#!/bin/bash

# Upload Shop Overflow Fix + Button Text Size + Categories
# Fixes product cards overflowing their container on shop pages
# Makes button text smaller for better fit
# Adds Dutch product categories to product cards

echo "🚀 Uploading Shop Updates: Overflow Fix + Button Text + Categories..."

# Upload the updated shop CSS
echo "📤 Uploading coconpm-shop.css..."
scp -i ~/.ssh/web css/coconpm-shop.css web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/css/

# Upload the updated buttons CSS
echo "📤 Uploading coconpm-buttons.css..."
scp -i ~/.ssh/web css/coconpm-buttons.css web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/css/

# Upload the updated product card template
echo "📤 Uploading content-product.php..."
scp -i ~/.ssh/web woocommerce/content-product.php web@server-1.coconcosmetics.nl:/home/web/domains/coconcosmetics.nl/public_html/wp-content/themes/Divi/woocommerce/

echo "✅ Shop updates uploaded successfully!"
echo ""
echo "🔧 Changes made:"
echo "   • Fixed product card overflow issues"
echo "   • Added width and max-width constraints to grid and cards"
echo "   • Added overflow: hidden to prevent card overflow"
echo "   • Added box-sizing: border-box to all card elements"
echo "   • Added proper text wrapping to prevent text overflow"
echo "   • Reduced button font size from 16px to 12px"
echo "   • Added Dutch product categories below product titles"
echo "   • Categories styled with gold color (#BFA86C) matching theme"
echo "   • Categories are clickable links to category pages"
echo "   • Responsive category styling for mobile devices"
echo ""
echo "🎨 Category Display Features:"
echo "   • Shows product categories in Dutch"
echo "   • Uses bullet separator (•) between multiple categories"
echo "   • Skips 'uncategorized' category"
echo "   • Hover effect changes color to pink (#C64193)"
echo "   • Links to category archive pages"
echo ""
echo "💡 The shop page now shows:"
echo "   - Product cards that stay within container boundaries"
echo "   - Smaller, better-fitting button text"
echo "   - Beautiful category display in theme colors"
echo "🌐 Visit the shop page to see the new category display!"
