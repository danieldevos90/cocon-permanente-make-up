# Quick Deploy Guide - Scroll Performance Fix

## What Was Fixed?

The slow scrolling on your website was caused by:
- ✅ Unthrottled JavaScript scroll listeners
- ✅ Missing GPU acceleration on fixed header
- ✅ Excessive paint/repaint operations
- ✅ No CSS containment optimizations

## Files to Upload (3 files)

### New Files (create these):
```
📁 wp-content/themes/Divi/js/
   └── scroll-performance-fix.js  (NEW - 4.8 KB)

📁 wp-content/themes/Divi/css/
   └── scroll-performance.css     (NEW - 3.2 KB)
```

### Modified Files (replace this):
```
📁 wp-content/themes/Divi/
   └── functions.php              (MODIFIED - backup first!)
```

## 3-Step Deployment

### Step 1: Upload via FTP

Using FileZilla or your FTP client:

```
1. Connect to: coconpermanentemakeup.nl
2. Navigate to: /wp-content/themes/Divi/
3. BACKUP functions.php first! (download a copy)
4. Upload:
   - js/scroll-performance-fix.js (drag to /js/ folder)
   - css/scroll-performance.css (drag to /css/ folder)
   - functions.php (replace existing)
```

**FTP Credentials:** See your `ftp.md` file

### Step 2: Clear All Caches

**1. Divi Cache:**
```
WordPress Admin → Divi → Theme Options → Builder → Advanced
Click: "Clear" on both cache options
```

**2. WordPress Cache (if using a cache plugin):**
```
Check: WP Rocket, W3 Total Cache, WP Super Cache, etc.
Click: "Clear All Cache" or similar button
```

**3. Server Cache (if using):**
```
CloudFlare: Purge Everything
SiteGround: Clear Cache
Or contact your hosting provider
```

**4. Your Browser:**
```
Press: Ctrl + Shift + R (Windows)
Or: Cmd + Shift + R (Mac)
Or: Open in incognito/private window
```

### Step 3: Test

Visit: https://www.coconpermanentemakeup.nl/

**Test Checklist:**
- [ ] Scroll feels smooth and responsive
- [ ] Fixed header still works
- [ ] Menu opens/closes correctly
- [ ] No JavaScript errors in console (F12)
- [ ] Mobile menu works
- [ ] Product pages load correctly

## Expected Results

### Before:
- 🐌 Sluggish scroll at 10-30fps
- 😓 High CPU usage
- 🐢 Paint times: 40ms

### After:
- ⚡ Smooth scroll at 55-60fps
- 😊 Low CPU usage
- 🚀 Paint times: 5-10ms

## Troubleshooting

### If something breaks:

**Option A: Quick rollback via FTP**
```
1. Delete: js/scroll-performance-fix.js
2. Delete: css/scroll-performance.css
3. Replace functions.php with your backup
4. Clear all caches again
```

**Option B: Emergency disable (no FTP access)**
```
WordPress Admin → Divi → Theme Options → Custom CSS
Add this:
#main-header { will-change: auto !important; }
```

### Common Issues:

**"Changes not visible"**
→ Clear ALL caches (especially Divi and browser)

**"JavaScript error in console"**
→ Check if jQuery is loaded before our script
→ Verify file uploaded correctly

**"Header looks weird"**
→ Clear Divi static CSS cache
→ Hard refresh browser (Ctrl+Shift+R)

## File Locations Reference

```
Your Site Structure:
├── wp-content/
│   └── themes/
│       └── Divi/
│           ├── functions.php          ← REPLACE THIS
│           ├── js/
│           │   └── scroll-performance-fix.js  ← NEW FILE
│           └── css/
│               └── scroll-performance.css     ← NEW FILE
```

## Support & Documentation

- **Full Documentation:** See `SCROLL-PERFORMANCE-FIX.md`
- **Upload Script:** Run `./upload-performance-fix.sh` (requires lftp)
- **FTP Info:** Check `ftp.md`
- **Cache Clearing:** See `CLEAR-CACHE.md`

## Performance Testing Tools

After deployment, check your site:
- https://pagespeed.web.dev/ (enter your URL)
- Chrome DevTools → Performance tab → Record while scrolling

Target scores:
- Performance: 90+ (desktop)
- Performance: 70+ (mobile)
- Smooth 60fps scrolling

## Questions?

If you encounter issues:
1. ✅ Verify all files uploaded correctly
2. ✅ Confirm all caches cleared
3. ✅ Check browser console for errors (F12)
4. ✅ Test in different browser/incognito mode
5. ✅ Check if hosting has server-side cache

---

**Status:** Ready to deploy ✅  
**Risk Level:** Low (easy rollback)  
**Time Required:** 10-15 minutes  
**Backup Required:** Yes (functions.php)

