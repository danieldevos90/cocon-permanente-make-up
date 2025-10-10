<?php
/**
 * Single Product Image with Vertical Gallery and Navigation Arrows
 *
 * @package Divi
 * @subpackage WooCommerce
 */

defined( 'ABSPATH' ) || exit;

global $product;

$product_id = $product->get_id();
$attachment_ids = $product->get_gallery_image_ids();
$main_image_id = $product->get_image_id();

// Add main image to the beginning of the array
if ( $main_image_id ) {
	array_unshift( $attachment_ids, $main_image_id );
}

// Remove duplicates
$attachment_ids = array_unique( $attachment_ids );
?>

<div class="cocon-product-gallery">
	<div class="wc-row g-3">
		<?php if ( count( $attachment_ids ) > 1 ) : ?>
			<!-- Vertical Thumbnails -->
			<div class="wc-col-auto">
				<div class="gallery-thumbnails">
					<?php foreach ( $attachment_ids as $index => $attachment_id ) : ?>
						<?php
						$thumbnail_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
						?>
						<div class="gallery-thumbnail <?php echo $index === 0 ? 'active' : ''; ?>" 
							 data-index="<?php echo esc_attr( $index ); ?>"
							 data-image-id="<?php echo esc_attr( $attachment_id ); ?>">
							<img src="<?php echo esc_url( $thumbnail_url ); ?>" 
								 alt="<?php echo esc_attr( get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ) ); ?>" />
						</div>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>
		
		<!-- Main Image with Navigation Arrows -->
		<div class="wc-col">
			<div class="gallery-main-wrapper">
				<div class="gallery-main-image">
					<?php foreach ( $attachment_ids as $index => $attachment_id ) : ?>
						<?php
						$image_url = wp_get_attachment_image_url( $attachment_id, 'full' );
						$image_alt = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
						?>
						<div class="gallery-image <?php echo $index === 0 ? 'active' : ''; ?>" 
							 data-index="<?php echo esc_attr( $index ); ?>">
							<img src="<?php echo esc_url( $image_url ); ?>" 
								 alt="<?php echo esc_attr( $image_alt ); ?>" />
						</div>
					<?php endforeach; ?>
					
					<?php if ( count( $attachment_ids ) > 1 ) : ?>
						<!-- Navigation Arrows -->
						<button class="gallery-nav gallery-nav-prev" aria-label="Previous image">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
						<button class="gallery-nav gallery-nav-next" aria-label="Next image">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</div>
</div>

<?php
// JavaScript moved to external file: Divi/js/product-gallery.js
// This improves performance by removing inline scripts that slow down Chrome
?>

