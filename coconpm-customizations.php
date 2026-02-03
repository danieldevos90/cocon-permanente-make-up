
/**
 * ==============================================
 * COCONPM CUSTOMIZATIONS
 * Added to restore custom WooCommerce styling
 * ==============================================
 */

// Load custom WooCommerce functions after theme is set (avoids wrong path when this file is in mu-plugins)
add_action( 'after_setup_theme', function() {
	if ( file_exists( get_template_directory() . '/inc/woocommerce-custom.php' ) ) {
		require_once get_template_directory() . '/inc/woocommerce-custom.php';
	}
}, 1 );

/**
 * COCONPM Gold Navigation Colors Override
 */
function coconpm_force_gold_nav_colors() {
	?>
	<style id="coconpm-force-gold-override" type="text/css">
		/* Gold color for navigation links */
		#main-header .et-menu > li > a,
		#top-menu > li > a,
		.et_header_style_centered #top-menu > li > a,
		#et-top-navigation .et-menu > li > a,
		.et_nav_text_color_dark #top-menu > li > a,
		.et-menu li a,
		#main-header .et-cart-info {
			color: #BFA86C !important;
		}
		
		/* Hover state - slightly darker gold */
		#main-header .et-menu > li > a:hover,
		#top-menu > li > a:hover,
		.et_header_style_centered #top-menu > li > a:hover,
		#et-top-navigation .et-menu > li > a:hover,
		.et-menu li a:hover {
			color: #9d8556 !important;
			opacity: 1 !important;
		}
		
		/* Active/current page */
		#main-header .et-menu > li.current-menu-item > a,
		#main-header .et-menu > li.current_page_item > a,
		#top-menu > li.current-menu-item > a,
		#top-menu > li.current_page_item > a {
			color: #BFA86C !important;
		}
		
		/* Dropdown menu items */
		#main-header .et-menu li li a,
		#top-menu li li a,
		.nav li ul li a {
			color: #BFA86C !important;
		}
		
		#main-header .et-menu li li a:hover,
		#top-menu li li a:hover {
			color: #9d8556 !important;
			background-color: rgba(191, 168, 108, 0.1) !important;
		}
		
		/* Cart icon */
		#et-top-navigation .et-cart-info span::before,
		.et_cart_icon::before,
		#main-header .et-cart-info span::before {
			color: #BFA86C !important;
		}
	</style>
	<?php
}
add_action( 'wp_head', 'coconpm_force_gold_nav_colors', 9999 );

/**
 * COCONPM Featured Products Shortcode (inline version)
 */
if ( ! function_exists( 'coconpm_featured_products_shortcode' ) ) {
	function coconpm_featured_products_shortcode( $atts ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return '';
		}

		$atts = shortcode_atts( array(
			'limit'         => 8,
			'columns'       => 4,
			'orderby'       => 'rand',
			'order'         => 'desc',
			'title'         => '',
			'view_all'      => '',
			'view_all_text' => 'Bekijk alle producten',
		), $atts, 'featured_products' );

		$query_args = array(
			'post_type'           => 'product',
			'post_status'         => 'publish',
			'ignore_sticky_posts' => 1,
			'posts_per_page'      => $atts['limit'],
			'orderby'             => $atts['orderby'],
			'order'               => $atts['order'],
			'tax_query'           => array(
				'relation' => 'AND',
				array(
					'taxonomy' => 'product_visibility',
					'field'    => 'name',
					'terms'    => 'featured',
				),
			),
		);

		$products = new WP_Query( $query_args );

		ob_start();

		if ( $products->have_posts() ) :
			?>
			<section class="coconpm-featured-products">
				<div class="coconpm-featured-container">
					
					<?php if ( ! empty( $atts['title'] ) ) : ?>
						<div class="coconpm-featured-header">
							<h2 class="coconpm-featured-title"><?php echo esc_html( $atts['title'] ); ?></h2>
							<?php if ( ! empty( $atts['view_all'] ) ) : ?>
								<a href="<?php echo esc_url( $atts['view_all'] ); ?>" class="coconpm-featured-view-all">
									<?php echo esc_html( $atts['view_all_text'] ); ?>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</a>
							<?php endif; ?>
						</div>
					<?php endif; ?>
					
					<div class="coconpm-products-grid coconpm-featured-grid coconpm-columns-<?php echo esc_attr( $atts['columns'] ); ?>">
						<?php
						while ( $products->have_posts() ) :
							$products->the_post();
							wc_get_template_part( 'content', 'product' );
						endwhile;
						?>
					</div>
				</div>
			</section>
			<?php
			wp_reset_postdata();
		else :
			echo '<div class="coconpm-no-products"><p>' . esc_html__( 'No featured products found.', 'Divi' ) . '</p></div>';
		endif;

		return ob_get_clean();
	}
	add_shortcode( 'coconpm_featured', 'coconpm_featured_products_shortcode' );
	add_shortcode( 'featured_products', 'coconpm_featured_products_shortcode' );
}

/**
 * COCONPM Add inline CSS for shop styling
 */
function coconpm_inline_shop_styles() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	?>
	<style id="coconpm-shop-styles" type="text/css">
	/* COCONPM Shop Grid */
	.coconpm-products-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24px;
		margin-bottom: 48px;
	}
	
	.coconpm-product-card {
		background: #ffffff;
		border: 1px solid #f0f0f0;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.coconpm-product-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	
	.coconpm-card-image {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: #f5f5f5;
	}
	
	.coconpm-card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.coconpm-sale-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		background: #BFA86C;
		color: #ffffff;
		padding: 6px 10px;
		font-size: 12px;
		font-weight: 600;
	}
	
	.coconpm-card-body {
		padding: 20px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
	}
	
	.coconpm-card-category-small {
		font-size: 11px;
		color: #999999;
		text-transform: uppercase;
	}
	
	.coconpm-card-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}
	
	.coconpm-card-title a {
		color: #000000;
		text-decoration: none;
	}
	
	.coconpm-card-title a:hover {
		color: #C64193;
	}
	
	.coconpm-card-price {
		color: #C64193;
		font-weight: 600;
		font-size: 18px;
	}
	
	.coconpm-card-actions {
		margin-top: auto;
	}
	
	/* COCONPM Buttons */
	.coconpm-btn,
	.coconpm-btn-primary {
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		padding: 12px 32px !important;
		height: 48px !important;
		background: transparent !important;
		border: 2px solid #C64193 !important;
		color: #C64193 !important;
		font-size: 14px !important;
		font-weight: 500 !important;
		text-decoration: none !important;
		transition: all 0.3s ease !important;
		cursor: pointer !important;
		width: 100%;
	}
	
	.coconpm-btn:hover,
	.coconpm-btn-primary:hover {
		background: #C64193 !important;
		color: #ffffff !important;
	}
	
	/* Featured Products Section */
	.coconpm-featured-products {
		width: 100%;
		padding: 60px 0;
		background: #ffffff;
	}
	
	.coconpm-featured-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}
	
	.coconpm-featured-header {
		margin-bottom: 40px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.coconpm-featured-title {
		font-size: 36px;
		font-weight: 700;
		color: #000000;
		margin: 0;
	}
	
	.coconpm-featured-view-all {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: #BFA86C;
		font-size: 15px;
		text-decoration: none;
	}
	
	.coconpm-featured-view-all:hover {
		color: #9d8556;
	}
	
	/* Responsive */
	@media (max-width: 992px) {
		.coconpm-products-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	
	@media (max-width: 576px) {
		.coconpm-products-grid {
			grid-template-columns: 1fr;
		}
	}
	</style>
	<?php
}
add_action( 'wp_head', 'coconpm_inline_shop_styles', 100 );

/**
 * Add WooCommerce support
 */
function coconpm_woocommerce_support() {
	add_theme_support( 'woocommerce' );
}
add_action( 'after_setup_theme', 'coconpm_woocommerce_support' );

/**
 * Set 4 products per row
 */
add_filter( 'loop_shop_columns', function() { return 4; } );

/**
 * Set 12 products per page
 */
add_filter( 'loop_shop_per_page', function() { return 12; }, 20 );

// END COCONPM CUSTOMIZATIONS
