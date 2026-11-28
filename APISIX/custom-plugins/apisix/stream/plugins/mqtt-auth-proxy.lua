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
local json = require("cjson.safe")
local base64 = require("ngx.base64")
local pkey = require("resty.openssl.pkey")
local ngx = ngx
local band = bit.band
local byte = string.byte
local rsa_nid = 6 -- OpenSSL NID_rsaEncryption.

core.ctx.register_var("mqtt_client_id", function(ctx)
    return ctx.mqtt_client_id
end)

local schema = {
    type = "object",
    properties = {
        protocol_name = {type = "string", default = "MQTT"},
        protocol_level = {type = "integer", enum = {4, 5}},
        public_key = {type = "string", minLength = 1},
        lifetime_grace_period = {type = "integer", minimum = 0, default = 0},
    },
    required = {"protocol_level", "public_key"},
}

local _M = {
    version = 0.1,
    priority = 1000,
    name = "mqtt-auth-proxy",
    schema = schema,
}

local function load_public_key(pem)
    local key = pkey.new(pem, {format = "PEM", type = "pu"})
    if key and key:get_key_type(true) == rsa_nid and key:get_size() >= 256 then
        return key
    end
end

function _M.check_schema(conf)
    local ok, err = core.schema.check(schema, conf)
    if not ok then
        return false, err
    end
    local loaded, key = pcall(load_public_key, conf.public_key)
    if not loaded or not key then
        return false, "public_key must be a PEM RSA public key of at least 2048 bits"
    end
    return true
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

local function decode_segment(encoded)
    local data = base64.decode_base64url(encoded)
    if data and base64.encode_base64url(data) == encoded then
        return data
    end
end

local function decode_json_segment(encoded)
    local data = decode_segment(encoded)
    if data and data:match("^%s*{") then
        return json.decode(data)
    end
end

local function is_numeric_date(value)
    return type(value) == "number" and value > -math.huge and value < math.huge
end

local function validate_jwt(token, conf)
    if not token then
        return false
    end
    local signed, raw_header, raw_payload, raw_signature =
        token:match("^(([A-Za-z0-9_-]+)%.([A-Za-z0-9_-]+))%.([A-Za-z0-9_-]+)$")
    if not signed then
        return false
    end

    local header = decode_json_segment(raw_header)
    local signature = decode_segment(raw_signature)
    if not header or header.alg ~= "RS256" or header.crit ~= nil or header.b64 ~= nil
        or not signature
    then
        return false
    end

    local key = load_public_key(conf.public_key)
    if not key or not key:verify(signature, signed, "sha256", pkey.PADDINGS.RSA_PKCS1_PADDING) then
        return false
    end

    local claims = decode_json_segment(raw_payload)
    if not claims or type(claims.sub) ~= "string" or claims.sub == ""
        or claims.uuid ~= claims.sub
    then
        return false
    end

    local now = ngx.time()
    local grace = conf.lifetime_grace_period or 0
    return is_numeric_date(claims.exp) and now < claims.exp + grace
        and (claims.nbf == nil or (is_numeric_date(claims.nbf) and claims.nbf <= now + grace))
        and (claims.iat == nil or (is_numeric_date(claims.iat) and claims.iat <= now + grace))
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

    local ok, valid = pcall(validate_jwt, connect.password, conf)
    if not ok or not valid then
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
