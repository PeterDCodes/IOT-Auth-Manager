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
: "${SERVICE_KEY:?ERROR: SERVICE_KEY is not set}"
: "${PUB_KEY_PATH:?ERROR: PUB_KEY_PATH is not set}"

echo "Configuration loaded successfully."


# -------------------------------------------------------
# Load public key
# -------------------------------------------------------
echo "Loading public key from ${PUB_KEY_PATH}"

if [[ ! -f "$PUB_KEY_PATH" ]]; then
    echo "ERROR: Public key not found: ${PUB_KEY_PATH}"
    exit 1
fi

PUBLIC_KEY=$(cat "$PUB_KEY_PATH")

if [[ -z "$PUBLIC_KEY" ]]; then
    echo "ERROR: Public key is empty"
    exit 1
fi

echo "Public key loaded successfully."


# -------------------------------------------------------
# Create APISIX consumer
# -------------------------------------------------------
echo "Creating APISIX consumer: iot-device-consumer"

# Convert multiline PEM into JSON-compatible \n escapes
PUBLIC_KEY_JSON=${PUBLIC_KEY//$'\n'/\\n}

PAYLOAD=$(cat <<EOF
{
  "username": "iot-device-consumer",
  "plugins": {
    "jwt-auth": {
      "key": "${SERVICE_KEY}",
      "algorithm": "RS256",
      "public_key": "${PUBLIC_KEY_JSON}"
    }
  }
}
EOF
)

if curl --fail-with-body \
    --silent \
    --show-error \
    -X PUT \
    "http://127.0.0.1:9180/apisix/admin/consumers" \
    -H "X-API-KEY: ${ADMIN_KEY}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
then
    echo
    echo "APISIX consumer created successfully."
else
    echo
    echo "ERROR: Failed to create APISIX consumer."
    exit 1
fi