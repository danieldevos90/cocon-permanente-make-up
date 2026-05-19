#!/bin/bash

# Upload COCONPM Product Variations System - FIXED VERSION
# This includes: variant dropdowns + image gallery switching + WooCommerce integration fix

echo "🔄 Uploading FIXED COCONPM Product Variations System..."

# Upload updated variable product template (FIXED WOOCOMMERCE INTEGRATION)
echo "📤 Uploading FIXED variable product template..."
scp cocon-permanente-make-up/Divi/woocommerce/single-product/add-to-cart/variable.php coconpm@coconpm.nl:domains/coconpm.nl/public_html/wp-content/themes/Divi/woocommerce/single-product/add-to-cart/

# Upload updated product CSS with variation styles (FIXED TABLE STYLING)
echo "📤 Uploading FIXED product CSS with variation styles..."
scp cocon-permanente-make-up/Divi/css/coconpm-product.css coconpm@coconpm.nl:domains/coconpm.nl/public_html/wp-content/themes/Divi/css/

# Upload updated product variations JavaScript (FIXED WOOCOMMERCE EVENTS)
echo "📤 Uploading FIXED product variations JavaScript..."
scp cocon-permanente-make-up/Divi/js/product-variations.js coconpm@coconpm.nl:domains/coconpm.nl/public_html/wp-content/themes/Divi/js/

# Upload updated WooCommerce custom PHP with JS enqueue
echo "📤 Uploading WooCommerce custom functions..."
scp cocon-permanente-make-up/Divi/inc/woocommerce-custom.php coconpm@coconpm.nl:domains/coconpm.nl/public_html/wp-content/themes/Divi/inc/

echo "✅ COCONPM Product Variations System Upload Complete!"
echo ""
echo "🎯 FIXES APPLIED:"
echo "   ✅ Fixed 'Selecteer enkele productopties' error"
echo "   ✅ Fixed greyed out Add to Cart button"
echo "   ✅ Restored WooCommerce variation functionality"
echo "   ✅ Maintained custom dropdown styling"
echo "   ✅ Fixed image gallery switching"
echo ""
echo "🔧 Test on:"
echo "   • Variable products - button should become active"
echo "   • Variation selection - should work without errors"
echo "   • Image switching when variants selected"
echo "   • Mobile/tablet responsiveness"
