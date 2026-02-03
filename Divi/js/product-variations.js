/**
 * COCONPM Product Variations Handler
 * Handles variant selection and image gallery updates
 * Updated to work with standard WooCommerce forms
 */

(function($) {
	'use strict';
	
	let variationInitialized = false;
	
	function initVariationHandler() {
		if (variationInitialized) return;
		
		// Use standard WooCommerce variations form class
		const $variationsForm = $('.variations_form');
		if (!$variationsForm.length) return;
		
		const $gallery = $('.cocon-product-gallery');
		if (!$gallery.length) return;
		
		// Get variation data
		const variationsData = $variationsForm.data('product_variations');
		if (!variationsData || !Array.isArray(variationsData)) return;
		
		// Store original gallery images for reset
		const originalImages = [];
		$gallery.find('.gallery-image').each(function() {
			originalImages.push({
				src: $(this).find('img').attr('src'),
				alt: $(this).find('img').attr('alt')
			});
		});
		
		const originalThumbnails = [];
		$gallery.find('.gallery-thumbnail').each(function() {
			originalThumbnails.push({
				src: $(this).find('img').attr('src'),
				alt: $(this).find('img').attr('alt'),
				imageId: $(this).data('image-id')
			});
		});
		
		// Handle variation selection
		$variationsForm.on('change', 'select', function() {
			// Let WooCommerce handle the variation logic first
			setTimeout(function() {
				updateVariationImages();
			}, 100);
		});
		
		// Handle reset variations (using WooCommerce's standard reset link)
		$variationsForm.on('click', '.reset_variations', function(e) {
			e.preventDefault();
			// Trigger WooCommerce reset
			$variationsForm.find('select').val('').trigger('change');
			resetToOriginalImages();
		});
		
		// Listen for WooCommerce variation events
		$variationsForm.on('found_variation', function(event, variation) {
			if (variation.image && variation.image.src) {
				updateGalleryWithVariation(variation);
			}
		});
		
		$variationsForm.on('reset_data', function() {
			resetToOriginalImages();
		});
		
		function updateVariationImages() {
			const selectedAttributes = {};
			let hasSelection = false;
			
			// Get all selected attributes from WooCommerce selects
			$variationsForm.find('select').each(function() {
				const $select = $(this);
				const attributeName = $select.attr('name');
				const attributeValue = $select.val();
				
				if (attributeValue && attributeValue !== '') {
					selectedAttributes[attributeName] = attributeValue;
					hasSelection = true;
				}
			});
			
			if (!hasSelection) {
				resetToOriginalImages();
				return;
			}
			
			// Find matching variation
			const matchingVariation = findMatchingVariation(selectedAttributes);
			
			if (matchingVariation && matchingVariation.image && matchingVariation.image.src) {
				updateGalleryWithVariation(matchingVariation);
			} else {
				resetToOriginalImages();
			}
		}
		
		function findMatchingVariation(selectedAttributes) {
			for (let i = 0; i < variationsData.length; i++) {
				const variation = variationsData[i];
				let matches = true;
				
				// Check if all selected attributes match this variation
				for (const attrName in selectedAttributes) {
					if (variation.attributes && variation.attributes[attrName]) {
						// Handle both exact matches and empty variation attributes (any)
						if (variation.attributes[attrName] !== '' && 
							variation.attributes[attrName] !== selectedAttributes[attrName]) {
							matches = false;
							break;
						}
					}
				}
				
				if (matches) {
					return variation;
				}
			}
			return null;
		}
		
		function updateGalleryWithVariation(variation) {
			if (!variation.image || !variation.image.src) return;
			
			const $mainImages = $gallery.find('.gallery-image');
			const $thumbnails = $gallery.find('.gallery-thumbnail');
			
			// Update first image with variation image
			const $firstImage = $mainImages.first();
			const $firstThumbnail = $thumbnails.first();
			
			if ($firstImage.length && $firstThumbnail.length) {
				// Update main image
				$firstImage.find('img').attr({
					'src': variation.image.src,
					'srcset': variation.image.srcset || '',
					'sizes': variation.image.sizes || '',
					'alt': variation.image.alt || ''
				});
				
				// Update thumbnail
				$firstThumbnail.find('img').attr({
					'src': variation.image.thumb_src || variation.image.src,
					'alt': variation.image.alt || ''
				});
				
				// Make sure first image is active
				$mainImages.removeClass('active');
				$thumbnails.removeClass('active');
				$firstImage.addClass('active');
				$firstThumbnail.addClass('active');
				
				// Update current index in gallery script if it exists
				if (window.coconpmGallery) {
					window.coconpmGallery.currentIndex = 0;
				}
			}
		}
		
		function resetToOriginalImages() {
			const $mainImages = $gallery.find('.gallery-image');
			const $thumbnails = $gallery.find('.gallery-thumbnail');
			
			// Restore original main images
			$mainImages.each(function(index) {
				if (originalImages[index]) {
					$(this).find('img').attr({
						'src': originalImages[index].src,
						'alt': originalImages[index].alt
					});
				}
			});
			
			// Restore original thumbnails
			$thumbnails.each(function(index) {
				if (originalThumbnails[index]) {
					$(this).find('img').attr({
						'src': originalThumbnails[index].src,
						'alt': originalThumbnails[index].alt
					});
				}
			});
			
			// Reset to first image active
			$mainImages.removeClass('active').first().addClass('active');
			$thumbnails.removeClass('active').first().addClass('active');
			
			// Update current index in gallery script if it exists
			if (window.coconpmGallery) {
				window.coconpmGallery.currentIndex = 0;
			}
		}
		
		variationInitialized = true;
	}
	
	// Initialize on DOM ready
	$(document).ready(initVariationHandler);
	
	// Re-initialize on AJAX updates (for dynamic content)
	$(document).on('updated_wc_div', initVariationHandler);
	
})(jQuery);
