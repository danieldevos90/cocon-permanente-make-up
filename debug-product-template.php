<?php
/**
 * Debug Product Template Loading
 */

define('WP_USE_THEMES', false);
require_once('wp-load.php');

echo "=== DEBUGGING PRODUCT TEMPLATE ===\n\n";

// Simulate product page request
$product_slug = 'combi-behandeling-wenkbrauwen-eyeliner';

// Get the product by slug
$product_post = get_page_by_path($product_slug, OBJECT, 'product');

if (!$product_post) {
    echo "❌ Product not found with slug: {$product_slug}\n";
    exit;
}

echo "✅ Product found:\n";
echo "   ID: {$product_post->ID}\n";
echo "   Title: {$product_post->post_title}\n";
echo "   Status: {$product_post->post_status}\n";
echo "   Type: {$product_post->post_type}\n\n";

// Check template hierarchy
echo "=== TEMPLATE HIERARCHY ===\n";

$theme_root = get_template_directory();
echo "Theme directory: {$theme_root}\n\n";

// Check which templates exist
$templates_to_check = array(
    'single-product.php' => $theme_root . '/single-product.php',
    'woocommerce/single-product.php' => $theme_root . '/woocommerce/single-product.php',
    'woocommerce.php' => $theme_root . '/woocommerce.php',
    'single.php' => $theme_root . '/single.php',
    'index.php' => $theme_root . '/index.php',
);

echo "Templates found:\n";
foreach ($templates_to_check as $name => $path) {
    $exists = file_exists($path);
    $status = $exists ? '✅' : '❌';
    echo "   {$status} {$name}\n";
    if ($exists) {
        echo "      Path: {$path}\n";
        echo "      Size: " . filesize($path) . " bytes\n";
    }
}

// Test WooCommerce template loading
echo "\n=== WOOCOMMERCE TEMPLATE SYSTEM ===\n";

// Simulate is_product() check
global $wp_query;
$wp_query->is_single = true;
$wp_query->is_singular = true;
$wp_query->queried_object = $product_post;
$wp_query->queried_object_id = $product_post->ID;

// Check what template WooCommerce would use
$template = wc_get_template('single-product.php', array(), '', '');
echo "WC template function returned: " . var_export($template, true) . "\n";

// Check template loader
$template_loader = WC()->template_loader();
echo "\nWC Template Loader class: " . get_class($template_loader) . "\n";

echo "\n=== SOLUTION ===\n";
echo "If single-product.php exists but isn't loading:\n";
echo "1. Clear all caches\n";
echo "2. Flush permalinks\n";
echo "3. Check file permissions\n";
echo "4. Verify WooCommerce isn't overriding template\n";

