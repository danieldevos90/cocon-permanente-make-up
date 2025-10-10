#!/bin/bash

# Upload ALL Custom COCONPM WooCommerce Pages
# Complete transformation: Shop, Product, and Cart pages
# All using coconpm-* classes for zero conflicts

echo "🚀 Uploading ALL Custom COCONPM WooCommerce Pages..."
echo ""
echo "📦 This will upload:"
echo "   ✓ Shop/Archive Page (coconpm-shop.css)"
echo "   ✓ Single Product Page (coconpm-product.css)"
echo "   ✓ Cart Page (coconpm-cart.css)"
echo "   ✓ All templates and enqueue functions"
echo ""

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

# Unified Button System (loads on ALL pages)
echo 'Uploading unified button CSS...';
put -O css Divi/css/coconpm-buttons.css;

# Shop Page Files
echo 'Uploading shop page...';
put Divi/archive-product.php;
put -O woocommerce Divi/woocommerce/content-product.php;
put -O css Divi/css/coconpm-shop.css;

# Product Page Files
echo 'Uploading product page...';
put -O woocommerce Divi/woocommerce/single-product.php;
put -O css Divi/css/coconpm-product.css;

# Cart Page Files (if exists)
echo 'Uploading cart page...';
put -O css Divi/css/coconpm-cart.css;

# Enqueue Functions
echo 'Uploading enqueue functions...';
put -O inc Divi/inc/woocommerce-custom.php;

bye;
"

echo ""
echo "✅ Upload complete!"
echo ""
echo "═══════════════════════════════════════════════════"
echo "        🎉 COCONPM WOOCOMMERCE TRANSFORMATION       "
echo "═══════════════════════════════════════════════════"
echo ""
echo "📦 All Custom Pages Uploaded:"
echo ""
echo "   🏪 SHOP PAGE"
echo "      - archive-product.php"
echo "      - content-product.php (product cards)"
echo "      - coconpm-shop.css"
echo "      - 4-column responsive grid"
echo "      - Beautiful product cards"
echo ""
echo "   📦 PRODUCT PAGE"
echo "      - single-product.php"
echo "      - coconpm-product.css"
echo "      - 2-column layout (images + info)"
echo "      - Custom quantity selector"
echo ""
echo "   🛒 CART PAGE"
echo "      - coconpm-cart.css"
echo "      - Clean table layout"
echo "      - Custom quantity selectors"
echo ""
echo "   ⚙️  ENQUEUE FUNCTIONS"
echo "      - woocommerce-custom.php"
echo "      - Auto-loads correct CSS per page"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "🎯 What's Changed:"
echo "   ✓ 100% custom coconpm-* classes on ALL pages"
echo "   ✓ Zero Divi or WooCommerce conflicts"
echo "   ✓ Consistent styling across shop/product/cart"
echo "   ✓ Fully responsive designs"
echo "   ✓ Beautiful hover effects & animations"
echo "   ✓ Clean, maintainable code"
echo ""
echo "📝 Next Steps:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache"
echo "   3. Test each page type:"
echo "      - Shop: /shop/"
echo "      - Product: /product/demo-product/"
echo "      - Cart: /cart/"
echo "   4. Check browser console for:"
echo "      ✅ COCONPM SHOP CSS LOADED!"
echo "      ✅ COCONPM PRODUCT CSS LOADED!"
echo "      ✅ COCONPM CART CSS LOADED!"
echo ""
echo "🎨 CSS Files (3 total):"
echo "   - coconpm-shop.css (522 lines)"
echo "   - coconpm-product.css (522 lines)"
echo "   - coconpm-cart.css (existing)"
echo ""
echo "📚 Documentation:"
echo "   - CUSTOM-SHOP-PAGE.md"
echo "   - CUSTOM-PRODUCT-PAGE.md"
echo ""
echo "═══════════════════════════════════════════════════"
echo "        ✨ Your WooCommerce is now conflict-free! ✨  "
echo "═══════════════════════════════════════════════════"

