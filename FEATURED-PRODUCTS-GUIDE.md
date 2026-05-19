# Featured Products Module Guide

## Overview
The featured products module displays WooCommerce products marked as "Featured" using a beautiful, custom-styled grid that matches your shop page design.

## Files Involved

### PHP
- `Divi/inc/woocommerce-custom.php` - Contains the shortcode logic

### CSS
- `Divi/css/coconpm-featured.css` - Featured section styles
- `Divi/css/coconpm-shop.css` - Product card styles (shared with shop page)
- `Divi/css/coconpm-buttons.css` - Button styles (shared)

### Template
- `Divi/woocommerce/content-product.php` - Product card template

## How to Upload

Run the upload script:
```bash
./upload-featured-products.sh
```

This uploads all 4 necessary files to your server.

## Usage

### Basic Shortcode
```
[featured_products]
```

### With Parameters
```
[featured_products limit="4" columns="4"]
[featured_products limit="8" columns="4" title="Uitgelichte producten"]
[featured_products limit="6" columns="3" orderby="rand"]
```

### Parameters

| Parameter | Description | Default | Options |
|-----------|-------------|---------|---------|
| `limit` | Number of products to show | `8` | Any number |
| `columns` | Products per row (desktop) | `4` | `2`, `3`, `4`, `5`, `6` |
| `title` | Optional section title | (none) | Any text |
| `orderby` | Sort order | `rand` | `rand`, `date`, `title`, `price` |
| `order` | Sort direction | `desc` | `asc`, `desc` |

## How to Mark Products as Featured

1. Go to **WordPress Admin → Products → All Products**
2. Click the **⭐ star icon** next to products you want to feature
3. The star turns yellow/filled when active
4. You need at least as many featured products as your `limit` parameter

## CSS Classes Structure

```html
<section class="coconpm-featured-products">
  <div class="coconpm-featured-container">
    <div class="coconpm-featured-header">
      <h2 class="coconpm-featured-title">Title</h2>
    </div>
    <div class="coconpm-products-grid coconpm-featured-grid coconpm-columns-4">
      
      <!-- Product Card (same as shop page) -->
      <div class="coconpm-product-card">
        <a class="coconpm-card-link">
          <div class="coconpm-card-image">
            <img>
            <span class="coconpm-sale-badge">Sale</span>
          </div>
        </a>
        <div class="coconpm-card-body">
          <div class="coconpm-card-header">
            <h3 class="coconpm-card-title">Product Name</h3>
            <div class="coconpm-card-price">€99</div>
          </div>
          <div class="coconpm-card-excerpt">Description...</div>
          <div class="coconpm-card-actions">
            <a class="coconpm-btn coconpm-btn-primary">Add to Cart</a>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</section>
```

## Responsive Behavior

| Screen Size | Columns |
|-------------|---------|
| Desktop (>1200px) | 4 (or as specified) |
| Desktop (992-1200px) | 3 |
| Tablet (768-992px) | 2 |
| Mobile (576-768px) | 2 |
| Small Mobile (<576px) | 1 |

## Styling Customization

### Change Section Padding
Edit `coconpm-featured.css`:
```css
.coconpm-featured-products {
  padding: 60px 0; /* Change this value */
}
```

### Change Title Style
```css
.coconpm-featured-title {
  font-size: 36px;
  font-weight: 700;
  color: #000000;
  text-align: center; /* or left */
}
```

### Change Grid Gap
```css
.coconpm-featured-grid {
  gap: 24px; /* Change spacing between cards */
}
```

## Integration with Divi Builder

### Option 1: Text Module
1. Add a **Text Module** to your Divi page
2. Switch to **Text** tab
3. Paste the shortcode:
   ```
   [featured_products limit="4" columns="4" title="Uitgelichte producten"]
   ```

### Option 2: Code Module
1. Add a **Code Module** to your Divi page
2. Paste the shortcode (same as above)

### Option 3: Shortcode Module
1. Add a **Shortcode Module** (if available in your Divi version)
2. Enter the shortcode

## Troubleshooting

### Products Not Showing

1. **Check if products are marked as featured**
   - Go to Products → All Products
   - Look for yellow ⭐ stars
   - If no stars are filled, no products are featured

2. **Check if products are published**
   - Products must be Published (not Draft or Private)

3. **Clear all caches**
   - Browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - WordPress: Clear any caching plugins
   - Server: Clear server cache

4. **Check browser console for errors**
   - Press F12
   - Look for red errors in Console tab

### Styling Not Working

1. **Verify CSS files are uploaded**
   - Check that `coconpm-featured.css` exists on server
   - Check that `coconpm-shop.css` exists on server

2. **Check CSS is loading**
   - View page source
   - Search for `coconpm-featured.css`
   - Should see it in `<link>` tags

3. **Clear all caches** (see above)

### Wrong Number of Columns

The grid is responsive and automatically adjusts based on screen size. On smaller screens, it will show fewer columns regardless of the `columns` parameter.

## Other Shortcodes Included

### Recent Products
Shows recently added products:
```
[recent_products limit="6" columns="3"]
```

### Product Category
Shows products from a specific category:
```
[product_category category="category-slug" limit="4" columns="2"]
```

To find category slug:
1. Go to Products → Categories
2. Hover over category name
3. Look at URL in browser status bar
4. The slug is the part after `tag_ID=`

## Development Notes

- The featured products use the same product card template as the shop page
- All styling is controlled through `coconpm-*` classes (no conflicts with Divi/WooCommerce)
- CSS is loaded globally so shortcode works on any page
- Grid uses CSS Grid for modern, clean layout
- Fully responsive with mobile-first approach

