#!/usr/bin/env bash
# GymFlow smoke test — starts dev server, checks key routes, stops.
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || dirname "$0"/../../..)"
ROOT=$(pwd)
PORT=${PORT:-3333}

# ── deps ────────────────────────────────────────────────────────
[ -d apps/web/node_modules ] || pnpm install --frozen-lockfile

# ── stub env (Supabase placeholder so Next.js doesn't crash) ───
if [ ! -f apps/web/.env.local ]; then
  cp .env.example apps/web/.env.local
  sed -i \
    's|https://your-project.supabase.co|http://localhost:54321|;
     s|your-anon-key|placeholder|;
     s|your-service-role-key|placeholder|' \
    apps/web/.env.local
fi

# ── launch ──────────────────────────────────────────────────────
PORT=$PORT pnpm --filter @gymflow/web dev &
SRV_PID=$!
trap 'kill $SRV_PID 2>/dev/null; exit' EXIT INT TERM

echo "Waiting for :$PORT …"
for i in $(seq 1 30); do
  curl -sf http://localhost:$PORT > /dev/null 2>&1 && break
  sleep 1
done

# ── smoke ───────────────────────────────────────────────────────
pass=0; fail=0
check() {
  local label=$1 url=$2 expect=$3
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then
    echo "✓ $label ($code)"; ((pass++)) || true
  else
    echo "✗ $label — expected $expect got $code"; ((fail++)) || true
  fi
}

check "landing"   "http://localhost:$PORT"          200
check "login"     "http://localhost:$PORT/login"     200
check "cadastro"  "http://localhost:$PORT/cadastro"  200
check "dashboard" "http://localhost:$PORT/dashboard" 307  # redirects to login — correct
check "api/cnpj"  "http://localhost:$PORT/api/cnpj"  307  # auth-guarded — correct

echo ""
echo "Results: $pass passed, $fail failed"
[ $fail -eq 0 ]
