# Custom COCONPM Blog Pages

## Overview

Custom blog archive and single post templates with modern card-based design using `coconpm-*` classes, matching the style of the WooCommerce shop pages.

## Files Created

### Templates
- **`Divi/index.php`** - Blog index/home page template
- **`Divi/archive.php`** - Category, tag, author, and date archive template
- **`Divi/single.php`** - Single blog post template (with fallback to Divi for page builder posts)

### Styles
- **`Divi/css/coconpm-blog.css`** - Complete blog styling (700+ lines)

### Functions
- **`Divi/inc/woocommerce-custom.php`** - Added `cocon_enqueue_blog_styles()` function

## Design Features

### Blog Archive/Index
- 3-column responsive card grid
- Category badges in COCONPM pink (#C64193)
- Featured image with hover zoom effect
- Date and author with SVG icons
- Excerpt with "Read More" link
- Pagination
- Hover effects on cards

### Single Post
- Full-width featured image
- Category badges
- Date and author metadata
- Styled content (headings, paragraphs, lists, blockquotes, code)
- Tag cloud
- Author bio with avatar
- Previous/Next post navigation
- Comments section
- Back to blog link

## Color Scheme

Matches the COCONPM WooCommerce design:
- **Primary Pink**: `#C64193`
- **Fuchsia**: `#ff00ff`
- **Text**: `#333`
- **Gray**: `#666`

## CSS Classes

### Blog Archive
```css
.coconpm-blog-archive          /* Main container */
.coconpm-blog-header           /* Header section */
.coconpm-blog-title            /* Page title */
.coconpm-blog-description      /* Archive description */
.coconpm-blog-grid             /* Card grid */
.coconpm-blog-card             /* Individual post card */
.coconpm-blog-image            /* Featured image wrapper */
.coconpm-blog-content          /* Card content */
.coconpm-blog-categories       /* Category badges container */
.coconpm-blog-category         /* Individual category badge */
.coconpm-blog-card-title       /* Post title */
.coconpm-blog-meta             /* Date & author container */
.coconpm-blog-date             /* Date with icon */
.coconpm-blog-author           /* Author with icon */
.coconpm-blog-excerpt          /* Post excerpt */
.coconpm-blog-read-more        /* Read more link */
.coconpm-blog-pagination       /* Pagination wrapper */
.coconpm-no-posts              /* No posts message */
```

### Single Post
```css
.coconpm-blog-single           /* Main container */
.coconpm-blog-breadcrumb       /* Breadcrumb/back link */
.coconpm-back-link             /* Back to blog link */
.coconpm-blog-single-categories /* Categories */
.coconpm-blog-single-title     /* Post title */
.coconpm-blog-single-meta      /* Post metadata */
.coconpm-blog-single-image     /* Featured image */
.coconpm-blog-single-content   /* Post content */
.coconpm-page-links            /* Pagination for multi-page posts */
.coconpm-blog-tags             /* Tags container */
.coconpm-tags-label            /* Tags label */
.coconpm-blog-tag              /* Individual tag */
.coconpm-author-bio            /* Author bio section */
.coconpm-author-avatar         /* Author avatar */
.coconpm-author-info           /* Author information */
.coconpm-author-name           /* Author name */
.coconpm-author-description    /* Author description */
.coconpm-post-navigation       /* Post navigation */
.coconpm-nav-link              /* Navigation link */
.coconpm-nav-label             /* Navigation label */
.coconpm-nav-title             /* Navigation post title */
.coconpm-blog-comments         /* Comments wrapper */
```

## Responsive Breakpoints

```css
/* Desktop: 3 columns */
@media (min-width: 992px)

/* Tablet: 2 columns */
@media (max-width: 992px)

/* Mobile: 1 column */
@media (max-width: 768px)

/* Small Mobile: Optimized spacing */
@media (max-width: 480px)
```

## How It Works

### Template Hierarchy

WordPress template hierarchy:
1. **Blog Home**: Uses `index.php`
2. **Category Archive**: Uses `archive.php` (falls back to `index.php`)
3. **Tag Archive**: Uses `archive.php`
4. **Author Archive**: Uses `archive.php`
5. **Date Archive**: Uses `archive.php`
6. **Single Post**: Uses `single.php`

### Page Builder Support

The `single.php` template includes conditional logic:
- If the post uses Divi Page Builder → Shows default Divi template
- If the post is a standard post → Shows custom COCONPM template

This ensures compatibility with existing page builder content while providing custom styling for standard blog posts.

### CSS Loading

The `cocon_enqueue_blog_styles()` function in `woocommerce-custom.php`:
- Loads CSS only on blog pages (`is_singular('post')`, `is_archive()`, `is_home()`)
- Skips loading if page builder is used
- Adds cache-busting timestamp for development
- Logs to browser console when loaded

## Deployment

### Upload Script
```bash
./upload-custom-blog.sh
```

### What Gets Uploaded
- `index.php` - Blog index template
- `archive.php` - Archive template
- `single.php` - Single post template
- `coconpm-blog.css` - Blog styles
- `woocommerce-custom.php` - Updated enqueue functions

### After Upload
1. Clear browser cache (Cmd+Shift+R)
2. Clear WordPress cache (if caching plugin active)
3. Visit blog page or any post
4. Check browser console for: `✅ COCONPM BLOG CSS LOADED!`

## Customization

### Change Colors
Edit `coconpm-blog.css`:
```css
/* Primary pink color */
#C64193 → Your color

/* Fuchsia accent */
#ff00ff → Your color
```

### Change Grid Columns
Edit `coconpm-blog.css`:
```css
.coconpm-blog-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}
```

### Change Excerpt Length
Edit `archive.php` or `index.php`:
```php
<?php echo wp_trim_words( get_the_excerpt(), 25, '...' ); ?>
```
Change `25` to your desired word count.

## Features

### Archive/Index Pages
- ✅ Card-based grid layout
- ✅ Featured images with hover effects
- ✅ Category badges
- ✅ Date and author with icons
- ✅ Post excerpt
- ✅ Read more link with arrow
- ✅ Pagination
- ✅ Responsive design

### Single Posts
- ✅ Full-width featured image
- ✅ Category badges
- ✅ Date and author metadata
- ✅ Styled content (typography, images, lists, blockquotes, code)
- ✅ Tag cloud
- ✅ Author bio with avatar
- ✅ Previous/Next navigation with post titles
- ✅ Comments section
- ✅ Back to blog link
- ✅ Multi-page post support

### Technical
- ✅ 100% custom classes (no Divi conflicts)
- ✅ Page builder compatibility
- ✅ Responsive design
- ✅ SEO-friendly markup
- ✅ Accessibility (semantic HTML)
- ✅ Performance optimized
- ✅ Browser console debugging

## SVG Icons Used

### Date Icon
Calendar icon for post dates

### Author Icon
User icon for author names

### Arrow Icons
- Right arrow for "Read More" and "Next Post"
- Left arrow for "Previous Post" and "Back to Blog"

## Browser Console Output

When blog CSS loads successfully:
```
✅ COCONPM BLOG CSS LOADED!
📁 CSS File: .../coconpm-blog.css
🔢 Version: 4.26.1-[timestamp]
🎨 Custom COCONPM blog styling active
```

## Troubleshooting

### CSS Not Loading
1. Check browser console for CSS file
2. Verify file exists: `Divi/css/coconpm-blog.css`
3. Check if page builder is active (CSS won't load for page builder posts)
4. Clear all caches

### Layout Issues
1. Ensure parent container has enough width
2. Check for CSS conflicts from other plugins
3. Test with browser inspector to see which styles apply

### Images Not Showing
1. Ensure posts have featured images
2. Check image size settings in WordPress
3. Verify image URLs are correct

## Compatibility

- ✅ WordPress 5.0+
- ✅ Divi Theme 4.0+
- ✅ Page Builder compatibility
- ✅ All modern browsers
- ✅ Mobile responsive
- ✅ Touch-friendly

## Future Enhancements

Possible additions:
- Search functionality
- Post filtering
- Load more / infinite scroll
- Social sharing buttons
- Related posts
- Reading time estimate
- Table of contents for long posts


