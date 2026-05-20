<?php
/**
 * Inschrijfpagina's (shortcode-only) krijgen dezelfde volle breedte als Divi-landingspagina's:
 * header/top-bar over volle viewport, content ~1080px gecentreerd, geen sidebar, geen dubbele H1.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Enroll_Page_Layout {

	public static function register(): void {
		add_filter( 'body_class', [ __CLASS__, 'body_class' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_layout_styles' ], 30 );
	}

	public static function is_enroll_page( ?\WP_Post $post = null ): bool {
		if ( ! is_singular( 'page' ) ) {
			return false;
		}
		$post = $post ?? get_post();
		if ( ! $post instanceof \WP_Post ) {
			return false;
		}
		if ( has_shortcode( (string) $post->post_content, Shortcode::TAG ) ) {
			return true;
		}
		$slug = $post->post_name;
		return $slug !== '' && strpos( $slug, 'inschrijven-' ) === 0;
	}

	/**
	 * @param string[] $classes
	 * @return string[]
	 */
	public static function body_class( array $classes ): array {
		if ( self::is_enroll_page() ) {
			$classes[] = 'cpm-opl-enroll-page';
		}
		return $classes;
	}

	public static function enqueue_layout_styles(): void {
		if ( ! self::is_enroll_page() ) {
			return;
		}
		$page_id = (int) get_queried_object_id();
		if ( $page_id > 0 ) {
			self::apply_page_meta( $page_id );
		}
		if ( ! wp_style_is( 'cpm-opl-checkout', 'enqueued' ) ) {
			wp_enqueue_style( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.css', [], CPM_OPL_VERSION );
		}
	}

	/**
	 * Divi-meta voor nieuwe inschrijfpagina's (geen sidebar, titel verbergen).
	 */
	public static function apply_page_meta( int $page_id ): void {
		if ( $page_id <= 0 ) {
			return;
		}
		update_post_meta( $page_id, '_et_pb_page_layout', 'et_no_sidebar' );
		update_post_meta( $page_id, '_et_pb_show_title', 'off' );
	}
}
