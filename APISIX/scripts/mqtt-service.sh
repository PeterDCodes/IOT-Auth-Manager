# EXAMPLE MQTT SET UP CALL - https://apisix.apache.org/docs/apisix/plugins/mqtt-proxy/

curl "http://127.0.0.1:9180/apisix/admin/stream_routes" -X PUT \
  -H "X-API-KEY: ${admin_key}" \
  -d '{
    "id": "mqtt-route-proxy",
    "plugins": {
      "mqtt-proxy": {
        "protocol_name": "MQTT",
        "protocol_level": 4
      }
    },
    "upstream": {
      "type": "roundrobin",
      "nodes": [
        {
          "host": "localhost",
          "port": 1883,
          "weight": 1
        }
      ]
    }
  }'