/**
 * Scroll Performance Debug
 * Logs what's causing Chrome scroll lag
 */

(function() {
    'use strict';
    
    console.log('=== SCROLL PERFORMANCE DEBUG ===');
    console.log('Page URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Chrome:', /Chrome/.test(navigator.userAgent));
    
    // Check what stylesheets are loaded
    console.log('\n--- Loaded Stylesheets ---');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(function(sheet, index) {
        const href = sheet.href || 'inline';
        console.log(`${index + 1}. ${href.split('/').pop()}`);
        if (href.includes('woocommerce')) {
            console.warn('⚠️ WooCommerce CSS loaded:', href);
        }
    });
    
    // Check what scripts are loaded
    console.log('\n--- Loaded Scripts ---');
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(function(script, index) {
        const src = script.src;
        console.log(`${index + 1}. ${src.split('/').pop()}`);
        if (src.includes('woocommerce') || src.includes('product')) {
            console.warn('⚠️ WooCommerce JS loaded:', src);
        }
    });
    
    // Check for scroll event listeners
    console.log('\n--- Scroll Event Tracking ---');
    let scrollEventCount = 0;
    let lastScrollTime = Date.now();
    let scrollFPS = [];
    
    window.addEventListener('scroll', function() {
        scrollEventCount++;
        const now = Date.now();
        const delta = now - lastScrollTime;
        if (delta > 0) {
            const fps = 1000 / delta;
            scrollFPS.push(fps);
            
            // Keep only last 10 measurements
            if (scrollFPS.length > 10) {
                scrollFPS.shift();
            }
        }
        lastScrollTime = now;
    }, { passive: true });
    
    // Report every 2 seconds
    setInterval(function() {
        if (scrollEventCount > 0) {
            const avgFPS = scrollFPS.reduce((a, b) => a + b, 0) / scrollFPS.length;
            console.log(`Scroll events: ${scrollEventCount}, Avg FPS: ${avgFPS.toFixed(1)}`);
            
            if (avgFPS < 30) {
                console.error('🐌 SLOW SCROLL DETECTED! FPS:', avgFPS.toFixed(1));
            } else if (avgFPS < 50) {
                console.warn('⚠️ Sluggish scroll. FPS:', avgFPS.toFixed(1));
            } else {
                console.log('✅ Smooth scroll. FPS:', avgFPS.toFixed(1));
            }
            
            scrollEventCount = 0;
            scrollFPS = [];
        }
    }, 2000);
    
    // Check for heavy CSS
    console.log('\n--- CSS Analysis ---');
    const allStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
    console.log('Total style elements:', allStyles.length);
    
    // Check for inline styles
    const inlineStyles = document.querySelectorAll('[style]');
    console.log('Elements with inline styles:', inlineStyles.length);
    if (inlineStyles.length > 100) {
        console.warn('⚠️ Too many inline styles:', inlineStyles.length);
    }
    
    // Check for animations
    const animatedElements = document.querySelectorAll('[class*="animation"], [class*="et_pb_animation"]');
    console.log('Animated elements:', animatedElements.length);
    
    // Check for parallax
    const parallaxElements = document.querySelectorAll('[class*="parallax"]');
    console.log('Parallax elements:', parallaxElements.length);
    if (parallaxElements.length > 0) {
        console.warn('⚠️ Parallax detected:', parallaxElements.length);
    }
    
    // Check for sticky elements
    const stickyElements = document.querySelectorAll('[style*="sticky"]');
    console.log('Sticky elements:', stickyElements.length);
    
    // Monitor DOM changes
    let domChanges = 0;
    const observer = new MutationObserver(function(mutations) {
        domChanges += mutations.length;
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
    
    setInterval(function() {
        if (domChanges > 0) {
            console.log('DOM changes:', domChanges);
            if (domChanges > 100) {
                console.warn('⚠️ Excessive DOM changes:', domChanges);
            }
            domChanges = 0;
        }
    }, 2000);
    
    console.log('\n=== Debug logging active. Scroll the page to see performance data ===\n');
    
})();

