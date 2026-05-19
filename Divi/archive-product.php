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

		<!-- Category Filter Section -->
		<?php
		$product_categories = get_terms( array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'exclude'    => array( get_option( 'default_product_cat' ) ), // Exclude uncategorized
		) );

		if ( ! empty( $product_categories ) && ! is_wp_error( $product_categories ) ) :
		?>
			<div class="coconpm-category-filters">
				<h3 class="coconpm-filter-title">Categorieën</h3>
				<div class="coconpm-filter-buttons">
					<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>" 
					   class="coconpm-filter-btn <?php echo ( is_shop() && ! is_product_category() ) ? 'active' : ''; ?>">
						Alle producten
					</a>
					<?php foreach ( $product_categories as $category ) : ?>
						<a href="<?php echo esc_url( get_term_link( $category ) ); ?>" 
						   class="coconpm-filter-btn <?php echo ( is_product_category( $category->slug ) ) ? 'active' : ''; ?>">
							<?php echo esc_html( $category->name ); ?>
						</a>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>

		<!-- Shipping & Return Policy Info -->
		<div class="coconpm-info-boxes">
			<div class="coconpm-info-box coconpm-shipping-info">
				<div class="coconpm-info-content">
					<strong>Verzending</strong><br>
					Potloden: brievenbus<br>
					Naalden: pakket<br>
					<span class="coconpm-highlight">Gratis verzending vanaf €75</span> • Internationaal verzenden beschikbaar
				</div>
			</div>
			
			<div class="coconpm-info-box coconpm-return-info">
				<div class="coconpm-info-content">
					<strong>Retourbeleid</strong><br>
					Make-up producten kunnen om hygiënische redenen <span class="coconpm-highlight">niet geretourneerd worden</span><br>
					Andere producten: 14 dagen retourrecht
				</div>
			</div>
		</div>

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
