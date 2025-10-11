#!/bin/bash

# Quick Upload - Just Buttons CSS
# Fixes checkout button styling issues

echo "🎨 Uploading FIXED Button CSS (Checkout buttons included)..."
echo ""

# FTP credentials
FTP_HOST="server152.hosting2go.nl"
FTP_USER="domjiqtl"
FTP_PASS="4jL6ebMPCjf3"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Upload just the buttons CSS
echo "📤 Uploading coconpm-buttons.css..."
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
cd $REMOTE_PATH;
put -O css Divi/css/coconpm-buttons.css;
bye;
"

echo ""
echo "✅ Button CSS uploaded!"
echo ""
echo "🎯 What was fixed:"
echo "   ✓ Checkout Place Order button - now pink"
echo "   ✓ Checkout coupon button - now pink"
echo "   ✓ ALL checkout form buttons - unified styling"
echo "   ✓ Stronger CSS selectors to override Divi"
echo ""
echo "📝 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)"
echo "   2. Clear WordPress cache if you have a plugin"
echo "   3. Visit checkout page"
echo "   4. All buttons should now be:"
echo "      • Pink border (#C64193)"
echo "      • Transparent background"
echo "      • Pink text"
echo "      • Hover: Pink fill, white text"
echo ""
echo "🎨 Place Order button specifics:"
echo "   • Full width"
echo "   • 56px height (larger)"
echo "   • 18px font size"
echo "   • Pink border → Pink fill on hover"
echo ""
echo "✨ Done!"


