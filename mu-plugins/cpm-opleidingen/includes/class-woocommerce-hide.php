<?php
/**
 * Verberg legacy WooCommerce-aanbetaling-producten uit shop/catalogus.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WooCommerce_Hide {

	public static function register(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		add_filter( 'woocommerce_product_is_visible', [ __CLASS__, 'hide_deposit_products' ], 10, 2 );
		add_action( 'pre_get_posts', [ __CLASS__, 'exclude_from_shop_query' ] );
	}

	public static function hide_deposit_products( bool $visible, int $product_id ): bool {
		if ( self::is_deposit_product( $product_id ) ) {
			return false;
		}
		return $visible;
	}

	public static function exclude_from_shop_query( \WP_Query $query ): void {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}
		if ( ! ( $query->is_post_type_archive( 'product' ) || $query->is_tax( get_object_taxonomies( 'product' ) ) ) ) {
			return;
		}
		$exclude = self::deposit_product_ids();
		if ( ! $exclude ) {
			return;
		}
		$not_in = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_merge( $not_in, $exclude ) );
	}

	/**
	 * @return list<int>
	 */
	private static function deposit_product_ids(): array {
		$cached = get_transient( 'cpm_opl_deposit_product_ids' );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		$posts = get_posts(
			[
				'post_type'      => 'product',
				'post_status'    => 'publish',
				'posts_per_page' => 50,
				'fields'         => 'ids',
				's'              => 'aanbetaling masterclass',
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

	private static function is_deposit_product( int $product_id ): bool {
		$slug = (string) get_post_field( 'post_name', $product_id );
		return strpos( $slug, 'aanbetaling-masterclass' ) === 0
			|| strpos( $slug, 'aanbetaling-opleiding' ) === 0;
	}
}
