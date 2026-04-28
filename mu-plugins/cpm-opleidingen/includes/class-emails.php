<?php
/**
 * Plain HTML emails. Geen template engine — KISS.
 *
 * Gebruikt wp_mail() met een html-content-type filter scoped per call.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Emails {

	private static function send_html( string $to, string $subject, string $html ): bool {
		$filter = static fn() => 'text/html';
		add_filter( 'wp_mail_content_type', $filter );
		try {
			return wp_mail(
				$to,
				$subject,
				$html,
				[
					'From: Cocon Cosmetics <info@coconpermanentemakeup.nl>',
					'Reply-To: info@coconpermanentemakeup.nl',
				]
			);
		} finally {
			remove_filter( 'wp_mail_content_type', $filter );
		}
	}

	private static function format_amount( int $cents, string $currency = 'EUR' ): string {
		return ( $currency === 'EUR' ? '€ ' : $currency . ' ' ) . number_format( $cents / 100, 2, ',', '.' );
	}

	private static function payments_table( array $payments, string $currency = 'EUR' ): string {
		$rows = '';
		foreach ( $payments as $p ) {
			$label = $p['is_deposit'] ? 'Aanbetaling' : 'Termijn ' . $p['termijn_index'];
			$rows .= sprintf(
				'<tr><td style="padding:8px;border-top:1px solid #eee">%s</td><td style="padding:8px;border-top:1px solid #eee">%s</td><td style="padding:8px;border-top:1px solid #eee;text-align:right">%s</td><td style="padding:8px;border-top:1px solid #eee"><a href="%s">Betalen</a></td></tr>',
				esc_html( $label ),
				esc_html( $p['due_date'] ),
				esc_html( self::format_amount( (int) $p['amount_cents'], $currency ) ),
				esc_url( $p['mollie_url'] )
			);
		}
		return '<table style="width:100%;border-collapse:collapse;font:14px Arial,sans-serif"><thead><tr style="background:#fafafa"><th style="text-align:left;padding:8px">Termijn</th><th style="text-align:left;padding:8px">Vervaldatum</th><th style="text-align:right;padding:8px">Bedrag</th><th style="padding:8px"></th></tr></thead><tbody>' . $rows . '</tbody></table>';
	}

	public static function send_enrollment_confirmation( int $enrollment_id ): void {
		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr ) {
			return;
		}
		$cohort   = Cohort_CPT::get( (int) $enr['cohort_id'] );
		$payments = DB::get_payments_for_enrollment( $enrollment_id );

		$html = sprintf(
			'<h2>Welkom %s,</h2>
			<p>Bedankt voor je aanmelding voor <strong>%s</strong> (start: %s).</p>
			<p>Hieronder je betalingsschema. Klik op een knop om die termijn nu te betalen — je ontvangt voor toekomstige termijnen een herinnering per mail.</p>
			%s
			<p style="margin-top:20px">Totaal: <strong>%s</strong> (%d termijn(en))</p>
			<p>Adres opleiding: %s</p>
			<p>Tot snel,<br>Het team van Cocon Cosmetics</p>',
			esc_html( $enr['student_first_name'] ),
			esc_html( $cohort['title'] ?? 'Opleiding' ),
			esc_html( $cohort['start_date'] ?? '' ),
			self::payments_table( $payments, $enr['currency'] ),
			self::format_amount( (int) $enr['total_amount_cents'], $enr['currency'] ),
			(int) $enr['num_termijnen'],
			esc_html( $cohort['location'] ?? '' )
		);

		self::send_html(
			$enr['student_email'],
			'Bevestiging inschrijving — ' . ( $cohort['title'] ?? 'Opleiding' ),
			$html
		);
	}

	public static function send_first_payment_received( int $enrollment_id ): void {
		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr ) {
			return;
		}
		$cohort = Cohort_CPT::get( (int) $enr['cohort_id'] );
		$html   = sprintf(
			'<h2>Bedankt voor je eerste betaling!</h2>
			<p>Je plek voor <strong>%s</strong> (start %s) is officieel gereserveerd.</p>
			<p>Voor de volgende termijnen ontvang je een herinnering per e-mail, ruim voor de vervaldatum.</p>',
			esc_html( $cohort['title'] ?? 'Opleiding' ),
			esc_html( $cohort['start_date'] ?? '' )
		);
		self::send_html( $enr['student_email'], 'Plek bevestigd — ' . ( $cohort['title'] ?? 'Opleiding' ), $html );
	}

	public static function send_full_payment_received( int $enrollment_id ): void {
		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr ) {
			return;
		}
		$cohort = Cohort_CPT::get( (int) $enr['cohort_id'] );
		$html   = sprintf(
			'<h2>Volledig betaald — bedankt!</h2>
			<p>Alle termijnen voor <strong>%s</strong> zijn binnen. Je hoeft verder niets meer te doen — we zien je op %s.</p>',
			esc_html( $cohort['title'] ?? 'Opleiding' ),
			esc_html( $cohort['start_date'] ?? '' )
		);
		self::send_html( $enr['student_email'], 'Volledig betaald — tot ziens op de opleiding', $html );
	}

	public static function send_termijn_reminder( int $enrollment_id, int $payment_id ): void {
		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr ) {
			return;
		}
		$payments = DB::get_payments_for_enrollment( $enrollment_id );
		$payment  = null;
		foreach ( $payments as $p ) {
			if ( (int) $p['id'] === $payment_id ) {
				$payment = $p;
				break;
			}
		}
		if ( ! $payment ) {
			return;
		}
		$cohort = Cohort_CPT::get( (int) $enr['cohort_id'] );
		$html   = sprintf(
			'<h2>Herinnering: termijn vervalt op %s</h2>
			<p>Hi %s, een vriendelijke herinnering: termijn %d voor <strong>%s</strong> vervalt op <strong>%s</strong>.</p>
			<p>Bedrag: <strong>%s</strong></p>
			<p><a href="%s" style="display:inline-block;padding:12px 24px;background:#C64193;color:#fff;text-decoration:none;border-radius:4px">Nu betalen</a></p>',
			esc_html( $payment['due_date'] ),
			esc_html( $enr['student_first_name'] ),
			(int) $payment['termijn_index'],
			esc_html( $cohort['title'] ?? 'Opleiding' ),
			esc_html( $payment['due_date'] ),
			esc_html( self::format_amount( (int) $payment['amount_cents'], $payment['currency'] ) ),
			esc_url( $payment['mollie_url'] )
		);
		self::send_html( $enr['student_email'], 'Herinnering: betaling termijn ' . (int) $payment['termijn_index'], $html );
	}
}
