<?php
/**
 * Tiny Mollie REST client. No SDK dependency (keeps this mu-plugin zero-install).
 *
 * Only the endpoints we need:
 *   POST /v2/payment-links   → for elke termijn één link
 *   GET  /v2/payment-links/{id}
 *   GET  /v2/payments/{id}
 *
 * Mollie Payment Link API docs:
 *   https://docs.mollie.com/reference/v2/payment-links-api/create-payment-link
 *
 * Returns associative arrays. Throws RuntimeException on transport/HTTP errors.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Mollie_Client {

	const ENDPOINT = 'https://api.mollie.com/v2';

	private string $api_key;

	public function __construct( string $api_key ) {
		if ( ! $api_key ) {
			throw new \InvalidArgumentException( 'Lege Mollie API key.' );
		}
		$this->api_key = $api_key;
	}

	public static function from_mode( string $mode ): self {
		$key = cpm_opl_get_mollie_key( $mode === 'test' ? 'test' : 'live' );
		return new self( $key );
	}

	/**
	 * Create a Mollie Payment Link.
	 *
	 * @param array $params {
	 *   amount      : ['currency'=>'EUR', 'value'=>'595.00']  (string, 2 decimals)
	 *   description : human label, shown to customer
	 *   redirectUrl : where Mollie returns customer after payment
	 *   webhookUrl  : where Mollie POSTs status updates (must be public HTTPS)
	 *   expiresAt?  : ISO 8601 datetime (max 60 days)
	 *   metadata?   : array (will be JSON encoded by Mollie)
	 * }
	 */
	public function create_payment_link( array $params ): array {
		return $this->request( 'POST', '/payment-links', $params );
	}

	public function get_payment_link( string $id ): array {
		return $this->request( 'GET', '/payment-links/' . rawurlencode( $id ) );
	}

	public function get_payment( string $id ): array {
		return $this->request( 'GET', '/payments/' . rawurlencode( $id ) );
	}

	public function list_methods( array $query = [] ): array {
		$qs = $query ? '?' . http_build_query( $query ) : '';
		return $this->request( 'GET', '/methods' . $qs );
	}

	private function request( string $method, string $path, ?array $body = null ): array {
		$args = [
			'method'  => $method,
			'headers' => [
				'Authorization' => 'Bearer ' . $this->api_key,
				'Content-Type'  => 'application/json',
				'Accept'        => 'application/json',
			],
			'timeout' => 20,
		];
		if ( $body !== null ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( self::ENDPOINT . $path, $args );
		if ( is_wp_error( $response ) ) {
			throw new \RuntimeException( 'Mollie HTTP error: ' . $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );
		$data = json_decode( $raw, true );

		if ( $code >= 400 ) {
			$msg = is_array( $data ) && isset( $data['detail'] ) ? $data['detail'] : 'HTTP ' . $code;
			throw new \RuntimeException( 'Mollie API error: ' . $msg . ' (raw: ' . substr( $raw, 0, 300 ) . ')' );
		}
		return is_array( $data ) ? $data : [];
	}

	/** Convert int cents → Mollie's "595.00" string. */
	public static function cents_to_amount_string( int $cents ): string {
		return number_format( $cents / 100, 2, '.', '' );
	}
}
