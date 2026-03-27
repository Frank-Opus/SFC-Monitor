#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VITE_HOST="${VITE_HOST:-localhost}"
VITE_PORT="${VITE_PORT:-5173}"

find_node_bin() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi

  local candidates=(
    "$HOME/.vscode-server/bin/8b3775030ed1a69b13e4f4c628c612102e30a681/node"
    "$HOME/.windsurf-server/bin/745a6c1ac471cc11f782a05d2c3ceacbc1de308f/node"
    "$HOME/.cursor-server/bin/63fcac100bd5d5749f2a98aa47d65f6eca61db30/node"
    "$HOME/.cursor-server/bin/60d42bed27e5775c43ec0428d8c653c49e58e260/node"
    "$HOME/.cursor-server/bin/07aa3b4519da4feab4761c58da3eeedd253a1670/node"
    "$HOME/.cursor-server/bin/2e353c5f5b30150ff7b874dee5a87660693d9de0/node"
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

printf 'World Monitor web UI: http://%s:%s\n\n' "$VITE_HOST" "$VITE_PORT"
printf 'Using node: %s\n\n' "$NODE_BIN"

npm run dev -- --host "$VITE_HOST" --port "$VITE_PORT"
