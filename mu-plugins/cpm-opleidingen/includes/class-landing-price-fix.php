<?php
/**
 * WordPress-content: opleidingsprijzen overal excl. btw tonen.
 * Landingspagina's 2901 + 6834: ook trainer/copy fixes.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Landing_Price_Fix {

	private const BASIS_PAGE       = 2901;
	private const MASTERCLASS_PAGE = 6834;

	public static function register(): void {
		add_filter( 'the_content', [ __CLASS__, 'filter_content' ], 14 );
		add_action( 'wp_head', [ __CLASS__, 'inline_css' ], 99 );
		add_action( 'wp_footer', [ __CLASS__, 'inline_css' ], 1 );
	}

	public static function filter_content( $content ): string {
		if ( ! is_singular() || ! in_the_loop() || ! is_main_query() ) {
			return (string) $content;
		}
		$c = self::normalize_prices( (string) $content );
		if ( ! is_singular( 'page' ) ) {
			return $c;
		}
		$page = (int) get_queried_object_id();
		if ( $page === self::BASIS_PAGE ) {
			$c = self::fix_basis( $c );
		} elseif ( $page === self::MASTERCLASS_PAGE ) {
			$c = self::fix_masterclass( $c );
		}
		return $c;
	}

	private static function fix_basis( string $c ): string {
		$c = self::replace_trainer_heading( $c );

		$c = preg_replace(
			'/Onder leiding van de awardwinning Sina Hashemi[^<]+permanente make-up\.[^<]*<\/span>/i',
			'Onder leiding van Sina Hashemi leer je niet alleen de techniek, maar ook de finesse en werkwijze van een van de meest gevraagde PMU-specialisten.</span>',
			$c,
			1
		);

		$c = str_replace(
			'<b>Els, Sina en ons team van PMU-professionals</b>',
			'<b>Sina en ons team van PMU-professionals</b>',
			$c
		);

		$c = str_replace(
			'Demo model door Els of Sina',
			'Demo model door Sina',
			$c
		);

		$c = str_replace(
			'<div class="tmdivi-title">Start opleiding</div>',
			'<div class="tmdivi-title">Start opleiding — 23 september 2026</div>',
			$c
		);

		$c = preg_replace(
			'#<div class="et_pb_row et_pb_row_15\b[^"]*"[^>]*>.*?(?=<div class="et_pb_row et_pb_row_16\b)#s',
			'',
			$c,
			1
		);

		return $c;
	}

	private static function fix_masterclass( string $c ): string {
		$c = self::replace_trainer_heading( $c );

		$old_combi = 'Wil je graag nog meer leren? Na het volgen van de 3D Nano Masterclass krijg je de unieke kans om je technieken verder uit te breiden met de extra trainingsdag <strong>Combi Brows</strong> tegen een exclusieve <strong>prijs van €600 excl. btw.</strong> Deze kun je alleen volgen als je de 3D Nano Masterclass hebt gevolgd.';
		$new_combi = 'Wil je graag nog meer leren? Na het volgen van de 3D Nano Masterclass krijg je de unieke kans om je technieken verder uit te breiden met de optionele <strong>Combi Brows-vervolgdag</strong> (<strong>€600 excl. btw</strong>). Beschikbare data: <strong>18 november 2026</strong> (bij september-cohort) en <strong>27 november 2026</strong> (bij november-cohort). Alleen te boeken in combinatie met de masterclass.';

		$c = str_replace( $old_combi, $new_combi, $c );

		$c = preg_replace(
			'/Combi Brows<\/strong> tegen een exclusieve\s*<strong>prijs van €600 excl\. btw\.<\/strong>/i',
			'Combi Brows-vervolgdag</strong> (<strong>€600 excl. btw</strong>) — data: <strong>18 november 2026</strong> of <strong>27 november 2026</strong>',
			$c
		);

		$c = preg_replace(
			'#<div class="et_pb_row et_pb_row_13\b[^"]*"[^>]*>.*?(?=<div class="et_pb_row et_pb_row_14\b)#s',
			'',
			$c,
			1
		);

		return $c;
	}

	private static function replace_trainer_heading( string $c ): string {
		return (string) preg_replace(
			'/<h2([^>]*)>\s*Meet The Masters\s*<\/h2>/i',
			'<h2$1>Jouw trainer</h2>',
			$c
		);
	}

	public static function normalize_prices( string $c ): string {
		$map = [
			'€&nbsp;7.199,50 incl. btw' => '€&nbsp;5.950,00 excl. btw',
			'€ 7.199,50 incl. btw'       => '€ 5.950,00 excl. btw',
			'€ 7199,50 incl. btw'         => '€ 5.950,00 excl. btw',
			'€&nbsp;2.904,00 incl. btw'  => '€&nbsp;2.400,00 excl. btw',
			'€ 2.904,00 incl. btw'        => '€ 2.400,00 excl. btw',
			'€ 2904,00 incl. btw'         => '€ 2.400,00 excl. btw',
			'€ 2.904,- incl. btw'         => '€ 2.400,- excl. btw',
			'€ 726,00 incl. btw'          => '€ 600,00 excl. btw',
			'€ 726,- incl. btw'           => '€ 600,- excl. btw',
			'€ 726,00'                    => '€ 600,00 excl. btw',
			'€&nbsp;726,00'               => '€&nbsp;600,00 excl. btw',
			'€ 1.512,50 incl. btw'        => '€ 1.250,00 excl. btw',
			'€&nbsp;1.512,50 incl. btw'   => '€&nbsp;1.250,00 excl. btw',
			'€ 500,00 incl. btw'          => '€ 413,22 excl. btw',
		];
		foreach ( $map as $from => $to ) {
			$c = str_replace( $from, $to, $c );
		}

		$c = preg_replace( '/€\s*5\.950,-\s*incl\.\s*btw/i', '€ 5.950,- excl. btw', $c );
		$c = preg_replace( '/€\s*5950,-\s*incl\.\s*btw/i', '€ 5.950,- excl. btw', $c );
		$c = preg_replace( '/€\s*2\.400,-\s*incl\.\s*btw/i', '€ 2.400,- excl. btw', $c );
		$c = preg_replace( '/incl\.\s*21\s*%\s*btw/i', 'excl. 21% btw', $c );
		$c = preg_replace( '/incl\.\s*btw/i', 'excl. btw', $c );

		$c = str_replace( '€ 2.400,- Excl.', '€ 2.400,- excl. btw', $c );
		$c = str_replace( '€ 2.400,- excl.', '€ 2.400,- excl. btw', $c );

		return $c;
	}

	public static function inline_css(): void {
		if ( ! is_singular( 'page' ) ) {
			return;
		}
		$page = (int) get_queried_object_id();
		$rules = [];
		if ( $page === self::BASIS_PAGE ) {
			$rules[] = 'body.page-id-2901 .et_pb_row_15{display:none!important}';
		} elseif ( $page === self::MASTERCLASS_PAGE ) {
			$rules[] = 'body.page-id-6834 .et_pb_row_13{display:none!important}';
		}
		if ( ! $rules ) {
			return;
		}
		echo '<style id="cpm-landing-content-fix">' . implode( ' ', $rules ) . '</style>' . "\n";
	}
}
