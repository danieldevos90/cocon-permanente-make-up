<?php
/**
 * Plugin Name: Local Dev Helpers (Cocon)
 * Description: Local development helpers - serves missing uploads from production, disables external services, etc.
 * Version: 1.0.0
 * Author: ALT F AWESOME
 *
 * Drop this file in wp-content/mu-plugins/ to auto-load.
 */

if (!defined('ABSPATH')) { exit; }

const COCONPM_PROD_URL = 'https://www.coconpermanentemakeup.nl';
const COCONPM_LOCAL_URL = 'http://localhost:8080';

/**
 * Rewrite missing uploads to production.
 *
 * Filters every wp-content/uploads URL: if the file does not exist
 * on the local disk, replace localhost with the production host so
 * the browser fetches the original asset directly from production.
 */
function coconpm_rewrite_missing_uploads($url) {
    $upload_dir = wp_upload_dir();
    $base_url = $upload_dir['baseurl'];
    $base_dir = $upload_dir['basedir'];

    if (strpos($url, $base_url) !== 0) {
        return $url;
    }

    $relative = substr($url, strlen($base_url));
    $relative = strtok($relative, '?');
    $local_path = $base_dir . $relative;

    if (!file_exists($local_path)) {
        return str_replace(COCONPM_LOCAL_URL, COCONPM_PROD_URL, $url);
    }
    return $url;
}
add_filter('wp_get_attachment_url', 'coconpm_rewrite_missing_uploads', 99);
add_filter('wp_get_attachment_image_src', function ($image) {
    if (is_array($image) && !empty($image[0])) {
        $image[0] = coconpm_rewrite_missing_uploads($image[0]);
    }
    return $image;
}, 99);

/**
 * Last-resort: rewrite every <img src> in rendered HTML that points
 * at a missing local upload, mapping it to production.
 */
function coconpm_rewrite_html_images($buffer) {
    if (is_admin() || empty($buffer)) {
        return $buffer;
    }
    $upload_dir = wp_upload_dir();
    $base_url = $upload_dir['baseurl'];
    $base_dir = $upload_dir['basedir'];

    return preg_replace_callback(
        '#(' . preg_quote($base_url, '#') . '/[^"\'\s)]+)#i',
        function ($m) use ($base_url, $base_dir) {
            $relative = substr($m[1], strlen($base_url));
            $relative = strtok($relative, '?');
            if (!file_exists($base_dir . $relative)) {
                return str_replace(COCONPM_LOCAL_URL, COCONPM_PROD_URL, $m[1]);
            }
            return $m[1];
        },
        $buffer
    );
}
add_action('template_redirect', function () {
    if (!is_admin()) {
        ob_start('coconpm_rewrite_html_images');
    }
});

/**
 * Stop external services that would slow down or break local dev:
 * - LiteSpeed Cache (cloud calls)
 * - Anything that hits Google / Mailchimp / FB on every page load
 *
 * We don't deactivate plugins (admin can still manage them), we just
 * neutralise their HTTP calls.
 */
add_filter('pre_http_request', function ($preempt, $args, $url) {
    $blocked_hosts = [
        'api.litespeedtech.com',
        'wp.api.litespeedtech.com',
        'connect.facebook.net',
        'graph.facebook.com',
        'login.mailchimp.com',
        'us1.api.mailchimp.com',
        'googleads.g.doubleclick.net',
    ];
    foreach ($blocked_hosts as $host) {
        if (strpos($url, $host) !== false) {
            return new WP_Error('coconpm_blocked', "Blocked external call to $host in local dev");
        }
    }
    return $preempt;
}, 10, 3);

/**
 * Show an admin notice so it's obvious you're on the local clone.
 */
add_action('admin_notices', function () {
    echo '<div class="notice notice-warning"><p><strong>LOCAL DEV CLONE</strong> — Database is een kopie van productie. URL: ' . esc_html(home_url()) . '</p></div>';
});
