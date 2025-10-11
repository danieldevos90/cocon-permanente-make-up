#!/bin/bash

# Upload Unified COCONPM Button System
# Consistent buttons across ALL WooCommerce pages

echo "🎨 Uploading Unified COCONPM Button System..."
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

# Upload unified button CSS
echo 'Uploading coconpm-buttons.css...';
put -O css Divi/css/coconpm-buttons.css;

# Upload updated templates
echo 'Uploading updated templates...';
put -O woocommerce Divi/woocommerce/content-product.php;
put -O woocommerce Divi/woocommerce/single-product.php;

# Upload updated enqueue functions
echo 'Uploading woocommerce-custom.php...';
put -O inc Divi/inc/woocommerce-custom.php;

bye;
"

echo ""
echo "✅ Upload complete!"
echo ""
echo "═══════════════════════════════════════════════════"
echo "        🎨 UNIFIED BUTTON SYSTEM DEPLOYED           "
echo "═══════════════════════════════════════════════════"
echo ""
echo "📦 What was uploaded:"
echo "   ✓ coconpm-buttons.css - Shared button styles"
echo "   ✓ content-product.php - Updated button class"
echo "   ✓ single-product.php - Updated button class"
echo "   ✓ woocommerce-custom.php - Loads button CSS everywhere"
echo ""
echo "🎯 Benefits:"
echo "   ✓ ONE button style for ALL pages"
echo "   ✓ Consistent look: Shop, Product, Cart, Checkout"
echo "   ✓ Easy to maintain (change once, applies everywhere)"
echo "   ✓ No more duplicate button CSS in multiple files"
echo ""
echo "🎨 Button Classes Available:"
echo "   - .coconpm-btn (base button)"
echo "   - .coconpm-btn-primary (pink, main CTA)"
echo "   - .coconpm-btn-secondary (grey, less emphasis)"
echo "   - .coconpm-btn-block (full width)"
echo "   - .coconpm-btn-sm (small, 44px)"
echo "   - .coconpm-btn-lg (large, 56px)"
echo ""
echo "📝 Usage Examples:"
echo "   <button class='coconpm-btn'>Button</button>"
echo "   <button class='coconpm-btn coconpm-btn-primary'>Add to Cart</button>"
echo "   <button class='coconpm-btn coconpm-btn-secondary'>Cancel</button>"
echo "   <button class='coconpm-btn coconpm-btn-block'>Full Width</button>"
echo ""
echo "🎨 Button Styling:"
echo "   • Pink: #C64193 (primary)"
echo "   • Grey: #666666 (secondary)"
echo "   • Height: 48px (standard)"
echo "   • Border: 2px solid"
echo "   • Hover: Filled background"
echo "   • Border radius: 0 (sharp corners)"
echo ""
echo "📝 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache"
echo "   3. Visit any WooCommerce page"
echo "   4. Open browser console - you should see:"
echo "      '🎨 COCONPM UNIFIED BUTTONS CSS LOADED!'"
echo "   5. Check that all buttons look consistent"
echo ""
echo "🎯 Applies to ALL buttons on:"
echo "   • Shop page (Add to Cart)"
echo "   • Product page (Add to Cart)"
echo "   • Cart page (Update Cart, Proceed to Checkout)"
echo "   • Checkout page (Place Order)"
echo "   • Notice messages (View Cart, etc.)"
echo ""
echo "═══════════════════════════════════════════════════"
echo "        ✨ Buttons are now unified! ✨               "
echo "═══════════════════════════════════════════════════"


