<?php
/**
 * Overzicht van geplande cohorts (geen marketing-copy — alleen data uit WP).
 *
 * [cpm_cohort_schedule]                    — alle templates, aankomend eerst
 * [cpm_cohort_schedule template="…"]       — filter op template-key
 *
 * Auto-inject op hub-pagina /pmu-opleidingen-cocon-cosmetics/ (ID 7003).
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cohort_Schedule {

	const SHORTCODE = 'cpm_cohort_schedule';

	public static function register(): void {
		add_shortcode( self::SHORTCODE, [ __CLASS__, 'shortcode' ] );
		add_filter( 'the_content', [ __CLASS__, 'auto_inject' ], 18 );
		add_action( 'wp_footer', [ __CLASS__, 'footer_inject' ], 5 );
	}

	/**
	 * @return array<int>
	 */
	public static function hub_page_ids(): array {
		$ids = [ 7003 ];
		return array_map( 'intval', (array) apply_filters( 'cpm_opl_schedule_page_ids', $ids ) );
	}

	public static function auto_inject( $content ) {
		if ( ! is_singular( 'page' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		if ( ! in_array( (int) get_queried_object_id(), self::hub_page_ids(), true ) ) {
			return $content;
		}
		return $content . self::render( '' );
	}

	/** Divi-pagebuilder gebruikt vaak geen the_content — injecteer in footer. */
	public static function footer_inject(): void {
		if ( ! is_singular( 'page' ) ) {
			return;
		}
		if ( ! in_array( (int) get_queried_object_id(), self::hub_page_ids(), true ) ) {
			return;
		}
		$html = self::render( '' );
		if ( $html === '' ) {
			return;
		}
		echo '<div class="cpm-opl-schedule-wrap" style="max-width:880px;margin:2rem auto 3rem;padding:0 1rem">';
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</div>';
	}

	public static function shortcode( $atts ): string {
		$atts = shortcode_atts( [ 'template' => '' ], (array) $atts, self::SHORTCODE );
		return self::render( (string) $atts['template'] );
	}

	private static function render( string $template_filter ): string {
		$cohorts = self::query_cohorts( $template_filter );
		if ( ! $cohorts ) {
			return '';
		}

		$by_template = [];
		foreach ( $cohorts as $row ) {
			$key = (string) ( $row['template'] ?: 'overig' );
			$by_template[ $key ][] = $row;
		}

		wp_enqueue_style( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.css', [], CPM_OPL_VERSION );

		ob_start();
		?>
		<section class="cpm-opl-schedule" aria-label="Geplande startdata opleidingen">
			<?php foreach ( $by_template as $template => $items ) : ?>
				<?php
				$label = self::template_label( $template );
				?>
				<h4><?php echo esc_html( $label ); ?></h4>
				<table class="cpm-opl-table">
					<thead>
						<tr>
							<th scope="col">Start</th>
							<th scope="col">Opleiding</th>
							<th scope="col"></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $items as $item ) : ?>
							<tr>
								<td><?php echo esc_html( $item['start_label'] ); ?></td>
								<td><?php echo esc_html( $item['title'] ); ?></td>
								<td>
									<?php if ( $item['url'] ) : ?>
										<a class="cpm-opl-cta__button" style="display:inline-block;padding:8px 16px;font-size:13px" href="<?php echo esc_url( $item['url'] ); ?>">Inschrijven</a>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endforeach; ?>
		</section>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * @return list<array{template:string,title:string,start_label:string,url:string}>
	 */
	private static function query_cohorts( string $template_filter ): array {
		$today = gmdate( 'Y-m-d' );
		$meta_query = [
			[
				'key'     => '_cpm_start_date',
				'value'   => $today,
				'compare' => '>=',
				'type'    => 'DATE',
			],
		];
		if ( $template_filter !== '' ) {
			$meta_query[] = [
				'key'     => '_cpm_template',
				'value'   => $template_filter,
				'compare' => '=',
			];
		}

		$ids = get_posts(
			[
				'post_type'      => Cohort_CPT::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => 50,
				'orderby'        => 'meta_value',
				'meta_key'       => '_cpm_start_date',
				'order'          => 'ASC',
				'fields'         => 'ids',
				'meta_query'     => $meta_query,
			]
		);

		$rows = [];
		foreach ( $ids as $id ) {
			$cohort = Cohort_CPT::get( (int) $id );
			if ( ! $cohort ) {
				continue;
			}
			$page_id = (int) get_post_meta( (int) $id, Cohort_Auto_Page::META_PAGE_ID, true );
			if ( ! $page_id ) {
				$page_id = Cohort_Auto_Page::ensure_page( (int) $id );
			}
			$rows[] = [
				'template'     => (string) ( $cohort['template'] ?? '' ),
				'title'        => (string) ( $cohort['title'] ?? get_the_title( $id ) ),
				'start_label'  => self::dutch_date( (string) ( $cohort['start_date'] ?? '' ) ),
				'url'          => $page_id ? (string) get_permalink( $page_id ) : '',
			];
		}
		return $rows;
	}

	private static function template_label( string $template ): string {
		$labels = [
			'pmu-opleiding-wenkbrauwen' => 'Basisopleiding wenkbrauwen',
			'masterclass-3d-nano-brows' => '3D Nano Brows masterclass',
		];
		return $labels[ $template ] ?? ucfirst( str_replace( '-', ' ', $template ) );
	}

	private static function dutch_date( string $iso ): string {
		if ( ! $iso ) {
			return '—';
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
