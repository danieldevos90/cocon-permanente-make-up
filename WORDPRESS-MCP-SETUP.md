# WordPress MCP Setup for Cocon Permanente Make-up

## Status: WORKING

Cursor is wired to your live WordPress / WooCommerce site at
[coconpermanentemakeup.nl](https://coconpermanentemakeup.nl) via the
`@automattic/mcp-wordpress-remote` proxy and the `wordpress-mcp` plugin
on the server.

```
Site         : https://www.coconpermanentemakeup.nl
WP version   : 6.9.4
WP user      : Daniel (id 6, role administrator)
Auth method  : JWT Bearer (issued by jwt-auth/v1/token)
JWT lifetime : 30 days  (max allowed by the plugin)
MCP endpoint : /wp-json/wp/v2/wpmcp           (JSON-RPC, used by the proxy)
MCP endpoint : /wp-json/wp/v2/wpmcp/streamable (JSON-RPC, future-proof)
MCP endpoint : /wp-json/mcp/mcp-adapter-default-server (Abilities API, empty until plugins add abilities)
Tools today  : 5  (get_site_info, wp_get_media_file, list_api_functions,
                   get_function_details, run_api_function)
```

`run_api_function` + `list_api_functions` together expose the entire WordPress
REST API (all 165 `wp/v2/*` routes plus WooCommerce `wc/v3`, RankMath, Yoast,
Jetpack, Mollie, etc.) through 3 MCP tool calls — the LLM can discover any
endpoint, look up its schema, then invoke it.

---

## What was installed on the server

Two plugins were uploaded via the DirectAdmin file-manager API and activated
through `/wp-json/wp/v2/plugins` (LiteSpeed WAF blocks the regular wp-admin
upload form, so the file-manager route is preferred):

| Plugin              | Version | Purpose                                              |
|---------------------|---------|------------------------------------------------------|
| `wordpress-mcp`     | 0.2.5   | Real MCP transport with 5 working tools (this is the one Cursor talks to) |
| `mcp-adapter`       | 0.5.0   | New WP/Abilities-API MCP transport. Active but exposes 0 tools until plugins register MCP-public abilities. Kept active so we can adopt it later. |

The `wordpress_mcp_settings` option was set to:

```json
{
  "enabled": true,
  "features_adapter_enabled": true,
  "enable_create_tools": true,
  "enable_update_tools": true,
  "enable_delete_tools": false,
  "enable_rest_api_crud_tools": true
}
```

`enable_delete_tools` is intentionally `false` so the MCP cannot trigger
destructive deletes. Flip it via wp-admin → Settings → MCP if you want.

---

## Cursor configuration

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wordpress-coconpmu": {
      "command": "npx",
      "args": ["-y", "@automattic/mcp-wordpress-remote@latest"],
      "env": {
        "WP_API_URL": "https://coconpermanentemakeup.nl",
        "JWT_TOKEN": "<jwt token, refreshed by .wp-mcp/refresh-jwt.sh>",
        "OAUTH_ENABLED": "false",
        "LOG_FILE": ".wordpress-mcp.log"
      }
    }
  }
}
```

`.cursor/` is gitignored, so the JWT never lands in git.

---

## Renewing the JWT

The JWT expires after 30 days. To renew:

```bash
./.wp-mcp/refresh-jwt.sh
```

The script:
1. Calls `POST /wp-json/jwt-auth/v1/token` with username `Daniel` + password.
2. Patches the new token into `.cursor/mcp.json`.
3. Backs up the previous mcp.json with a timestamped suffix.
4. Logs the action in `.wp-mcp/refresh-jwt.log`.

Restart Cursor afterward so the new env vars are picked up.

If you ever rotate the WordPress password, edit `.wp-mcp/refresh-jwt.sh` and
update `WP_PASSWORD` there. The whole `.wp-mcp/` folder is gitignored.

---

## Verifying it works (cli)

```bash
JWT=$(jq -r '.mcpServers."wordpress-coconpmu".env.JWT_TOKEN' .cursor/mcp.json)

curl -sk -X POST \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  https://coconpermanentemakeup.nl/wp-json/wp/v2/wpmcp/streamable | jq .
```

Should return the 5 tools.

For a stdio smoke test of the proxy itself:

```bash
{
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
  sleep 2
} | env WP_API_URL="https://coconpermanentemakeup.nl" JWT_TOKEN="$JWT" OAUTH_ENABLED="false" \
  npx -y @automattic/mcp-wordpress-remote@latest | jq .
```

---

## Examples of what you can ask Cursor now

- "List all WooCommerce products with stock < 5."
- "Show me draft posts created in the last 30 days."
- "What's the title and meta description of the homepage?"
- "Add a new tag 'Lente Acties' with slug 'lente-acties'."
- "Update the SEO title of the product 'Mesoestetic sunstick' to …"
- "Show all RankMath-detected SEO issues for the shop page."
- "List Mollie payment methods enabled in WooCommerce."

Behind the scenes the LLM calls `list_api_functions` once to learn what's
available, `get_function_details` to read the schema for the relevant route,
and `run_api_function` to execute.

---

## Security notes

- JWT secret is per-site; if you ever leak the JWT itself, just call the
  refresh script again — old token stays valid for the rest of the 30-day
  window unless you rotate the WP password too.
- `enable_delete_tools` is `false`. Keep it that way unless you really mean
  to give the agent delete privileges.
- The MCP only authenticates against the `Daniel` admin account. Any action
  the MCP performs is attributed to that user in the WordPress audit log.
- All WP credentials live in `.cursor/mcp.json` and `.wp-mcp/refresh-jwt.sh`,
  both gitignored.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Cursor MCP shows 0 tools | JWT expired | Run `./.wp-mcp/refresh-jwt.sh`, restart Cursor |
| `401 unauthorized` on `/wp/v2/wpmcp` | JWT expired or wrong site | refresh JWT |
| `403 mcp_disabled` | Plugin setting flipped off | wp-admin → Settings → MCP → Enable MCP |
| `405 Accept header must include both …` | Hitting `/streamable` without `Accept: application/json, text/event-stream` | the proxy already sends the right header — only relevant if you call directly |
| `rest_no_route` for `/wp/v2/wpmcp` | wordpress-mcp plugin deactivated | reactivate via `PUT /wp-json/wp/v2/plugins/wordpress-mcp/wordpress-mcp` `{"status":"active"}` |
