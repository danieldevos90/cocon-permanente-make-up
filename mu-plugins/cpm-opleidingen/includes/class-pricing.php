<?php
/**
 * Canonieke prijzen incl. btw (centen) per opleiding-template.
 * Gelijk aan Salonized Cocon Academy + website-inschrijfbedragen.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Pricing {

	const LOCATION = 'Korte Hoogstraat 29A, Vlaardingen';

	const SYNC_OPTION = 'cpm_opl_pricing_sync_version';
	const SYNC_VERSION = '2';

	/**
	 * @return array<string,array<string,mixed>>
	 */
	public static function products(): array {
		$products = [
			'pmu-opleiding-wenkbrauwen' => [
				'total_price_cents' => 595000,
				'deposit_cents'     => 125000,
				'max_termijnen'     => 3,
				'max_students'      => 5,
				'location'          => self::LOCATION,
				'currency'          => 'EUR',
				'addon_price_cents' => 0,
				'addon_date'        => '',
				'addon_label'       => '',
			],
			'masterclass-3d-nano-brows' => [
				// Salonized: aanbetaling €500 + restant €2.404 = €2.904 incl. btw
				'total_price_cents' => 290400,
				'deposit_cents'     => 50000,
				'max_termijnen'     => 3,
				'max_students'      => 5,
				'location'          => self::LOCATION,
				'currency'          => 'EUR',
				'addon_price_cents' => 72600,
				'addon_label'       => 'Combi Brows-vervolgdag',
			],
		];
		return (array) apply_filters( 'cpm_opl_pricing_products', $products );
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public static function defaults_for_template( string $template ): ?array {
		$products = self::products();
		return $products[ $template ] ?? null;
	}

	public static function mailchimp_tag_for_template( string $template ): string {
		$map = [
			'pmu-opleiding-wenkbrauwen' => 'Basis opleiding',
			'masterclass-3d-nano-brows' => 'Masterclass',
		];
		$map = (array) apply_filters( 'cpm_opl_mailchimp_tag_map', $map );
		return $map[ $template ] ?? '';
	}

	/**
	 * Eenmalig: cohort-meta alignen met canonieke incl.-prijzen (live + nieuwe cohorts).
	 */
	public static function maybe_sync_cohorts(): void {
		if ( get_option( self::SYNC_OPTION ) === self::SYNC_VERSION ) {
			return;
		}
		self::sync_all_cohort_prices();
		update_option( self::SYNC_OPTION, self::SYNC_VERSION, false );
	}

	public static function sync_all_cohort_prices(): int {
		$updated = 0;
		$ids     = get_posts(
			[
				'post_type'      => Cohort_CPT::POST_TYPE,
				'post_status'    => [ 'publish', 'draft', 'pending', 'future' ],
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);
		foreach ( $ids as $id ) {
			if ( self::sync_cohort( (int) $id ) ) {
				++$updated;
			}
		}
		return $updated;
	}

	public static function sync_cohort( int $cohort_id ): bool {
		$template = (string) get_post_meta( $cohort_id, '_cpm_template', true );
		if ( $template === '' ) {
			$template = Cohort_Defaults::DEFAULT_TEMPLATE;
		}
		$defaults = self::defaults_for_template( $template );
		if ( ! $defaults ) {
			return false;
		}
		$map = [
			'total_price_cents' => '_cpm_total_price_cents',
			'deposit_cents'     => '_cpm_deposit_cents',
			'max_termijnen'     => '_cpm_max_termijnen',
			'max_students'      => '_cpm_max_students',
			'location'          => '_cpm_location',
			'currency'          => '_cpm_currency',
			'addon_price_cents' => '_cpm_addon_price_cents',
			'addon_label'       => '_cpm_addon_label',
		];
		$changed = false;
		foreach ( $map as $key => $meta_key ) {
			if ( ! array_key_exists( $key, $defaults ) ) {
				continue;
			}
			$new = $defaults[ $key ];
			$old = get_post_meta( $cohort_id, $meta_key, true );
			if ( (string) $old !== (string) $new ) {
				update_post_meta( $cohort_id, $meta_key, $new );
				$changed = true;
			}
		}
		if ( empty( get_post_meta( $cohort_id, '_cpm_template', true ) ) ) {
			update_post_meta( $cohort_id, '_cpm_template', $template );
			$changed = true;
		}
		return $changed;
	}

	/**
	 * Audit-overzicht voor admin/diag (geen secrets).
	 *
	 * @return array<string,mixed>
	 */
	public static function audit_report(): array {
		$report = [
			'vat_note' => 'Alle bedragen in CPM zijn incl. 21% btw (consumentenprijs).',
			'products' => [],
			'cohorts'  => [],
		];
		foreach ( self::products() as $tpl => $def ) {
			$report['products'][ $tpl ] = [
				'total'   => self::format_eur( (int) $def['total_price_cents'] ),
				'deposit' => self::format_eur( (int) $def['deposit_cents'] ),
				'addon'   => (int) $def['addon_price_cents'] > 0
					? self::format_eur( (int) $def['addon_price_cents'] )
					: null,
			];
		}
		$ids = get_posts(
			[
				'post_type'      => Cohort_CPT::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]
		);
		foreach ( $ids as $id ) {
			$c = Cohort_CPT::get( (int) $id );
			if ( ! $c ) {
				continue;
			}
			$tpl     = (string) ( $c['template'] ?? '' );
			$canon   = self::defaults_for_template( $tpl );
			$total   = (int) $c['total_price_cents'];
			$deposit = (int) $c['deposit_cents'];
			$addon   = (int) ( $c['addon_price_cents'] ?? 0 );
			$ok      = $canon
				&& $total === (int) $canon['total_price_cents']
				&& $deposit === (int) $canon['deposit_cents']
				&& $addon === (int) ( $canon['addon_price_cents'] ?? 0 );
			$report['cohorts'][] = [
				'id'      => (int) $id,
				'title'   => (string) $c['title'],
				'template'=> $tpl,
				'total'   => self::format_eur( $total ),
				'deposit' => self::format_eur( $deposit ),
				'addon'   => $addon > 0 ? self::format_eur( $addon ) : null,
				'ok'      => $ok,
			];
		}
		return $report;
	}

	public static function format_eur( int $cents ): string {
		return '€ ' . number_format( $cents / 100, 2, ',', '.' );
	}
}
