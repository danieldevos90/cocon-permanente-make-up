<?php
/**
 * Mollie roept ons webhook endpoint aan na elke status-change van een payment link / payment.
 * Body bevat alleen `id=tr_xxxx` (oud) of `id=pl_xxxx` (nieuw, voor payment links).
 *
 * Ons werk:
 *   - Match `id` op cpm_payments.mollie_id
 *   - Re-fetch object via Mollie API om actuele status te krijgen (NOOIT op POST-body vertrouwen)
 *   - Update payment status, paid_at
 *   - Als alle termijnen paid → enrollment status="completed"
 *   - Als termijn 1 paid en enrollment status was "awaiting_first_payment" → "active"
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Webhook {

	public static function register(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_route' ] );
	}

	public static function register_route(): void {
		register_rest_route(
			Checkout_Handler::NAMESPACE_REST,
			'/webhook',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'handle' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	public static function handle( \WP_REST_Request $request ) {
		$id = $request->get_param( 'id' );
		if ( ! $id ) {
			return new \WP_REST_Response( [ 'ok' => false, 'reason' => 'missing id' ], 200 );
		}

		$payment = DB::get_payment_by_mollie_id( $id );
		if ( ! $payment ) {
			error_log( '[CPM][webhook] Unknown mollie id: ' . $id );
			return new \WP_REST_Response( [ 'ok' => true, 'note' => 'unknown id (ignored)' ], 200 );
		}

		$enrollment = DB::get_enrollment( (int) $payment['enrollment_id'] );
		if ( ! $enrollment ) {
			return new \WP_REST_Response( [ 'ok' => true, 'note' => 'orphan payment' ], 200 );
		}

		try {
			$mollie = Mollie_Client::from_mode( $enrollment['mode'] );
			// Payment Link ids start with `pl_`, regular payments with `tr_`.
			if ( strpos( $id, 'pl_' ) === 0 ) {
				$obj = $mollie->get_payment_link( $id );
				$status = self::derive_link_status( $obj );
			} else {
				$obj    = $mollie->get_payment( $id );
				$status = (string) ( $obj['status'] ?? 'unknown' );
			}
		} catch ( \Throwable $e ) {
			error_log( '[CPM][webhook] Mollie fetch error: ' . $e->getMessage() );
			return new \WP_REST_Response( [ 'ok' => false, 'error' => 'mollie fetch failed' ], 200 );
		}

		$update = [ 'mollie_status' => $status ];
		if ( in_array( $status, [ 'paid', 'authorized' ], true ) && empty( $payment['paid_at'] ) ) {
			$update['paid_at'] = current_time( 'mysql' );
		}
		DB::update_payment( (int) $payment['id'], $update );

		// Re-evaluate enrollment status.
		$payments = DB::get_payments_for_enrollment( (int) $enrollment['id'] );
		$paid     = array_filter(
			$payments,
			static fn( $p ) => in_array( $p['mollie_status'], [ 'paid', 'authorized' ], true )
		);

		if ( count( $paid ) === count( $payments ) ) {
			DB::update_enrollment( (int) $enrollment['id'], [ 'status' => 'completed' ] );
			Emails::send_full_payment_received( (int) $enrollment['id'] );
		} elseif ( count( $paid ) >= 1 && $enrollment['status'] === 'awaiting_first_payment' ) {
			DB::update_enrollment( (int) $enrollment['id'], [ 'status' => 'active' ] );
			Emails::send_first_payment_received( (int) $enrollment['id'] );
		}

		return new \WP_REST_Response( [ 'ok' => true, 'status' => $status ], 200 );
	}

	private static function derive_link_status( array $link ): string {
		// Payment links don't have a single "status" field.
		// They're "paid" when paidAt is set, "expired" when expiresAt has passed, else "open".
		if ( ! empty( $link['paidAt'] ) ) {
			return 'paid';
		}
		if ( ! empty( $link['expiresAt'] ) && strtotime( $link['expiresAt'] ) < time() ) {
			return 'expired';
		}
		return 'open';
	}
}
