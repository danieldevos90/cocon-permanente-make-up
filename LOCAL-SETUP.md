# 🚀 Local WordPress Site - Quick Access

## ✅ Your Site is Running!

Your local Cocon Permanente Make-up WordPress site is now running with Docker.

---

## 🌐 Access Your Site

### Frontend (Public Site)
**URL:** http://localhost:8080

### WordPress Admin
**URL:** http://localhost:8080/wp-admin  
**Username:** `admin`  
**Password:** `admin123`

### WooCommerce Shop
**URL:** http://localhost:8080/shop

---

## 📦 What's Installed

✅ **WordPress** - Latest version  
✅ **Divi Theme** - Activated with custom WooCommerce templates  
✅ **WooCommerce** - v10.2.2 (Configured for EUR/Dutch)  
✅ **WordPress Importer** - For importing content  
✅ **Regenerate Thumbnails** - For image management  

---

## 🛍️ Sample Products Created

6 custom beauty products have been created:

1. **Microblading Wenkbrauwen** - €350
2. **Permanente Eyeliner** - €275 (was €295 - ON SALE!)
3. **Lip Blush Behandeling** - €325
4. **Aftercare Crème** - €25 (Physical product, 50 in stock)
5. **Touch-up Sessie (6-8 weken)** - €125
6. **Gratis Intakegesprek** - FREE

### Product Categories Created:
- Wenkbrauwen
- Eyeliner
- Lippen
- Verzorging
- Touch-ups

---

## 🎨 Custom Templates Available

Your Divi theme now includes these WooCommerce templates:

- ✅ Featured Products Homepage
- ✅ Shop Overview Page
- ✅ Product Detail Pages
- ✅ Shopping Cart
- ✅ Checkout Page

---

## 🔧 Docker Commands

### Start the site
```bash
docker-compose up -d
```

### Stop the site
```bash
docker-compose down
```

### Stop and remove all data (fresh start)
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f wordpress
```

### Run WP-CLI commands
```bash
docker-compose exec wp-cli wp [command] --allow-root
```

### Example: List all products
```bash
docker-compose exec wp-cli wp post list --post_type=product --allow-root
```

---

## 📁 File Structure

```
Your Project/
├── Divi/                    # Theme files (auto-synced to container)
│   ├── woocommerce.php
│   ├── woocommerce/
│   ├── inc/woocommerce-custom.php
│   └── css/woocommerce-custom.css
├── docker-compose.yml       # Docker configuration
├── uploads.ini             # PHP upload settings
└── setup-wordpress.sh      # Initial setup script
```

**Note:** Changes you make to files in the `Divi` folder will immediately reflect in the running site!

---

## 🎯 Next Steps

1. **Visit the Site**
   - Go to http://localhost:8080
   - Check out the shop at http://localhost:8080/shop

2. **Login to Admin**
   - Go to http://localhost:8080/wp-admin
   - Login with `admin` / `admin123`

3. **Configure WooCommerce**
   - Complete the WooCommerce setup wizard if prompted
   - Add payment methods (Settings > Payments)
   - Configure shipping (Settings > Shipping)

4. **Customize Divi**
   - Go to Divi > Theme Options
   - Use the Divi Builder to create custom pages
   - Edit the homepage with Visual Builder

5. **Add Featured Products**
   - Go to Products
   - Edit any product
   - Check "Featured product" checkbox
   - Use `[featured_products]` shortcode on homepage

6. **Create Homepage**
   - Pages > Add New
   - Template: "Featured Products Homepage"
   - Or add shortcode: `[featured_products limit="8" columns="4"]`
   - Set as homepage in Settings > Reading

---

## 🛠️ Troubleshooting

### Site not loading?
```bash
# Check if containers are running
docker-compose ps

# Restart containers
docker-compose restart
```

### Database issues?
```bash
# Access database directly
docker-compose exec db mysql -u wordpress -pwordpress wordpress
```

### Permission errors?
```bash
# Fix permissions in WordPress container
docker-compose exec wordpress chown -R www-data:www-data /var/www/html
```

### Need to reset everything?
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d
sleep 30
docker-compose exec -T wp-cli bash /setup-wordpress.sh
```

---

## 📊 Database Info

**Host:** `localhost:3306`  
**Database:** `wordpress`  
**Username:** `wordpress`  
**Password:** `wordpress`  
**Root Password:** `rootpassword`

You can connect with any MySQL client (e.g., MySQL Workbench, TablePlus, Sequel Pro)

---

## 🔍 Useful WP-CLI Commands

```bash
# List all plugins
docker-compose exec wp-cli wp plugin list --allow-root

# List all themes
docker-compose exec wp-cli wp theme list --allow-root

# Create a new product
docker-compose exec wp-cli wp post create --post_type=product --post_title="New Product" --post_status=publish --allow-root

# Clear cache
docker-compose exec wp-cli wp cache flush --allow-root

# Update permalink structure
docker-compose exec wp-cli wp rewrite flush --allow-root

# Export database
docker-compose exec db mysqldump -u wordpress -pwordpress wordpress > backup.sql

# Import database
docker-compose exec -T db mysql -u wordpress -pwordword wordpress < backup.sql
```

---

## 📝 Notes

- The site is configured for Dutch/Netherlands (NL)
- Currency is set to EUR (€)
- Decimal separator: comma (,)
- Thousand separator: period (.)
- All changes to the Divi theme files are immediately reflected
- Database and WordPress files persist in Docker volumes

---

## 🎉 Enjoy Your Local Development Environment!

Your site is ready for development. Start customizing!

**Need help?** Check the WooCommerce documentation files in the Divi folder.

