<?php
/**
 * DB schema + light migration helper.
 *
 * Two tables:
 *   {prefix}cpm_enrollments  → 1 rij per inschrijving (cohort + student + plan)
 *   {prefix}cpm_payments     → 1 rij per termijn (gekoppeld aan enrollment + Mollie payment link)
 *
 * Schema version stored in option `cpm_opl_db_version`. Bump SCHEMA_VERSION when
 * you change a CREATE TABLE below, and dbDelta() will handle the alter.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DB {

	const SCHEMA_VERSION = '1';

	public static function table_enrollments(): string {
		global $wpdb;
		return $wpdb->prefix . 'cpm_enrollments';
	}

	public static function table_payments(): string {
		global $wpdb;
		return $wpdb->prefix . 'cpm_payments';
	}

	public static function maybe_migrate(): void {
		$current = (string) get_option( 'cpm_opl_db_version', '0' );
		if ( $current === self::SCHEMA_VERSION ) {
			return;
		}
		self::migrate();
		update_option( 'cpm_opl_db_version', self::SCHEMA_VERSION, false );
	}

	private static function migrate(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset = $wpdb->get_charset_collate();
		$enr     = self::table_enrollments();
		$pay     = self::table_payments();

		dbDelta(
			"CREATE TABLE {$enr} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				cohort_id BIGINT UNSIGNED NOT NULL,
				student_first_name VARCHAR(120) NOT NULL DEFAULT '',
				student_last_name  VARCHAR(120) NOT NULL DEFAULT '',
				student_email      VARCHAR(190) NOT NULL,
				student_phone      VARCHAR(40)  NOT NULL DEFAULT '',
				billing_company    VARCHAR(190) NOT NULL DEFAULT '',
				billing_address    VARCHAR(190) NOT NULL DEFAULT '',
				billing_postcode   VARCHAR(20)  NOT NULL DEFAULT '',
				billing_city       VARCHAR(120) NOT NULL DEFAULT '',
				billing_country    VARCHAR(2)   NOT NULL DEFAULT 'NL',
				notes              TEXT NULL,
				num_termijnen      TINYINT UNSIGNED NOT NULL DEFAULT 1,
				total_amount_cents BIGINT UNSIGNED NOT NULL,
				deposit_cents      BIGINT UNSIGNED NOT NULL DEFAULT 0,
				currency           VARCHAR(3) NOT NULL DEFAULT 'EUR',
				status             VARCHAR(32) NOT NULL DEFAULT 'pending',
				mode               VARCHAR(8) NOT NULL DEFAULT 'live',
				created_at         DATETIME NOT NULL,
				updated_at         DATETIME NOT NULL,
				PRIMARY KEY  (id),
				KEY cohort_id (cohort_id),
				KEY student_email (student_email),
				KEY status (status)
			) {$charset};"
		);

		dbDelta(
			"CREATE TABLE {$pay} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				enrollment_id BIGINT UNSIGNED NOT NULL,
				termijn_index TINYINT UNSIGNED NOT NULL,
				is_deposit TINYINT UNSIGNED NOT NULL DEFAULT 0,
				amount_cents BIGINT UNSIGNED NOT NULL,
				currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
				due_date DATE NOT NULL,
				mollie_id VARCHAR(64) NOT NULL DEFAULT '',
				mollie_url TEXT NULL,
				mollie_status VARCHAR(32) NOT NULL DEFAULT 'created',
				paid_at DATETIME NULL,
				reminder_sent_at DATETIME NULL,
				created_at DATETIME NOT NULL,
				updated_at DATETIME NOT NULL,
				PRIMARY KEY  (id),
				KEY enrollment_id (enrollment_id),
				KEY mollie_id (mollie_id),
				KEY due_date (due_date),
				KEY mollie_status (mollie_status)
			) {$charset};"
		);
	}

	public static function insert_enrollment( array $data ): int {
		global $wpdb;
		$now              = current_time( 'mysql' );
		$data['created_at'] = $now;
		$data['updated_at'] = $now;
		$wpdb->insert( self::table_enrollments(), $data );
		return (int) $wpdb->insert_id;
	}

	public static function update_enrollment( int $id, array $data ): void {
		global $wpdb;
		$data['updated_at'] = current_time( 'mysql' );
		$wpdb->update( self::table_enrollments(), $data, [ 'id' => $id ] );
	}

	public static function get_enrollment( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table_enrollments() . ' WHERE id = %d', $id ), ARRAY_A );
		return $row ?: null;
	}

	public static function insert_payment( array $data ): int {
		global $wpdb;
		$now                = current_time( 'mysql' );
		$data['created_at'] = $now;
		$data['updated_at'] = $now;
		$wpdb->insert( self::table_payments(), $data );
		return (int) $wpdb->insert_id;
	}

	public static function update_payment( int $id, array $data ): void {
		global $wpdb;
		$data['updated_at'] = current_time( 'mysql' );
		$wpdb->update( self::table_payments(), $data, [ 'id' => $id ] );
	}

	public static function get_payment_by_mollie_id( string $mollie_id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table_payments() . ' WHERE mollie_id = %s', $mollie_id ), ARRAY_A );
		return $row ?: null;
	}

	public static function get_payments_for_enrollment( int $enrollment_id ): array {
		global $wpdb;
		$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM ' . self::table_payments() . ' WHERE enrollment_id = %d ORDER BY termijn_index ASC', $enrollment_id ), ARRAY_A );
		return $rows ?: [];
	}

	/**
	 * Payments due for reminder: not paid, due_date within `$days_ahead` days, no reminder yet.
	 */
	public static function get_due_unreminded( int $days_ahead = 7 ): array {
		global $wpdb;
		$cutoff = gmdate( 'Y-m-d', time() + ( $days_ahead * DAY_IN_SECONDS ) );
		$sql    = $wpdb->prepare(
			'SELECT * FROM ' . self::table_payments() . "
			WHERE mollie_status NOT IN ('paid','authorized','canceled','expired','failed')
			  AND reminder_sent_at IS NULL
			  AND due_date <= %s
			ORDER BY due_date ASC",
			$cutoff
		);
		return $wpdb->get_results( $sql, ARRAY_A ) ?: [];
	}
}
