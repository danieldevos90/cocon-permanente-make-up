# WooCommerce Templates Documentation

This document describes all the custom WooCommerce templates and components created for the Cocon Permanente Make-up website.

## Overview

The Divi theme now includes complete WooCommerce support with custom templates for:
1. **Featured Products** (Homepage)
2. **Shop Overview** (Product Archive)
3. **Product Detail Pages**
4. **Cart Page**
5. **Checkout Page**

---

## Template Files

### 1. Shop Overview Page
**File:** `woocommerce.php`

This template handles the main shop page and all product archives (categories, tags, etc.).

**Features:**
- Responsive product grid (4 columns on desktop, adapts to mobile)
- Product filtering and sorting
- Pagination
- Category descriptions
- Integration with Divi Builder (can be edited with Visual Builder)

---

### 2. Single Product Page
**File:** `woocommerce/single-product.php`

Displays individual product details.

**Features:**
- Product gallery with zoom and lightbox
- Product title, price, description
- Add to cart button
- Product tabs (description, reviews, additional info)
- Related products
- Upsells and cross-sells
- Full Divi Builder integration

---

### 3. Featured Products Homepage Template
**File:** `page-template-featured-products.php`

A page template specifically for showcasing featured products on the homepage.

**How to use:**
1. Create a new page in WordPress
2. Select "Featured Products Homepage" from the Page Attributes > Template dropdown
3. The page will automatically display featured products

**Features:**
- Displays products marked as "Featured" in WooCommerce
- Responsive grid layout
- Can be combined with Divi Builder sections
- Shows up to 8 featured products by default

---

### 4. Cart Page
**File:** `woocommerce/cart/cart.php`

Custom cart page template.

**Features:**
- Product listing with thumbnails
- Quantity adjustment
- Remove items
- Coupon code input
- Cart totals
- Cross-sells (related products)
- Proceed to checkout button

---

### 5. Checkout Page
**File:** `woocommerce/checkout/form-checkout.php`

Custom checkout form template.

**Features:**
- Billing information form
- Shipping information form
- Order review
- Payment methods
- Place order button
- Responsive two-column layout

---

## Shortcodes

Three powerful shortcodes have been added for displaying products anywhere on your site:

### Featured Products Shortcode
```
[featured_products limit="8" columns="4"]
```

**Parameters:**
- `limit` - Number of products to display (default: 8)
- `columns` - Number of columns (default: 4)
- `orderby` - Sort by: date, title, rand (default: rand)
- `order` - ASC or DESC (default: desc)

**Example:**
```
[featured_products limit="12" columns="3" orderby="date"]
```

---

### Recent Products Shortcode
```
[recent_products limit="8" columns="4"]
```

**Parameters:**
- `limit` - Number of products to display (default: 8)
- `columns` - Number of columns (default: 4)
- `orderby` - Sort by: date, title, rand (default: date)
- `order` - ASC or DESC (default: desc)

**Example:**
```
[recent_products limit="6" columns="2"]
```

---

### Product Category Shortcode
```
[product_category category="permanent-makeup" limit="8" columns="4"]
```

**Parameters:**
- `category` - Category slug (required)
- `limit` - Number of products to display (default: 8)
- `columns` - Number of columns (default: 4)
- `orderby` - Sort by: date, title, rand (default: date)
- `order` - ASC or DESC (default: desc)

**Example:**
```
[product_category category="eyebrow-products" limit="4" columns="4"]
```

---

## Custom Styling

All WooCommerce pages use custom styling defined in:
**File:** `css/woocommerce-custom.css`

### Key Style Features:
- **Brand Colors:** Gold (#d4af37) for primary actions and accents
- **Modern Card Design:** Clean, elevated product cards with hover effects
- **Responsive Grid:** Automatically adjusts from 4 to 1 columns based on screen size
- **Typography:** Clear, readable fonts with proper hierarchy
- **Professional Buttons:** Styled call-to-action buttons with hover animations

### Customizing Colors:
To change the primary color from gold to your brand color, search and replace `#d4af37` in `css/woocommerce-custom.css` with your hex color.

---

## Custom Functions

**File:** `inc/woocommerce-custom.php`

This file contains:
- All shortcode definitions
- WooCommerce theme support declarations
- Product grid column settings
- Products per page settings

### Default Settings:
- **Products per page:** 12
- **Columns:** 4 (desktop)
- **Gallery features:** Zoom, Lightbox, Slider enabled

---

## Using Divi Builder with WooCommerce

All WooCommerce pages are compatible with Divi Builder. You can:

1. **Edit pages with Visual Builder:**
   - Enable the Divi Builder on any WooCommerce page
   - Add sections, rows, and modules above or below WooCommerce content
   - Create custom layouts for shop pages

2. **Use WooCommerce Modules:**
   Divi includes built-in WooCommerce modules:
   - Woo Products
   - Woo Product Title
   - Woo Product Price
   - Woo Add to Cart
   - Woo Product Gallery
   - Woo Product Images
   - And many more...

3. **Create Custom Product Pages:**
   - Use Theme Builder to create custom single product layouts
   - Add custom sections before/after product content
   - Design unique product detail pages

---

## Setup Instructions

### 1. Setting Up Featured Products
To display products on your homepage:

**Option A: Use the Page Template**
1. Go to Pages > Add New
2. Set the page title (e.g., "Home")
3. In Page Attributes, select "Featured Products Homepage" template
4. Publish the page
5. Go to Settings > Reading and set this as your homepage

**Option B: Use Shortcode**
1. Create or edit any page
2. Add the shortcode: `[featured_products limit="8" columns="4"]`
3. Products marked as "Featured" in WooCommerce will display

### 2. Marking Products as Featured
1. Go to Products in WordPress admin
2. Edit a product
3. In the Product data panel, check "Featured"
4. Update the product

### 3. Setting Up Shop Page
1. Go to WooCommerce > Settings > Products > Display
2. Select your Shop page
3. The `woocommerce.php` template will automatically be used

### 4. Customizing Cart and Checkout
The cart and checkout pages use the custom templates automatically. You can further customize them with:
- Divi Builder sections above/below the forms
- Custom CSS in the WordPress Customizer
- Editing the template files directly

---

## File Structure

```
Divi/
├── woocommerce.php (Shop archive template)
├── page-template-featured-products.php (Homepage template)
├── inc/
│   └── woocommerce-custom.php (Custom functions & shortcodes)
├── css/
│   └── woocommerce-custom.css (Custom styling)
└── woocommerce/
    ├── single-product.php (Product detail template)
    ├── cart/
    │   └── cart.php (Cart page template)
    └── checkout/
        └── form-checkout.php (Checkout form template)
```

---

## Responsive Breakpoints

The templates use the following breakpoints:
- **Desktop:** 992px and above (4 columns)
- **Tablet:** 768px - 991px (3 columns)
- **Small Tablet:** 481px - 767px (2 columns)
- **Mobile:** 480px and below (1 column)

---

## Browser Support

All templates are tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Troubleshooting

### Products not showing?
- Make sure WooCommerce is installed and activated
- Check that products are published and have a price set
- For featured products, ensure products are marked as "Featured"

### Styling looks broken?
- Clear your site cache (if using a caching plugin)
- Check that `woocommerce-custom.css` is being loaded
- Try disabling other plugins to check for conflicts

### Shortcodes not working?
- Make sure the shortcode is typed correctly
- Check that WooCommerce is active
- Verify products exist in the specified category

---

## Support & Updates

For questions or issues:
1. Check the WooCommerce documentation: https://docs.woocommerce.com/
2. Check the Divi documentation: https://www.elegantthemes.com/documentation/divi/
3. Contact your developer for custom modifications

---

## Changelog

**Version 1.0.0**
- Initial WooCommerce template setup
- Added featured products template
- Created custom shortcodes
- Implemented responsive styling
- Added cart and checkout templates

