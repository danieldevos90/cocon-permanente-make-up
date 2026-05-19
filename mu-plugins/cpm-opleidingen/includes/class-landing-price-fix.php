<?php
/**
 * Corrigeert verouderde "excl. btw" / verkeerde bedragen op vaste Divi-landingspagina's.
 * Alleen prijslabels — geen andere copy.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Landing_Price_Fix {

	public static function register(): void {
		add_filter( 'the_content', [ __CLASS__, 'filter' ], 14 );
	}

	public static function filter( $content ): string {
		if ( ! is_singular( 'page' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$page = (int) get_queried_object_id();
		$c    = (string) $content;

		if ( $page === 6834 ) {
			$c = str_replace( '€ 2.400,- Excl.', '€ 2.904,- incl. btw', $c );
			$c = str_replace( '€600 excl. btw.', '€ 726,- incl. btw', $c );
		}
		if ( $page === 2901 ) {
			$c = preg_replace( '/€\s*5950,-\s*excl\.\s*btw/i', '€ 5.950,- incl. btw', $c );
			$c = preg_replace( '/€\s*5\.950,-\s*excl\.\s*btw/i', '€ 5.950,- incl. btw', $c );
		}

		return $c;
	}
}
