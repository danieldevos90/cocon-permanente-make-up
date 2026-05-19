#!/usr/bin/env bash
# Deploy de CPM Opleidingen mu-plugin naar live via DirectAdmin REST API.
# (FTP zit achter Cloudflare en is geblokkeerd; DirectAdmin REST werkt wel.)
#
# Stappen:
#   1. Zip lokaal de mu-plugin
#   2. Upload zip naar wp-content/mu-plugins/
#   3. Extract op de server (overwrite)
#   4. Upload de loader-stub
#   5. Cleanup

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

DA_URL="${COCONPM_DA_URL:-https://web223.controlepaneel.net:2222}"
DA_USER="${COCONPM_DA_USER:-coconper}"
DA_PASS="${COCONPM_DA_PASS:-YVfZFyYMuvrGHjD4v7Qg}"

LOCAL_DIR="$ROOT/mu-plugins"
LOCAL_LOADER="$LOCAL_DIR/cpm-opleidingen-loader.php"
LOCAL_PLUGIN_DIR="$LOCAL_DIR/cpm-opleidingen"

REMOTE_MU="domains/coconpermanentemakeup.nl/public_html/wp-content/mu-plugins"
ZIP_NAME="cpm-opleidingen-$(date +%s).zip"
LOCAL_ZIP="/tmp/$ZIP_NAME"

if [ ! -f "$LOCAL_LOADER" ] || [ ! -d "$LOCAL_PLUGIN_DIR" ]; then
	echo "ERROR: kan plugin niet vinden in $LOCAL_DIR" >&2
	exit 1
fi

echo "=========================================="
echo "Deploy CPM Opleidingen → $DA_URL"
echo "Remote:  $REMOTE_MU/cpm-opleidingen/"
echo "=========================================="

cd "$LOCAL_DIR"

# 1. Build zip (excl tests folder)
echo "→ Zip aanmaken…"
rm -f "$LOCAL_ZIP"
zip -rq "$LOCAL_ZIP" cpm-opleidingen -x 'cpm-opleidingen/tests/*'
echo "   $(du -h "$LOCAL_ZIP" | cut -f1)  $LOCAL_ZIP"

# 2. Upload zip
echo "→ Upload zip naar server…"
UPLOAD_RES=$(curl -sk -m 60 -u "$DA_USER:$DA_PASS" \
	-X POST "$DA_URL/api/filemanager-actions/upload?dir=$REMOTE_MU&name=$ZIP_NAME&overwrite=true" \
	-F "file=@$LOCAL_ZIP")
echo "   ✓ $UPLOAD_RES"

# 3. Extract on server
echo "→ Extracten op server…"
EXTRACT_PAYLOAD=$(jq -nc \
	--arg src "$REMOTE_MU/$ZIP_NAME" \
	--arg dst "$REMOTE_MU" \
	'{ source: $src, destinationDir: $dst, members: [], mergeAndOverwrite: true }')
EXTRACT_RES=$(curl -sk -m 60 -u "$DA_USER:$DA_PASS" \
	-X POST "$DA_URL/api/filemanager-actions/extract-archive" \
	-H "Content-Type: application/json" \
	-d "$EXTRACT_PAYLOAD" -w "\nHTTP %{http_code}")
echo "   $EXTRACT_RES"

# 4. Upload loader
echo "→ Upload loader stub…"
LOADER_RES=$(curl -sk -m 60 -u "$DA_USER:$DA_PASS" \
	-X POST "$DA_URL/api/filemanager-actions/upload?dir=$REMOTE_MU&name=cpm-opleidingen-loader.php&overwrite=true" \
	-F "file=@$LOCAL_LOADER")
echo "   ✓ $LOADER_RES"

# 5. Cleanup zip op server
echo "→ Verwijder zip op server…"
DEL_PAYLOAD=$(jq -nc --arg p "$REMOTE_MU/$ZIP_NAME" '{ paths: [$p] }')
curl -sk -m 30 -u "$DA_USER:$DA_PASS" \
	-X POST "$DA_URL/api/filemanager-actions/remove" \
	-H "Content-Type: application/json" \
	-d "$DEL_PAYLOAD" >/dev/null
rm -f "$LOCAL_ZIP"

# 6. Mailchimp-keys → mu-plugin/.env.local (overschrijft geen server-root .env)
ENV_SRC="$ROOT/marketing-automations/.env"
if [ -f "$ENV_SRC" ]; then
	echo "→ Mailchimp .env.local sync…"
	TMP_ENV=$(mktemp)
	{
		grep -E '^(API_KEY_MAILCHIMP|MAILCHIMP_API_KEY|MAILCHIMP_LIST_ID)=' "$ENV_SRC" || true
	} > "$TMP_ENV"
	if [ -s "$TMP_ENV" ]; then
		curl -sk -m 60 -u "$DA_USER:$DA_PASS" \
			-X POST "$DA_URL/api/filemanager-actions/upload?dir=$REMOTE_MU/cpm-opleidingen&name=.env.local&overwrite=true" \
			-F "file=@$TMP_ENV" >/dev/null
		echo "   ✓ .env.local geüpload"
	else
		echo "   ⚠ geen MAILCHIMP-regels in $ENV_SRC"
	fi
	rm -f "$TMP_ENV"
fi

# Trigger WP (prijs-sync draait op eerste request na deploy)
curl -sk -m 20 "https://www.coconpermanentemakeup.nl/wp-cron.php?doing_wp_cron=1" >/dev/null || true
curl -sk -m 20 "https://www.coconpermanentemakeup.nl/" >/dev/null || true

echo ""
echo "✓ Deploy klaar."
echo ""
echo "=========================================="
echo "Smoke-test (run volgende stap):"
echo "=========================================="
echo "JWT=\$(jq -r '.mcpServers.\"wordpress-coconpmu\".env.JWT_TOKEN' .cursor/mcp.json)"
echo "curl -sk -H \"Authorization: Bearer \$JWT\" 'https://www.coconpermanentemakeup.nl/wp-json/cpm/v1/admin/diag' | jq"
