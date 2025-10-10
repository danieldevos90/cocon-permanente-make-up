# Cache Clearing Guide - Fix Style Override Issues

## Problem
Styles not appearing or being overridden by cached versions or other stylesheets.

## Solution Applied

### 1. **Cache Buster Added** ✅
Changed CSS version from static version to `time()` which generates a unique timestamp on every page load.

```php
// Before:
'1.3.0'

// After:
time() // This creates: ?ver=1696876543 (changes every time)
```

**Location**: `Divi/inc/woocommerce-custom.php` line 260

**For Production**: Change back to a static version like `'1.3.1'` once styles are working.

### 2. **Stronger CSS Specificity** ✅
Added multiple layers of CSS overrides with `!important` flags:
- Inline styles via `wp_add_inline_style()`
- Final override in `wp_head` hook (priority 9999)
- Body-level selectors for maximum specificity

---

## How to Clear ALL Caches

### Step 1: Browser Cache (Client-Side)

#### Chrome / Edge
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"

**OR** Use hard refresh:
- Windows: `Ctrl + F5` or `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

#### Firefox
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Time range: "Everything"
3. Check "Cache"
4. Click "Clear Now"

#### Safari
1. Go to Safari → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Press `Cmd + Option + E` to empty caches

---

### Step 2: WordPress Cache

If using a caching plugin, clear it:

#### WP Rocket
1. Go to WordPress Admin → Settings → WP Rocket
2. Click "Clear cache" in the top admin bar
3. OR go to WP Rocket → Clear cache → Clear cache

#### WP Super Cache
1. Go to Settings → WP Super Cache
2. Click "Delete Cache" button

#### W3 Total Cache
1. Go to Performance → Dashboard
2. Click "Empty all caches" button

#### LiteSpeed Cache
1. Go to LiteSpeed Cache → Toolbox
2. Click "Purge All"

#### WP Fastest Cache
1. Go to WP Fastest Cache
2. Click "Delete Cache" button

---

### Step 3: Divi Cache

The Divi theme has its own caching system:

1. **Divi Builder Cache**
   - Go to WordPress Admin → Divi → Theme Options
   - Click the "Builder" tab
   - Scroll to "Static CSS File Generation"
   - Click "Clear" next to the cache notice

2. **Divi Static CSS Files**
   ```bash
   # Via FTP or File Manager, delete these folders:
   wp-content/et-cache/
   ```

3. **Via Divi Theme Options**
   - Divi → Theme Options → Builder → Advanced
   - Find "Static CSS File Generation"
   - Disable it temporarily, save
   - Enable it again, save

---

### Step 4: Server Cache

#### If using cPanel
1. Log into cPanel
2. Go to "Select PHP Version" or "MultiPHP Manager"
3. Click "Reset OPcache" if available

#### If using Cloudflare
1. Log into Cloudflare
2. Go to Caching
3. Click "Purge Everything"

#### Via SSH (if you have access)
```bash
# OPcache
sudo service php7.4-fpm reload
# or
sudo service php8.0-fpm reload

# Redis (if installed)
redis-cli FLUSHALL

# Memcached (if installed)
echo "flush_all" | nc localhost 11211
```

---

### Step 5: Local Docker Cache (If Using Docker Setup)

Since you have `docker-compose.yml`:

```bash
# Navigate to project directory
cd /Users/danieldevos/Documents/ALT\ F\ AWESOME/cocon-permanente-make-up/cocon-permanente-make-up/

# Restart containers (preserves data)
docker-compose restart

# Or rebuild containers (clears all cache)
docker-compose down
docker-compose up --build -d

# Clear WordPress object cache via WP-CLI
docker-compose exec wordpress wp cache flush
```

---

## Testing After Clearing Cache

### 1. **Check if Styles Are Loading**
Open browser DevTools (F12) and go to:
- **Network tab** → Filter by CSS
- Look for `woocommerce-custom.css?ver=XXXXXXXXXX` (should have large timestamp)
- Click on it to verify the file contents

### 2. **Inspect Elements**
Right-click on the element (button, price, quantity input) → Inspect
- Check which styles are applied
- Look for crossed-out styles (being overridden)
- Verify `!important` rules are winning

### 3. **Check Console for Errors**
- Open DevTools Console tab
- Look for any JavaScript errors
- Look for 404 errors for missing files

---

## Verification Checklist

After clearing all caches, verify these are working:

### ✅ Fuchsia Price Color
- [ ] Price displays as `#ff00ff` (bright magenta/fuchsia)
- [ ] Visible on product pages
- [ ] Not grey or pink

### ✅ Quantity Input
- [ ] 48x48px square
- [ ] Black 2px border
- [ ] Transparent background
- [ ] Centered text

### ✅ Add to Cart Button
- [ ] 48px height (same as quantity)
- [ ] Pink border (#C64193)
- [ ] Transparent background
- [ ] Turns pink on hover

### ✅ Custom Gallery
- [ ] Vertical thumbnails visible on left
- [ ] Black square navigation arrows in bottom corners
- [ ] Clicking thumbnails changes main image
- [ ] Arrows work for navigation

---

## Still Not Working?

### Debug Steps

#### 1. Check if Custom CSS is Loading
Add this to browser console:
```javascript
// Check if stylesheet is loaded
Array.from(document.styleSheets).find(sheet => 
  sheet.href && sheet.href.includes('woocommerce-custom.css')
)
```

#### 2. Check File Permissions
```bash
# Via SSH
chmod 644 Divi/css/woocommerce-custom.css
chmod 644 Divi/inc/woocommerce-custom.php
chmod 644 Divi/woocommerce/single-product/product-image.php
```

#### 3. Force PHP to Reload
Create a file called `clear-cache.php` in your WordPress root:
```php
<?php
// Clear OPcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache cleared!<br>";
}

// Clear WordPress object cache
wp_cache_flush();
echo "WordPress cache cleared!<br>";

// Delete transients
delete_transient('et_core_path');
delete_transient('et_core_version');
echo "Divi transients cleared!<br>";
?>
```

Visit: `https://yoursite.com/clear-cache.php`
Then delete the file.

#### 4. Disable Other Plugins Temporarily
Some plugins can interfere with styles:
- Disable all plugins except WooCommerce
- Test if styles work
- Re-enable plugins one by one to find the culprit

#### 5. Check Divi Theme Customizer
Go to: **Appearance → Customize → Additional CSS**
- Check if there's any conflicting CSS here
- Temporarily remove it to test

---

## Prevention for Future

### 1. Use Query String Versioning
In `woocommerce-custom.php`, use version numbers:
```php
'1.3.1' // Increment this whenever you change CSS
```

### 2. Disable Caching During Development
Add to `wp-config.php`:
```php
define('WP_CACHE', false);
define('CONCATENATE_SCRIPTS', false);
```

### 3. Use Private/Incognito Mode for Testing
- No cache
- No cookies
- Fresh session

---

## Quick Fix Command (All-in-One)

If you have WP-CLI installed:
```bash
# Clear all WordPress caches
wp cache flush
wp transient delete --all
wp theme mod remove all

# Clear Divi cache
rm -rf wp-content/et-cache/*

# Restart web server (if applicable)
sudo service apache2 restart
# or
sudo service nginx restart
```

---

## Emergency Nuclear Option 🚨

If NOTHING works, temporarily add this to the very top of `woocommerce-custom.css`:

```css
/* EMERGENCY OVERRIDE - Remove after testing */
* {
    color: #ff00ff !important; /* Everything fuchsia to verify file loads */
}
```

If you see everything turn fuchsia, your CSS file IS loading but being overridden.
If nothing changes, the file is NOT loading (check file path/permissions).

**Remove this test CSS immediately after verification!**

---

## Support

If styles still aren't applying after all these steps:

1. Check browser console for 404 errors on CSS files
2. Verify file paths are correct
3. Check server error logs
4. Ensure WordPress has write permissions to generate dynamic CSS
5. Try switching to a default WordPress theme temporarily to isolate the issue

**Current CSS Version**: Uses `time()` for automatic cache busting
**Last Updated**: October 9, 2025

