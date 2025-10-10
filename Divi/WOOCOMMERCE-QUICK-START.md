# WooCommerce Quick Start Guide

## ✅ What's Been Set Up

All WooCommerce templates are now ready to use! Here's what's been created:

### 📁 Files Created:

1. **`woocommerce.php`** - Shop overview/archive page template
2. **`woocommerce/single-product.php`** - Product detail page template
3. **`woocommerce/cart/cart.php`** - Shopping cart page template
4. **`woocommerce/checkout/form-checkout.php`** - Checkout form template
5. **`page-template-featured-products.php`** - Featured products homepage template
6. **`inc/woocommerce-custom.php`** - Custom functions and shortcodes
7. **`css/woocommerce-custom.css`** - Custom WooCommerce styling
8. **`functions.php`** - Updated to include custom WooCommerce files

---

## 🚀 Quick Setup Steps

### Step 1: Upload Theme to WordPress
```bash
# The Divi folder contains the complete theme
# Upload to: wp-content/themes/Divi/
```

### Step 2: Activate Theme
1. Go to WordPress Admin > Appearance > Themes
2. Activate the Divi theme

### Step 3: Install WooCommerce
1. Install and activate WooCommerce plugin
2. Complete the WooCommerce setup wizard

### Step 4: Create Homepage with Featured Products

**Option A: Use the Page Template**
1. Pages > Add New
2. Title: "Home" (or your preferred name)
3. Page Attributes > Template: Select "Featured Products Homepage"
4. Publish
5. Settings > Reading > Set as homepage

**Option B: Use Shortcode on Any Page**
1. Edit any page
2. Add this shortcode: `[featured_products limit="8" columns="4"]`
3. Publish

### Step 5: Mark Products as Featured
1. Products > All Products
2. Edit a product
3. Product data > General > Check "Featured product"
4. Update

---

## 🎨 Available Shortcodes

### Featured Products
```
[featured_products limit="8" columns="4"]
```

### Recent Products
```
[recent_products limit="12" columns="3"]
```

### Products by Category
```
[product_category category="your-category-slug" limit="8" columns="4"]
```

---

## 🎯 Pages You'll Need

1. **Shop** - WooCommerce creates this automatically
2. **Cart** - WooCommerce creates this automatically
3. **Checkout** - WooCommerce creates this automatically
4. **My Account** - WooCommerce creates this automatically
5. **Homepage** - Create manually with featured products template or shortcode

---

## 💅 Customizing the Look

### Change Primary Color
Edit `css/woocommerce-custom.css` and replace `#d4af37` (gold) with your brand color.

### Change Products Per Page
Edit `inc/woocommerce-custom.php` - look for `cocon_woocommerce_products_per_page()` function.

### Change Grid Columns
Edit `inc/woocommerce-custom.php` - look for `cocon_woocommerce_loop_columns()` function.

---

## 📋 Testing Checklist

- [ ] Theme is activated
- [ ] WooCommerce is installed and activated
- [ ] At least 3-4 test products are created
- [ ] Some products are marked as "Featured"
- [ ] Homepage displays featured products
- [ ] Shop page shows product grid
- [ ] Single product page displays correctly
- [ ] Can add products to cart
- [ ] Cart page displays correctly
- [ ] Checkout page displays correctly
- [ ] Mobile responsive (test on phone)

---

## 🆘 Common Issues

**Products not showing?**
- Check products are published
- Check products have prices
- Check WooCommerce is activated

**Styling looks wrong?**
- Clear cache
- Check if `woocommerce-custom.css` is loading
- Try disabling other plugins

**Shortcode not working?**
- Check spelling
- Check WooCommerce is active
- For category shortcode, verify category slug is correct

---

## 📸 What Each Template Does

| Template | Purpose | Used For |
|----------|---------|----------|
| `woocommerce.php` | Shop archive | Main shop page, categories, search results |
| `single-product.php` | Product details | Individual product pages |
| `cart.php` | Shopping cart | Cart page with product list |
| `form-checkout.php` | Checkout form | Checkout process |
| `page-template-featured-products.php` | Featured showcase | Homepage or landing pages |

---

## 🎓 Next Steps

1. ✅ Upload and activate the theme
2. ✅ Install WooCommerce
3. ✅ Create products
4. ✅ Mark some as featured
5. ✅ Create homepage
6. ✅ Test all pages
7. ✅ Customize colors to match your brand
8. ✅ Add your logo and branding
9. ✅ Configure payment methods
10. ✅ Configure shipping options

---

## 📚 Documentation

Full documentation: See `WOOCOMMERCE-TEMPLATES-README.md`

---

## ✨ Features Included

✅ Responsive product grids  
✅ Featured products display  
✅ Product filtering and sorting  
✅ Product gallery with zoom  
✅ Add to cart functionality  
✅ Shopping cart with quantity adjustment  
✅ Complete checkout flow  
✅ Mobile-optimized design  
✅ Divi Builder integration  
✅ Custom shortcodes  
✅ Professional styling  

---

Ready to launch! 🚀

