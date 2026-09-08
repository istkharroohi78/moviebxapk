#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  start.sh — Run Filmora (API + Web + Bot) without Docker
#  Usage:  ./start.sh [--skip-build]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_BUILD=false

for arg in "$@"; do
  [[ "$arg" == "--skip-build" ]] && SKIP_BUILD=true
done

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${BOLD}[start.sh]${RESET} $*"; }
ok()   { echo -e "${GREEN}✔${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
die()  { echo -e "${RED}✘ ERROR:${RESET} $*" >&2; exit 1; }

# ── Load .env if it exists ────────────────────────────────────
ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  log "Loading environment from .env"
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
else
  warn ".env not found — using existing shell environment"
  warn "Copy .env.example to .env and fill in values if needed"
fi

# ── Dependency checks ─────────────────────────────────────────
log "Checking dependencies..."

command -v node  >/dev/null 2>&1 || die "node not found. Install Node.js 20+"
command -v pnpm  >/dev/null 2>&1 || die "pnpm not found. Run: npm install -g pnpm"
command -v python3 >/dev/null 2>&1 || die "python3 not found. Install Python 3.11+"

NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
[[ "$NODE_VER" -ge 20 ]] || die "Node.js 20+ required (found v$NODE_VER)"

ok "node $(node --version), pnpm $(pnpm --version), python3 $(python3 --version | awk '{print $2}')"

# ── Required env vars ─────────────────────────────────────────
MISSING=()
[[ -z "${MONGODB_URI:-}" ]]           && MISSING+=("MONGODB_URI")
[[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]    && MISSING+=("TELEGRAM_BOT_TOKEN")
[[ -z "${API_ID:-}" ]]                && MISSING+=("API_ID")
[[ -z "${API_HASH:-}" ]]              && MISSING+=("API_HASH")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  warn "Missing required environment variables:"
  for v in "${MISSING[@]}"; do echo -e "  ${RED}•${RESET} $v"; done
  warn "Bot may fail to start without these. Press Ctrl+C to abort or wait 5s to continue..."
  sleep 5
fi

# ── Install pnpm deps ─────────────────────────────────────────
log "Installing Node.js dependencies..."
cd "$ROOT"
pnpm install --frozen-lockfile
ok "Dependencies installed"

# ── Build ─────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
  log "Building API server..."
  pnpm --filter @workspace/api-server run build
  ok "API server built"

  log "Building Next.js website..."
  pnpm --filter @workspace/filmora run build
  ok "Website built"
else
  warn "--skip-build passed, skipping build step"
fi

# ── Install Python deps ───────────────────────────────────────
log "Installing Python dependencies..."
cd "$ROOT/bot"
pip3 install -q -r requirements.txt
ok "Python dependencies installed"
cd "$ROOT"

# ── PID tracking ─────────────────────────────────────────────
API_PID=""
WEB_PID=""
BOT_PID=""

cleanup() {
  echo ""
  log "Shutting down all services..."
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null && echo -e "  ${RED}stopped${RESET} API server (pid $API_PID)"
  [[ -n "$WEB_PID" ]] && kill "$WEB_PID" 2>/dev/null && echo -e "  ${RED}stopped${RESET} Web server (pid $WEB_PID)"
  [[ -n "$BOT_PID" ]] && kill "$BOT_PID" 2>/dev/null && echo -e "  ${RED}stopped${RESET} Telegram bot (pid $BOT_PID)"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Prefixed log helper ───────────────────────────────────────
run_service() {
  local label="$1"
  local color="$2"
  shift 2
  # Prefix every line with [SERVICE] in color
  "$@" 2>&1 | while IFS= read -r line; do
    echo -e "${color}[${label}]${RESET} $line"
  done &
  echo $!
}

# ── Start services ────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  🎬 Filmora — Starting all services${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# 1. API Server
API_PORT="${API_PORT:-5000}"
export PORT="$API_PORT" NODE_ENV="${NODE_ENV:-production}" MONGODB_URI="${MONGODB_URI:-}" TMDB_API_KEY="${TMDB_API_KEY:-}" COLLECTION_NAME="${COLLECTION_NAME:-test}"
API_PID=$(run_service "API  " "$CYAN" node --enable-source-maps "$ROOT/artifacts/api-server/dist/index.mjs")
ok "API server started on port $API_PORT (pid $API_PID)"

# 2. Next.js website
WEB_PORT="${WEB_PORT:-3000}"
export PORT="$WEB_PORT" HOSTNAME="0.0.0.0"
WEB_PID=$(run_service "WEB  " "$BLUE" node "$ROOT/artifacts/filmora/.next/standalone/artifacts/filmora/server.js")
ok "Website started on port $WEB_PORT (pid $WEB_PID)"

# 3. Telegram bot
export PORT="${BOT_PORT:-8082}"
BOT_PID=$(run_service "BOT  " "$MAGENTA" python3 "$ROOT/bot/bot.py")
ok "Telegram bot started (pid $BOT_PID)"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${CYAN}API ${RESET}→  http://localhost:${API_PORT}/api"
echo -e "  ${BLUE}WEB ${RESET}→  http://localhost:${WEB_PORT}"
echo -e "  ${MAGENTA}BOT ${RESET}→  Telegram (@${VITE_BOT_USERNAME:-your_bot})"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all services"
echo ""

# ── Wait forever (until Ctrl+C) ───────────────────────────────
wait
