<?php
/**
 * Daily cron: stuur een herinnering voor termijnen die binnen 7 dagen vervallen
 * en nog niet betaald zijn én nog geen reminder hebben gehad.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cron {

	const HOOK = 'cpm_opl_daily';

	public static function register(): void {
		add_action( 'init', [ __CLASS__, 'maybe_schedule' ] );
		add_action( self::HOOK, [ __CLASS__, 'run' ] );
	}

	public static function maybe_schedule(): void {
		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_event( strtotime( 'tomorrow 06:00' ), 'daily', self::HOOK );
		}
	}

	public static function run(): void {
		$rows = DB::get_due_unreminded( 7 );
		foreach ( $rows as $row ) {
			Emails::send_termijn_reminder( (int) $row['enrollment_id'], (int) $row['id'] );
			DB::update_payment( (int) $row['id'], [ 'reminder_sent_at' => current_time( 'mysql' ) ] );
		}
	}
}
