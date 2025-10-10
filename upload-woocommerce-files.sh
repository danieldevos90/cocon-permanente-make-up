#!/bin/bash

# Upload WooCommerce templates and CSS to FTP
# Usage: ./upload-woocommerce-files.sh

FTP_HOST="ftp.coconpermanentemakeup.nl"
FTP_USER="altfawesome@coconpermanentemakeup.nl"
FTP_PASS="rcFYzB8tUQeQsMaQ5bqw"
REMOTE_PATH="/home/coconper/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

echo "🚀 Starting WooCommerce files upload..."
echo ""

# Upload CSS file
echo "📤 Uploading woocommerce-custom.css..."
lftp -c "
set ftp:ssl-allow no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
cd $REMOTE_PATH/css
put Divi/css/woocommerce-custom.css
bye
"

if [ $? -eq 0 ]; then
    echo "✅ CSS file uploaded successfully"
else
    echo "❌ CSS file upload failed"
fi

echo ""
echo "📤 Uploading WooCommerce template files..."

# Upload WooCommerce templates
lftp -c "
set ftp:ssl-allow no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
mirror -R --no-perms --verbose Divi/woocommerce $REMOTE_PATH/woocommerce
bye
"

if [ $? -eq 0 ]; then
    echo "✅ WooCommerce templates uploaded successfully"
else
    echo "❌ WooCommerce templates upload failed"
fi

echo ""
echo "🎉 Upload process completed!"
echo ""
echo "Files uploaded:"
echo "  - woocommerce-custom.css"
echo "  - woocommerce/cart/cart.php"
echo "  - woocommerce/checkout/form-checkout.php"
echo "  - woocommerce/content-product.php"
echo "  - woocommerce/single-product/add-to-cart/simple.php"
echo "  - woocommerce/single-product/add-to-cart/variable.php"
echo "  - woocommerce/single-product/product-image.php"
echo "  - woocommerce/single-product/related.php"
echo "  - woocommerce/single-product.php"

