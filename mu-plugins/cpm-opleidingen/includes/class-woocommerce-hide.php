<?php
/**
 * Legacy WooCommerce-aanbetaling-producten: verbergen, niet koopbaar, redirect naar CPM-inschrijf.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WooCommerce_Hide {

	const SYNC_OPTION = 'cpm_opl_wc_legacy_sync';
	const SYNC_VERSION = '1';

	/** Aanbetaling masterclass = €500 incl. btw (zelfde als CPM deposit). */
	const DEPOSIT_PRICE = '500';

	public static function register(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		add_action( 'init', [ __CLASS__, 'maybe_sync_legacy_products' ], 20 );
		add_filter( 'woocommerce_product_is_visible', [ __CLASS__, 'hide_deposit_products' ], 10, 2 );
		add_filter( 'woocommerce_is_purchasable', [ __CLASS__, 'not_purchasable' ], 10, 2 );
		add_filter( 'woocommerce_add_to_cart_validation', [ __CLASS__, 'block_add_to_cart' ], 10, 2 );
		add_action( 'pre_get_posts', [ __CLASS__, 'exclude_from_shop_query' ] );
		add_action( 'template_redirect', [ __CLASS__, 'redirect_to_cpm_enroll' ], 5 );
	}

	public static function maybe_sync_legacy_products(): void {
		if ( get_option( self::SYNC_OPTION ) === self::SYNC_VERSION ) {
			return;
		}
		foreach ( self::find_deposit_product_ids() as $id ) {
			self::sync_product( (int) $id );
		}
		delete_transient( 'cpm_opl_deposit_product_ids' );
		update_option( self::SYNC_OPTION, self::SYNC_VERSION, false );
	}

	public static function sync_product( int $product_id ): void {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return;
		}
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}
		$product->set_regular_price( self::DEPOSIT_PRICE );
		$product->set_price( self::DEPOSIT_PRICE );
		$product->set_catalog_visibility( 'hidden' );
		$product->set_sold_individually( true );
		$product->save();

		$url = self::enroll_url_for_product( $product_id );
		if ( $url ) {
			update_post_meta( $product_id, '_cpm_enroll_redirect', esc_url_raw( $url ) );
		}
	}

	public static function hide_deposit_products( bool $visible, int $product_id ): bool {
		if ( self::is_deposit_product( $product_id ) ) {
			return false;
		}
		return $visible;
	}

	public static function not_purchasable( bool $purchasable, $product ): bool {
		if ( $product instanceof \WC_Product && self::is_deposit_product( $product->get_id() ) ) {
			return false;
		}
		return $purchasable;
	}

	public static function block_add_to_cart( bool $passed, int $product_id ): bool {
		if ( self::is_deposit_product( $product_id ) ) {
			wc_add_notice(
				'Inschrijven voor deze opleiding verloopt via ons inschrijfformulier (incl. btw, termijnbetaling).',
				'notice'
			);
			return false;
		}
		return $passed;
	}

	public static function exclude_from_shop_query( \WP_Query $query ): void {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}
		if ( ! ( $query->is_post_type_archive( 'product' ) || $query->is_tax( get_object_taxonomies( 'product' ) ) ) ) {
			return;
		}
		$exclude = self::find_deposit_product_ids();
		if ( ! $exclude ) {
			return;
		}
		$not_in = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_merge( $not_in, $exclude ) );
	}

	public static function redirect_to_cpm_enroll(): void {
		if ( ! is_product() ) {
			return;
		}
		$product_id = (int) get_queried_object_id();
		if ( ! self::is_deposit_product( $product_id ) ) {
			return;
		}
		$url = (string) get_post_meta( $product_id, '_cpm_enroll_redirect', true );
		if ( $url === '' ) {
			$url = self::enroll_url_for_product( $product_id );
		}
		if ( $url === '' ) {
			$url = CTA::next_cohort_signup_url( 'masterclass-3d-nano-brows' );
		}
		if ( $url ) {
			wp_safe_redirect( $url, 301 );
			exit;
		}
	}

	/**
	 * @return list<int>
	 */
	public static function find_deposit_product_ids(): array {
		$cached = get_transient( 'cpm_opl_deposit_product_ids' );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		$posts = get_posts(
			[
				'post_type'      => 'product',
				'post_status'    => [ 'publish', 'private', 'draft' ],
				'posts_per_page' => 100,
				'fields'         => 'ids',
				's'              => 'aanbetaling',
			]
		);
		$ids = [];
		foreach ( $posts as $id ) {
			if ( self::is_deposit_product( (int) $id ) ) {
				$ids[] = (int) $id;
			}
		}
		set_transient( 'cpm_opl_deposit_product_ids', $ids, DAY_IN_SECONDS );
		return $ids;
	}

	public static function is_deposit_product( int $product_id ): bool {
		$slug = (string) get_post_field( 'post_name', $product_id );
		return strpos( $slug, 'aanbetaling-masterclass' ) === 0
			|| strpos( $slug, 'aanbetaling-opleiding' ) === 0
			|| strpos( $slug, 'aanbetaling-pmu' ) === 0;
	}

	public static function enroll_url_for_product( int $product_id ): string {
		$slug = (string) get_post_field( 'post_name', $product_id );
		if ( strpos( $slug, 'aanbetaling-masterclass' ) === 0 ) {
			$path = self::deposit_slug_to_enroll_path( $slug );
			if ( $path !== '' ) {
				$page = get_page_by_path( $path );
				if ( $page ) {
					return (string) get_permalink( $page );
				}
			}
			return CTA::next_cohort_signup_url( 'masterclass-3d-nano-brows' );
		}
		if ( strpos( $slug, 'aanbetaling-opleiding' ) === 0 || strpos( $slug, 'aanbetaling-pmu' ) === 0 ) {
			return CTA::next_cohort_signup_url( 'pmu-opleiding-wenkbrauwen' );
		}
		return '';
	}

	/**
	 * aanbetaling-masterclass-…-1617-september-2026 → inschrijven-masterclass-…-16-17-september-2026
	 */
	private static function deposit_slug_to_enroll_path( string $slug ): string {
		if ( strpos( $slug, 'aanbetaling-masterclass-3d-nano-brows-' ) !== 0 ) {
			return '';
		}
		$rest = substr( $slug, strlen( 'aanbetaling-masterclass-3d-nano-brows-' ) );
		if ( preg_match( '#^(\d{2})(\d{2})-([a-z]+-\d{4})$#', $rest, $m ) ) {
			return 'inschrijven-masterclass-3d-nano-brows-' . $m[1] . '-' . $m[2] . '-' . $m[3];
		}
		return '';
	}
}
