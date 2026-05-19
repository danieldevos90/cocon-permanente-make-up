<?php
/**
 * Overzicht van geplande cohorts (geen marketing-copy — alleen data uit WP).
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cohort_Schedule {

	const SHORTCODE = 'cpm_cohort_schedule';

	/** @var bool */
	private static $printed = false;

	/** @var bool */
	private static $inline_style_printed = false;

	public static function register(): void {
		add_shortcode( self::SHORTCODE, [ __CLASS__, 'shortcode' ] );
		add_filter( 'the_content', [ __CLASS__, 'strip_hub_shortcode' ], 5 );
		add_filter( 'the_content', [ __CLASS__, 'auto_inject' ], 18 );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'maybe_enqueue' ], 20 );
		add_action( 'wp_head', [ __CLASS__, 'head_stylesheet' ], 5 );
		add_action( 'et_after_main_content', [ __CLASS__, 'inject_hub_schedule' ], 15 );
		add_action( 'init', [ __CLASS__, 'maybe_purge_hub_cache' ], 99 );
	}

	/**
	 * Divi-hub: shortcode in page builder + et_after_main_content gaf dubbele blokken.
	 */
	public static function strip_hub_shortcode( $content ) {
		if ( ! is_string( $content ) || $content === '' || ! self::is_hub_request() ) {
			return $content;
		}
		return (string) preg_replace( '/\[cpm_cohort_schedule[^\]]*\]/i', '', $content );
	}

	public static function maybe_purge_hub_cache(): void {
		$key    = 'cpm_opl_hub_cache_v';
		$stored = (string) get_option( $key, '' );
		if ( $stored === CPM_OPL_VERSION ) {
			return;
		}
		update_option( $key, CPM_OPL_VERSION, false );
		$purge_ids = self::hub_page_ids();
		$front     = (int) get_option( 'page_on_front' );
		if ( $front && ! in_array( $front, $purge_ids, true ) ) {
			$purge_ids[] = $front;
		}
		foreach ( $purge_ids as $post_id ) {
			do_action( 'litespeed_purge_post', $post_id );
			$url = get_permalink( $post_id );
			if ( $url ) {
				do_action( 'litespeed_purge_url', $url );
			}
		}
	}

	public static function maybe_enqueue(): void {
		if ( ! self::is_hub_request() ) {
			return;
		}
		self::enqueue_styles();
	}

	/** Direct stylesheet link — betrouwbaar op Divi/LiteSpeed wanneer late enqueue faalt. */
	public static function head_stylesheet(): void {
		if ( ! self::is_hub_request() ) {
			return;
		}
		$url = esc_url(
			add_query_arg( 'ver', CPM_OPL_VERSION, CPM_OPL_URL . 'assets/checkout.css' )
		);
		echo '<link rel="stylesheet" id="cpm-opl-checkout-css" href="' . esc_url( $url ) . '" media="all" />' . "\n";
	}

	private static function is_hub_request(): bool {
		return is_page( self::hub_page_ids() );
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
		// Hub: alleen via inject_hub_schedule (onder de Divi-content).
		if ( self::is_hub_request() ) {
			return $content;
		}
		return $content . self::render( '' );
	}

	public static function inject_hub_schedule(): void {
		if ( self::$printed || ! self::is_hub_request() ) {
			return;
		}
		self::output_schedule();
	}

	private static function output_schedule(): void {
		$html = self::render( '' );
		if ( $html === '' ) {
			return;
		}
		self::$printed = true;
		self::ensure_styles_printed();
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	private static function ensure_styles_printed(): void {
		self::enqueue_styles();
		if ( wp_style_is( 'cpm-opl-checkout', 'done' ) ) {
			return;
		}
		wp_print_styles( 'cpm-opl-checkout' );
		if ( wp_style_is( 'cpm-opl-checkout', 'done' ) ) {
			return;
		}
		$url = esc_url(
			add_query_arg( 'ver', CPM_OPL_VERSION, CPM_OPL_URL . 'assets/checkout.css' )
		);
		echo '<link rel="stylesheet" id="cpm-opl-checkout-css" href="' . esc_url( $url ) . '" media="all" />' . "\n";
	}

	public static function shortcode( $atts ): string {
		if ( self::is_hub_request() ) {
			return '';
		}
		$atts = shortcode_atts( [ 'template' => '' ], (array) $atts, self::SHORTCODE );
		return self::render( (string) $atts['template'] );
	}

	private static function render( string $template_filter ): string {
		if ( self::$printed ) {
			return '';
		}

		$cohorts = self::query_cohorts( $template_filter );
		if ( ! $cohorts ) {
			return '';
		}

		$by_template = [];
		foreach ( $cohorts as $row ) {
			$key = (string) ( $row['template'] ?: 'overig' );
			$by_template[ $key ][] = $row;
		}

		if ( ! self::is_hub_request() ) {
			self::enqueue_styles();
		}

		ob_start();
		?>
		<?php echo self::inline_schedule_style_tag(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<div class="cpm-opl-schedule-wrap">
			<section class="cpm-opl-schedule" aria-label="Geplande startdata opleidingen">
				<header class="cpm-opl-schedule__intro">
					<p class="cpm-opl-schedule__eyebrow">Cocon Academy</p>
					<h2 class="cpm-opl-schedule__title">Komende startdata</h2>
					<p class="cpm-opl-schedule__lead">Kies je opleiding en schrijf je direct in. Alle bedragen zijn incl. 21% btw.</p>
				</header>

				<?php foreach ( $by_template as $template => $items ) : ?>
					<?php
					$label = self::template_label( $template );
					$price = self::template_price_label( $template );
					?>
					<div class="cpm-opl-schedule__group">
						<div class="cpm-opl-schedule__group-head">
							<h3 class="cpm-opl-schedule__group-title"><?php echo esc_html( $label ); ?></h3>
							<?php if ( $price ) : ?>
								<p class="cpm-opl-schedule__group-price"><?php echo esc_html( $price ); ?></p>
							<?php endif; ?>
						</div>
						<ul class="cpm-opl-schedule__list">
							<?php foreach ( $items as $item ) : ?>
								<li class="cpm-opl-schedule__card<?php echo $item['image_url'] ? ' has-image' : ''; ?>">
									<?php if ( $item['image_url'] ) : ?>
										<div class="cpm-opl-schedule__media">
											<img
												src="<?php echo esc_url( $item['image_url'] ); ?>"
												alt="<?php echo esc_attr( $item['title'] ); ?>"
												width="96"
												height="96"
												loading="lazy"
												decoding="async"
											/>
										</div>
									<?php endif; ?>
									<div class="cpm-opl-schedule__card-main">
										<time class="cpm-opl-schedule__date" datetime="<?php echo esc_attr( $item['start_iso'] ); ?>">
											<?php echo esc_html( $item['start_label'] ); ?>
										</time>
										<p class="cpm-opl-schedule__name"><?php echo esc_html( $item['title'] ); ?></p>
									</div>
									<?php if ( $item['url'] ) : ?>
										<a class="cpm-opl-schedule__btn" href="<?php echo esc_url( $item['url'] ); ?>">
											Inschrijven
										</a>
									<?php endif; ?>
								</li>
							<?php endforeach; ?>
						</ul>
					</div>
				<?php endforeach; ?>
			</section>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	private static function inline_schedule_style_tag(): string {
		if ( self::$inline_style_printed ) {
			return '';
		}
		$file = CPM_OPL_PATH . 'assets/checkout.css';
		if ( ! is_readable( $file ) ) {
			return '';
		}
		$css = (string) file_get_contents( $file );
		if ( ! preg_match( '/\/\*\s*cpm-schedule-critical:start\s*\*\/(.*?)\/\*\s*cpm-schedule-critical:end\s*\*\//s', $css, $m ) ) {
			return '';
		}
		self::$inline_style_printed = true;
		return '<style id="cpm-opl-schedule-critical">' . trim( $m[1] ) . '</style>';
	}

	private static function enqueue_styles(): void {
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

	private static function template_price_label( string $template ): string {
		$def = Pricing::defaults_for_template( $template );
		if ( ! $def ) {
			return '';
		}
		$total = (int) ( $def['total_price_cents'] ?? 0 );
		if ( $total <= 0 ) {
			return '';
		}
		return 'Investering ' . Pricing::format_eur( $total ) . ' incl. btw';
	}

	/**
	 * @return list<array{template:string,title:string,start_label:string,start_iso:string,url:string,image_url:string}>
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
			$start = (string) ( $cohort['start_date'] ?? '' );
			$template = (string) ( $cohort['template'] ?? '' );
			$rows[] = [
				'template'     => $template,
				'title'        => (string) ( $cohort['title'] ?? get_the_title( $id ) ),
				'start_label'  => self::dutch_date( $start ),
				'start_iso'    => $start,
				'url'          => $page_id ? (string) get_permalink( $page_id ) : '',
				'image_url'    => self::resolve_schedule_image( $cohort, $template ),
			];
		}
		return $rows;
	}

	private static function resolve_schedule_image( array $cohort, string $template ): string {
		$url = (string) ( $cohort['hero_image_url'] ?? '' );
		if ( $url !== '' ) {
			return $url;
		}
		return self::template_image_url( $template );
	}

	private static function template_image_url( string $template ): string {
		static $cache = [];

		if ( isset( $cache[ $template ] ) ) {
			return $cache[ $template ];
		}

		$page_ids = (array) apply_filters(
			'cpm_opl_schedule_template_page_ids',
			[
				'masterclass-3d-nano-brows' => 6834,
				'pmu-opleiding-wenkbrauwen'   => 2901,
			]
		);

		$url = '';
		$page_id = (int) ( $page_ids[ $template ] ?? 0 );
		if ( $page_id ) {
			$thumb = get_the_post_thumbnail_url( $page_id, 'medium' );
			$url   = $thumb ? (string) $thumb : '';
		}

		if ( $url === '' ) {
			$fallbacks = (array) apply_filters(
				'cpm_opl_schedule_template_images',
				[
					'masterclass-3d-nano-brows' => content_url( 'uploads/2023/06/IMG_5692.jpeg' ),
					'pmu-opleiding-wenkbrauwen'   => content_url( 'uploads/2024/11/PC106302-bewerkt.jpg' ),
				]
			);
			$url = (string) ( $fallbacks[ $template ] ?? '' );
		}

		$cache[ $template ] = $url;

		return $cache[ $template ];
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
