#!/bin/bash

# Upload Shop Updates: Overflow Fix + Button Text + Category Filters
# Fixes product cards overflowing their container on shop pages
# Makes button text smaller for better fit
# Adds Dutch category filter buttons to shop page

echo "🚀 Uploading Shop Updates: Overflow Fix + Button Text + Category Filters..."

# Upload the updated shop CSS
echo "📤 Uploading coconpm-shop.css..."
scp -i ~/.ssh/web css/coconpm-shop.css web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/css/

# Upload the updated buttons CSS
echo "📤 Uploading coconpm-buttons.css..."
scp -i ~/.ssh/web css/coconpm-buttons.css web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/css/

# Upload the updated product card template
echo "📤 Uploading content-product.php..."
scp -i ~/.ssh/web woocommerce/content-product.php web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/woocommerce/

# Upload the updated shop page template
echo "📤 Uploading archive-product.php..."
scp -i ~/.ssh/web archive-product.php web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/

# Upload the updated single product template
echo "📤 Uploading single-product.php..."
scp -i ~/.ssh/web woocommerce/single-product.php web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/woocommerce/

# Upload the updated WooCommerce custom CSS (for message styling)
echo "📤 Uploading woocommerce-custom.css..."
scp -i ~/.ssh/web css/woocommerce-custom.css web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/css/

echo "✅ Shop updates uploaded successfully!"
echo ""
echo "🔧 Changes made:"
echo "   • Fixed product card overflow issues"
echo "   • Added width and max-width constraints to grid and cards"
echo "   • Added overflow: hidden to prevent card overflow"
echo "   • Added box-sizing: border-box to all card elements"
echo "   • Added proper text wrapping to prevent text overflow"
echo "   • Reduced button font size from 16px to 12px"
echo "   • Added Dutch category filter section at top of shop page"
echo "   • Category filters styled with theme colors"
echo "   • Responsive category filter design for all devices"
echo "   • Added small category labels above product titles"
echo "   • Made demo messages more minimal (removed borders)"
echo "   • Removed borders from pagination for cleaner look"
echo "   • Added shipping & return policy info boxes"
echo ""
echo "📦 New Info Boxes Features:"
echo "   • Shipping info: Potloden (brievenbus) vs Naalden (pakket)"
echo "   • Free shipping from €75 highlighted"
echo "   • International shipping mentioned"
echo "   • Return policy: Make-up not returnable (hygiene)"
echo "   • Other products: 14 days return policy"
echo "   • Styled with theme colors (gold/pink borders)"
echo "   • Added to both shop page and product pages"
echo "   • Fully responsive design"
echo ""
echo "🎨 Category Filter Features:"
echo "   • 'Alle producten' button to show all products"
echo "   • Individual category buttons in Dutch"
echo "   • Active state highlighting (pink #C64193)"
echo "   • Hover effects with gold color (#BFA86C)"
echo "   • Fully responsive design"
echo "   • Clean, professional appearance matching theme"
echo ""
echo "💡 The shop page now features:"
echo "   - Product cards that stay within container boundaries"
echo "   - Smaller, better-fitting button text"
echo "   - Beautiful category filter section at the top"
echo "   - Easy navigation between product categories"
echo "🌐 Visit the shop page to see the new category filters in action!"