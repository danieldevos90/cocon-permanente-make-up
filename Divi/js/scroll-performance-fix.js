/**
 * Aggressive Scroll Performance Fix for Chrome
 * Simplified approach to eliminate Chrome scroll lag
 */

(function() {
    'use strict';

    // Aggressive throttle - only fires every 200ms (was 100ms)
    function throttle(func, wait) {
        let timeout;
        let lastRan;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    if ((Date.now() - lastRan) >= wait) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, wait - (Date.now() - lastRan));
            }
        };
    }

    // Detect Chrome
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (!isChrome) {
        // Not Chrome, skip optimization
        return;
    }

    // CRITICAL: Use passive listeners (tells browser we won't preventDefault)
    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function() {
                supportsPassive = true;
            }
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
    } catch (e) {}

    // Only manage will-change on actual scroll
    const fixedElements = document.querySelectorAll('#main-header, .et-fixed-header');
    let scrollTimeout;

    // Extremely throttled scroll handler - 200ms
    const handleScroll = throttle(function() {
        clearTimeout(scrollTimeout);
        
        // Add will-change only during scroll
        fixedElements.forEach(el => {
            if (el) el.style.willChange = 'transform';
        });

        // Remove will-change after scroll ends
        scrollTimeout = setTimeout(function() {
            fixedElements.forEach(el => {
                if (el) el.style.willChange = 'auto';
            });
        }, 300);
    }, 200);

    // Attach passive scroll listener
    window.addEventListener('scroll', handleScroll, supportsPassive ? { passive: true } : false);

    // CRITICAL: Disable Divi's scroll effects that cause lag
    document.addEventListener('DOMContentLoaded', function() {
        // Disable parallax if it exists
        const parallaxSections = document.querySelectorAll('.et_pb_section_parallax');
        parallaxSections.forEach(function(section) {
            section.classList.remove('et_pb_section_parallax');
        });

        // Force GPU acceleration on fixed elements only
        const style = document.createElement('style');
        style.textContent = `
            #main-header,
            .et-fixed-header {
                -webkit-transform: translate3d(0, 0, 0);
                transform: translate3d(0, 0, 0);
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
            }
            
            /* Prevent layout thrashing */
            .et_pb_section {
                will-change: auto !important;
            }
            
            /* Simplify transitions */
            #main-header * {
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    });

    // Disable smooth scroll behavior (causes Chrome lag)
    if (document.documentElement.style.scrollBehavior !== undefined) {
        document.documentElement.style.scrollBehavior = 'auto';
    }

})();
