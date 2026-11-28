# MQTT authentication through APISIX

APISIX gives us one authentication approach for HTTP APIs and MQTT. Devices get a signed JWT from IOT Auth Manager. For HTTP, the client sends it as a bearer token and APISIX's built-in `jwt-auth` plugin checks it. For MQTT, the client connects to APISIX over TLS and sends the JWT as the password in its MQTT CONNECT packet.

The custom `mqtt-auth-proxy` plugin intercepts the CONNECT packet and reads the username and password. It uses the password as the JWT and verifies the RS256 signature with the configured public key (`public.pem`). It also checks the token's expiration and device claims. If the token is valid, APISIX forwards the connection to Mosquitto. If it’s invalid, APISIX refuses the connection.

The upstream broker can run without its own client authentication because APISIX handles it. In production, keep the broker on a private network reachable by APISIX, leave the broker ports unpublished, and have MQTT clients connect through the APISIX TLS listener. For local testing, Node-RED can connect directly to `mosquitto:1883`. That direct connection bypasses gateway authentication.

## APISIX configuration

In `APISIX/config.yaml`, `http&stream` lets APISIX act as both an **HTTP API gateway (Layer 7)** and a **TCP/UDP proxy (Layer 4)**. The MQTT listener uses TCP port `9100` with TLS enabled. This is the MQTT-related part of the config:

```yaml
apisix:
  proxy_mode: http&stream
  stream_proxy:
    tcp:
      - addr: 9100
        tls: true
```

The config also lists `mqtt-auth-proxy` under `stream_plugins`. The [MQTT route setup script](../APISIX/scripts/mqtt-service.sh) applies the plugin to the stream route and sets the public key and upstream broker.
