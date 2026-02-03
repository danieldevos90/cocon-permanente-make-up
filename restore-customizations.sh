#!/bin/bash
# Restore COCONPM Customizations to DirectAdmin Server
# This script uploads all custom files that were lost during the Divi theme update

# Configuration
DA_URL="https://coconpermanentemakeup.nl:2222"
DA_USER="coconper"
DA_PASS="f8thQXxSdda2wNnHTmBJ"
LOCAL_DIVI="/Users/danieldevos/Documents/ALT F AWESOME/cocon-permanente-make-up/cocon-permanente-make-up/Divi"
REMOTE_DIVI="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "COCONPM Customization Restore Script"
echo "=============================================="
echo ""

# Function to upload a file
upload_file() {
    local local_path="$1"
    local remote_path="$2"
    
    if [ -f "$local_path" ]; then
        echo -n "Uploading $(basename "$local_path")... "
        
        # Read file content and encode for upload
        local content=$(cat "$local_path")
        
        # Use curl to upload via DirectAdmin File Manager
        local response=$(curl -k -s -u "$DA_USER:$DA_PASS" \
            -X POST "$DA_URL/CMD_FILE_MANAGER" \
            -d "action=edit" \
            -d "path=$remote_path" \
            --data-urlencode "text=$content" 2>&1)
        
        if [[ "$response" == *"error"* ]]; then
            echo -e "${RED}FAILED${NC}"
            echo "Error: $response"
            return 1
        else
            echo -e "${GREEN}OK${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}SKIP${NC} - File not found: $local_path"
        return 1
    fi
}

# Function to create directory
create_dir() {
    local remote_path="$1"
    echo -n "Creating directory $remote_path... "
    
    curl -k -s -u "$DA_USER:$DA_PASS" \
        -X POST "$DA_URL/CMD_FILE_MANAGER" \
        -d "action=folder" \
        -d "path=$remote_path" \
        -d "name=new" > /dev/null 2>&1
    
    echo -e "${GREEN}OK${NC}"
}

echo "Step 1: Creating required directories..."
echo "----------------------------------------------"

# Create inc directory if it doesn't exist
create_dir "$REMOTE_DIVI/inc"

echo ""
echo "Step 2: Uploading CSS files..."
echo "----------------------------------------------"

# CSS Files
upload_file "$LOCAL_DIVI/css/coconpm-buttons.css" "$REMOTE_DIVI/css/coconpm-buttons.css"
upload_file "$LOCAL_DIVI/css/coconpm-shop.css" "$REMOTE_DIVI/css/coconpm-shop.css"
upload_file "$LOCAL_DIVI/css/coconpm-product.css" "$REMOTE_DIVI/css/coconpm-product.css"
upload_file "$LOCAL_DIVI/css/coconpm-featured.css" "$REMOTE_DIVI/css/coconpm-featured.css"
upload_file "$LOCAL_DIVI/css/coconpm-cart.css" "$REMOTE_DIVI/css/coconpm-cart.css"
upload_file "$LOCAL_DIVI/css/coconpm-checkout.css" "$REMOTE_DIVI/css/coconpm-checkout.css"
upload_file "$LOCAL_DIVI/css/coconpm-blog.css" "$REMOTE_DIVI/css/coconpm-blog.css"

echo ""
echo "Step 3: Uploading JavaScript files..."
echo "----------------------------------------------"

# JS Files
upload_file "$LOCAL_DIVI/js/coconpm-checkout-mobile.js" "$REMOTE_DIVI/js/coconpm-checkout-mobile.js"
upload_file "$LOCAL_DIVI/js/coconpm-noptin-popup.js" "$REMOTE_DIVI/js/coconpm-noptin-popup.js"
upload_file "$LOCAL_DIVI/js/product-gallery.js" "$REMOTE_DIVI/js/product-gallery.js"
upload_file "$LOCAL_DIVI/js/product-variations.js" "$REMOTE_DIVI/js/product-variations.js"

echo ""
echo "Step 4: Uploading PHP files..."
echo "----------------------------------------------"

# Main PHP files
upload_file "$LOCAL_DIVI/inc/woocommerce-custom.php" "$REMOTE_DIVI/inc/woocommerce-custom.php"
upload_file "$LOCAL_DIVI/archive-product.php" "$REMOTE_DIVI/archive-product.php"
upload_file "$LOCAL_DIVI/page-template-featured-products.php" "$REMOTE_DIVI/page-template-featured-products.php"

echo ""
echo "Step 5: Uploading WooCommerce template overrides..."
echo "----------------------------------------------"

# WooCommerce templates
upload_file "$LOCAL_DIVI/woocommerce/content-product.php" "$REMOTE_DIVI/woocommerce/content-product.php"
upload_file "$LOCAL_DIVI/woocommerce/single-product.php" "$REMOTE_DIVI/woocommerce/single-product.php"
upload_file "$LOCAL_DIVI/woocommerce/single-product/product-image.php" "$REMOTE_DIVI/woocommerce/single-product/product-image.php"
upload_file "$LOCAL_DIVI/woocommerce/single-product/related.php" "$REMOTE_DIVI/woocommerce/single-product/related.php"
upload_file "$LOCAL_DIVI/woocommerce/single-product/add-to-cart/simple.php" "$REMOTE_DIVI/woocommerce/single-product/add-to-cart/simple.php"
upload_file "$LOCAL_DIVI/woocommerce/single-product/add-to-cart/variable.php" "$REMOTE_DIVI/woocommerce/single-product/add-to-cart/variable.php"
upload_file "$LOCAL_DIVI/woocommerce/cart/cart.php" "$REMOTE_DIVI/woocommerce/cart/cart.php"
upload_file "$LOCAL_DIVI/woocommerce/checkout/form-checkout.php" "$REMOTE_DIVI/woocommerce/checkout/form-checkout.php"

echo ""
echo "=============================================="
echo "Restore Complete!"
echo "=============================================="
echo ""
echo "Please clear any caching plugins and test the website."
echo "URL: https://coconpermanentemakeup.nl"
