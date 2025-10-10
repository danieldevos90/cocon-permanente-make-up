# Debug Scroll Performance Lag

## Files Added for Debugging

1. **`Divi/js/scroll-debug.js`** - JavaScript console logging
2. **`Divi/inc/woocommerce-custom.php`** - PHP error_log debugging
3. **`Divi/functions.php`** - Loads debug script

## How to Use

### Step 1: Upload Files

Upload these 3 files via FTP:
```
Divi/js/scroll-debug.js
Divi/inc/woocommerce-custom.php
Divi/functions.php
```

### Step 2: Clear All Caches

- Divi cache
- WordPress cache
- Browser cache (Cmd+Shift+R)

### Step 3: Test on Home Page in Chrome

1. Open https://www.coconpermanentemakeup.nl/ in Chrome
2. Open DevTools (F12)
3. Go to **Console** tab
4. **Reload the page**
5. You'll see debug output like:

```
=== SCROLL PERFORMANCE DEBUG ===
Page URL: https://www.coconpermanentemakeup.nl/
User Agent: Chrome/119...
Is Chrome: true

--- Loaded Stylesheets ---
1. style.css
2. woocommerce-custom.css  ⚠️ <-- THIS SHOULDN'T BE HERE ON HOME PAGE!
...

--- Loaded Scripts ---
1. jquery.js
2. custom.js
...
```

### Step 4: Scroll the Page

As you scroll, you'll see:

```
Scroll events: 45, Avg FPS: 22.5
🐌 SLOW SCROLL DETECTED! FPS: 22.5
```

Or if it's smooth:

```
Scroll events: 38, Avg FPS: 58.3
✅ Smooth scroll. FPS: 58.3
```

### Step 5: Check PHP Logs

#### Via cPanel:

1. Log into cPanel
2. Go to **Errors** or **Error Log**
3. Look for recent entries like:

```
=== WooCommerce Styles Check ===
Current URL: /
is_woocommerce(): NO
is_cart(): NO
is_checkout(): NO
is_account_page(): NO
is_front_page(): YES
is_home(): YES
✅ SKIPPING WooCommerce CSS - Not a WooCommerce page
```

Or if it's loading incorrectly:

```
=== WooCommerce Styles Check ===
Current URL: /
is_woocommerce(): YES  <-- THIS IS THE PROBLEM!
⚠️ LOADING WooCommerce CSS
```

#### Via FTP/SSH:

Check these files:
- `/error_log` (in root)
- `/public_html/error_log`
- Ask your host where PHP error logs are stored

### What to Look For

#### In Browser Console:

**🚨 RED FLAGS:**
- `⚠️ WooCommerce CSS loaded:` on home page
- `⚠️ WooCommerce JS loaded:` on home page
- `🐌 SLOW SCROLL DETECTED! FPS:` below 30
- `⚠️ Too many inline styles:` over 100
- `⚠️ Parallax detected:` any number
- `⚠️ Excessive DOM changes:` over 100

**✅ GOOD SIGNS:**
- No WooCommerce CSS/JS on home page
- FPS above 55
- Few inline styles
- No parallax
- Low DOM changes

#### In PHP Logs:

**🚨 PROBLEM:**
```
is_woocommerce(): YES  (on home page)
⚠️ LOADING WooCommerce CSS
⚠️ LOADING Inline Button Styles
```

**✅ CORRECT:**
```
is_woocommerce(): NO  (on home page)
✅ SKIPPING WooCommerce CSS
✅ SKIPPING Inline Button Styles
```

### Step 6: Send Me the Output

Take screenshots of:

1. **Console output** (the top section with loaded files)
2. **Scroll FPS** (while scrolling)
3. **PHP error log** (the WooCommerce Styles Check section)

This will tell us exactly what's loading and causing the slowdown.

## Quick Test

Run this in Chrome Console on the home page:

```javascript
// Check if WooCommerce CSS is loaded
const wcCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter(s => s.href.includes('woocommerce'));
console.log('WooCommerce CSS files:', wcCSS.length);
wcCSS.forEach(s => console.log('  -', s.href));

// Check performance
let start = Date.now();
let frames = 0;
function countFrames() {
    frames++;
    if (Date.now() - start < 1000) {
        requestAnimationFrame(countFrames);
    } else {
        console.log('FPS:', frames);
    }
}
window.addEventListener('scroll', () => {
    start = Date.now();
    frames = 0;
    countFrames();
}, { once: true });
console.log('Now scroll the page...');
```

## Expected Results

### If WooCommerce CSS is the problem:

You'll see:
- `WooCommerce CSS files: 1` (or more)
- File path to `woocommerce-custom.css`
- FPS below 30

### If it's something else:

You'll see:
- `WooCommerce CSS files: 0`
- But FPS still below 30
- Then we know it's NOT the WooCommerce CSS

## Remove Debug After Testing

Once we find the issue, remove debug logging:

1. Remove `error_log()` calls from `woocommerce-custom.php`
2. Remove `scroll-debug.js` enqueue from `functions.php`
3. (Or just delete the debug script file)

---

**Created:** October 10, 2025  
**Purpose:** Find what's causing Chrome scroll lag on home page  
**Status:** Active - awaiting test results


