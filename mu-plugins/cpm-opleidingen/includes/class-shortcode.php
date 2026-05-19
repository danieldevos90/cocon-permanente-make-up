<?php
/**
 * [cpm_opleiding_aanmelden cohort_id="123"] → render checkout-formulier.
 *
 * Server-side rendered. JS is alleen progressive-enhancement: live update van
 * termijn-keuze → bedragen-overview. Werkt prima zonder JS (server valideert
 * en bouwt het plan opnieuw bij submit).
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Shortcode {

	const TAG = 'cpm_opleiding_aanmelden';

	public static function register(): void {
		add_shortcode( self::TAG, [ __CLASS__, 'render' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'maybe_enqueue' ] );
	}

	public static function maybe_enqueue(): void {
		// Heuristic: only enqueue on pages where shortcode is used.
		global $post;
		if ( ! is_singular() || ! $post || ! has_shortcode( (string) $post->post_content, self::TAG ) ) {
			return;
		}
		wp_enqueue_style( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.css', [], CPM_OPL_VERSION );
		wp_enqueue_script( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.js', [], CPM_OPL_VERSION, true );
		wp_localize_script(
			'cpm-opl-checkout',
			'CPM_OPL',
			[
				'rest_root' => esc_url_raw( rest_url( Checkout_Handler::NAMESPACE_REST ) ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
			]
		);
	}

	public static function render( array $atts ): string {
		$atts = shortcode_atts( [ 'cohort_id' => 0 ], $atts, self::TAG );

		$cohort_id = (int) $atts['cohort_id'];
		$cohort    = $cohort_id ? Cohort_CPT::get( $cohort_id ) : null;

		if ( ! $cohort ) {
			return '<div class="cpm-opl-error">Cohort niet gevonden of nog niet gepubliceerd.</div>';
		}

		$options = Payment_Plan::available_options( $cohort['max_termijnen'], $cohort['start_date'] );
		$preview = [ 'base' => [] ];
		foreach ( $options as $n ) {
			try {
				$preview['base'][ $n ] = Payment_Plan::build(
					$cohort['total_price_cents'],
					$cohort['deposit_cents'],
					$n,
					$cohort['start_date']
				);
			} catch ( \Throwable $e ) {
				continue;
			}
		}
		$addon_price = (int) ( $cohort['addon_price_cents'] ?? 0 );
		$addon_date  = trim( (string) ( $cohort['addon_date'] ?? '' ) );
		if ( $addon_date === '' && $addon_price > 0 && ( $cohort['template'] ?? '' ) === 'masterclass-3d-nano-brows' ) {
			$addon_date = Pricing::addon_date_for_masterclass( (string) ( $cohort['start_date'] ?? '' ) );
			$cohort['addon_date'] = $addon_date;
		}
		if ( $addon_price > 0 && $addon_date !== '' ) {
			$preview['with_addon'] = [];
			$grand_total = (int) $cohort['total_price_cents'] + $addon_price;
			foreach ( $options as $n ) {
				try {
					$preview['with_addon'][ $n ] = Payment_Plan::build(
						$grand_total,
						$cohort['deposit_cents'],
						$n,
						$cohort['start_date']
					);
				} catch ( \Throwable $e ) {
					continue;
				}
			}
		}

		ob_start();
		$template = CPM_OPL_PATH . 'templates/checkout-form.php';
		include $template;
		return (string) ob_get_clean();
	}
}
