<?php
/**
 * Related Products - Grid Layout
 *
 * @package Divi
 * @subpackage WooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( $related_products ) : ?>

	<section class="cocon-related-products related products wc-mt-5">
		<h2 class="cocon-related-title" style="font-size: 1.75rem; margin-bottom: 1.5rem;"><?php esc_html_e( 'Related Products', 'woocommerce' ); ?></h2>

		<ul class="cocon-products-grid products columns-4">
			<?php foreach ( $related_products as $related_product ) : ?>
				<?php
				$post_object = get_post( $related_product->get_id() );

				setup_postdata( $GLOBALS['post'] =& $post_object );

				// Use the reusable product card component
				wc_get_template_part( 'content', 'product' );
				?>
			<?php endforeach; ?>
		</ul>
	</section>

<?php
endif;

wp_reset_postdata();

