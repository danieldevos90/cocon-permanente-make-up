<?php
/**
 * Cohort-CTA: knop "Meld je aan" voor de eerstvolgende beschikbare cursus
 * van een gegeven template.
 *
 * Twee gebruiksmodes:
 *
 *   1. Shortcode in een pagina:
 *      [cpm_next_cohort_cta template="masterclass-3d-nano-brows"]
 *      [cpm_next_cohort_cta cohort_id="9320" label="Schrijf je in"]
 *
 *   2. Automatisch geïnjecteerd onderaan de content op de
 *      bestaande Divi-landingspagina's (geen handmatige bewerking nodig):
 *
 *      page 6834 (/3d-nano-brows-masterclass/)         → template masterclass-3d-nano-brows
 *      page 2901 (/opleidingen/)                       → template pmu-opleiding-wenkbrauwen
 *
 *      Aanpasbaar via filter `cpm_opl_landing_cta_map`.
 *
 * De CTA toont een korte regel met de eerstvolgende startdatum + 1 grote
 * pink knop "Meld je aan". De optie tot 1/2/3 termijnen wordt op de
 * inschrijfpagina zelf gepresenteerd; we leggen er hier opzettelijk geen
 * nadruk op zodat de CTA luchtig blijft.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CTA {

	const SHORTCODE = 'cpm_next_cohort_cta';

	public static function register(): void {
		add_shortcode( self::SHORTCODE, [ __CLASS__, 'shortcode' ] );
		add_filter( 'the_content', [ __CLASS__, 'auto_inject' ], 20 );
	}

	/**
	 * Mapping page_id → template_key. Filterable.
	 *
	 * @return array<int,string>
	 */
	public static function landing_map(): array {
		$map = [
			6834 => 'masterclass-3d-nano-brows',  // /3d-nano-brows-masterclass/
			2901 => 'pmu-opleiding-wenkbrauwen',  // /opleidingen/  (basisopleiding wenkbrauwen)
		];
		return (array) apply_filters( 'cpm_opl_landing_cta_map', $map );
	}

	/**
	 * Voegt automatisch de CTA toe onderaan de content op de mapping-pagina's.
	 */
	public static function auto_inject( $content ) {
		if ( ! is_singular( 'page' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$map  = self::landing_map();
		$page = (int) get_queried_object_id();
		if ( ! isset( $map[ $page ] ) ) {
			return $content;
		}
		return $content . self::render_cta_for_template( (string) $map[ $page ] );
	}

	/**
	 * Shortcode handler. Atts:
	 *   - cohort_id (int)        — kies expliciet een cohort
	 *   - template  (string)     — kies "eerstvolgende beschikbare" voor dit template
	 *   - label     (string)     — knop-tekst (default "Meld je aan")
	 */
	public static function shortcode( $atts ): string {
		$atts = shortcode_atts(
			[
				'cohort_id' => 0,
				'template'  => '',
				'label'     => 'Meld je aan',
			],
			(array) $atts,
			self::SHORTCODE
		);

		$cohort_id = (int) $atts['cohort_id'];
		if ( ! $cohort_id && $atts['template'] !== '' ) {
			$cohort_id = self::find_next_cohort_id( (string) $atts['template'] );
		}
		if ( ! $cohort_id ) {
			return '';
		}
		return self::render( $cohort_id, (string) $atts['label'] );
	}

	private static function render_cta_for_template( string $template ): string {
		$cohort_id = self::find_next_cohort_id( $template );
		if ( ! $cohort_id ) {
			return '';
		}
		return self::render( $cohort_id, 'Meld je aan' );
	}

	/**
	 * Eerstvolgende publiek-gepubliceerde cohort van een template met
	 * startdatum vanaf vandaag (oplopend). Fallback: de meest recente
	 * cohort van die template (zelfs als verlopen) — beter een knop met
	 * verlopen datum tonen dan helemaal niets.
	 */
	private static function find_next_cohort_id( string $template ): int {
		$today = gmdate( 'Y-m-d' );

		$args = [
			'post_type'      => Cohort_CPT::POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'orderby'        => 'meta_value',
			'meta_key'       => '_cpm_start_date',
			'order'          => 'ASC',
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'     => '_cpm_template',
					'value'   => $template,
					'compare' => '=',
				],
				[
					'key'     => '_cpm_start_date',
					'value'   => $today,
					'compare' => '>=',
					'type'    => 'DATE',
				],
			],
		];
		$q = get_posts( $args );
		if ( $q ) {
			return (int) $q[0];
		}

		// Fallback: meest recente cohort van dit template
		$args['meta_query'] = [
			[
				'key'     => '_cpm_template',
				'value'   => $template,
				'compare' => '=',
			],
		];
		$args['order'] = 'DESC';
		$q             = get_posts( $args );
		return $q ? (int) $q[0] : 0;
	}

	private static function render( int $cohort_id, string $label ): string {
		$cohort = Cohort_CPT::get( $cohort_id );
		if ( ! $cohort ) {
			return '';
		}
		$page_id = (int) get_post_meta( $cohort_id, Cohort_Auto_Page::META_PAGE_ID, true );
		if ( ! $page_id ) {
			// Geen gekoppelde inschrijfpagina → maak hem nu aan
			$page_id = Cohort_Auto_Page::ensure_page( $cohort_id );
		}
		if ( ! $page_id ) {
			return '';
		}
		$url   = (string) get_permalink( $page_id );
		$date  = self::dutch_date( (string) $cohort['start_date'] );
		$start = $cohort['start_date'] ? strtotime( (string) $cohort['start_date'] ) : 0;
		$is_past   = $start && $start < strtotime( gmdate( 'Y-m-d' ) );
		$date_line = $is_past
			? sprintf( 'Schrijf je in voor de volgende editie' )
			: sprintf( 'Eerstvolgende start: <strong>%s</strong>', esc_html( $date ) );

		self::enqueue_styles();

		ob_start();
		?>
		<aside class="cpm-opl-cta">
			<div class="cpm-opl-cta__copy">
				<p class="cpm-opl-cta__date"><?php echo wp_kses( $date_line, [ 'strong' => [] ] ); ?></p>
				<p class="cpm-opl-cta__title"><?php echo esc_html( get_the_title( $cohort_id ) ); ?></p>
			</div>
			<a class="cpm-opl-cta__button" href="<?php echo esc_url( $url ); ?>">
				<?php echo esc_html( $label ); ?>
			</a>
		</aside>
		<?php
		return (string) ob_get_clean();
	}

	private static function enqueue_styles(): void {
		// Zelfde stylesheet als de inschrijfpagina (cta-blok zit erin)
		if ( ! wp_style_is( 'cpm-opl-checkout', 'registered' ) ) {
			wp_register_style(
				'cpm-opl-checkout',
				CPM_OPL_URL . 'assets/checkout.css',
				[],
				CPM_OPL_VERSION
			);
		}
		wp_enqueue_style( 'cpm-opl-checkout' );
	}

	private static function dutch_date( string $iso ): string {
		if ( ! $iso ) {
			return '';
		}
		$ts = strtotime( $iso );
		if ( ! $ts ) {
			return $iso;
		}
		$months = [
			1 => 'januari', 2 => 'februari', 3 => 'maart', 4 => 'april',
			5 => 'mei', 6 => 'juni', 7 => 'juli', 8 => 'augustus',
			9 => 'september', 10 => 'oktober', 11 => 'november', 12 => 'december',
		];
		return (int) date( 'j', $ts ) . ' ' . $months[ (int) date( 'n', $ts ) ] . ' ' . date( 'Y', $ts );
	}
}
