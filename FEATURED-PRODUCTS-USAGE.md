# Featured Products - Fixed Usage Guide

## What Was Fixed

### Problem 1: Columns Not Working
**Cause**: Shop CSS was overriding featured CSS with lower specificity
- Shop CSS: `.coconpm-products-grid { grid-template-columns: repeat(4, 1fr); }`
- This was applying to ALL grids including featured products

**Solution**: Increased CSS specificity and added `!important`
- Before: `.coconpm-featured-grid.coconpm-columns-4`
- After: `.coconpm-featured-products .coconpm-products-grid.coconpm-featured-grid.coconpm-columns-4 !important`

### Problem 2: Title Not Showing
**Cause**: Title parameter not included in shortcode

**Solution**: Add the `title` parameter

---

## Correct Shortcode Usage

### WITHOUT Title (no header)
```
[featured_products limit="4" columns="4"]
```

### WITH Title (shows header)
```
[featured_products limit="4" columns="4" title="Uitgelichte producten"]
```

### All Parameters
```
[featured_products 
  limit="8" 
  columns="4" 
  title="Onze Bestsellers" 
  orderby="rand" 
  order="desc"]
```

---

## Parameters Explained

| Parameter | Required | Default | Description | Example Values |
|-----------|----------|---------|-------------|----------------|
| `limit` | No | `8` | Number of products | `4`, `8`, `12` |
| `columns` | No | `4` | Products per row (desktop) | `2`, `3`, `4`, `5`, `6` |
| `title` | No | *(none)* | Section heading | `"Uitgelichte producten"` |
| `orderby` | No | `rand` | Sort order | `rand`, `date`, `title`, `price` |
| `order` | No | `desc` | Sort direction | `asc`, `desc` |

---

## Example Shortcodes

### Show 4 products in 4 columns with title
```
[featured_products limit="4" columns="4" title="Populaire Producten"]
```

### Show 8 random products in 4 columns with title
```
[featured_products limit="8" columns="4" title="Ontdek Onze Producten" orderby="rand"]
```

### Show 6 newest products in 3 columns with title
```
[featured_products limit="6" columns="3" title="Nieuw Binnen" orderby="date"]
```

### Show 4 products without title
```
[featured_products limit="4" columns="4"]
```

---

## Files Changed

### `coconpm-featured.css`
- ✅ Increased CSS specificity with parent selector
- ✅ Added `!important` to override shop CSS
- ✅ All grid rules now have: `.coconpm-featured-products .coconpm-products-grid.coconpm-featured-grid.coconpm-columns-X`

### What Makes the Grid Work

**CSS Selector Chain (Specificity = 3 classes + !important):**
```css
.coconpm-featured-products 
  .coconpm-products-grid.coconpm-featured-grid.coconpm-columns-4 {
    grid-template-columns: repeat(4, minmax(240px, 300px)) !important;
    justify-content: start;
  }
```

This beats the shop CSS:
```css
.coconpm-products-grid {
  grid-template-columns: repeat(4, 1fr); /* Lower specificity */
}
```

---

## Upload & Test

1. **Upload the fixed CSS:**
   ```bash
   ./upload-featured-products.sh
   ```

2. **Update your shortcode to include title:**
   ```
   [featured_products limit="4" columns="4" title="Uitgelichte producten"]
   ```

3. **Clear all caches** (browser + WordPress)

4. **Check results:**
   - ✅ Title should now show
   - ✅ Products should be in 4 columns (not stretched)
   - ✅ Each product card ~270px wide max

---

## CSS Troubleshooting

### Verify CSS is Loading
Press **F12** → **Console** → You should see:
```
✅ COCONPM FEATURED CSS LOADED
```

### Verify Grid CSS is Applied
Press **F12** → **Inspector** → Select a product card → Check:
```css
.coconpm-featured-products .coconpm-products-grid.coconpm-featured-grid.coconpm-columns-4 {
  grid-template-columns: repeat(4, minmax(240px, 300px)) !important;
}
```

This should be visible and NOT crossed out.

---

## Common Mistakes

❌ **Wrong:** `[featured_products limit="4"]` (no title, but expecting one)
✅ **Right:** `[featured_products limit="4" title="Uitgelichte producten"]`

❌ **Wrong:** `columns=4` (no quotes)
✅ **Right:** `columns="4"` (with quotes)

❌ **Wrong:** Missing closing bracket `[featured_products`
✅ **Right:** Proper closing `[featured_products ...]`

---

## Dutch Title Suggestions

- `"Uitgelichte producten"`
- `"Onze Bestsellers"`
- `"Populaire Producten"`
- `"Ontdek Onze Collectie"`
- `"Aanbevolen Voor Jou"`
- `"Meest Verkocht"`
- `"Nieuw Binnen"`

