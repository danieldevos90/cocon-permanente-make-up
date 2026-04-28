<?php
/**
 * Plugin Name: Cocon Cosmetics — Opleidingen (loader)
 * Description: Mu-plugin loader die de eigenlijke plugin in subfolder cpm-opleidingen/ inschakelt.
 * Version: 0.1.0
 *
 * mu-plugins laadt alleen top-level *.php files. Deze stub activeert daarom de echte plugin.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/cpm-opleidingen/cpm-opleidingen.php';
