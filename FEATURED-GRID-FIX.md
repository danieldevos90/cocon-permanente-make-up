# Featured Products Grid Fix

## Problem
Product cards were stretching to full width when there were fewer products than columns (e.g., showing 1 product in a 4-column grid made it huge).

## Solution
Updated `coconpm-featured.css` to use fixed column widths with `minmax()` and `justify-content: start`:

### Before
```css
.coconpm-featured-grid.coconpm-columns-4 {
  grid-template-columns: repeat(4, 1fr); /* Each column takes 1 fraction = stretches */
}
```

### After
```css
.coconpm-featured-grid.coconpm-columns-4 {
  grid-template-columns: repeat(4, minmax(240px, 300px)); /* Fixed min/max width */
  justify-content: start; /* Align to left, don't stretch */
}
```

## Result
- **4 columns**: Each product card is 240-300px wide (never stretches to fill empty space)
- **3 columns**: Each product card is 240-350px wide
- **2 columns**: Each product card is 250-350px wide
- Products maintain consistent size even if there's only 1 product

## Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| Desktop (>1200px) | Shows requested columns (2-6) with fixed widths |
| Large Desktop (992-1200px) | 4+ column grids become 3 columns |
| Tablet (768-992px) | All grids become 2 columns |
| Mobile (480-768px) | All grids stay 2 columns (smaller cards) |
| Small Mobile (<480px) | All grids become 1 column (centered) |

## Example Usage

### Show 4 products in 4 columns
```
[featured_products limit="4" columns="4"]
```
Even if you only have 1-3 featured products, they won't stretch - they'll maintain their ~270px width.

### Show 3 products in 3 columns
```
[featured_products limit="3" columns="3"]
```
Each card will be ~295px wide maximum.

## Files Changed
- `Divi/css/coconpm-featured.css` - Fixed grid column definitions

## Upload
```bash
./upload-featured-products.sh
```

This will upload the updated CSS file to your server.

