/**
 * COCONPM Noptin Form Success Popup
 * Shows browser alert when Noptin form is successfully submitted
 */

(function($) {
	'use strict';

	// Wait for DOM to be ready
	$(document).ready(function() {
		
		// Find Noptin form container
		var $noptinContainer = $('.coconpm-blog-subscribe');
		
		if ($noptinContainer.length === 0) {
			return; // No Noptin form found
		}

		// Method 1: Listen for form submission events
		$noptinContainer.on('submit', 'form', function(e) {
			// Don't prevent default - let Noptin handle submission
			// We'll detect success via other methods
		});

		// Method 2: Use MutationObserver to detect success messages
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.addedNodes.length) {
					// Check for Noptin success indicators
					var $addedNodes = $(mutation.addedNodes);
					
					// Check for success messages (common Noptin classes)
					var $successMessage = $addedNodes.filter('.noptin-success, .noptin-success-message, .noptin-notice-success, [class*="success"]');
					
					// Also check if any added node contains success text
					$addedNodes.each(function() {
						var $node = $(this);
						var text = $node.text().toLowerCase();
						
						// Check for success indicators
						if (
							$node.hasClass('noptin-success') ||
							$node.hasClass('noptin-success-message') ||
							$node.hasClass('noptin-notice-success') ||
							$node.is('[class*="success"]') ||
							text.indexOf('success') !== -1 ||
							text.indexOf('bedankt') !== -1 ||
							text.indexOf('subscribed') !== -1 ||
							text.indexOf('abonneren') !== -1 && text.indexOf('gelukt') !== -1
						) {
							// Success detected - show popup
							setTimeout(function() {
								alert('Bedankt voor je aanmelding! Je bent succesvol geabonneerd op onze nieuwsbrief.');
							}, 500);
							return false;
						}
					});
					
					// Check if success message exists in container
					if ($successMessage.length > 0) {
						setTimeout(function() {
							alert('Bedankt voor je aanmelding! Je bent succesvol geabonneerd op onze nieuwsbrief.');
						}, 500);
					}
				}
			});
		});

		// Start observing the Noptin container
		observer.observe($noptinContainer[0], {
			childList: true,
			subtree: true,
			characterData: true
		});

		// Method 3: Listen for custom Noptin events (if they exist)
		$(document).on('noptin:subscribed noptin:success noptin_form_submitted', function(e) {
			setTimeout(function() {
				alert('Bedankt voor je aanmelding! Je bent succesvol geabonneerd op onze nieuwsbrief.');
			}, 500);
		});

		// Method 4: Check for AJAX success responses
		// Intercept AJAX calls if possible
		if (typeof jQuery !== 'undefined' && jQuery.ajaxSetup) {
			var originalAjaxSuccess = jQuery.ajaxSuccess;
			jQuery.ajaxSuccess(function(event, xhr, settings) {
				// Check if this is a Noptin form submission
				if (settings.url && (
					settings.url.indexOf('noptin') !== -1 ||
					settings.url.indexOf('wp-admin/admin-ajax.php') !== -1
				)) {
					try {
						var response = xhr.responseJSON || {};
						if (response.success === true || response.data && response.data.success) {
							setTimeout(function() {
								alert('Bedankt voor je aanmelding! Je bent succesvol geabonneerd op onze nieuwsbrief.');
							}, 500);
						}
					} catch(e) {
						// Response might not be JSON
					}
				}
			});
		}

		// Method 5: Periodically check for success messages (fallback)
		var checkInterval = setInterval(function() {
			var $successElements = $noptinContainer.find('.noptin-success, .noptin-success-message, .noptin-notice-success, [class*="success"]');
			if ($successElements.length > 0 && !$successElements.data('popup-shown')) {
				$successElements.data('popup-shown', true);
				setTimeout(function() {
					alert('Bedankt voor je aanmelding! Je bent succesvol geabonneerd op onze nieuwsbrief.');
				}, 500);
			}
		}, 1000);

		// Stop checking after 30 seconds to avoid infinite loop
		setTimeout(function() {
			clearInterval(checkInterval);
		}, 30000);

	});

})(jQuery);

