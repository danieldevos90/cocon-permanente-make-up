#!/usr/bin/env bash
# Push platform + WhatsApp + dashboard env vars to Vercel (all environments).
# Usage: ./scripts/set-vercel-whatsapp-env.sh
# Optional: export META_APP_SECRET META_WHATSAPP_ACCESS_TOKEN before running.
set -euo pipefail
cd "$(dirname "$0")/.."

# Load local secrets — whatsapp-automations/.env wins for Meta (sourced last)
for f in .env.local ../.env ../whatsapp-automations/.env; do
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f" 2>/dev/null || true
    set +a
  fi
done

# App secret may only be set as META_WHATSAPP_APP_SECRET in .env
META_APP_SECRET="${META_APP_SECRET:-${META_WHATSAPP_APP_SECRET:-}}"

WEBHOOK="${META_WHATSAPP_WEBHOOK_VERIFY_TOKEN:-307f8f7c8d9cd508dd001a23f40ce779}"
ONBOARD="${WHATSAPP_ONBOARD_ACCESS_TOKEN:-baab981a5492b499ef5941e8dd8c5baa}"
DASHBOARD_PW="${DASHBOARD_PASSWORD:-coconiscool3}"
PHONE_ID="${META_WHATSAPP_PHONE_NUMBER_ID:-}"
WABA_ID="${META_WHATSAPP_BUSINESS_ACCOUNT_ID:-}"
REDIS_URL="${UPSTASH_REDIS_REST_URL:-${KV_REST_API_URL:-}}"
REDIS_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-${KV_REST_API_TOKEN:-}}"

add() {
  local name=$1 value=$2
  for env in production preview development; do
    echo -n "→ $name ($env) "
    printf '%s' "$value" | vercel env add "$name" "$env" --yes --force --non-interactive 2>&1 | grep -E 'Overrode|Added|Saved' || echo "ok"
  done
}

echo "=== Dashboard ==="
add DASHBOARD_PASSWORD "$DASHBOARD_PW"

echo "=== Tenant / platform ==="
add CLIENT_ID cocon
add NEXT_PUBLIC_PLATFORM_NAME "AFA - Message Platform"
add NEXT_PUBLIC_CLIENT_NAME "Cocon Cosmetics"
add NEXT_PUBLIC_CLIENT_DISPLAY_PHONE "+31 6 23943507"
add NEXT_PUBLIC_CLIENT_ONBOARD_CONTACT Daniela

echo "=== Meta / WhatsApp ==="
add META_APP_ID 823081517310848
add NEXT_PUBLIC_META_APP_ID 823081517310848
add META_EMBEDDED_SIGNUP_CONFIG_ID 971625582419184
add NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID 971625582419184
add META_WHATSAPP_API_VERSION v21.0
if [[ -n "$WABA_ID" ]]; then
  add META_WHATSAPP_BUSINESS_ACCOUNT_ID "$WABA_ID"
else
  echo "⚠ META_WHATSAPP_BUSINESS_ACCOUNT_ID leeg — vul na Embedded Signup onder Alt F Awesome"
fi
if [[ -n "$PHONE_ID" ]]; then
  add META_WHATSAPP_PHONE_NUMBER_ID "$PHONE_ID"
else
  echo "⚠ META_WHATSAPP_PHONE_NUMBER_ID leeg — vul na onboard-flow"
fi
add WHATSAPP_DRY_RUN true
add META_WHATSAPP_WEBHOOK_VERIFY_TOKEN "$WEBHOOK"
add WHATSAPP_ONBOARD_ACCESS_TOKEN "$ONBOARD"
add NEXT_PUBLIC_WHATSAPP_ONBOARD_GATE "$ONBOARD"

if [[ -n "${META_APP_SECRET:-}" ]]; then
  add META_APP_SECRET "$META_APP_SECRET"
  add META_WHATSAPP_APP_SECRET "$META_APP_SECRET"
else
  echo "⚠ META_APP_SECRET / META_WHATSAPP_APP_SECRET niet gezet"
fi

if [[ -n "${META_WHATSAPP_ACCESS_TOKEN:-}" ]]; then
  add META_WHATSAPP_ACCESS_TOKEN "$META_WHATSAPP_ACCESS_TOKEN"
else
  echo "⚠ META_WHATSAPP_ACCESS_TOKEN niet gezet — live API-calls nog niet mogelijk"
fi

if [[ -n "${META_SYSTEM_USER_ID:-}" ]]; then
  add META_SYSTEM_USER_ID "$META_SYSTEM_USER_ID"
fi

if [[ -n "$REDIS_URL" && -n "$REDIS_TOKEN" ]]; then
  echo "=== Redis (Upstash) ==="
  add UPSTASH_REDIS_REST_URL "$REDIS_URL"
  add UPSTASH_REDIS_REST_TOKEN "$REDIS_TOKEN"
  add KV_REST_API_URL "$REDIS_URL"
  add KV_REST_API_TOKEN "$REDIS_TOKEN"
else
  echo "⚠ Redis URL/token niet gevonden in .env.local of ../.env"
fi

echo "=== Verbose logging (Vercel Runtime Logs) ==="
add WHATSAPP_HOOK_DEBUG true
add WHATSAPP_API_LOG true
add LOG_LEVEL debug
add NODE_OPTIONS "--enable-source-maps"

echo ""
echo "Done. Redeploy: vercel deploy --prod --yes"
echo "Logs: vercel logs https://marketing-automations-kohl.vercel.app --follow"
