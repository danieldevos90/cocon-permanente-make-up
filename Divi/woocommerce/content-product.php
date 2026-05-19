<?php
/**
 * Product Card Template for Shop/Archive Pages
 * Custom COCONPM Product Card - 100% Custom Classes
 *
 * @package Divi
 * @subpackage WooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;

// Ensure visibility
if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
?>

<div class="coconpm-product-card">
	
	<!-- Product Image with Link -->
	<a href="<?php echo esc_url( get_permalink() ); ?>" class="coconpm-card-link">
		<div class="coconpm-card-image">
			<?php if ( has_post_thumbnail() ) : ?>
				<?php 
				// Use 'large' size for better quality (1024x1024)
				// Alternative sizes: 'medium_large' (768px), 'full' (original)
				the_post_thumbnail( 'large', array( 'class' => 'coconpm-product-img' ) ); 
				?>
			<?php else : ?>
				<img src="<?php echo esc_url( wc_placeholder_img_src( 'large' ) ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?>" class="coconpm-product-img">
			<?php endif; ?>
			
			<!-- Sale Badge -->
			<?php if ( $product->is_on_sale() ) : ?>
				<span class="coconpm-sale-badge">Sale</span>
			<?php endif; ?>
		</div>
	</a>
	
	<!-- Product Card Body -->
	<div class="coconpm-card-body">
		
		<!-- Product Categories (Small, above title) -->
		<?php 
		$product_categories = get_the_terms( $product->get_id(), 'product_cat' );
		if ( $product_categories && ! is_wp_error( $product_categories ) ) : 
		?>
			<div class="coconpm-card-category-small">
				<?php 
				$category_names = array();
				foreach ( $product_categories as $category ) {
					if ( $category->slug !== 'uncategorized' ) { // Skip default uncategorized
						$category_names[] = esc_html( $category->name );
					}
				}
				if ( ! empty( $category_names ) ) {
					echo implode( ' • ', $category_names );
				}
				?>
			</div>
		<?php endif; ?>
		
		<!-- Product Title -->
		<h3 class="coconpm-card-title">
			<a href="<?php echo esc_url( get_permalink() ); ?>">
				<?php the_title(); ?>
			</a>
		</h3>
		
		<!-- Product Price -->
		<div class="coconpm-card-price">
			<?php echo $product->get_price_html(); ?>
		</div>
		
		<!-- Product Short Description -->
		<?php if ( $product->get_short_description() ) : ?>
			<div class="coconpm-card-excerpt">
				<?php echo wp_trim_words( $product->get_short_description(), 15, '...' ); ?>
			</div>
		<?php endif; ?>
		
		<!-- Add to Cart Button -->
		<div class="coconpm-card-actions">
			<a href="?add-to-cart=<?php echo esc_attr( $product->get_id() ); ?>" 
			   class="coconpm-btn coconpm-btn-primary coconpm-btn-block"
			   data-product_id="<?php echo esc_attr( $product->get_id() ); ?>">
				Toevoegen aan winkelwagen
			</a>
		</div>
		
	</div>
	
</div>
