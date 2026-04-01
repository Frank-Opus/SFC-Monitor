#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VITE_HOST="${VITE_HOST:-localhost}"
VITE_PORT="${VITE_PORT:-5173}"
RELAY_HOST="${RELAY_HOST:-127.0.0.1}"
RELAY_PORT="${RELAY_PORT:-3004}"

find_node_bin() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi

  local candidates=(
    "$HOME/.nvm/versions/node/v22.17.0/bin/node"
    "$HOME/.windsurf-server/bin/745a6c1ac471cc11f782a05d2c3ceacbc1de308f/node"
    "$HOME/.vscode-server/cli/servers/Stable-ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb/server/node"
    "$HOME/.vscode-server/bin/848b80aeb52026648a8ff9f7c45a9b0a80641e2e/node"
    "$HOME/.cursor-server/bin/63fcac100bd5d5749f2a98aa47d65f6eca61db30/node"
    "$HOME/.cursor-server/bin/60d42bed27e5775c43ec0428d8c653c49e58e260/node"
    "$HOME/.cursor-server/bin/07aa3b4519da4feab4761c58da3eeedd253a1670/node"
    "$HOME/.cursor-server/bin/2e353c5f5b30150ff7b874dee5a87660693d9de0/node"
    "$HOME/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681/node"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "Could not find a usable node binary." >&2
  echo "Set WM_NODE_BIN=/path/to/node and retry." >&2
  return 1
}

NODE_BIN="${WM_NODE_BIN:-$(find_node_bin)}"
export PATH="$(dirname "$NODE_BIN"):$HOME/.npm-global/bin:$PATH"

cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local"
  set +a
fi

: "${WS_RELAY_URL:=http://${RELAY_HOST}:${RELAY_PORT}}"
: "${VITE_WS_RELAY_URL:=ws://${RELAY_HOST}:${RELAY_PORT}}"
: "${VITE_OPENSKY_RELAY_URL:=http://${RELAY_HOST}:${RELAY_PORT}}"

relay_is_healthy() {
  if ! command -v curl >/dev/null 2>&1; then
    return 1
  fi
  curl -fsS "http://${RELAY_HOST}:${RELAY_PORT}/health" >/dev/null 2>&1
}

RELAY_PID=""
cleanup() {
  if [[ -n "$RELAY_PID" ]] && kill -0 "$RELAY_PID" >/dev/null 2>&1; then
    kill "$RELAY_PID" >/dev/null 2>&1 || true
    wait "$RELAY_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

if [[ "${WM_START_RELAY:-1}" != "0" && -n "${AISSTREAM_API_KEY:-}" ]]; then
  if relay_is_healthy; then
    printf 'Relay already running: http://%s:%s\n\n' "$RELAY_HOST" "$RELAY_PORT"
  else
    printf 'Starting local relay: http://%s:%s\n' "$RELAY_HOST" "$RELAY_PORT"
    "$NODE_BIN" scripts/ais-relay.cjs >"$ROOT_DIR/.worldmonitor-relay.log" 2>&1 &
    RELAY_PID=$!

    for _ in $(seq 1 20); do
      if relay_is_healthy; then
        printf 'Relay ready.\n\n'
        break
      fi
      sleep 1
    done

    if ! relay_is_healthy; then
      echo "Relay failed to become healthy. Recent log output:" >&2
      tail -n 40 "$ROOT_DIR/.worldmonitor-relay.log" >&2 || true
      exit 1
    fi
  fi
else
  printf 'Relay autostart skipped. Set AISSTREAM_API_KEY and leave WM_START_RELAY=1 to enable it.\n\n'
fi

printf 'World Monitor web UI: http://%s:%s\n\n' "$VITE_HOST" "$VITE_PORT"
printf 'Using node: %s\n\n' "$NODE_BIN"

npm run dev -- --host "$VITE_HOST" --port "$VITE_PORT"
