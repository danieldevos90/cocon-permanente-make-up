/**
 * CoconPM Checkout Mobile Grid Fix
 * Forces single column layout on mobile devices
 */

(function() {
    'use strict';

    function applyMobileCheckoutGrid() {
        // Check if we're on mobile
        if (window.innerWidth <= 992) {
            const checkoutGrids = document.querySelectorAll('.coconpm-checkout-grid');
            
            checkoutGrids.forEach(function(grid) {
                // Force inline styles to ensure override
                grid.style.setProperty('grid-template-columns', '1fr', 'important');
                grid.style.setProperty('gap', window.innerWidth <= 768 ? '32px' : '40px', 'important');
                grid.style.setProperty('display', 'grid', 'important');
            });
        } else {
            // Remove inline styles on desktop to let CSS take over
            const checkoutGrids = document.querySelectorAll('.coconpm-checkout-grid');
            
            checkoutGrids.forEach(function(grid) {
                grid.style.removeProperty('grid-template-columns');
                grid.style.removeProperty('gap');
                grid.style.removeProperty('display');
            });
        }
    }

    // Apply on page load
    document.addEventListener('DOMContentLoaded', applyMobileCheckoutGrid);
    
    // Apply on window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyMobileCheckoutGrid, 150);
    });
    
    // Also apply immediately in case DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        applyMobileCheckoutGrid();
    }
})();

