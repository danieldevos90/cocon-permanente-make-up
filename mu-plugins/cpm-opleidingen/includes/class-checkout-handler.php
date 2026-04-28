<?php
/**
 * REST endpoint dat 1) de inschrijving in DB plaatst, 2) Mollie payment links
 * voor alle termijnen aanmaakt, 3) bevestigingsmail verstuurt, 4) klant naar
 * Mollie checkout van termijn 1 redirect.
 *
 * Endpoint: POST /wp-json/cpm/v1/checkout
 * Public — beveiligd door:
 *   - WP nonce (gegenereerd door shortcode)
 *   - Honeypot field
 *   - Rate-limit per IP (transient, 5/uur)
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Checkout_Handler {

	const NAMESPACE_REST = 'cpm/v1';

	public static function register(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE_REST,
			'/checkout',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'handle' ],
				'permission_callback' => '__return_true',
				'args'                => [
					'cohort_id'      => [ 'required' => true, 'type' => 'integer' ],
					'num_termijnen'  => [ 'required' => true, 'type' => 'integer' ],
					'first_name'     => [ 'required' => true, 'type' => 'string' ],
					'last_name'      => [ 'required' => true, 'type' => 'string' ],
					'email'          => [ 'required' => true, 'type' => 'string' ],
					'phone'          => [ 'required' => false, 'type' => 'string' ],
					'company'        => [ 'required' => false, 'type' => 'string' ],
					'address'        => [ 'required' => false, 'type' => 'string' ],
					'postcode'       => [ 'required' => false, 'type' => 'string' ],
					'city'           => [ 'required' => false, 'type' => 'string' ],
					'country'        => [ 'required' => false, 'type' => 'string' ],
					'notes'          => [ 'required' => false, 'type' => 'string' ],
					'website'        => [ 'required' => false, 'type' => 'string' ], // honeypot, must be empty
					'_wpnonce'       => [ 'required' => false, 'type' => 'string' ],
				],
			]
		);
	}

	public static function handle( \WP_REST_Request $request ) {
		// Honeypot — bots vullen vaak een "website" veld in dat we verbergen via CSS.
		if ( ! empty( $request->get_param( 'website' ) ) ) {
			return new \WP_Error( 'cpm_spam_detected', 'Aanmelding geweigerd.', [ 'status' => 400 ] );
		}

		// Nonce check (best effort — REST routes for anonymous users gebruiken X-WP-Nonce header).
		$nonce = $request->get_header( 'x_wp_nonce' ) ?: $request->get_param( '_wpnonce' );
		if ( $nonce && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error( 'cpm_invalid_nonce', 'Sessie verlopen, herlaad de pagina.', [ 'status' => 403 ] );
		}

		// Simpele rate-limit per IP.
		$ip      = self::client_ip();
		$rl_key  = 'cpm_rl_' . md5( $ip );
		$attempts = (int) get_transient( $rl_key );
		if ( $attempts >= 5 ) {
			return new \WP_Error( 'cpm_rate_limit', 'Te veel pogingen. Probeer over een uur opnieuw.', [ 'status' => 429 ] );
		}
		set_transient( $rl_key, $attempts + 1, HOUR_IN_SECONDS );

		// Validate cohort.
		$cohort = Cohort_CPT::get( (int) $request['cohort_id'] );
		if ( ! $cohort ) {
			return new \WP_Error( 'cpm_invalid_cohort', 'Cohort niet gevonden of niet meer beschikbaar.', [ 'status' => 404 ] );
		}

		// Validate termijn-keuze tegen cohort + deadline.
		$num_termijnen = (int) $request['num_termijnen'];
		$allowed       = Payment_Plan::available_options( $cohort['max_termijnen'], $cohort['start_date'] );
		if ( ! in_array( $num_termijnen, $allowed, true ) ) {
			return new \WP_Error(
				'cpm_invalid_plan',
				sprintf(
					'Voor deze opleiding is alleen nog mogelijk: %s termijn(en). Startdatum is %s.',
					implode( ' / ', $allowed ),
					$cohort['start_date']
				),
				[ 'status' => 400 ]
			);
		}

		// Build payment plan.
		try {
			$plan = Payment_Plan::build(
				$cohort['total_price_cents'],
				$cohort['deposit_cents'],
				$num_termijnen,
				$cohort['start_date']
			);
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'cpm_plan_error', $e->getMessage(), [ 'status' => 400 ] );
		}

		// Validate email + name.
		$email = sanitize_email( (string) $request['email'] );
		if ( ! is_email( $email ) ) {
			return new \WP_Error( 'cpm_invalid_email', 'Ongeldig e-mailadres.', [ 'status' => 400 ] );
		}
		$first = sanitize_text_field( (string) $request['first_name'] );
		$last  = sanitize_text_field( (string) $request['last_name'] );
		if ( $first === '' || $last === '' ) {
			return new \WP_Error( 'cpm_invalid_name', 'Voor- en achternaam zijn verplicht.', [ 'status' => 400 ] );
		}

		// Insert enrollment.
		$mode = cpm_opl_is_test_mode() ? 'test' : 'live';
		$enrollment_id = DB::insert_enrollment(
			[
				'cohort_id'          => $cohort['id'],
				'student_first_name' => $first,
				'student_last_name'  => $last,
				'student_email'      => $email,
				'student_phone'      => sanitize_text_field( (string) ( $request['phone'] ?? '' ) ),
				'billing_company'    => sanitize_text_field( (string) ( $request['company'] ?? '' ) ),
				'billing_address'    => sanitize_text_field( (string) ( $request['address'] ?? '' ) ),
				'billing_postcode'   => sanitize_text_field( (string) ( $request['postcode'] ?? '' ) ),
				'billing_city'       => sanitize_text_field( (string) ( $request['city'] ?? '' ) ),
				'billing_country'    => strtoupper( sanitize_text_field( (string) ( $request['country'] ?? 'NL' ) ) ),
				'notes'              => wp_kses_post( (string) ( $request['notes'] ?? '' ) ),
				'num_termijnen'      => $num_termijnen,
				'total_amount_cents' => $cohort['total_price_cents'],
				'deposit_cents'      => $cohort['deposit_cents'],
				'currency'           => $cohort['currency'],
				'status'             => 'pending',
				'mode'               => $mode,
			]
		);

		// Create Mollie payment link for EVERY termijn.
		try {
			$mollie = Mollie_Client::from_mode( $mode );
		} catch ( \Throwable $e ) {
			DB::update_enrollment( $enrollment_id, [ 'status' => 'config_error' ] );
			return new \WP_Error( 'cpm_mollie_config', 'Mollie API key ontbreekt of is ongeldig.', [ 'status' => 500 ] );
		}

		$webhook_url = self::webhook_url();
		$return_url  = self::checkout_return_url( $enrollment_id );

		$first_link_url = '';
		foreach ( $plan as $idx => $termijn ) {
			$desc = sprintf(
				'%s — termijn %d/%d voor %s %s',
				$cohort['title'],
				$termijn['termijn'],
				count( $plan ),
				$first,
				$last
			);
			$expires_at = self::expires_at_for( $termijn['due_date'] );

			// Note: Mollie's payment-links API doesn't accept the `metadata` field that
			// the regular payments endpoint does. We persist the enrollment ↔ mollie_id
			// mapping in our own {prefix}cpm_payments table instead.
			$payload = [
				'amount'      => [
					'currency' => $cohort['currency'],
					'value'    => Mollie_Client::cents_to_amount_string( (int) $termijn['amount_cents'] ),
				],
				'description' => $desc,
				'redirectUrl' => $return_url,
				'expiresAt'   => $expires_at,
			];
			// Mollie weigert localhost/private hostnames als webhook. Skip dan zodat
			// de rest van de flow lokaal blijft testbaar (cron/admin pollen dan zelf de status).
			if ( $webhook_url ) {
				$payload['webhookUrl'] = $webhook_url;
			}

			try {
				$link = $mollie->create_payment_link( $payload );
			} catch ( \Throwable $e ) {
				DB::update_enrollment( $enrollment_id, [ 'status' => 'mollie_error' ] );
				error_log( '[CPM] Mollie payment link error: ' . $e->getMessage() );
				return new \WP_Error( 'cpm_mollie_error', 'Kon de betaalverzoeken niet aanmaken bij Mollie. Probeer opnieuw of neem contact op.', [ 'status' => 502 ] );
			}

			DB::insert_payment(
				[
					'enrollment_id' => $enrollment_id,
					'termijn_index' => (int) $termijn['termijn'],
					'is_deposit'    => (int) $termijn['is_deposit'],
					'amount_cents'  => (int) $termijn['amount_cents'],
					'currency'      => $cohort['currency'],
					'due_date'      => $termijn['due_date'],
					'mollie_id'     => (string) ( $link['id'] ?? '' ),
					'mollie_url'    => (string) ( $link['_links']['paymentLink']['href'] ?? '' ),
					'mollie_status' => 'created',
				]
			);
			if ( $idx === 0 ) {
				$first_link_url = (string) ( $link['_links']['paymentLink']['href'] ?? '' );
			}
		}

		DB::update_enrollment( $enrollment_id, [ 'status' => 'awaiting_first_payment' ] );

		// Bevestigingsmail met overzicht alle termijnen.
		Emails::send_enrollment_confirmation( $enrollment_id );

		return new \WP_REST_Response(
			[
				'ok'             => true,
				'enrollment_id'  => $enrollment_id,
				'redirect_url'   => $first_link_url,
			],
			200
		);
	}

	private static function expires_at_for( string $due_date ): string {
		// Mollie payment links expire max 60 days. We zetten de eerste 7 dagen na due_date,
		// maar nooit later dan 60 dagen vanaf nu.
		$due       = ( new \DateTimeImmutable( $due_date ) )->modify( '+7 days' );
		$max_allowed = ( new \DateTimeImmutable( 'now', new \DateTimeZone( 'UTC' ) ) )->modify( '+59 days' );
		$expires   = $due > $max_allowed ? $max_allowed : $due;
		return $expires->setTime( 23, 59, 59 )->format( 'Y-m-d\TH:i:s+00:00' );
	}

	private static function checkout_return_url( int $enrollment_id ): string {
		$page_id = (int) get_option( 'cpm_opl_thankyou_page_id', 0 );
		$base    = $page_id > 0 ? get_permalink( $page_id ) : '';
		if ( ! $base ) {
			$base = home_url( '/aanmelden-bedankt/' );
		}
		return add_query_arg( [ 'enr' => $enrollment_id ], $base );
	}

	/**
	 * Webhook URL voor Mollie. Mollie weigert localhost/private. In dev:
	 * 1. Als constant CPM_OPL_PUBLIC_WEBHOOK_URL is gezet, gebruik die (bv. ngrok).
	 * 2. Als WP_HOME bevat 'localhost' of '.local' → return '' (skip webhook).
	 * 3. Anders: rest_url($namespace/webhook).
	 */
	public static function webhook_url(): string {
		if ( defined( 'CPM_OPL_PUBLIC_WEBHOOK_URL' ) && CPM_OPL_PUBLIC_WEBHOOK_URL ) {
			return (string) CPM_OPL_PUBLIC_WEBHOOK_URL;
		}
		$home = (string) home_url();
		if ( str_contains( $home, 'localhost' ) || str_contains( $home, '.local' ) || str_contains( $home, '127.0.0.1' ) ) {
			return '';
		}
		return rest_url( self::NAMESPACE_REST . '/webhook' );
	}

	private static function client_ip(): string {
		$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
		if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$parts = explode( ',', $_SERVER['HTTP_X_FORWARDED_FOR'] );
			$ip    = trim( $parts[0] );
		}
		return filter_var( $ip, FILTER_VALIDATE_IP ) ?: '0.0.0.0';
	}
}
