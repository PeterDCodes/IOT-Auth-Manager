--
-- Licensed to the Apache Software Foundation (ASF) under one or more
-- contributor license agreements.  See the NOTICE file distributed with
-- this work for additional information regarding copyright ownership.
-- The ASF licenses this file to You under the Apache License, Version 2.0
-- (the "License"); you may not use this file except in compliance with
-- the License.  You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
--
local core = require("apisix.core")
local bit = require("bit")
local jwt_parser = require("apisix.plugins.jwt-auth.parser")
local ngx = ngx
local band = bit.band
local byte = string.byte
local consumers

core.ctx.register_var("mqtt_client_id", function(ctx)
    return ctx.mqtt_client_id
end)

local schema = {
    type = "object",
    properties = {
        protocol_name = {type = "string", default = "MQTT"},
        protocol_level = {type = "integer", enum = {4, 5}},
        key = {type = "string", minLength = 1},
    },
    required = {"protocol_level", "key"},
}

local _M = {
    version = 0.1,
    priority = 1000,
    name = "mqtt-auth-proxy",
    schema = schema,
}

function _M.check_schema(conf)
    return core.schema.check(schema, conf)
end

function _M.init()
    -- Stream workers need their own watch of the APISIX consumer profiles.
    local err
    consumers, err = core.config.new("/consumers", {automatic = true})
    if not consumers then
        core.log.error("failed to watch MQTT auth consumers: ", err)
    end
end

local function decode_variable_byte_int(data, offset)
    local length = 0
    local multiplier = 1
    for pos = offset, offset + 3 do
        local digit = byte(data, pos)
        if not digit then
            return nil
        end
        length = length + band(digit, 127) * multiplier
        if digit < 128 then
            if pos == offset or digit ~= 0 then
                return length, pos + 1
            end
            return nil
        end
        multiplier = multiplier * 128
    end
end

local function read_field(data, pos)
    local hi, lo = byte(data, pos, pos + 1)
    if not lo then
        return nil
    end
    local last = pos + 1 + hi * 256 + lo
    if last > #data then
        return nil
    end
    return data:sub(pos + 2, last), last + 1
end

local function skip_properties(data, pos)
    local length, start = decode_variable_byte_int(data, pos)
    if start and start + length <= #data + 1 then
        return start + length
    end
end

local function parse_mqtt(data, pos, conf)
    local protocol
    protocol, pos = read_field(data, pos)
    if not pos or protocol ~= (conf.protocol_name or "MQTT") then
        return nil
    end

    local level, flags = byte(data, pos, pos + 1)
    if level ~= conf.protocol_level or not flags or pos + 3 > #data then
        return nil
    end
    local has_will = band(flags, 4) ~= 0
    if band(flags, 1) ~= 0 or band(flags, 24) == 24
        or (not has_will and band(flags, 56) ~= 0)
        or (level == 4 and band(flags, 192) == 64)
    then
        return nil
    end
    pos = pos + 4 -- Protocol level, Connect Flags, and Keep Alive.

    if level == 5 then
        pos = skip_properties(data, pos)
        if not pos then
            return nil
        end
    end

    local client_id
    client_id, pos = read_field(data, pos)
    if not pos then
        return nil
    end
    if has_will then
        if level == 5 then
            pos = skip_properties(data, pos)
            if not pos then
                return nil
            end
        end
        for _ = 1, 2 do -- Will Topic and Will Payload.
            local field
            field, pos = read_field(data, pos)
            if not field then
                return nil
            end
        end
    end

    local username, password
    if band(flags, 128) ~= 0 then
        username, pos = read_field(data, pos)
        if not pos then
            return nil
        end
    end
    if band(flags, 64) ~= 0 then
        password, pos = read_field(data, pos)
        if not pos then
            return nil
        end
    end
    if pos ~= #data + 1 then
        return nil
    end
    return {client_id = client_id, username = username, password = password}
end

local function validate_jwt(token, key)
    local entry = consumers and consumers:get(key)
    local plugins = entry and entry.value and entry.value.plugins
    local auth = plugins and plugins["jwt-auth"]
    if not auth or auth.algorithm ~= "RS256" or type(auth.public_key) ~= "string"
        or not token or token == ""
    then
        return false
    end

    local jwt = jwt_parser.new(token)
    if not jwt or type(jwt.header) ~= "table" or jwt.header.alg ~= "RS256"
        or type(jwt.payload) ~= "table" or not jwt:verify_signature(auth.public_key)
    then
        return false
    end
    return jwt:verify_claims(nil, {lifetime_grace_period = auth.lifetime_grace_period})
end

function _M.preread(conf, ctx)
    local sock, err = ngx.req.socket()
    if not sock then
        core.log.error("failed to open MQTT downstream socket: ", err)
        return 503
    end

    local header = sock:peek(5)
    if not header or byte(header, 1) ~= 16 then
        return 400
    end
    local length, pos = decode_variable_byte_int(header, 2)
    if not length or length < 10 then
        return 400
    end

    local data = sock:peek(pos + length - 1)
    local connect = data and parse_mqtt(data, pos, conf)
    if not connect then
        return 400
    end

    if not validate_jwt(connect.password, conf.key) then
        -- MQTT 5 uses reason 0x87 and an empty properties field.
        local reply = conf.protocol_level == 5 and "\x20\x03\x00\x87\x00"
                      or "\x20\x02\x00\x05"
        local ok, send_err = sock:send(reply)
        if not ok then
            core.log.warn("failed to send MQTT connection refusal: ", send_err)
        end
        return 403
    end

    if connect.client_id ~= "" then
        ctx.mqtt_client_id = connect.client_id
    end
end

return _M
