#!/bin/bash

# Upload Featured Products Shortcode Files
# This uploads the necessary files for the [featured_products] shortcode to work

echo "🚀 Uploading Featured Products Files..."
echo ""

# FTP credentials
FTP_HOST="server152.hosting2go.nl"
FTP_USER="domjiqtl"
FTP_PASS="4jL6ebMPCjf3"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Upload files via FTP
echo "📤 Uploading featured products files..."
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
cd $REMOTE_PATH;

# Upload the file containing the shortcode
put -O inc Divi/inc/woocommerce-custom.php;

# Upload featured products CSS
put -O css Divi/css/coconpm-featured.css;

# Upload shop CSS (needed for product cards)
put -O css Divi/css/coconpm-shop.css;

# Upload product card template
put -O woocommerce Divi/woocommerce/content-product.php;

bye;
"

if [ $? -eq 0 ]; then
    echo "✅ Upload successful!"
else
    echo "❌ Upload failed!"
    exit 1
fi

echo ""
echo "📦 Files uploaded:"
echo "   ✓ inc/woocommerce-custom.php - Contains [featured_products] shortcode"
echo "   ✓ css/coconpm-featured.css - Featured products section styles"
echo "   ✓ css/coconpm-shop.css - Product card styles (shared)"
echo "   ✓ woocommerce/content-product.php - Product card template"
echo ""
echo "🎯 What this includes:"
echo "   ✓ [featured_products] shortcode with custom coconpm-* classes"
echo "   ✓ Beautiful product grid with hover effects"
echo "   ✓ Responsive design (4/3/2/1 columns)"
echo "   ✓ Same styling as shop page"
echo "   ✓ [recent_products] and [product_category] shortcuts also included"
echo ""
echo "📝 Usage Examples:"
echo "   [coconpm_featured limit=\"4\" columns=\"4\"]"
echo "   [coconpm_featured limit=\"8\" columns=\"4\" title=\"Uitgelichte producten\"]"
echo "   [coconpm_featured limit=\"6\" columns=\"3\" orderby=\"rand\"]"
echo ""
echo "   Alternative (old name, may conflict with plugins):"
echo "   [featured_products limit=\"4\" columns=\"4\"]"
echo ""
echo "🎨 CSS Classes Used:"
echo "   - .coconpm-featured-products (section wrapper)"
echo "   - .coconpm-featured-container (content container)"
echo "   - .coconpm-featured-header (title section)"
echo "   - .coconpm-products-grid (product grid - shared with shop)"
echo "   - .coconpm-product-card (product card - shared with shop)"
echo "   - All card styles inherited from shop page"
echo ""
echo "⚠️  IMPORTANT - Next Steps:"
echo "   1. ⭐ Mark products as FEATURED in WooCommerce:"
echo "      - Go to: Products → All Products"
echo "      - Click the ⭐ star icon on products you want to feature"
echo ""
echo "   2. 🧹 Clear ALL caches:"
echo "      - Browser cache (Cmd+Shift+R / Ctrl+Shift+R)"
echo "      - WordPress cache (if using caching plugin)"
echo "      - Server cache (if applicable)"
echo ""
echo "   3. 🔍 Check the page - Featured products should now appear!"
echo ""
echo "🐛 Troubleshooting:"
echo "   If products still don't show:"
echo "   - Verify products are marked as Featured (⭐)"
echo "   - Check browser console for errors"
echo "   - View page source - search for 'No featured products found'"
echo "   - Make sure products are Published (not Draft)"
echo ""

