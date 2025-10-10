# Clear WordPress & WooCommerce Cache

Your template changes are saved but WordPress is serving cached versions. Follow these steps:

## 1. Clear WordPress Cache

If using a caching plugin:
- **WP Super Cache**: Go to Settings > WP Super Cache > Delete Cache
- **W3 Total Cache**: Go to Performance > Dashboard > Empty All Caches
- **WP Rocket**: Go to Settings > WP Rocket > Clear Cache
- **Redis/Memcached**: Flush the cache

## 2. Clear WooCommerce Template Cache

```bash
# Option 1: Via WP-CLI (if available)
wp transient delete --all
wp cache flush

# Option 2: Via MySQL/phpMyAdmin
# Run this query in your database:
DELETE FROM wp_options WHERE option_name LIKE '_transient_%';
DELETE FROM wp_options WHERE option_name LIKE '_site_transient_%';
```

## 3. Clear Divi/Elegant Themes Cache

1. Go to **Divi > Theme Options**
2. Click **Builder > Advanced**
3. Scroll to **Static CSS File Generation**
4. Click **Clear** button
5. Click **Regenerate Static CSS Files**

## 4. Force Template Refresh

Add this to your `wp-config.php` temporarily:

```php
define('WP_DEBUG', true);
define('SCRIPT_DEBUG', true);
```

This disables template caching during development.

## 5. Clear Browser Cache

- Chrome: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Firefox: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Safari: `Cmd+Option+R`

## 6. Restart Docker (if using Docker)

```bash
cd /Users/danieldevos/Documents/ALT\ F\ AWESOME/cocon-permanente-make-up/cocon-permanente-make-up/
docker-compose restart
```

## 7. Check File Permissions

Make sure the template file is readable:

```bash
chmod 644 Divi/woocommerce/single-product.php
```

## 8. Test with curl again

```bash
curl http://localhost:8080/product/microblading-wenkbrauwen/ | grep "cocon-product-cart"
```

You should now see the new classes:
```html
<div class="cocon-product-cart product-add-to-cart wc-mb-4">
```

---

**Quick Fix for Development:**

Add to `wp-config.php`:
```php
// Force fresh template load (REMOVE IN PRODUCTION!)
define('WP_CACHE', false);
define('CONCATENATE_SCRIPTS', false);
```

After clearing caches, the custom classes should appear! 🎉

