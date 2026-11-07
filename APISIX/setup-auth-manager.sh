#!/usr/bin/env bash

set -euo pipefail

ENV_FILE=".env"

# -------------------------------------------------------
# Load environment variables
# -------------------------------------------------------
echo "Loading configuration from ${ENV_FILE}"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: ${ENV_FILE} not found"
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Validate required variables
: "${ADMIN_KEY:?ERROR: ADMIN_KEY is not set}"

echo "Configuration loaded successfully."


# -------------------------------------------------------
# Create APISIX upstream
# -------------------------------------------------------
echo "Creating APISIX upstream: iot-auth-manager"

PAYLOAD=$(cat <<EOF
{
  "name": "iot-auth-manager",
  "type": "roundrobin",
  "nodes": {
    "iot-auth-manager:3000": 1
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/upstreams/iot-auth-manager" \
    -H "X-API-KEY: ${ADMIN_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
then
    echo
    echo "APISIX upstream created successfully."
else
    echo
    echo "ERROR: Failed to create APISIX upstream."
    exit 1
fi


# -------------------------------------------------------
# Create APISIX service
# -------------------------------------------------------
echo "Creating APISIX service: iot-auth-manager"

PAYLOAD=$(cat <<EOF
{
  "name": "iot-auth-manager",
  "upstream_id": "iot-auth-manager",
  "plugins": {
    "jwt-auth": {}
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/services/iot-auth-manager" \
    -H "X-API-KEY: ${ADMIN_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
then
    echo
    echo "APISIX service created successfully."
else
    echo
    echo "ERROR: Failed to create APISIX service."
    exit 1
fi


# -------------------------------------------------------
# Create APISIX route
# -------------------------------------------------------
echo "Creating APISIX route: iot-auth-manager"

PAYLOAD=$(cat <<EOF
{
  "name": "iot-auth-manager",
  "upstream_id": "iot-auth-manager",
  "uri": "/auth/*",
  "plugins": {
    "proxy-rewrite": {
      "regex_uri": ["^/auth/(.*)$", "/\$1"]
    }
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/routes/iot-auth-manager" \
    -H "X-API-KEY: ${ADMIN_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
then
    echo
    echo "APISIX route created successfully."
else
    echo
    echo "ERROR: Failed to create APISIX route."
    exit 1
fi
