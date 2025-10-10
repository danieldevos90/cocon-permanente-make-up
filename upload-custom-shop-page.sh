#!/bin/bash

# Upload Custom COCONPM Shop/Archive Page
# Completely custom shop page with coconpm-* classes (like cart and product pages)

echo "🚀 Uploading Custom COCONPM Shop/Archive Page..."

# FTP credentials
FTP_HOST="server152.hosting2go.nl"
FTP_USER="domjiqtl"
FTP_PASS="4jL6ebMPCjf3"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Upload files via FTP
echo "📤 Uploading files..."
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
cd $REMOTE_PATH;

# Upload shop archive template
put Divi/archive-product.php;

# Upload product card template
put -O woocommerce Divi/woocommerce/content-product.php;

# Upload custom shop CSS
put -O css Divi/css/coconpm-shop.css;

# Upload updated enqueue functions
put -O inc Divi/inc/woocommerce-custom.php;

bye;
"

echo ""
echo "✅ Upload complete!"
echo ""
echo "📦 What was uploaded:"
echo "   ✓ archive-product.php - Custom shop template with coconpm-* classes"
echo "   ✓ content-product.php - Custom product card with coconpm-* classes"
echo "   ✓ coconpm-shop.css - 100% custom shop page styles"
echo "   ✓ woocommerce-custom.php - Updated to enqueue shop CSS"
echo ""
echo "🎯 What's different:"
echo "   ✓ No more cocon-* or wc-* classes that conflict with Divi"
echo "   ✓ All coconpm-* classes (same pattern as cart & product pages)"
echo "   ✓ Clean 4-column product grid (responsive)"
echo "   ✓ Beautiful product cards with hover effects"
echo "   ✓ No WooCommerce or Divi style conflicts"
echo "   ✓ Fully responsive design (4/3/2/1 columns)"
echo ""
echo "📝 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache if you have a caching plugin"
echo "   3. Visit shop page or product category"
echo "   4. Open browser console - you should see:"
echo "      '✅ COCONPM SHOP CSS LOADED!'"
echo ""
echo "🎨 CSS Classes Used:"
echo "   - .coconpm-shop-page (container)"
echo "   - .coconpm-products-grid (4-column grid)"
echo "   - .coconpm-product-card (card wrapper)"
echo "   - .coconpm-card-image (image section)"
echo "   - .coconpm-card-body (content section)"
echo "   - .coconpm-card-title (product title)"
echo "   - .coconpm-card-price (price)"
echo "   - .coconpm-card-button (add to cart)"
echo "   - etc."
echo ""
echo "📱 Responsive Grid:"
echo "   - Desktop (>1200px): 4 columns"
echo "   - Desktop (992-1200px): 3 columns"
echo "   - Tablet (768-992px): 2 columns"
echo "   - Mobile (<768px): 2 columns"
echo "   - Small Mobile (<576px): 1 column"

