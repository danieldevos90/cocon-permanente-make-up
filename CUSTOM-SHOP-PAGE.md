# Custom COCONPM Shop/Archive Page

**Status:** ✅ Ready to Deploy  
**Pattern:** Same as Cart & Product Pages (coconpm-* classes)  
**Approach:** 100% Custom - No Divi/WooCommerce Conflicts

---

## 🎯 Problem Solved

**Before:**
- ❌ Mixed `cocon-*`, `wc-*` classes causing conflicts
- ❌ Fighting with Divi's dynamic CSS overrides
- ❌ Product grid not using consistent styling
- ❌ Inconsistent with cart and product pages

**After:**
- ✅ Clean 4-column responsive product grid
- ✅ 100% custom `coconpm-*` classes (no conflicts)
- ✅ Same pattern as cart & product pages (consistent)
- ✅ Beautiful product cards with hover effects
- ✅ Fully responsive (4/3/2/1 columns)

---

## 📁 Files Changed

### 1. `Divi/archive-product.php` (Shop Template)
**New Custom Classes:**
```html
<div class="coconpm-shop-page">
  <h1 class="coconpm-shop-title">...</h1>
  <div class="coconpm-shop-toolbar">...</div>
  <div class="coconpm-products-grid">
    <!-- Product cards here -->
  </div>
  <div class="coconpm-shop-pagination">...</div>
</div>
```

### 2. `Divi/woocommerce/content-product.php` (Product Card)
**New Custom Classes:**
```html
<div class="coconpm-product-card">
  <a class="coconpm-card-link">
    <div class="coconpm-card-image">...</div>
    <span class="coconpm-sale-badge">...</span>
  </a>
  <div class="coconpm-card-body">
    <div class="coconpm-card-header">
      <h3 class="coconpm-card-title">...</h3>
      <div class="coconpm-card-price">...</div>
    </div>
    <div class="coconpm-card-excerpt">...</div>
    <div class="coconpm-card-actions">
      <a class="coconpm-card-button">...</a>
    </div>
  </div>
</div>
```

### 3. `Divi/css/coconpm-shop.css` (NEW FILE)
**100% Custom Styles:**
- Shop Container & Page Title
- Toolbar (Result Count + Sorting)
- 4-Column Responsive Grid
- Product Cards (Image, Title, Price, Description, Button)
- Sale Badges
- Hover Effects
- Pagination
- No Products Found Message
- Fully Responsive (5 breakpoints)

### 4. `Divi/inc/woocommerce-custom.php` (Updated)
**Added Shop CSS Enqueue:**
```php
if ( is_shop() || is_product_category() || is_product_tag() || is_product_taxonomy() ) {
    wp_enqueue_style('coconpm-shop', ...);
}
```

---

## 🎨 CSS Classes Reference

### Layout Classes
- `.coconpm-shop-page` - Main container (max-width: 1200px)
- `.coconpm-shop-title` - Page title (H1)
- `.coconpm-shop-toolbar` - Result count + sorting
- `.coconpm-products-grid` - 4-column grid layout
- `.coconpm-shop-pagination` - Pagination wrapper
- `.coconpm-no-products` - Empty state

### Product Card Classes
- `.coconpm-product-card` - Card wrapper
- `.coconpm-card-link` - Image link wrapper
- `.coconpm-card-image` - Image container (1:1 aspect ratio)
- `.coconpm-sale-badge` - "Sale" badge (gold)
- `.coconpm-card-body` - Card content wrapper
- `.coconpm-card-header` - Title + Price row
- `.coconpm-card-title` - Product title (H3)
- `.coconpm-card-price` - Product price
- `.coconpm-card-excerpt` - Short description
- `.coconpm-card-actions` - Button wrapper
- `.coconpm-card-button` - Add to cart button

---

## 🚀 Deployment

### Upload Files:
```bash
./upload-custom-shop-page.sh
```

**Or manually via FTP:**
1. `Divi/archive-product.php` → `/wp-content/themes/Divi/`
2. `Divi/woocommerce/content-product.php` → `/wp-content/themes/Divi/woocommerce/`
3. `Divi/css/coconpm-shop.css` → `/wp-content/themes/Divi/css/`
4. `Divi/inc/woocommerce-custom.php` → `/wp-content/themes/Divi/inc/`

### After Upload:
1. **Clear browser cache** (Cmd+Shift+R)
2. **Clear WordPress cache** (if using caching plugin)
3. **Visit shop page** or any product category
4. **Open browser console** - should see:
   ```
   ✅ COCONPM SHOP CSS LOADED!
   ```

---

## 📱 Responsive Grid Breakpoints

| Screen Size | Columns | CSS |
|-------------|---------|-----|
| Large Desktop (>1200px) | 4 columns | `grid-template-columns: repeat(4, 1fr)` |
| Desktop (992-1200px) | 3 columns | `grid-template-columns: repeat(3, 1fr)` |
| Tablet (768-992px) | 2 columns | `grid-template-columns: repeat(2, 1fr)` |
| Mobile (576-768px) | 2 columns | `grid-template-columns: repeat(2, 1fr)` |
| Small Mobile (<576px) | 1 column | `grid-template-columns: 1fr` |

---

## 🎯 Key Features

### Product Card Design
```
┌─────────────────────┐
│                     │
│   Product Image     │
│   (1:1 ratio)       │
│   [Sale Badge]      │
│                     │
├─────────────────────┤
│ Title    │  €12,00  │
├─────────────────────┤
│ Short description   │
│ truncated to 15...  │
├─────────────────────┤
│ [Add to Cart Btn]   │
└─────────────────────┘
```

### Hover Effects
- **Image:** Scales to 1.05x
- **Card:** Subtle shadow appears
- **Title:** Changes to pink (#C64193)
- **Button:** Pink fill with white text

### Sale Badge
- Gold background (#BFA86C)
- White text
- Positioned top-right on image
- Uppercase, bold, 12px

### Add to Cart Button
- Transparent background
- Pink border (#C64193)
- Hover: Pink fill with white text
- Full width
- 48px height (consistent with other pages)

### Pagination
- Centered layout
- Inline flex with 8px gap
- 40px × 40px buttons
- Pink active state
- Smooth hover transitions

---

## 🎨 Product Card Styling

### Image Section
```css
.coconpm-card-image {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f5f5f5;
}
```

### Price Display
- **Regular Price:** Pink (#C64193), 16px, bold
- **Old Price:** Grey (#999999), 14px, strikethrough
- **Sale Price:** Pink (#C64193), 16px, bold, no underline

### Typography
- **Title:** 16px, Semi-bold (600), Black
- **Description:** 14px, Regular (400), Grey (#666666)
- **Button:** 14px, Medium (500), Pink → White on hover

---

## 🔄 Comparison with Other Pages

All WooCommerce pages now use the **same pattern:**

| Aspect | Shop Page | Product Page | Cart Page |
|--------|-----------|--------------|-----------|
| Container | `.coconpm-shop-page` | `.coconpm-product-page` | `.coconpm-cart-page` |
| Grid | `.coconpm-products-grid` | `.coconpm-product-grid` | `.coconpm-cart-grid` |
| Card/Item | `.coconpm-product-card` | `.coconpm-product-*` | `.coconpm-cart-item` |
| Custom CSS | `coconpm-shop.css` | `coconpm-product.css` | `coconpm-cart.css` |
| Enqueue | `if (is_shop())` | `if (is_product())` | `if (is_cart())` |
| Style Conflicts | None ✅ | None ✅ | None ✅ |

**Result:** Consistent, maintainable, conflict-free codebase across ALL WooCommerce pages.

---

## 🎉 Benefits

1. **No More Conflicts:** Custom classes don't collide with Divi or WooCommerce
2. **Easy to Customize:** All styles in one dedicated CSS file (522 lines)
3. **Consistent Pattern:** Same approach as cart & product pages
4. **Better Performance:** No style override battles
5. **Future-Proof:** Won't break with Divi/WooCommerce updates
6. **Maintainable:** Clear, organized code structure
7. **Beautiful Design:** Modern card-based layout with smooth animations

---

## 📋 Pages Using Custom COCONPM Classes

✅ **Shop Page** (archive-product.php) - `coconpm-shop.css`  
✅ **Product Categories** - `coconpm-shop.css`  
✅ **Product Tags** - `coconpm-shop.css`  
✅ **Single Product** - `coconpm-product.css`  
✅ **Cart Page** - `coconpm-cart.css`  

---

## 🎨 Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary (Pink) | Pink | #C64193 |
| Gold (Sale Badge) | Fuchsia | #BFA86C |
| Text (Dark) | Black | #000000 |
| Text (Light) | Grey | #666666 |
| Text (Muted) | Light Grey | #999999 |
| Border | Light Grey | #e0e0e0 |
| Background | Off-White | #f5f5f5 |

---

## 📚 Next Steps

1. **Deploy the files** using the upload script
2. **Test on shop page** - verify grid layout works
3. **Test category pages** - ensure styling is consistent
4. **Test responsive design** on mobile/tablet
5. **Add product images** if missing
6. **Customize styling** if needed (all in `coconpm-shop.css`)

---

## 🔧 Customization Guide

All styling is in `Divi/css/coconpm-shop.css`:

**Change number of columns:**
```css
.coconpm-products-grid {
  grid-template-columns: repeat(4, 1fr); /* Change 4 to 3 or 5 */
}
```

**Change card spacing:**
```css
.coconpm-products-grid {
  gap: 24px; /* Change to 16px or 32px */
}
```

**Change button color:**
```css
.coconpm-card-button {
  border: 2px solid #C64193; /* Your color */
  color: #C64193;
}
```

**Disable hover effects:**
```css
.coconpm-product-card:hover .coconpm-card-image img {
  transform: none; /* Remove scale effect */
}
```

---

**Questions?** All styling is in `Divi/css/coconpm-shop.css` - easy to modify!

