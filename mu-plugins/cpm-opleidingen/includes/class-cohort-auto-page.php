<?php
/**
 * Bij elke nieuwe (of bijgewerkte) cohort: zorg dat er een inschrijfpagina
 * bestaat die enkel de shortcode bevat. Daardoor krijgt elk event-product
 * automatisch dezelfde stijl + layout zonder dat we per cursus een Divi-page
 * hoeven samen te stellen.
 *
 *  - Pagina-slug:    inschrijven-{post_name van cohort}
 *  - Pagina-titel:   "Inschrijven — {cohort title}"
 *  - Pagina-content: [cpm_opleiding_aanmelden cohort_id="{ID}"]
 *  - Koppeling:      post_meta `_cpm_enroll_page_id` op het cohort
 *
 * Bestaat de pagina al, dan wordt enkel de titel + shortcode-content ge-sync'd
 * (zodat handmatige edits aan de inhoud niet automagisch teruggezet worden,
 *  tenzij de pagina alleen de oude shortcode bevat).
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cohort_Auto_Page {

	const META_PAGE_ID = '_cpm_enroll_page_id';

	public static function register(): void {
		add_action( 'save_post_' . Cohort_CPT::POST_TYPE, [ __CLASS__, 'on_save' ], 20, 3 );
	}

	/**
	 * Hook: wp_insert_post / wp_update_post → publish-status check + create/sync.
	 */
	public static function on_save( int $post_id, \WP_Post $post, bool $update ): void {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}
		if ( $post->post_status !== 'publish' ) {
			return;
		}
		self::ensure_page( $post_id );
	}

	/**
	 * Maak (of werk bij) de inschrijfpagina voor dit cohort.
	 * Returns het pagina-ID.
	 */
	public static function ensure_page( int $cohort_id ): int {
		$post = get_post( $cohort_id );
		if ( ! $post || $post->post_type !== Cohort_CPT::POST_TYPE ) {
			return 0;
		}

		$shortcode = sprintf( '[cpm_opleiding_aanmelden cohort_id="%d"]', $cohort_id );
		$title     = 'Inschrijven — ' . $post->post_title;
		$slug      = self::slug_for( $post );

		$page_id = (int) get_post_meta( $cohort_id, self::META_PAGE_ID, true );

		// Resolve fallback: maybe een pagina met dezelfde slug bestaat al
		// (bv. handmatig aangemaakt) — koppel die als wij geen meta hebben.
		if ( ! $page_id ) {
			$existing = get_page_by_path( $slug, OBJECT, 'page' );
			if ( $existing instanceof \WP_Post ) {
				$page_id = (int) $existing->ID;
				update_post_meta( $cohort_id, self::META_PAGE_ID, $page_id );
			}
		}

		if ( $page_id && get_post_status( $page_id ) ) {
			$current_content = trim( (string) get_post_field( 'post_content', $page_id ) );
			$is_just_shortcode = self::content_is_only_our_shortcode( $current_content );

			$update_args = [
				'ID'         => $page_id,
				'post_title' => $title,
			];
			// Alleen content overschrijven als de pagina nog "leeg" is
			// (alleen onze shortcode of compleet leeg). Zo blijven handmatige
			// Divi-customisaties intact.
			if ( $is_just_shortcode || $current_content === '' ) {
				$update_args['post_content'] = $shortcode;
			}
			wp_update_post( $update_args );
			Enroll_Page_Layout::apply_page_meta( $page_id );
			return $page_id;
		}

		$new_id = wp_insert_post( [
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $shortcode,
		], true );
		if ( is_wp_error( $new_id ) ) {
			return 0;
		}
		update_post_meta( $cohort_id, self::META_PAGE_ID, (int) $new_id );
		Enroll_Page_Layout::apply_page_meta( (int) $new_id );
		return (int) $new_id;
	}

	private static function slug_for( \WP_Post $cohort ): string {
		$source = $cohort->post_name ?: $cohort->post_title;
		$base   = 'inschrijven-' . sanitize_title( $source );
		return $base ?: ( 'inschrijven-cohort-' . $cohort->ID );
	}

	/**
	 * True als de content ofwel leeg is, ofwel alleen één van onze shortcodes
	 * bevat (eventueel met whitespace eromheen).
	 */
	private static function content_is_only_our_shortcode( string $content ): bool {
		$trimmed = trim( $content );
		if ( $trimmed === '' ) {
			return true;
		}
		// Match: [cpm_opleiding_aanmelden cohort_id="123"]   (met optionele extra whitespace)
		return (bool) preg_match( '/^\[cpm_opleiding_aanmelden\s+cohort_id="?\d+"?\s*\]$/', $trimmed );
	}
}
