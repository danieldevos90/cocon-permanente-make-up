#!/bin/bash
# Upload cleaned cart CSS files to fix grid overflow issue

echo "🚀 Uploading cart CSS fixes..."

# FTP credentials (update if needed)
FTP_HOST="ftp.coconpermanentemakeup.nl"
FTP_USER="cocon_pm"

# Upload cleaned woocommerce-custom.css (removed 523 lines of duplicate cart CSS)
echo "📤 Uploading woocommerce-custom.css (cleaned - removed duplicates)..."
ncftpput -u "$FTP_USER" -p "$FTP_HOST" \
  /public_html/wp-content/themes/Divi/css \
  Divi/css/woocommerce-custom.css

# Upload coconpm-cart.css  
echo "📤 Uploading coconpm-cart.css..."
ncftpput -u "$FTP_USER" -p "$FTP_HOST" \
  /public_html/wp-content/themes/Divi/css \
  Divi/css/coconpm-cart.css

echo "✅ Upload complete!"
echo ""
echo "🔄 Next steps:"
echo "1. Clear your browser cache (Cmd+Shift+R or Ctrl+Shift+R)"
echo "2. Visit the cart page and verify the layout is fixed"
echo "3. The grid should now be: Left column (flexible) + Right column (380px)"
echo ""
echo "🎯 What was fixed:"
echo "   - Removed 523 lines of duplicate cart CSS from woocommerce-custom.css"
echo "   - Cart styling now uses ONLY coconpm-cart.css"
echo "   - Grid: 60/40 split (3fr 2fr) for desktop with 60px gap"
echo "   - Mobile: Single column stacked layout"
echo "   - Added strong overrides to prevent any theme conflicts"
echo "   - Added box-sizing and overflow controls for solid layout"

