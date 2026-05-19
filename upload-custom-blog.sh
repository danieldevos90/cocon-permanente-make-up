#!/bin/bash

# Upload Custom COCONPM Blog Pages
# Custom blog archive and single post pages with coconpm-* classes

echo "🚀 Uploading Custom COCONPM Blog Pages..."

# FTP credentials
FTP_HOST="server152.hosting2go.nl"
FTP_USER="domjiqtl"
FTP_PASS="4jL6ebMPCjf3"
REMOTE_PATH="/domains/coconpermanentemakeup.nl/public_html/wp-content/themes/Divi"

# Upload files via FTP
echo "📤 Uploading files..."
lftp -c "
set ftp:ssl-allow no;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
cd $REMOTE_PATH;

# Upload blog templates
put Divi/index.php;
put Divi/archive.php;
put Divi/single.php;

# Upload custom blog CSS
put -O css Divi/css/coconpm-blog.css;

# Upload updated enqueue functions
put -O inc Divi/inc/woocommerce-custom.php;

bye;
"

echo ""
echo "✅ Upload complete!"
echo ""
echo "📦 What was uploaded:"
echo "   ✓ index.php - Custom blog index template with coconpm-* classes"
echo "   ✓ archive.php - Custom blog archive template with coconpm-* classes"
echo "   ✓ single.php - Custom blog single post template with coconpm-* classes"
echo "   ✓ coconpm-blog.css - 100% custom blog styles"
echo "   ✓ woocommerce-custom.php - Updated to enqueue blog CSS"
echo ""
echo "🎯 What's different:"
echo "   ✓ No more default Divi blog classes"
echo "   ✓ All coconpm-* classes (same pattern as shop, cart & product pages)"
echo "   ✓ 2-column header: Title + Subscribe form | Description"
echo "   ✓ Email subscribe form built-in"
echo "   ✓ Tags filter bar with active states"
echo "   ✓ Minimal card design (2-column grid)"
echo "   ✓ Whole card is clickable for better UX"
echo "   ✓ Beautiful single post layout with navigation"
echo "   ✓ Fully responsive design"
echo ""
echo "📝 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R)"
echo "   2. Clear WordPress cache if you have a caching plugin"
echo "   3. Visit blog page or any blog post"
echo "   4. Open browser console - you should see:"
echo "      '✅ COCONPM BLOG CSS LOADED!'"
echo ""
echo "🎨 Blog Archive CSS Classes:"
echo "   - .coconpm-blog-archive (container)"
echo "   - .coconpm-blog-header (2-column header)"
echo "   - .coconpm-blog-header-left (title + subscribe)"
echo "   - .coconpm-blog-header-right (description)"
echo "   - .coconpm-blog-subscribe (subscribe form)"
echo "   - .coconpm-subscribe-input (email input)"
echo "   - .coconpm-subscribe-btn (submit button)"
echo "   - .coconpm-tags-filter (tags filter bar)"
echo "   - .coconpm-tag-filter-btn (tag button)"
echo "   - .coconpm-blog-grid (2-column grid)"
echo "   - .coconpm-blog-card (minimal card)"
echo "   - .coconpm-card-link (clickable wrapper)"
echo "   - .coconpm-blog-image (featured image)"
echo "   - .coconpm-blog-excerpt (short description)"
echo "   - .coconpm-blog-read-more ('Lees meer →')"
echo ""
echo "🎨 Single Post CSS Classes:"
echo "   - .coconpm-blog-single (container)"
echo "   - .coconpm-blog-breadcrumb (back link)"
echo "   - .coconpm-blog-single-title (post title)"
echo "   - .coconpm-blog-single-meta (post meta)"
echo "   - .coconpm-blog-single-content (post content)"
echo "   - .coconpm-blog-tags (post tags)"
echo "   - .coconpm-author-bio (author information)"
echo "   - .coconpm-post-navigation (prev/next links)"
echo "   - .coconpm-blog-comments (comments section)"
echo ""
echo "📱 Responsive Grid:"
echo "   - Desktop (>992px): 2 columns"
echo "   - Tablet/Mobile (<992px): 1 column"
echo ""
echo "🎨 Design Features:"
echo "   - 2-column header (title+subscribe | description)"
echo "   - Email subscribe form with pink button"
echo "   - Tags filter bar (top 10 tags)"
echo "   - Minimal card design (image, title, excerpt)"
echo "   - Whole card clickable for better UX"
echo "   - Image hover zoom effect"
echo "   - Placeholder for posts without images"
echo "   - 'Lees meer →' in Dutch"
echo "   - Smooth transitions"
echo "   - Pink accent color (#C64193)"
echo "   - Previous/Next post navigation"
echo "   - Author bio with avatar"
echo ""

