<?php
/**
 * Canonieke prijzen excl. btw (centen) per opleiding-template.
 * Website toont excl.; Mollie rekent incl. 21% btw af.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Pricing {

	const LOCATION = 'Korte Hoogstraat 29A, Vlaardingen';

	const SYNC_OPTION = 'cpm_opl_pricing_sync_version';
	const SYNC_VERSION = '4';

	const BTW_RATE = 1.21;

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
				'canonical_start'   => '2026-09-23',
			],
			'masterclass-3d-nano-brows' => [
				'total_price_cents' => 240000,
				'deposit_cents'     => 41322,
				'max_termijnen'     => 3,
				'max_students'      => 5,
				'location'          => self::LOCATION,
				'currency'          => 'EUR',
				'addon_price_cents' => 60000,
				'addon_label'       => 'Combi Brows-vervolgdag (optionele uitbreidingsdag)',
			],
		];
		return (array) apply_filters( 'cpm_opl_pricing_products', $products );
	}

	public static function incl_cents( int $excl_cents ): int {
		if ( $excl_cents <= 0 ) {
			return 0;
		}
		return (int) round( $excl_cents * self::BTW_RATE );
	}

	public static function excl_from_incl_cents( int $incl_cents ): int {
		if ( $incl_cents <= 0 ) {
			return 0;
		}
		return (int) round( $incl_cents / self::BTW_RATE );
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

		$changed = self::sync_cohort_content( $cohort_id, $template ) || $changed;

		return $changed;
	}

	private static function sync_cohort_content( int $cohort_id, string $template ): bool {
		$changed  = false;
		$defaults = Cohort_Defaults::for_cohort( $cohort_id );

		if ( ! empty( $defaults['trainer_name'] ) ) {
			$trainer = (string) $defaults['trainer_name'];
			if ( (string) get_post_meta( $cohort_id, '_cpm_trainer_name', true ) !== $trainer ) {
				update_post_meta( $cohort_id, '_cpm_trainer_name', $trainer );
				$changed = true;
			}
		}

		$product = self::defaults_for_template( $template );
		if ( ! $product ) {
			return $changed;
		}

		if ( $template === 'pmu-opleiding-wenkbrauwen' && ! empty( $product['canonical_start'] ) ) {
			$start = (string) $product['canonical_start'];
			if ( (string) get_post_meta( $cohort_id, '_cpm_start_date', true ) !== $start ) {
				update_post_meta( $cohort_id, '_cpm_start_date', $start );
				$changed = true;
			}
		}

		if ( $template === 'masterclass-3d-nano-brows' && (int) ( $product['addon_price_cents'] ?? 0 ) > 0 ) {
			$start = (string) get_post_meta( $cohort_id, '_cpm_start_date', true );
			$addon = self::masterclass_addon_date_for_start( $start );
			if ( $addon && (string) get_post_meta( $cohort_id, '_cpm_addon_date', true ) !== $addon ) {
				update_post_meta( $cohort_id, '_cpm_addon_date', $addon );
				$changed = true;
			}
		}

		return $changed;
	}

	private static function masterclass_addon_date_for_start( string $start_iso ): string {
		return self::addon_date_for_masterclass( $start_iso );
	}

	public static function addon_date_for_masterclass( string $start_iso ): string {
		if ( $start_iso === '' ) {
			return '';
		}
		$month = (int) substr( $start_iso, 5, 2 );
		if ( $month <= 9 ) {
			return '2026-11-18';
		}
		if ( $month === 11 ) {
			return '2026-11-27';
		}
		return '';
	}

	/**
	 * Audit-overzicht voor admin/diag (geen secrets).
	 *
	 * @return array<string,mixed>
	 */
	public static function audit_report(): array {
		$report = [
			'vat_note' => 'Opgeslagen bedragen zijn excl. 21% btw; Mollie incasseert incl. btw.',
			'products' => [],
			'cohorts'  => [],
		];
		foreach ( self::products() as $tpl => $def ) {
			$excl = (int) $def['total_price_cents'];
			$report['products'][ $tpl ] = [
				'total_excl'   => self::format_eur_excl( $excl ),
				'total_incl'   => self::format_eur_incl( $excl ),
				'deposit_excl' => self::format_eur_excl( (int) $def['deposit_cents'] ),
				'addon'        => (int) $def['addon_price_cents'] > 0
					? self::format_eur_excl( (int) $def['addon_price_cents'] )
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
			$tpl       = (string) ( $c['template'] ?? '' );
			$canon     = self::defaults_for_template( $tpl );
			$total_ex  = (int) ( $c['total_price_excl_cents'] ?? 0 );
			$dep_ex    = (int) ( $c['deposit_excl_cents'] ?? 0 );
			$addon_ex  = (int) ( $c['addon_price_excl_cents'] ?? 0 );
			$ok        = $canon
				&& $total_ex === (int) $canon['total_price_cents']
				&& $dep_ex === (int) $canon['deposit_cents']
				&& $addon_ex === (int) ( $canon['addon_price_cents'] ?? 0 );
			$report['cohorts'][] = [
				'id'       => (int) $id,
				'title'    => (string) $c['title'],
				'template' => $tpl,
				'total'    => self::format_eur_excl( $total_ex ),
				'deposit'  => self::format_eur_excl( $dep_ex ),
				'addon'    => $addon_ex > 0 ? self::format_eur_excl( $addon_ex ) : null,
				'ok'       => $ok,
			];
		}
		return $report;
	}

	public static function format_eur( int $cents ): string {
		return '€ ' . number_format( $cents / 100, 2, ',', '.' );
	}

	public static function format_eur_excl( int $excl_cents ): string {
		return self::format_eur( $excl_cents ) . ' excl. btw';
	}

	public static function format_eur_incl( int $excl_cents ): string {
		return self::format_eur( self::incl_cents( $excl_cents ) ) . ' incl. btw';
	}
}
