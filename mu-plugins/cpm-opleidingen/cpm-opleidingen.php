<?php
/**
 * Plugin Name: Cocon Cosmetics — Opleidingen Checkout
 * Description: Inschrijvingen voor PMU-opleidingen met aanbetaling + 1/2/3 termijnen via Mollie. Validatie: laatste termijn moet minimaal 14 dagen vóór startdatum binnen zijn.
 * Version: 0.6.0
 * Author: Cocon Cosmetics
 * Requires at least: 6.0
 * Requires PHP: 7.4
 *
 * Drop in wp-content/mu-plugins/cpm-opleidingen/ — auto-loaded via mu-plugin loader.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CPM_OPL_VERSION', '0.6.3' );
define( 'CPM_OPL_FILE', __FILE__ );
define( 'CPM_OPL_PATH', plugin_dir_path( __FILE__ ) );
define( 'CPM_OPL_URL', plugin_dir_url( __FILE__ ) );
define( 'CPM_OPL_DEADLINE_DAYS', 14 );

require_once CPM_OPL_PATH . 'includes/class-db.php';
require_once CPM_OPL_PATH . 'includes/class-cohort-defaults.php';
require_once CPM_OPL_PATH . 'includes/class-cohort-cpt.php';
require_once CPM_OPL_PATH . 'includes/class-cohort-auto-page.php';
require_once CPM_OPL_PATH . 'includes/class-payment-plan.php';
require_once CPM_OPL_PATH . 'includes/class-mollie-client.php';
require_once CPM_OPL_PATH . 'includes/class-emails.php';
require_once CPM_OPL_PATH . 'includes/class-checkout-handler.php';
require_once CPM_OPL_PATH . 'includes/class-webhook.php';
require_once CPM_OPL_PATH . 'includes/class-cron.php';
require_once CPM_OPL_PATH . 'includes/class-shortcode.php';
require_once CPM_OPL_PATH . 'includes/class-cta.php';
require_once CPM_OPL_PATH . 'includes/class-admin.php';
require_once CPM_OPL_PATH . 'includes/class-admin-rest.php';

/**
 * Bootstrap the plugin.
 *
 * Cannot use register_activation_hook from a mu-plugin (mu-plugins are always
 * "active"), so the schema migration runs on every load against a stored
 * version number — fast no-op when the schema is already current.
 */
add_action( 'plugins_loaded', static function () {
	CPM_Opleidingen\DB::maybe_migrate();
	CPM_Opleidingen\Cohort_CPT::register();
	CPM_Opleidingen\Cohort_Auto_Page::register();
	CPM_Opleidingen\Webhook::register();
	CPM_Opleidingen\Checkout_Handler::register();
	CPM_Opleidingen\Cron::register();
	CPM_Opleidingen\Shortcode::register();
	CPM_Opleidingen\CTA::register();
	CPM_Opleidingen\Admin_REST::register();
	if ( is_admin() ) {
		CPM_Opleidingen\Admin::register();
	}
}, 5 );

/**
 * Helper: returns the Mollie API key from the .env that lives in the project root.
 *
 * Resolution order:
 *   1. WP option `cpm_opl_mollie_key_live` / `cpm_opl_mollie_key_test`
 *   2. Constants `CPM_OPL_MOLLIE_LIVE_KEY` / `CPM_OPL_MOLLIE_TEST_KEY` (define in wp-config.php)
 *   3. .env file in the project root (only relevant for local dev)
 */
function cpm_opl_get_mollie_key( string $mode = 'live' ): string {
	$option = $mode === 'test' ? 'cpm_opl_mollie_key_test' : 'cpm_opl_mollie_key_live';
	$value  = get_option( $option );
	if ( $value ) {
		return (string) $value;
	}

	$constant = $mode === 'test' ? 'CPM_OPL_MOLLIE_TEST_KEY' : 'CPM_OPL_MOLLIE_LIVE_KEY';
	if ( defined( $constant ) ) {
		return (string) constant( $constant );
	}

	$env_path = ABSPATH . '../.env';
	if ( file_exists( $env_path ) ) {
		$lines = @file( $env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
		$key   = $mode === 'test' ? 'MOLLIE_TEST_API_KEY' : 'MOLLIE_LIVE_API_KEY';
		foreach ( (array) $lines as $line ) {
			if ( str_starts_with( ltrim( $line ), $key . '=' ) ) {
				return trim( substr( ltrim( $line ), strlen( $key ) + 1 ) );
			}
		}
	}

	return '';
}

/**
 * Returns true when plugin should run in Mollie test mode.
 * Defaults to test on local dev (when WP_HOME contains "localhost").
 */
function cpm_opl_is_test_mode(): bool {
	$forced = get_option( 'cpm_opl_test_mode', null );
	if ( $forced !== null && $forced !== '' ) {
		return (bool) $forced;
	}
	return ( defined( 'WP_HOME' ) && false !== strpos( (string) WP_HOME, 'localhost' ) );
}
