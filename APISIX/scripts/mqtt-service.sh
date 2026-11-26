#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ -f .env ]]; then
  source ./.env
fi

: "${ADMIN_KEY:?Set ADMIN_KEY in APISIX/.env or in the environment}"
: "${PUB_KEY_PATH:=./public.pem}"
: "${APISIX_ADMIN_URL:=http://127.0.0.1:9180/apisix/admin}"
: "${MQTT_BROKER_HOST:=mosquitto}"
: "${MQTT_BROKER_PORT:=1883}"
: "${MQTT_PROTOCOL_LEVEL:=4}"

if [[ ! -r "$PUB_KEY_PATH" || ! -s "$PUB_KEY_PATH" ]]; then
  printf 'Public key file is missing, unreadable, or empty: %s\n' "$PUB_KEY_PATH" >&2
  exit 1
fi
if [[ "$MQTT_PROTOCOL_LEVEL" != 4 && "$MQTT_PROTOCOL_LEVEL" != 5 ]]; then
  printf 'MQTT_PROTOCOL_LEVEL must be 4 (MQTT 3.1.1) or 5 (MQTT 5).\n' >&2
  exit 1
fi

consumer_name=mqtt-consumer
route_id=mqtt-route-proxy

consumer_payload=$(jq -n --arg name "$consumer_name" --rawfile public_key "$PUB_KEY_PATH" '
  {
    username: $name,
    plugins: {"jwt-auth": {key: $name, algorithm: "RS256", public_key: $public_key}}
  }
')

route_payload=$(jq -n --arg key "$consumer_name" --arg host "$MQTT_BROKER_HOST" \
  --argjson port "$MQTT_BROKER_PORT" --argjson level "$MQTT_PROTOCOL_LEVEL" '
  {
    server_port: 9100,
    plugins: {"mqtt-auth-proxy": {key: $key, protocol_name: "MQTT", protocol_level: $level}},
    upstream: {type: "roundrobin", nodes: [{host: $host, port: $port, weight: 1}]}
  }
')

put_config() {
  curl --fail-with-body --silent --show-error \
    -X PUT "${APISIX_ADMIN_URL%/}/$1" \
    -H "X-API-KEY: ${ADMIN_KEY}" \
    -H 'Content-Type: application/json' \
    --data-binary "$2"
  printf '\n'
}

put_config "consumers/$consumer_name" "$consumer_payload"
put_config "stream_routes/$route_id" "$route_payload"
