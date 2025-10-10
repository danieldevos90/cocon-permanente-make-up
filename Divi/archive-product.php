<?php
/**
 * WooCommerce Shop/Archive Page Template
 * Custom COCONPM Shop Page - 100% Custom Classes
 * 
 * @package Divi
 * @subpackage WooCommerce
 */

get_header();
?>

<div id="main-content">
	<div class="coconpm-shop-page">
		
		<!-- Page Title -->
		<?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : ?>
			<h1 class="coconpm-shop-title"><?php woocommerce_page_title(); ?></h1>
		<?php endif; ?>

		<!-- Category/Archive Description -->
		<?php
		/**
		 * woocommerce_archive_description hook.
		 */
		do_action( 'woocommerce_archive_description' );
		?>

		<?php if ( woocommerce_product_loop() ) : ?>

			<!-- Toolbar: Result Count + Sorting -->
			<div class="coconpm-shop-toolbar">
				<?php
				/**
				 * woocommerce_before_shop_loop hook.
				 * This outputs the result count and ordering dropdown
				 */
				do_action( 'woocommerce_before_shop_loop' );
				?>
			</div>

			<!-- Products Grid -->
			<div class="coconpm-products-grid">
				<?php
				if ( wc_get_loop_prop( 'total' ) ) {
					while ( have_posts() ) {
						the_post();
						
						/**
						 * Hook: woocommerce_shop_loop.
						 */
						do_action( 'woocommerce_shop_loop' );
						
						// Use custom product card template
						wc_get_template_part( 'content', 'product' );
					}
				}
				?>
			</div>

			<!-- Pagination -->
			<div class="coconpm-shop-pagination">
				<?php
				/**
				 * woocommerce_after_shop_loop hook.
				 * This outputs the pagination
				 */
				do_action( 'woocommerce_after_shop_loop' );
				?>
			</div>

		<?php else : ?>

			<!-- No Products Found -->
			<div class="coconpm-no-products">
				<?php
				/**
				 * woocommerce_no_products_found hook.
				 */
				do_action( 'woocommerce_no_products_found' );
				?>
			</div>

		<?php endif; ?>

	</div>
</div>

<?php get_footer(); ?>
