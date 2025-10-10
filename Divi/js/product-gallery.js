/**
 * Optimized Product Gallery - Moved from inline to external file
 * Fixes Chrome scroll performance issues
 */

(function($) {
	'use strict';
	
	// Only initialize once, not on every scroll
	let galleryInitialized = false;
	
	function initProductGallery() {
		if (galleryInitialized) return;
		
		const $gallery = $('.cocon-product-gallery');
		if (!$gallery.length) return;
		
		const $thumbnails = $gallery.find('.gallery-thumbnail');
		const $images = $gallery.find('.gallery-image');
		const totalImages = $images.length;
		
		if (totalImages <= 1) return;
		
		let currentIndex = 0;
		
		// Thumbnail click - use event delegation
		$gallery.on('click', '.gallery-thumbnail', function() {
			const index = parseInt($(this).data('index'));
			showImage(index);
		});
		
		// Navigation arrows - use event delegation
		$gallery.on('click', '.gallery-nav-prev', function(e) {
			e.preventDefault();
			e.stopPropagation();
			currentIndex = (currentIndex - 1 + totalImages) % totalImages;
			showImage(currentIndex);
		});
		
		$gallery.on('click', '.gallery-nav-next', function(e) {
			e.preventDefault();
			e.stopPropagation();
			currentIndex = (currentIndex + 1) % totalImages;
			showImage(currentIndex);
		});
		
		// Keyboard navigation - ONLY when gallery is hovered (not global)
		$gallery.on('keydown', function(e) {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				currentIndex = (currentIndex - 1 + totalImages) % totalImages;
				showImage(currentIndex);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				currentIndex = (currentIndex + 1) % totalImages;
				showImage(currentIndex);
			}
		});
		
		// Optimized image switching - no setTimeout
		function showImage(index) {
			currentIndex = index;
			
			// Update thumbnails
			$thumbnails.removeClass('active');
			$thumbnails.eq(index).addClass('active');
			
			// Update images - simple and fast
			$images.removeClass('active');
			$images.eq(index).addClass('active');
		}
		
		galleryInitialized = true;
	}
	
	// Initialize on DOM ready
	$(document).ready(initProductGallery);
	
})(jQuery);

