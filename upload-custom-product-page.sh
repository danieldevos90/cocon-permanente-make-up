#!/bin/bash

# Upload Custom COCONPM Product Page
# Completely custom product page with coconpm-* classes (like cart page)

echo "🚀 Uploading Custom COCONPM Product Page..."

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

# Upload product template
put -O woocommerce Divi/woocommerce/single-product.php;

# Upload custom product CSS
put -O css Divi/css/coconpm-product.css;

# Upload updated enqueue functions
put -O inc Divi/inc/woocommerce-custom.php;

bye;
"

echo ""
echo "✅ Upload complete!"
echo ""
echo "📦 What was uploaded:"
echo "   ✓ single-product.php - Custom product template with coconpm-* classes"
echo "   ✓ coconpm-product.css - 100% custom product page styles"
echo "   ✓ woocommerce-custom.php - Updated to enqueue product CSS"
echo ""
echo "🎯 What's different:"
echo "   ✓ No more cocon-* classes that conflict with Divi"
echo "   ✓ All coconpm-* classes (same pattern as cart page)"
echo "   ✓ Clean 2-column grid: Images left, Info right"
echo "   ✓ No WooCommerce or Divi style conflicts"
echo "   ✓ Fully responsive design"
echo ""
echo "📝 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache if you have a caching plugin"
echo "   3. Visit a product page"
echo "   4. Open browser console - you should see:"
echo "      '✅ COCONPM PRODUCT CSS LOADED!'"
echo ""
echo "⚠️  Note: Demo Product still has no images"
echo "   Add a featured image in WordPress Admin to test the full layout"
echo ""
echo "🎨 CSS Classes Used:"
echo "   - .coconpm-product-page (container)"
echo "   - .coconpm-product-grid (2-column grid)"
echo "   - .coconpm-product-left (images)"
echo "   - .coconpm-product-right (info)"
echo "   - .coconpm-product-title"
echo "   - .coconpm-product-price"
echo "   - .coconpm-add-to-cart"
echo "   - etc."

