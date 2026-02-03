# DirectAdmin MCP Setup for Cocon Permanente Make-up

## Current Status: WORKING

The DirectAdmin MCP server is **connected and working** using the Legacy CMD_API.

```
Status: healthy
Legacy API: true
Domains: coconcosmetics.nl, coconpermanentemakeup.nl
Tools: 121 (including 23 legacy tools)
```

## Available Legacy Tools

The following commands work with your user account:

| Tool | Description |
|------|-------------|
| `cmd_show_domains` | List all domains |
| `cmd_show_subdomains` | List subdomains for a domain |
| `cmd_show_databases` | List MySQL databases |
| `cmd_show_email_accounts` | List email accounts |
| `cmd_show_ftp_accounts` | List FTP accounts |
| `cmd_show_dns_records` | List DNS records |
| `cmd_show_ssl` | Show SSL certificate info |
| `cmd_show_user_usage` | Get disk/bandwidth usage |
| `cmd_show_cronjobs` | List cron jobs |
| `cmd_file_manager` | Browse files |
| `cmd_show_backups` | List available backups |
| `cmd_create_database` | Create MySQL database |
| `cmd_create_email_account` | Create email account |
| `cmd_create_ftp_account` | Create FTP account |
| `cmd_add_dns_record` | Add DNS record |
| `cmd_create_cronjob` | Create cron job |
| `cmd_create_backup` | Create backup |

## REST API (Optional - Requires Admin)

The REST API (`/api/*`) requires admin-level access. The legacy API works for all user-level operations.

### To Enable REST API (Optional):

### Step 1: Log into DirectAdmin as Admin
Go to: https://coconpermanentemakeup.nl:2222
Username: `coconper`

### Step 2: Create a Login Key (Recommended)
1. In DirectAdmin, go to **Account Manager** → **Login Keys**
2. Click **Create Key**
3. Settings:
   - **Key Name**: `mcp-api`
   - **Expiry**: Never (or set a long expiry)
   - **Allow Clear Text Password**: No (more secure)
   - **Allow HTML**: No
   - **Commands**: Select all API commands you want to allow, or select "All Commands"
4. Click **Create**
5. **Copy the generated Login Key** (you'll only see it once!)

### Step 3: Update the .env file
Edit `.directadmin-mcp/.env` and replace the password with the Login Key:

```ini
DA_URL=https://coconpermanentemakeup.nl:2222
DA_USERNAME=coconper
DA_LOGIN_KEY=<paste-your-login-key-here>
```

### Step 4: Restart the MCP Server
```bash
# Stop the current server (if running)
pkill -f "directadmin-mcp"

# Start it again
./start-directadmin-mcp.sh
```

### Step 5: Verify Connection
```bash
curl http://localhost:8888/health
```

You should see: `{"status":"healthy","directadmin":{"connected":true},...}`

## Alternative: Enable API Access for User

If you're the server admin, you may need to:
1. Go to **Admin Level** → **Admin Settings**
2. Enable **API Access** for the user account
3. Or use the Admin account to create a Login Key

## Files Created

| File | Purpose |
|------|---------|
| `.directadmin-mcp/` | DirectAdmin MCP server (cloned from GitHub) |
| `.directadmin-mcp/.env` | Credentials (DO NOT commit to git) |
| `start-directadmin-mcp.sh` | Script to start the MCP server |
| `.cursor/mcp.json` | Cursor MCP configuration for this workspace |
| `.gitignore` | Protects sensitive files from being committed |

## Usage with Cursor

Once the connection is working:
1. The DirectAdmin MCP will appear in Cursor's MCP tools
2. You can use natural language to manage your hosting:
   - "List all domains"
   - "Show database usage"
   - "Check email accounts"
   - "View WordPress installations"

## WordPress MCP Setup (Alternative)

Since the DirectAdmin REST API needs admin configuration, you can use the **WordPress MCP** directly:

### Step 1: Create an Application Password in WordPress
1. Go to: https://coconpermanentemakeup.nl/wp-admin/
2. Navigate to **Users** → **Your Profile**
3. Scroll down to **Application Passwords**
4. Enter name: `Cursor MCP`
5. Click **Add New Application Password**
6. Copy the generated password (spaces are OK)

### Step 2: Update `.cursor/mcp.json`
Replace `YOUR_APPLICATION_PASSWORD_HERE` with your Application Password:

```json
{
  "wordpress-mcp": {
    "env": {
      "WP_API_URL": "https://coconpermanentemakeup.nl/",
      "WP_API_USERNAME": "your-wp-username",
      "WP_API_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
    }
  }
}
```

### Step 3: Restart Cursor
After updating the configuration, restart Cursor to load the WordPress MCP.

---

## DirectAdmin WordPress Integration

The DirectAdmin MCP includes WordPress tools:
- `api_wordpress_locations` - List WordPress installations
- `api_wordpress_locations_location_id_config` - Get WordPress config
- `api_wordpress_locations_location_id_options` - Manage WordPress options

Combined with the installed `wordpress-pro` skill, you have full WordPress development capabilities.

## Troubleshooting

### 403 Forbidden
- API access not enabled for user
- Login Key not created or expired
- Incorrect credentials

### Connection Refused
- DirectAdmin server not running
- Firewall blocking port 2222

### SSL Errors
- Set `SSL_VERIFY=false` in .env if using self-signed certificate
