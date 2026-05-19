#!/bin/bash

# Upload COCONPM Checkout Styling Files - FIXED VERSION
# Custom 2-column checkout layout with consistent styling

echo "🛒 Uploading COCONPM Checkout Styling Files (FIXED)..."
echo "=================================================="

# FTP Configuration
FTP_HOST="ftp.coconpermanentemakeup.nl"
FTP_USER="coconper"
FTP_PASS="Cocon2024!"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Upload checkout CSS
echo "📦 Uploading coconpm-checkout.css (FIXED LAYOUT)..."
curl -T "Divi/css/coconpm-checkout.css" \
  ftp://$FTP_HOST$REMOTE_PATH/css/ \
  --user $FTP_USER:$FTP_PASS

# Upload checkout form template
echo "📦 Uploading form-checkout.php..."
curl -T "Divi/woocommerce/checkout/form-checkout.php" \
  ftp://$FTP_HOST$REMOTE_PATH/woocommerce/checkout/ \
  --user $FTP_USER:$FTP_PASS

# Upload woocommerce-custom.php with checkout CSS loading
echo "📦 Uploading woocommerce-custom.php (with checkout CSS loading)..."
curl -T "Divi/inc/woocommerce-custom.php" \
  ftp://$FTP_HOST$REMOTE_PATH/inc/ \
  --user $FTP_USER:$FTP_PASS

echo ""
echo "✅ CHECKOUT STYLING UPLOAD COMPLETE!"
echo "=================================================="
echo ""
echo "🔧 AGGRESSIVE FIXES APPLIED:"
echo "• ULTRA STRONG CSS selectors with html body prefixes"
echo "• Nuclear option Divi theme overrides (et_pb_section, et_pb_row, etc.)"
echo "• Forced black background for coupon message (was gold)"
echo "• Complete col2-set elimination and grid enforcement"
echo "• Added Divi-specific ID selectors (#main-content, #et-main-area)"
echo ""
echo "📋 UPLOADED FILES:"
echo "• coconpm-checkout.css - Fixed checkout page styling"
echo "• form-checkout.php - 2-column checkout layout template"
echo "• woocommerce-custom.php - Added checkout CSS loading"
echo ""
echo "🎯 LAYOUT FEATURES:"
echo "• Left Column (60%): Factuurgegevens (Billing Details)"
echo "• Right Column (40%): Je bestelling (Your Order)"
echo "• Consistent COCONPM styling and button system"
echo "• Responsive design for mobile/tablet"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Clear browser cache and reload checkout page"
echo "2. Verify 2-column layout is working"
echo "3. Check that coupon message is styled properly"
echo "4. Test checkout functionality"
echo ""
