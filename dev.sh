#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
SAME_TERMINAL=false

for arg in "$@"; do
  case "$arg" in
    --same-terminal) SAME_TERMINAL=true ;;
    -h | --help)
      printf 'Usage: ./dev.sh [--same-terminal]\n\n'
      printf 'Starts the MLInsights API and website in two Terminal windows.\n'
      printf '  --same-terminal   Run both servers in this terminal instead.\n\n'
      printf 'Optional environment variables: BACKEND_PORT (default 8000), FRONTEND_PORT (default 3000).\n'
      exit 0
      ;;
    *)
      printf 'Unknown option: %s (try --help)\n' "$arg" >&2
      exit 1
      ;;
  esac
done

info() { printf '\033[1;34m→\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$1"; }
fail() {
  printf '\033[1;31m✗\033[0m %s\n' "$1" >&2
  exit 1
}

port_in_use() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

free_port() {
  local port="$1"
  while port_in_use "$port"; do port=$((port + 1)); done
  printf '%s' "$port"
}

file_hash() { shasum "$1" | cut -d' ' -f1; }

command -v node >/dev/null 2>&1 || fail "Node.js 20.9 or newer is required. Install it from https://nodejs.org"
command -v npm >/dev/null 2>&1 || fail "npm is required. It ships with Node.js."
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)' ||
  fail "Node.js 20.9 or newer is required. You have $(node -v)."

PYTHON=""
for candidate in python3.11 python3.12 python3.13 python3; do
  if command -v "$candidate" >/dev/null 2>&1 &&
    "$candidate" -c 'import sys;sys.exit(0 if sys.version_info>=(3,11) else 1)' 2>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
[ -n "$PYTHON" ] || fail "Python 3.11 or newer is required. Install it from https://www.python.org/downloads/"

if [ ! -x "$BACKEND/.venv/bin/python" ]; then
  info "Creating the backend virtual environment with $PYTHON"
  "$PYTHON" -m venv "$BACKEND/.venv"
fi

REQUIREMENTS_STAMP="$BACKEND/.venv/.requirements.sha"
REQUIREMENTS_HASH="$(file_hash "$BACKEND/requirements.txt")"
if [ ! -f "$REQUIREMENTS_STAMP" ] || [ "$(cat "$REQUIREMENTS_STAMP")" != "$REQUIREMENTS_HASH" ]; then
  info "Installing backend dependencies. The first run can take a few minutes."
  "$BACKEND/.venv/bin/python" -m pip install --upgrade pip --quiet
  "$BACKEND/.venv/bin/python" -m pip install -r "$BACKEND/requirements.txt" --quiet
  printf '%s' "$REQUIREMENTS_HASH" >"$REQUIREMENTS_STAMP"
fi

PACKAGES_STAMP="$FRONTEND/node_modules/.install.sha"
if [ ! -d "$FRONTEND/node_modules" ] || [ ! -f "$PACKAGES_STAMP" ] ||
  [ "$(cat "$PACKAGES_STAMP")" != "$(file_hash "$FRONTEND/package-lock.json")" ]; then
  info "Installing frontend dependencies"
  (cd "$FRONTEND" && npm install --no-fund --no-audit)
  file_hash "$FRONTEND/package-lock.json" >"$PACKAGES_STAMP"
fi

if [ ! -f "$BACKEND/.env" ]; then
  info "Creating backend/.env with local defaults"
  printf 'ALLOWED_ORIGINS=http://localhost:3000\nALLOWED_ORIGIN_REGEX=\nUPLOAD_DIR=\nMAX_UPLOAD_MB=50\nSESSION_TTL_HOURS=24\nMAX_CACHED_SESSIONS=8\nLOG_LEVEL=INFO\n' >"$BACKEND/.env"
fi

if [ ! -f "$FRONTEND/.env" ]; then
  info "Creating frontend/.env with local defaults"
  printf 'NEXT_PUBLIC_API_URL=http://localhost:8000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\nNEXT_PUBLIC_CONTACT_EMAIL=\n' >"$FRONTEND/.env"
fi

REQUESTED_BACKEND_PORT="${BACKEND_PORT:-8000}"
REQUESTED_FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="$(free_port "$REQUESTED_BACKEND_PORT")"
FRONTEND_PORT="$(free_port "$REQUESTED_FRONTEND_PORT")"
[ "$BACKEND_PORT" = "$REQUESTED_BACKEND_PORT" ] || warn "Port $REQUESTED_BACKEND_PORT is busy, so the API will use port $BACKEND_PORT."
[ "$FRONTEND_PORT" = "$REQUESTED_FRONTEND_PORT" ] || warn "Port $REQUESTED_FRONTEND_PORT is busy, so the website will use port $FRONTEND_PORT."

API_URL="http://localhost:$BACKEND_PORT"
WEB_URL="http://localhost:$FRONTEND_PORT"
BACKEND_CMD="cd $(printf '%q' "$BACKEND") && ALLOWED_ORIGINS=$WEB_URL,http://127.0.0.1:$FRONTEND_PORT ./.venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port $BACKEND_PORT --no-access-log"
FRONTEND_CMD="cd $(printf '%q' "$FRONTEND") && NEXT_PUBLIC_API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$WEB_URL npm run dev -- --port $FRONTEND_PORT"

print_urls() {
  printf '\n\033[1mMLInsights is starting\033[0m\n'
  printf '  Website   %s\n' "$WEB_URL"
  printf '  App       %s/app\n' "$WEB_URL"
  printf '  API       %s  (docs at %s/docs)\n\n' "$API_URL" "$API_URL"
}

open_terminal() {
  local title="$1" command="$2"
  local escaped="${command//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  osascript >/dev/null <<APPLESCRIPT
tell application "Terminal"
  set newTab to do script "$escaped"
  set custom title of newTab to "$title"
  activate
end tell
APPLESCRIPT
}

if [ "$SAME_TERMINAL" = false ] && [ "$(uname -s)" = "Darwin" ] && command -v osascript >/dev/null 2>&1; then
  info "Opening the API in a new Terminal window"
  open_terminal "MLInsights API" "$BACKEND_CMD"
  info "Opening the website in a new Terminal window"
  open_terminal "MLInsights Web" "$FRONTEND_CMD"
  print_urls
  printf 'Close either Terminal window, or press Ctrl+C in it, to stop that server.\n'
  exit 0
fi

pids=()
cleanup() {
  printf '\n'
  info "Stopping both servers"
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

bash -c "${BACKEND_CMD/ .\/.venv\/bin\/uvicorn/ exec ./.venv/bin/uvicorn}" &
pids+=($!)
bash -c "${FRONTEND_CMD/ npm run dev/ exec npm run dev}" &
pids+=($!)
print_urls
printf 'Press Ctrl+C to stop both servers.\n'
wait
