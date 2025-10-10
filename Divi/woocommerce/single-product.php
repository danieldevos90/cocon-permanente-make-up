<?php
/**
 * The Template for displaying single product pages
 * Custom COCONPM Product Page - 100% Custom Classes
 *
 * @package Divi
 * @subpackage WooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

get_header();

// Get the product object
global $product;

if ( ! $product ) {
	return;
}
?>

<div id="main-content">
	<div class="coconpm-product-page">
		
		<?php while ( have_posts() ) : the_post(); ?>
			
			<div class="coconpm-product-wrapper" itemscope itemtype="http://schema.org/Product">
				
				<!-- Breadcrumb -->
				<div class="coconpm-breadcrumb">
					<?php woocommerce_breadcrumb(); ?>
				</div>
				
				<!-- Main Product Grid -->
				<div class="coconpm-product-grid">
					
					<!-- Left Column: Product Images -->
					<div class="coconpm-product-left">
						<?php wc_get_template( 'single-product/product-image.php' ); ?>
					</div>
					
					<!-- Right Column: Product Info -->
					<div class="coconpm-product-right">
						
						<!-- Product Title -->
						<h1 class="coconpm-product-title" itemprop="name"><?php the_title(); ?></h1>
						
						<!-- Product Rating -->
						<?php if ( $product->get_average_rating() ) : ?>
							<div class="coconpm-product-rating">
								<?php woocommerce_template_single_rating(); ?>
							</div>
						<?php endif; ?>
						
						<!-- Product Price -->
						<div class="coconpm-product-price" itemprop="price">
							<?php echo $product->get_price_html(); ?>
						</div>
						
						<!-- Product Short Description -->
						<?php if ( $product->get_short_description() ) : ?>
							<div class="coconpm-product-excerpt" itemprop="description">
								<?php echo $product->get_short_description(); ?>
							</div>
						<?php endif; ?>
						
						<!-- Add to Cart Form -->
						<div class="coconpm-add-to-cart">
							<?php woocommerce_template_single_add_to_cart(); ?>
						</div>
						
						<!-- Product Meta (SKU, Categories, Tags) -->
						<div class="coconpm-product-meta">
							<?php woocommerce_template_single_meta(); ?>
						</div>
						
					</div>
					
				</div>
				
				<!-- Product Tabs (Description, Additional Info, Reviews) -->
				<div class="coconpm-product-tabs">
					<?php woocommerce_output_product_data_tabs(); ?>
				</div>
				
				<!-- Related Products -->
				<div class="coconpm-related-products">
					<?php woocommerce_output_related_products(); ?>
				</div>
				
			</div>
			
		<?php endwhile; ?>
		
	</div>
</div>

<?php get_footer(); ?>

