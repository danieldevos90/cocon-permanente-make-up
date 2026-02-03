#!/bin/bash

# Upload checkout mobile fix
echo "Uploading checkout mobile grid fix..."

# FTP credentials
FTP_HOST="ftp.altfawesome.nl"
FTP_USER="cocon@cocon-cosmetics.nl"
FTP_PASS="ALT-F-AWESOME1"

# Upload the updated checkout CSS file
ftp -inv $FTP_HOST <<EOF
user $FTP_USER $FTP_PASS
cd /domains/cocon-cosmetics.nl/public_html/wp-content/themes/Divi/css
put cocon-permanente-make-up/Divi/css/coconpm-checkout.css coconpm-checkout.css
cd ../js
put cocon-permanente-make-up/Divi/js/coconpm-checkout-mobile.js coconpm-checkout-mobile.js
cd ../inc
put cocon-permanente-make-up/Divi/inc/woocommerce-custom.php woocommerce-custom.php
bye
EOF

echo "Checkout mobile fix uploaded successfully!"
echo ""
echo "✅ Updated files:"
echo "• coconpm-checkout.css - Enhanced mobile media queries with ultra-strong selectors"
echo "• coconpm-checkout-mobile.js - JavaScript failsafe for mobile grid override"
echo "• woocommerce-custom.php - Added JavaScript enqueue for mobile fix"
echo ""
echo "The checkout grid will now display as a single column on mobile devices."
echo ""
echo "📱 Mobile Fix Features:"
echo "• CSS media queries with maximum specificity"
echo "• JavaScript backup that forces inline styles on mobile"
echo "• Automatic responsive behavior on window resize"
echo ""
echo "Please clear your browser cache and test the checkout page on mobile."
