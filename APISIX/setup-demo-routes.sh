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
echo "Creating APISIX upstream: example-api"

PAYLOAD=$(cat <<EOF
{
  "name": "example-api",
  "type": "roundrobin",
  "nodes": {
    "example-api:3000": 1
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/upstreams/1" \
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
# Create APISIX route - will leverage service_id iot-auth-manager which is the auth manager plugin
# -------------------------------------------------------
echo "Creating APISIX route: example-api"

PAYLOAD=$(cat <<EOF
{
  "name": "example-api",
  "upstream_id": "1",
  "uri": "/example",
  "service_id": "iot-auth-manager",
  "plugins": {
    "proxy-rewrite": {
      "uri": "/"
    }
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/routes/1" \
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
