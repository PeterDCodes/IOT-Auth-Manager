#!/usr/bin/env bash

set -euo pipefail

run_setup() {
  local name=$1
  local script=$2

  echo
  echo "Setting up ${name}..."
  (
    bash "./scripts/${script}"
  )
}

run_setup "auth manager" "setup-auth-manager.sh"
run_setup "consumer" "setup-consumer.sh"
run_setup "example" "setup-demo-routes.sh"

echo
echo "Setup completed successfully."
