<?php
/**
 * Submenu onder "Opleidingen" → "Inschrijvingen" met simpele lijst.
 *
 * Geen list-table klasse, gewoon HTML — dit blijft een ops-tool.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Admin {

	public static function register(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
	}

	public static function register_menu(): void {
		add_submenu_page(
			'edit.php?post_type=' . Cohort_CPT::POST_TYPE,
			'Inschrijvingen',
			'Inschrijvingen',
			'manage_options',
			'cpm-enrollments',
			[ __CLASS__, 'render_list' ]
		);
	}

	public static function render_list(): void {
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$pay_table = DB::table_payments();

		$rows = $wpdb->get_results(
			"SELECT e.*, COUNT(p.id) AS pay_total, SUM(CASE WHEN p.mollie_status IN ('paid','authorized') THEN 1 ELSE 0 END) AS pay_paid
			FROM {$enr_table} e
			LEFT JOIN {$pay_table} p ON p.enrollment_id = e.id
			GROUP BY e.id
			ORDER BY e.created_at DESC
			LIMIT 200",
			ARRAY_A
		) ?: [];

		echo '<div class="wrap"><h1>Inschrijvingen opleidingen</h1>';
		echo '<p style="color:#6b6b6b">Laat de laatste 200 inschrijvingen zien. Status per termijn kun je via de Mollie Dashboard inzien.</p>';
		echo '<table class="widefat striped"><thead><tr><th>ID</th><th>Cohort</th><th>Student</th><th>E-mail</th><th>Plan</th><th>Totaal</th><th>Betaald</th><th>Status</th><th>Mode</th><th>Aangemaakt</th></tr></thead><tbody>';
		foreach ( $rows as $r ) {
			$cohort_title = get_the_title( (int) $r['cohort_id'] );
			$cohort_link  = get_edit_post_link( (int) $r['cohort_id'] );
			printf(
				'<tr><td>%d</td><td><a href="%s">%s</a></td><td>%s %s</td><td><a href="mailto:%s">%s</a></td><td>%dx</td><td>%s</td><td>%d / %d</td><td>%s</td><td><code>%s</code></td><td>%s</td></tr>',
				(int) $r['id'],
				esc_url( $cohort_link ),
				esc_html( $cohort_title ?: '(verwijderd)' ),
				esc_html( $r['student_first_name'] ),
				esc_html( $r['student_last_name'] ),
				esc_attr( $r['student_email'] ),
				esc_html( $r['student_email'] ),
				(int) $r['num_termijnen'],
				esc_html( '€ ' . number_format( $r['total_amount_cents'] / 100, 2, ',', '.' ) ),
				(int) $r['pay_paid'],
				(int) $r['pay_total'],
				esc_html( $r['status'] ),
				esc_html( $r['mode'] ),
				esc_html( $r['created_at'] )
			);
		}
		echo '</tbody></table></div>';
	}
}
