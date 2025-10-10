#!/bin/bash

# Script to add dummy images to WooCommerce products
# This script downloads dummy images and assigns them to products using WP-CLI

echo "🖼️  Adding dummy images to WooCommerce products..."

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create temporary directory for images
TEMP_DIR="/tmp/cocon-dummy-images"
mkdir -p $TEMP_DIR

echo -e "${BLUE}📥 Downloading dummy product images...${NC}"

# Download dummy images for makeup products (using picsum.photos for high-quality placeholder images)
# These will be different sizes suitable for product images

# Permanent makeup related dummy images (800x800 for product images)
for i in {1..10}; do
    echo "Downloading image $i..."
    curl -L "https://picsum.photos/800/800?random=$i" -o "$TEMP_DIR/product-$i.jpg" 2>/dev/null
    sleep 0.5  # Small delay to avoid rate limiting
done

# Also download some gallery images (different dimensions)
for i in {11..15}; do
    echo "Downloading gallery image $(($i-10))..."
    curl -L "https://picsum.photos/600/800?random=$i" -o "$TEMP_DIR/product-$i.jpg" 2>/dev/null
    sleep 0.5
done

echo -e "${GREEN}✅ Images downloaded successfully${NC}"

# Copy images into WP-CLI container's shared volume
echo -e "${BLUE}📦 Copying images to shared volume...${NC}"
docker cp $TEMP_DIR/. cocon_wp_cli:/var/www/html/wp-content/uploads/dummy-images/

echo -e "${BLUE}🔧 Processing products and adding images...${NC}"

# Execute WP-CLI commands inside the wp-cli container
docker exec cocon_wp_cli bash -c '
# Navigate to WordPress root
cd /var/www/html

# Check if images are accessible
IMAGE_DIR="/var/www/html/wp-content/uploads/dummy-images"
if [ ! -d "$IMAGE_DIR" ]; then
    echo "❌ Error: Image directory not found!"
    exit 1
fi

IMAGE_COUNT=$(ls -1 "$IMAGE_DIR"/*.jpg 2>/dev/null | wc -l)
echo "Found $IMAGE_COUNT images in upload directory"

if [ $IMAGE_COUNT -eq 0 ]; then
    echo "❌ Error: No images found!"
    exit 1
fi

echo "Getting list of products..."

# Get all product IDs
PRODUCT_IDS=$(wp post list --post_type=product --format=ids --allow-root)

if [ -z "$PRODUCT_IDS" ]; then
    echo "⚠️  No products found. Please create products first."
    exit 1
fi

echo "Found products: $PRODUCT_IDS"

# Counter for image assignment
IMG_COUNTER=1

# Loop through each product and assign images
for PRODUCT_ID in $PRODUCT_IDS; do
    PRODUCT_NAME=$(wp post get $PRODUCT_ID --field=post_title --allow-root)
    echo ""
    echo "Processing: $PRODUCT_NAME (ID: $PRODUCT_ID)"
    
    # Upload main product image
    IMAGE_FILE="$IMAGE_DIR/product-$IMG_COUNTER.jpg"
    
    if [ -f "$IMAGE_FILE" ]; then
        echo "  → Uploading main image from $IMAGE_FILE..."
        
        IMAGE_ID=$(wp media import "$IMAGE_FILE" \
            --post_id=$PRODUCT_ID \
            --title="$PRODUCT_NAME Main Image" \
            --porcelain \
            --allow-root 2>&1)
        
        # Check if upload was successful (IMAGE_ID should be a number)
        if [[ "$IMAGE_ID" =~ ^[0-9]+$ ]]; then
            # Set as featured image (main product image)
            wp post meta update $PRODUCT_ID _thumbnail_id $IMAGE_ID --allow-root
            echo "  ✅ Main image set (ID: $IMAGE_ID)"
            
            # Add to product gallery
            GALLERY_IDS="$IMAGE_ID"
            
            # Add 2-3 additional gallery images
            GALLERY_COUNT=$((1 + RANDOM % 3))  # Random between 1-3 additional images
            
            for (( g=1; g<=GALLERY_COUNT; g++ )); do
                GALLERY_IMG_NUM=$((IMG_COUNTER + g))
                
                # Make sure we have enough images (cycle through if needed)
                if [ $GALLERY_IMG_NUM -gt 15 ]; then
                    GALLERY_IMG_NUM=$((1 + RANDOM % 10 + 1))
                fi
                
                GALLERY_FILE="$IMAGE_DIR/product-$GALLERY_IMG_NUM.jpg"
                
                if [ -f "$GALLERY_FILE" ]; then
                    echo "  → Adding gallery image $g from product-$GALLERY_IMG_NUM.jpg..."
                    
                    GALLERY_IMG_ID=$(wp media import "$GALLERY_FILE" \
                        --post_id=$PRODUCT_ID \
                        --title="$PRODUCT_NAME Gallery $g" \
                        --porcelain \
                        --allow-root 2>&1)
                    
                    if [[ "$GALLERY_IMG_ID" =~ ^[0-9]+$ ]]; then
                        GALLERY_IDS="$GALLERY_IDS,$GALLERY_IMG_ID"
                        echo "  ✅ Gallery image $g added (ID: $GALLERY_IMG_ID)"
                    else
                        echo "  ⚠️  Failed to add gallery image: $GALLERY_IMG_ID"
                    fi
                fi
            done
            
            # Set product gallery
            wp post meta update $PRODUCT_ID _product_image_gallery "$GALLERY_IDS" --allow-root
            echo "  ✅ Product gallery updated with IDs: $GALLERY_IDS"
        else
            echo "  ❌ Failed to upload main image: $IMAGE_ID"
        fi
    else
        echo "  ⚠️  Image file not found: $IMAGE_FILE"
    fi
    
    # Mark some products as featured (for homepage)
    if [ $((RANDOM % 2)) -eq 0 ]; then
        wp post meta update $PRODUCT_ID _featured yes --allow-root
        echo "  ⭐ Marked as featured product"
    fi
    
    IMG_COUNTER=$((IMG_COUNTER + 1))
    
    # Reset counter if we run out of images
    if [ $IMG_COUNTER -gt 10 ]; then
        IMG_COUNTER=1
    fi
    
    echo "  ✅ Product $PRODUCT_ID complete!"
done

# Cleanup images from uploads directory
echo ""
echo "Cleaning up temporary images..."
rm -rf "$IMAGE_DIR"

echo ""
echo "✅ All products have been updated with images!"
echo ""

# Show summary
TOTAL_IMAGES=$(wp post list --post_type=attachment --format=count --allow-root)
echo "📊 Total images in media library: $TOTAL_IMAGES"
'

if [ $? -eq 0 ]; then
    # Cleanup local temp directory
    echo -e "${BLUE}🧹 Cleaning up local files...${NC}"
    rm -rf $TEMP_DIR

    echo ""
    echo -e "${GREEN}✅ Done! All products now have dummy images.${NC}"
    echo ""
    echo "📍 View your products at: http://localhost:8080/shop"
    echo "📍 Admin dashboard: http://localhost:8080/wp-admin"
    echo ""
    echo "💡 Tip: You may need to clear your browser cache to see the images."
else
    echo ""
    echo -e "${YELLOW}⚠️  Script completed with errors. Check output above.${NC}"
    echo ""
fi
