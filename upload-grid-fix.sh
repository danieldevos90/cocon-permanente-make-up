#!/bin/bash

# Upload WooCommerce CSS Grid Fix
# This fixes the product page grid layout that was broken

echo "🔧 Uploading WooCommerce CSS Grid Fix..."

# FTP credentials
FTP_HOST="server152.hosting2go.nl"
FTP_USER="domjiqtl"
FTP_PASS="4jL6ebMPCjf3"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi/css"

# Upload the CSS file
echo "📤 Uploading woocommerce-custom.css..."
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
cd $REMOTE_PATH;
put Divi/css/woocommerce-custom.css;
bye;
"

echo "✅ Upload complete!"
echo ""
echo "🎯 What was fixed:"
echo "   ✓ Grid layout now uses stronger CSS selectors to override Divi"
echo "   ✓ Added explicit grid-column positioning for image and info columns"
echo "   ✓ Forced container padding and width with !important"
echo "   ✓ Responsive breakpoints strengthened"
echo ""
echo "📝 Next steps:"
echo "   1. Clear your browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache if you have a caching plugin"
echo "   3. Refresh the product page"
echo "   4. You should now see a proper 2-column layout (image left, info right)"
echo ""
echo "⚠️  Note: The Demo Product still has no images, so the left column will be empty"
echo "   To test properly, add a featured image to the Demo Product in WordPress admin"


