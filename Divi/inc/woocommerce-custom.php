<?php
/**
 * Custom WooCommerce Functions
 * 
 * Add custom WooCommerce functionality and shortcodes
 * 
 * @package Divi
 * @subpackage WooCommerce
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Featured Products Shortcode
 * 
 * Usage: [featured_products limit="8" columns="4"]
 */
function cocon_featured_products_shortcode( $atts ) {
	// Check if WooCommerce is active
	if ( ! class_exists( 'WooCommerce' ) ) {
		return '';
	}

	$atts = shortcode_atts( array(
		'limit'      => 8,
		'columns'    => 4,
		'orderby'    => 'rand',
		'order'      => 'desc',
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
		<div class="woocommerce">
			<ul class="products columns-<?php echo esc_attr( $atts['columns'] ); ?>">
				<?php
				while ( $products->have_posts() ) :
					$products->the_post();
					wc_get_template_part( 'content', 'product' );
				endwhile;
				?>
			</ul>
		</div>
		<?php
		wp_reset_postdata();
	else :
		echo '<p>' . esc_html__( 'No featured products found.', 'Divi' ) . '</p>';
	endif;

	return ob_get_clean();
}
add_shortcode( 'featured_products', 'cocon_featured_products_shortcode' );

/**
 * Recent Products Shortcode
 * 
 * Usage: [recent_products limit="8" columns="4"]
 */
function cocon_recent_products_shortcode( $atts ) {
	// Check if WooCommerce is active
	if ( ! class_exists( 'WooCommerce' ) ) {
		return '';
	}

	$atts = shortcode_atts( array(
		'limit'   => 8,
		'columns' => 4,
		'orderby' => 'date',
		'order'   => 'desc',
	), $atts, 'recent_products' );

	$query_args = array(
		'post_type'           => 'product',
		'post_status'         => 'publish',
		'ignore_sticky_posts' => 1,
		'posts_per_page'      => $atts['limit'],
		'orderby'             => $atts['orderby'],
		'order'               => $atts['order'],
	);

	$products = new WP_Query( $query_args );

	ob_start();

	if ( $products->have_posts() ) :
		?>
		<div class="woocommerce">
			<ul class="products columns-<?php echo esc_attr( $atts['columns'] ); ?>">
				<?php
				while ( $products->have_posts() ) :
					$products->the_post();
					wc_get_template_part( 'content', 'product' );
				endwhile;
				?>
			</ul>
		</div>
		<?php
		wp_reset_postdata();
	else :
		echo '<p>' . esc_html__( 'No products found.', 'Divi' ) . '</p>';
	endif;

	return ob_get_clean();
}
add_shortcode( 'recent_products', 'cocon_recent_products_shortcode' );

/**
 * Product Category Shortcode
 * 
 * Usage: [product_category category="slug" limit="8" columns="4"]
 */
function cocon_product_category_shortcode( $atts ) {
	// Check if WooCommerce is active
	if ( ! class_exists( 'WooCommerce' ) ) {
		return '';
	}

	$atts = shortcode_atts( array(
		'category' => '',
		'limit'    => 8,
		'columns'  => 4,
		'orderby'  => 'date',
		'order'    => 'desc',
	), $atts, 'product_category' );

	if ( empty( $atts['category'] ) ) {
		return '<p>' . esc_html__( 'Please specify a product category.', 'Divi' ) . '</p>';
	}

	$query_args = array(
		'post_type'           => 'product',
		'post_status'         => 'publish',
		'ignore_sticky_posts' => 1,
		'posts_per_page'      => $atts['limit'],
		'orderby'             => $atts['orderby'],
		'order'               => $atts['order'],
		'tax_query'           => array(
			array(
				'taxonomy' => 'product_cat',
				'field'    => 'slug',
				'terms'    => $atts['category'],
			),
		),
	);

	$products = new WP_Query( $query_args );

	ob_start();

	if ( $products->have_posts() ) :
		?>
		<div class="woocommerce">
			<ul class="products columns-<?php echo esc_attr( $atts['columns'] ); ?>">
				<?php
				while ( $products->have_posts() ) :
					$products->the_post();
					wc_get_template_part( 'content', 'product' );
				endwhile;
				?>
			</ul>
		</div>
		<?php
		wp_reset_postdata();
	else :
		echo '<p>' . esc_html__( 'No products found in this category.', 'Divi' ) . '</p>';
	endif;

	return ob_get_clean();
}
add_shortcode( 'product_category', 'cocon_product_category_shortcode' );

/**
 * Add WooCommerce support to theme
 * Note: Removed gallery features as we use custom gallery
 */
function cocon_woocommerce_support() {
	add_theme_support( 'woocommerce' );
	// Removed default gallery features - using custom gallery
	// add_theme_support( 'wc-product-gallery-zoom' );
	// add_theme_support( 'wc-product-gallery-lightbox' );
	// add_theme_support( 'wc-product-gallery-slider' );
}
add_action( 'after_setup_theme', 'cocon_woocommerce_support' );

/**
 * Replace default WooCommerce product images with custom gallery
 */
function cocon_custom_product_gallery() {
	// Remove default WooCommerce product images and sale flash
	remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_sale_flash', 10 );
	remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20 );
	
	// Add custom gallery
	add_action( 'woocommerce_before_single_product_summary', 'cocon_show_custom_product_gallery', 20 );
}
add_action( 'wp', 'cocon_custom_product_gallery' );

/**
 * Display custom product gallery
 */
function cocon_show_custom_product_gallery() {
	// Try to load from theme directory first
	$template = locate_template( 'woocommerce/single-product/product-image.php' );
	
	if ( $template ) {
		load_template( $template, false );
	} else {
		// Fallback to direct include
		$file_path = get_template_directory() . '/woocommerce/single-product/product-image.php';
		if ( file_exists( $file_path ) ) {
			include( $file_path );
		}
	}
}

/**
 * Customize WooCommerce product columns
 */
function cocon_woocommerce_loop_columns() {
	return 4; // 4 products per row
}
add_filter( 'loop_shop_columns', 'cocon_woocommerce_loop_columns' );

/**
 * Customize number of products per page
 */
function cocon_woocommerce_products_per_page() {
	return 12;
}
add_filter( 'loop_shop_per_page', 'cocon_woocommerce_products_per_page', 20 );

/**
 * Enqueue custom WooCommerce styles (No Bootstrap dependency)
 * ONLY on WooCommerce pages - not on home page!
 */
function cocon_enqueue_woocommerce_styles() {
	// DEBUG: Log what page we're on
	error_log('=== WooCommerce Styles Check ===');
	error_log('Current URL: ' . $_SERVER['REQUEST_URI']);
	error_log('is_woocommerce(): ' . (is_woocommerce() ? 'YES' : 'NO'));
	error_log('is_cart(): ' . (is_cart() ? 'YES' : 'NO'));
	error_log('is_checkout(): ' . (is_checkout() ? 'YES' : 'NO'));
	error_log('is_account_page(): ' . (is_account_page() ? 'YES' : 'NO'));
	error_log('is_front_page(): ' . (is_front_page() ? 'YES' : 'NO'));
	error_log('is_home(): ' . (is_home() ? 'YES' : 'NO'));
	
	// CRITICAL: Only load on WooCommerce pages
	if ( ! is_woocommerce() && ! is_cart() && ! is_checkout() && ! is_account_page() ) {
		error_log('✅ SKIPPING WooCommerce CSS - Not a WooCommerce page');
		return;
	}
	
	error_log('⚠️ LOADING WooCommerce CSS');
	error_log('is_cart() check: ' . (is_cart() ? 'YES - SHOULD LOAD CART CSS' : 'NO - Cart CSS skipped'));
	
	// ALWAYS add debug to footer - even if not cart page - to verify file is loaded
	add_action( 'wp_footer', function() {
		$is_cart = is_cart();
		?>
		<script>
			console.log('%c🔍 COCONPM DEBUG - woocommerce-custom.php loaded', 'background: #2196F3; color: white; padding: 6px 12px; border-radius: 3px;');
			console.log('is_cart():', <?php echo $is_cart ? 'true' : 'false'; ?>);
			console.log('Current URL:', window.location.href);
		</script>
		<?php
	}, 998 );
	
	$theme_version = et_get_theme_version();
	
	// Enqueue Shared Button CSS on ALL WooCommerce pages
	// This ensures consistent button styling across shop, product, cart, checkout
	$button_css_url = get_template_directory_uri() . '/css/coconpm-buttons.css';
	$button_css_path = get_template_directory() . '/css/coconpm-buttons.css';
	
	error_log('🎨 LOADING UNIFIED BUTTON CSS - coconpm-buttons.css');
	error_log('CSS URL: ' . $button_css_url);
	error_log('CSS File exists: ' . (file_exists($button_css_path) ? 'YES' : 'NO - FILE MISSING!'));
	
	wp_enqueue_style(
		'coconpm-buttons',
		$button_css_url,
		array( 'woocommerce-general' ), // Load AFTER WooCommerce CSS
		$theme_version . '-' . time() // Cache buster for development
	);
	
	error_log('✅ wp_enqueue_style() called for coconpm-buttons (unified button system)');
	
	// Add console log in footer to confirm CSS loaded
	add_action( 'wp_footer', function() use ( $button_css_url, $theme_version, $button_css_path ) {
		?>
		<script>
			console.log('%c🎨 COCONPM UNIFIED BUTTONS CSS LOADED!', 'background: #9C27B0; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
			console.log('📁 CSS File:', '<?php echo esc_js($button_css_url); ?>');
			console.log('🔢 Version:', '<?php echo esc_js($theme_version . '-' . time()); ?>');
			console.log('📋 File exists:', '<?php echo file_exists($button_css_path) ? "YES ✅" : "NO ❌"; ?>');
			console.log('🎯 Applies to: All WooCommerce pages (Shop, Product, Cart, Checkout)');
			console.log('🎨 Classes: .coconpm-btn, .coconpm-btn-primary, .coconpm-btn-secondary');
		</script>
		<?php
	}, 997 );
	
	// Enqueue Custom Shop CSS on shop/archive pages
	if ( is_shop() || is_product_category() || is_product_tag() || is_product_taxonomy() ) {
		$shop_css_url = get_template_directory_uri() . '/css/coconpm-shop.css';
		$shop_css_path = get_template_directory() . '/css/coconpm-shop.css';
		
		error_log('🏪 SHOP PAGE DETECTED - Loading coconpm-shop.css');
		error_log('CSS URL: ' . $shop_css_url);
		error_log('CSS File exists: ' . (file_exists($shop_css_path) ? 'YES' : 'NO - FILE MISSING!'));
		
		wp_enqueue_style(
			'coconpm-shop',
			$shop_css_url,
			array( 'woocommerce-general', 'woocommerce-layout' ), // Load AFTER WooCommerce CSS
			$theme_version . '-' . time() // Cache buster for development
		);
		
		error_log('✅ wp_enqueue_style() called for coconpm-shop');
		
		// Add console log in footer to confirm CSS loaded
		add_action( 'wp_footer', function() use ( $shop_css_url, $theme_version, $shop_css_path ) {
			?>
			<script>
				console.log('%c✅ COCONPM SHOP CSS LOADED!', 'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
				console.log('📁 CSS File:', '<?php echo esc_js($shop_css_url); ?>');
				console.log('🔢 Version:', '<?php echo esc_js($theme_version . '-' . time()); ?>');
				console.log('📋 File exists:', '<?php echo file_exists($shop_css_path) ? "YES ✅" : "NO ❌"; ?>');
				console.log('🎨 CSS should be loaded as stylesheet');
			</script>
			<?php
		}, 999 );
	}
	
	// Enqueue Custom Product CSS on product pages
	if ( is_product() ) {
		$product_css_url = get_template_directory_uri() . '/css/coconpm-product.css';
		$product_css_path = get_template_directory() . '/css/coconpm-product.css';
		
		error_log('📦 PRODUCT PAGE DETECTED - Loading coconpm-product.css');
		error_log('CSS URL: ' . $product_css_url);
		error_log('CSS File exists: ' . (file_exists($product_css_path) ? 'YES' : 'NO - FILE MISSING!'));
		
		wp_enqueue_style(
			'coconpm-product',
			$product_css_url,
			array( 'woocommerce-general', 'woocommerce-layout' ), // Load AFTER WooCommerce CSS
			$theme_version . '-' . time() // Cache buster for development
		);
		
		error_log('✅ wp_enqueue_style() called for coconpm-product');
		
		// Add console log in footer to confirm CSS loaded
		add_action( 'wp_footer', function() use ( $product_css_url, $theme_version, $product_css_path ) {
			?>
			<script>
				console.log('%c✅ COCONPM PRODUCT CSS LOADED!', 'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
				console.log('📁 CSS File:', '<?php echo esc_js($product_css_url); ?>');
				console.log('🔢 Version:', '<?php echo esc_js($theme_version . '-' . time()); ?>');
				console.log('📋 File exists:', '<?php echo file_exists($product_css_path) ? "YES ✅" : "NO ❌"; ?>');
				console.log('🎨 CSS should be loaded as stylesheet');
			</script>
			<?php
		}, 999 );
	}
	
	// Enqueue Custom Cart CSS on cart page
	if ( is_cart() ) {
		$cart_css_url = get_template_directory_uri() . '/css/coconpm-cart.css';
		$cart_css_path = get_template_directory() . '/css/coconpm-cart.css';
		
		error_log('🛒 CART PAGE DETECTED - Loading coconpm-cart.css');
		error_log('CSS URL: ' . $cart_css_url);
		error_log('CSS File exists: ' . (file_exists($cart_css_path) ? 'YES' : 'NO - FILE MISSING!'));
		
		wp_enqueue_style(
			'coconpm-cart',
			$cart_css_url,
			array( 'woocommerce-general', 'woocommerce-layout' ), // Load AFTER WooCommerce CSS
			$theme_version . '-' . time() // Cache buster for development
		);
		
		error_log('✅ wp_enqueue_style() called for coconpm-cart');
		
		// Add console log in footer to confirm CSS loaded
		add_action( 'wp_footer', function() use ( $cart_css_url, $theme_version, $cart_css_path ) {
			?>
			<script>
				console.log('%c✅ COCONPM CART CSS LOADED!', 'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
				console.log('📁 CSS File:', '<?php echo esc_js($cart_css_url); ?>');
				console.log('🔢 Version:', '<?php echo esc_js($theme_version . '-' . time()); ?>');
				console.log('📋 File exists:', '<?php echo file_exists($cart_css_path) ? "YES ✅" : "NO ❌"; ?>');
				console.log('🎨 CSS should be loaded as stylesheet #25 or higher');
			</script>
			<?php
		}, 999 );
	}
	
	// Enqueue custom WooCommerce CSS - Load AFTER Divi theme styles
	wp_enqueue_style( 
		'cocon-woocommerce-custom', 
		get_template_directory_uri() . '/css/woocommerce-custom.css', 
		array( 'divi-style' ), 
		$theme_version
	);
	
	// Add critical inline CSS to override Divi's dynamic button styles
	$inline_css = '
		/* CRITICAL OVERRIDE: Consistent CTA buttons with auto width based on text */
		body.woocommerce a.button,
		body.woocommerce a.button.alt,
		body.woocommerce-page a.button,
		body.woocommerce-page a.button.alt,
		body.woocommerce button.button,
		body.woocommerce button.button.alt,
		body.woocommerce button.button.alt.disabled,
		body.woocommerce-page button.button,
		body.woocommerce-page button.button.alt,
		body.woocommerce-page button.button.alt.disabled,
		body.woocommerce input.button,
		body.woocommerce input.button.alt,
		body.woocommerce-page input.button,
		body.woocommerce-page input.button.alt,
		body.woocommerce #respond input#submit.alt,
		body.woocommerce-page #respond input#submit.alt,
		body.woocommerce #content input.button.alt,
		body.woocommerce-page #content input.button.alt,
		body .woocommerce a.button,
		body .woocommerce-page a.button {
			background-color: transparent !important;
			background: transparent !important;
			background-image: none !important;
			border: 2px solid #C64193 !important;
			color: #C64193 !important;
			font-weight: 500 !important;
			padding: 12px 32px !important;
			min-height: 48px !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			display: inline-flex !important;
			align-items: center !important;
			justify-content: center !important;
			width: auto !important;
			min-width: auto !important;
			white-space: nowrap !important;
			font-size: 16px !important;
			line-height: 1.5 !important;
		}
		
		body.woocommerce a.button:hover,
		body.woocommerce a.button.alt:hover,
		body.woocommerce-page a.button:hover,
		body.woocommerce-page a.button.alt:hover,
		body.woocommerce button.button:hover,
		body.woocommerce button.button.alt:hover,
		body.woocommerce button.button.alt.disabled:hover,
		body.woocommerce-page button.button:hover,
		body.woocommerce-page button.button.alt:hover,
		body.woocommerce-page button.button.alt.disabled:hover,
		body.woocommerce input.button:hover,
		body.woocommerce input.button.alt:hover,
		body.woocommerce-page input.button:hover,
		body.woocommerce-page input.button.alt:hover,
		body.woocommerce #respond input#submit.alt:hover,
		body.woocommerce-page #respond input#submit.alt:hover,
		body.woocommerce #content input.button.alt:hover,
		body.woocommerce-page #content input.button.alt:hover,
		body .woocommerce a.button:hover,
		body .woocommerce-page a.button:hover {
			background-color: #C64193 !important;
			background: #C64193 !important;
			background-image: none !important;
			color: #ffffff !important;
			border-color: #C64193 !important;
			box-shadow: none !important;
			border-radius: 0 !important;
		}
		
		/* FUCHSIA PRICE COLOR - MAXIMUM OVERRIDE */
		.woocommerce div.product p.price,
		.woocommerce div.product span.price,
		.woocommerce div.product .price,
		.product-price-wrapper .price,
		.price-large,
		body .woocommerce div.product p.price,
		body .woocommerce div.product span.price,
		body .price ins,
		body .price ins .amount,
		body .woocommerce .price ins,
		body .woocommerce-page .price ins {
			color: #ff00ff !important;
		}
		
		/* QUANTITY INPUT - SAME STYLING AS ADD TO CART BUTTON */
		.woocommerce div.product form.cart .quantity input[type="number"],
		body .woocommerce div.product form.cart .quantity input.qty {
			border: 2px solid #C64193 !important;
			padding: 12px 32px !important;
			width: auto !important;
			height: 48px !important;
			min-height: 48px !important;
			background: transparent !important;
			background-color: transparent !important;
			background-image: none !important;
			border-radius: 0 !important;
			text-align: center !important;
			color: #C64193 !important;
			font-weight: 500 !important;
			font-size: 16px !important;
			line-height: 1.5 !important;
			font-family: inherit !important;
			letter-spacing: normal !important;
			text-transform: none !important;
			display: inline-flex !important;
			align-items: center !important;
			justify-content: center !important;
			box-shadow: none !important;
		}
		
		.woocommerce div.product form.cart .quantity input[type="number"]:hover,
		body .woocommerce div.product form.cart .quantity input.qty:hover {
			background-color: #C64193 !important;
			background: #C64193 !important;
			color: #ffffff !important;
			border-color: #C64193 !important;
		}
	';
	wp_add_inline_style( 'cocon-woocommerce-custom', $inline_css );
}
add_action( 'wp_enqueue_scripts', 'cocon_enqueue_woocommerce_styles', 999 ); // High priority to load after Divi

/**
 * Force button styles in head - LAST override
 * This runs at the very end of wp_head to ensure it overrides everything
 * ONLY on WooCommerce pages - not on home page!
 */
function cocon_force_button_styles() {
	// DEBUG
	error_log('=== Inline Button Styles Check ===');
	error_log('is_woocommerce(): ' . (is_woocommerce() ? 'YES' : 'NO'));
	
	// CRITICAL: Only load on WooCommerce pages
	if ( ! is_woocommerce() && ! is_cart() && ! is_checkout() && ! is_account_page() ) {
		error_log('✅ SKIPPING Inline Button Styles');
		return;
	}
	
	error_log('⚠️ LOADING Inline Button Styles (187 lines)');
	?>
	<style id="cocon-button-override">
		/* REMOVE ALL BUTTON PSEUDO ELEMENTS */
		.single_add_to_cart_button::after,
		.single_add_to_cart_button::before,
		.button::after,
		.button::before,
		body.woocommerce a.button::after,
		body.woocommerce a.button::before,
		body.woocommerce button.button::after,
		body.woocommerce button.button::before,
		body.woocommerce input.button::after,
		body.woocommerce input.button::before {
			display: none !important;
			content: none !important;
			visibility: hidden !important;
		}
		
		/* ABSOLUTE FINAL OVERRIDE - Consistent CTA buttons with auto width */
		body.woocommerce a.button,
		body.woocommerce a.button.alt,
		body.woocommerce-page a.button,
		body.woocommerce-page a.button.alt,
		body.woocommerce button.button,
		body.woocommerce button.button.alt,
		body.woocommerce button.button.alt.disabled,
		body.woocommerce-page button.button,
		body.woocommerce-page button.button.alt,
		body.woocommerce-page button.button.alt.disabled,
		body.woocommerce input.button,
		body.woocommerce input.button.alt,
		body.woocommerce-page input.button,
		body.woocommerce-page input.button.alt,
		body.woocommerce #respond input#submit.alt,
		body.woocommerce-page #respond input#submit.alt,
		body.woocommerce #content input.button.alt,
		body.woocommerce-page #content input.button.alt,
		body .woocommerce a.button,
		body .woocommerce-page a.button,
		.single_add_to_cart_button.button {
			background-color: transparent !important;
			background: transparent !important;
			background-image: none !important;
			border: 2px solid #C64193 !important;
			color: #C64193 !important;
			font-weight: 500 !important;
			padding: 12px 32px !important;
			min-height: 48px !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			display: inline-flex !important;
			align-items: center !important;
			justify-content: center !important;
			width: auto !important;
			min-width: auto !important;
			white-space: nowrap !important;
			font-size: 16px !important;
			line-height: 1.5 !important;
		}
		
		body.woocommerce a.button:hover,
		body.woocommerce a.button.alt:hover,
		body.woocommerce-page a.button:hover,
		body.woocommerce-page a.button.alt:hover,
		body.woocommerce button.button:hover,
		body.woocommerce button.button.alt:hover,
		body.woocommerce button.button.alt.disabled:hover,
		body.woocommerce-page button.button:hover,
		body.woocommerce-page button.button.alt:hover,
		body.woocommerce-page button.button.alt.disabled:hover,
		body.woocommerce input.button:hover,
		body.woocommerce input.button.alt:hover,
		body.woocommerce-page input.button:hover,
		body.woocommerce-page input.button.alt:hover,
		body.woocommerce #respond input#submit.alt:hover,
		body.woocommerce-page #respond input#submit.alt:hover,
		body.woocommerce #content input.button.alt:hover,
		body.woocommerce-page #content input.button.alt:hover,
		body .woocommerce a.button:hover,
		body .woocommerce-page a.button:hover,
		.single_add_to_cart_button.button:hover {
			background-color: #C64193 !important;
			background: #C64193 !important;
			background-image: none !important;
			color: #ffffff !important;
			border-color: #C64193 !important;
			box-shadow: none !important;
			border-radius: 0 !important;
		}
		
		/* FUCHSIA PRICE - FINAL OVERRIDE */
		.woocommerce div.product p.price,
		.woocommerce div.product span.price,
		.woocommerce div.product .price,
		.product-price-wrapper .price,
		.price-large,
		body .woocommerce div.product p.price,
		body .woocommerce div.product span.price,
		body .woocommerce div.product .price ins,
		body .woocommerce div.product .price ins .amount,
		.woocommerce div.product p.price ins,
		.woocommerce div.product span.price ins {
			color: #ff00ff !important;
		}
		
		/* QUANTITY INPUT - FINAL OVERRIDE - SAME AS BUTTON */
		.woocommerce div.product form.cart .quantity input[type="number"],
		.woocommerce div.product form.cart .quantity input.qty,
		body .woocommerce div.product form.cart .quantity input[type="number"],
		body .woocommerce div.product form.cart .quantity input.qty,
		input.qty,
		.input-text.qty {
			border: 2px solid #C64193 !important;
			padding: 12px 32px !important;
			width: auto !important;
			height: 48px !important;
			min-height: 48px !important;
			background: transparent !important;
			background-color: transparent !important;
			background-image: none !important;
			border-radius: 0 !important;
			text-align: center !important;
			color: #C64193 !important;
			font-weight: 500 !important;
			font-size: 16px !important;
			line-height: 1.5 !important;
			font-family: inherit !important;
			letter-spacing: normal !important;
			text-transform: none !important;
			display: inline-flex !important;
			align-items: center !important;
			justify-content: center !important;
			box-shadow: none !important;
			white-space: nowrap !important;
		}
		
		.woocommerce div.product form.cart .quantity input[type="number"]:hover,
		.woocommerce div.product form.cart .quantity input.qty:hover,
		body .woocommerce div.product form.cart .quantity input[type="number"]:hover,
		body .woocommerce div.product form.cart .quantity input.qty:hover,
		input.qty:hover,
		.input-text.qty:hover {
			background-color: #C64193 !important;
			background: #C64193 !important;
			color: #ffffff !important;
			border-color: #C64193 !important;
		}
		
		/* GALLERY OVERRIDE - Hide default WooCommerce gallery */
		.woocommerce-product-gallery {
			display: none !important;
		}
		
		/* NOTICE BUTTONS - View Cart, etc. */
		.woocommerce-message a.button,
		.woocommerce-message a.button.wc-forward,
		.woocommerce-message .button,
		.woocommerce-message .wc-forward,
		.woocommerce-info a.button,
		.woocommerce-error a.button,
		body .woocommerce-message a.button,
		body .woocommerce-message .wc-forward {
			background-color: transparent !important;
			background: transparent !important;
			background-image: none !important;
			border: 2px solid #C64193 !important;
			color: #C64193 !important;
			font-weight: 500 !important;
			padding: 12px 32px !important;
			min-height: 48px !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			width: auto !important;
			min-width: auto !important;
			font-size: 16px !important;
			line-height: 1.5 !important;
		}
		
		.woocommerce-message a.button:hover,
		.woocommerce-message .wc-forward:hover,
		body .woocommerce-message a.button:hover {
			background-color: #C64193 !important;
			background: #C64193 !important;
			color: #ffffff !important;
		}
	</style>
	<?php
}
add_action( 'wp_head', 'cocon_force_button_styles', 9999 );

/**
 * Remove sidebar from all WooCommerce pages
 */
function cocon_remove_woocommerce_sidebar() {
	if ( is_woocommerce() ) {
		remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
	}
}
add_action( 'wp', 'cocon_remove_woocommerce_sidebar' );

/**
 * Force full width layout for shop pages - Remove sidebar completely
 */
function cocon_shop_fullwidth_layout( $classes ) {
	if ( is_shop() || is_product_category() || is_product_tag() || is_product_taxonomy() ) {
		// Remove any sidebar classes
		$classes = array_diff( $classes, array( 'et_right_sidebar', 'et_left_sidebar' ) );
		// Add full width class
		$classes[] = 'et_full_width_page';
	}
	return $classes;
}
add_filter( 'body_class', 'cocon_shop_fullwidth_layout', 99 );

/**
 * Wrap variable product quantity and add to cart button in flex container
 */
function cocon_variable_add_to_cart_wrapper_start() {
	echo '<div class="wc-add-to-cart-wrapper">';
}
add_action( 'woocommerce_before_add_to_cart_quantity', 'cocon_variable_add_to_cart_wrapper_start', 5 );

function cocon_variable_add_to_cart_wrapper_end() {
	echo '</div>';
}
add_action( 'woocommerce_after_add_to_cart_button', 'cocon_variable_add_to_cart_wrapper_end', 15 );

/**
 * Customize "Added to cart" message
 * Make it more subtle and elegant
 * 
 * To customize the message, edit the text in the sprintf() function below
 */
function cocon_custom_add_to_cart_message( $message, $product_id = null, $show_qty = false ) {
	if ( ! $product_id ) {
		return $message;
	}
	
	$product = wc_get_product( $product_id );
	
	if ( ! $product ) {
		return $message;
	}
	
	$product_name = $product->get_name();
	
	// Customize the message text here
	$custom_message = sprintf(
		'<div class="cocon-cart-notice-content">%s toegevoegd aan je winkelwagen</div>',
		'<strong>' . esc_html( $product_name ) . '</strong>'
	);
	
	return $custom_message;
}
add_filter( 'wc_add_to_cart_message_html', 'cocon_custom_add_to_cart_message', 10, 2 );

/**
 * Customize "View cart" button in add to cart notice
 */
function cocon_custom_cart_notice_button_text( $text ) {
	return 'Bekijk winkelwagen';
}
add_filter( 'woocommerce_product_add_to_cart_text', 'cocon_custom_cart_notice_button_text', 10, 1 );

/**
 * Add custom quantity buttons (+/-) to product page
 * ONLY on product pages - not on home page!
 */
function cocon_add_quantity_buttons() {
	// CRITICAL: Only load on product pages
	if ( ! is_product() ) {
		return;
	}
	?>
	<script type="text/javascript">
	jQuery(document).ready(function($) {
		// Add minus and plus buttons to quantity inputs
		$('form.cart .quantity').each(function() {
			var $quantity = $(this);
			var $input = $quantity.find('input.qty');
			
			// Only add buttons if they don't exist yet
			if ($quantity.find('.minus').length === 0) {
				// Add minus button before input
				$input.before('<button type="button" class="minus">−</button>');
				
				// Add plus button after input
				$input.after('<button type="button" class="plus">+</button>');
			}
		});
		
		// Handle minus button click
		$(document).on('click', '.quantity .minus', function(e) {
			e.preventDefault();
			var $input = $(this).siblings('input.qty');
			var currentVal = parseInt($input.val());
			var minVal = parseInt($input.attr('min')) || 1;
			
			if (currentVal > minVal) {
				$input.val(currentVal - 1).trigger('change');
			}
		});
		
		// Handle plus button click
		$(document).on('click', '.quantity .plus', function(e) {
			e.preventDefault();
			var $input = $(this).siblings('input.qty');
			var currentVal = parseInt($input.val());
			var maxVal = parseInt($input.attr('max'));
			
			if (!maxVal || currentVal < maxVal) {
				$input.val(currentVal + 1).trigger('change');
			}
		});
		
		// Re-add buttons when AJAX cart updates (for variable products)
		$(document.body).on('updated_cart_totals updated_checkout', function() {
			$('form.cart .quantity').each(function() {
				var $quantity = $(this);
				var $input = $quantity.find('input.qty');
				
				if ($quantity.find('.minus').length === 0) {
					$input.before('<button type="button" class="minus">−</button>');
					$input.after('<button type="button" class="plus">+</button>');
				}
			});
		});
		
		// Re-add buttons when variation is selected
		$(document).on('found_variation', function() {
			setTimeout(function() {
				$('form.cart .quantity').each(function() {
					var $quantity = $(this);
					var $input = $quantity.find('input.qty');
					
					if ($quantity.find('.minus').length === 0) {
						$input.before('<button type="button" class="minus">−</button>');
						$input.after('<button type="button" class="plus">+</button>');
					}
				});
			}, 100);
		});
	});
	</script>
	<?php
}
add_action( 'wp_footer', 'cocon_add_quantity_buttons' );

/**
 * Add custom quantity buttons to cart page as well
 * ONLY on cart page - not on home page!
 */
function cocon_cart_quantity_buttons() {
	// Already checking is_cart() - this is correct!
	if ( is_cart() ) {
		?>
		<script type="text/javascript">
		jQuery(document).ready(function($) {
			// Add buttons to cart page quantity inputs
			$('td.product-quantity .quantity').each(function() {
				var $quantity = $(this);
				var $input = $quantity.find('input.qty');
				
				if ($quantity.find('.minus').length === 0) {
					$input.before('<button type="button" class="minus">−</button>');
					$input.after('<button type="button" class="plus">+</button>');
				}
			});
			
			// Re-add after cart updates
			$(document.body).on('updated_cart_totals', function() {
				$('td.product-quantity .quantity').each(function() {
					var $quantity = $(this);
					var $input = $quantity.find('input.qty');
					
					if ($quantity.find('.minus').length === 0) {
						$input.before('<button type="button" class="minus">−</button>');
						$input.after('<button type="button" class="plus">+</button>');
					}
				});
			});
		});
		</script>
		<?php
	}
}
add_action( 'wp_footer', 'cocon_cart_quantity_buttons' );

