#!/bin/bash

echo "=========================================="
echo "  DIVI LAYOUT SETTINGS DIAGNOSTIC"
echo "=========================================="
echo ""

echo "📋 1. MENU LOCATIONS"
echo "-------------------"
docker exec cocon_wp_cli wp menu location list --allow-root 2>&1 | grep -v "PHP Warning"
echo ""

echo "📋 2. ACTIVE MENUS"
echo "-------------------"
docker exec cocon_wp_cli wp menu list --allow-root 2>&1 | grep -v "PHP Warning"
echo ""

echo "📋 3. THEME MODS (Navigation)"
echo "-------------------"
docker exec cocon_mysql mysql -u wordpress -pwordpress wordpress -N -e "SELECT option_value FROM k6sj_options WHERE option_name = 'theme_mods_Divi';" 2>&1 | grep -v "Using a password" > /tmp/theme_mods_check.txt
docker cp /tmp/theme_mods_check.txt cocon_wordpress:/tmp/
docker exec cocon_wordpress php -r '
$data = unserialize(file_get_contents("/tmp/theme_mods_check.txt"));
echo "Primary Menu: " . ($data["nav_menu_locations"]["primary-menu"] ?? "not set") . "\n";
echo "Secondary Menu: " . ($data["nav_menu_locations"]["secondary-menu"] ?? "not set") . "\n";
echo "Footer Menu: " . ($data["nav_menu_locations"]["footer-menu"] ?? "not set") . "\n";
echo "Custom Logo: " . ($data["custom_logo"] ?? "not set") . "\n";
'
echo ""

echo "📋 4. FOOTER WIDGETS"
echo "-------------------"
docker exec cocon_wp_cli wp widget list sidebar-2 --fields=name,id --allow-root 2>&1 | grep -v "PHP Warning"
docker exec cocon_wp_cli wp widget list sidebar-3 --fields=name,id --allow-root 2>&1 | grep -v "PHP Warning"
docker exec cocon_wp_cli wp widget list sidebar-4 --fields=name,id --allow-root 2>&1 | grep -v "PHP Warning"
docker exec cocon_wp_cli wp widget list sidebar-5 --fields=name,id --allow-root 2>&1 | grep -v "PHP Warning"
echo ""

echo "📋 5. ACTIVE PLUGINS"
echo "-------------------"
docker exec cocon_wp_cli wp plugin list --status=active --fields=name,version --allow-root 2>&1 | grep -v "PHP Warning"
echo ""

echo "📋 6. DIVI MOBILE MENU STATUS"
echo "-------------------"
docker exec cocon_wp_cli wp plugin list --allow-root 2>&1 | grep -i "mobile" | grep -v "PHP Warning" || echo "Divi Mobile Menu plugin not found"
docker exec cocon_mysql mysql -u wordpress -pwordpress wordpress -e "SELECT COUNT(*) as mobile_settings FROM k6sj_options WHERE option_name = 'divi_mobile_license';" 2>&1 | grep -v "Using a password" | tail -1
echo ""

echo "📋 7. IMAGE FILES STATUS"
echo "-------------------"
echo "Database attachments:"
docker exec cocon_mysql mysql -u wordpress -pwordpress wordpress -e "SELECT COUNT(*) as total FROM k6sj_posts WHERE post_type = 'attachment';" 2>&1 | grep -v "Using a password" | tail -1
echo "Actual files on disk:"
docker exec cocon_wordpress find /var/www/html/wp-content/uploads -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" 2>&1 | wc -l
echo "Logo files:"
docker exec cocon_wordpress ls -la /var/www/html/wp-content/uploads/2020/10/ 2>&1 | grep -i logo | wc -l
echo ""

echo "📋 8. THEME BUILDER STATUS"
echo "-------------------"
docker exec cocon_wp_cli wp post list --post_type=et_theme_builder --fields=ID,post_title,post_status --allow-root 2>&1 | grep -v "PHP Warning"
docker exec cocon_wp_cli wp post list --post_type=et_header_layout --fields=ID,post_title,post_status --allow-root 2>&1 | grep -v "PHP Warning"
docker exec cocon_wp_cli wp post list --post_type=et_footer_layout --fields=ID,post_title,post_status --allow-root 2>&1 | grep -v "PHP Warning"
echo ""

echo "=========================================="
echo "  RECOMMENDED ACTIONS"
echo "=========================================="
echo ""
echo "Based on the diagnostic above:"
echo ""
echo "1. If 'Secondary Menu' = 0:"
echo "   → Production might not use a secondary menu"
echo "   → OR you need to assign one"
echo ""
echo "2. If 'Custom Logo' = 'not set':"
echo "   → Go to: Appearance → Customize → Site Identity"
echo "   → Upload logo"
echo ""
echo "3. If Divi Mobile Menu plugin is missing:"
echo "   → Either install it (paid plugin)"
echo "   → OR ask if production actually uses it"
echo ""
echo "4. If image counts don't match:"
echo "   → Run: ./download-images.sh"
echo ""
echo "5. Compare with production site manually:"
echo "   → Visit: https://www.coconpermanentemakeup.nl"
echo "   → Check header, navigation, footer visually"
echo "   → Note any specific differences"
echo ""

