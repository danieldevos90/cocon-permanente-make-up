<?php
/**
 * Blog Single Post Template
 * Custom COCONPM Blog Detail - 100% Custom Classes
 * 
 * @package Divi
 * @subpackage Blog
 */

get_header();

$show_default_title = get_post_meta( get_the_ID(), '_et_pb_show_title', true );
$is_page_builder_used = et_pb_is_pagebuilder_used( get_the_ID() );

// If using page builder, use default Divi template
if ( et_builder_is_product_tour_enabled() || $is_page_builder_used ) :
?>
	<div id="main-content">
		<?php if ( et_builder_is_product_tour_enabled() ): ?>
			<?php while ( have_posts() ): the_post(); ?>
				<article id="post-<?php the_ID(); ?>" <?php post_class( 'et_pb_post' ); ?>>
					<div class="entry-content">
						<?php the_content(); ?>
					</div>
				</article>
			<?php endwhile; ?>
		<?php else: ?>
			<div class="container">
				<div id="content-area" class="clearfix">
					<div id="left-area">
						<?php while ( have_posts() ) : the_post(); ?>
							<?php do_action( 'et_before_post' ); ?>
							<article id="post-<?php the_ID(); ?>" <?php post_class( 'et_pb_post' ); ?>>
								<?php if ( 'off' !== $show_default_title ) { ?>
									<div class="et_post_meta_wrapper">
										<h1 class="entry-title"><?php the_title(); ?></h1>
										<?php
										if ( ! post_password_required() ) :
											et_divi_post_meta();
											$thumb = '';
											$width = (int) apply_filters( 'et_pb_index_blog_image_width', 1080 );
											$height = (int) apply_filters( 'et_pb_index_blog_image_height', 675 );
											$classtext = 'et_featured_image';
											$titletext = get_the_title();
											$alttext = get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true );
											$thumbnail = get_thumbnail( $width, $height, $classtext, $alttext, $titletext, false, 'Blogimage' );
											$thumb = $thumbnail["thumb"];
											$post_format = et_pb_post_format();
											if ( 'video' === $post_format && false !== ( $first_video = et_get_first_video() ) ) {
												printf( '<div class="et_main_video_container">%1$s</div>', et_core_esc_previously( $first_video ) );
											} else if ( ! in_array( $post_format, array( 'gallery', 'link', 'quote' ) ) && 'on' === et_get_option( 'divi_thumbnails', 'on' ) && '' !== $thumb ) {
												print_thumbnail( $thumb, $thumbnail["use_timthumb"], $alttext, $width, $height );
											} else if ( 'gallery' === $post_format ) {
												et_pb_gallery_images();
											}
										endif;
										?>
									</div>
								<?php } ?>
								<div class="entry-content">
									<?php
									do_action( 'et_before_content' );
									the_content();
									wp_link_pages( array( 'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'Divi' ), 'after' => '</div>' ) );
									?>
								</div>
								<div class="et_post_meta_wrapper">
									<?php
									do_action( 'et_after_post' );
									if ( ( comments_open() || get_comments_number() ) && 'on' === et_get_option( 'divi_show_postcomments', 'on' ) ) {
										comments_template( '', true );
									}
									?>
								</div>
							</article>
						<?php endwhile; ?>
					</div>
					<?php get_sidebar(); ?>
				</div>
			</div>
		<?php endif; ?>
	</div>
<?php
else :
	// Custom COCONPM blog detail template for standard posts
?>
<div id="main-content">
	<div class="coconpm-blog-single">
		
		<?php while ( have_posts() ) : the_post(); ?>
			
			<article id="post-<?php the_ID(); ?>" <?php post_class( 'coconpm-blog-article' ); ?>>
				
				<!-- Breadcrumb / Back Link -->
				<div class="coconpm-blog-breadcrumb">
					<a href="<?php echo get_permalink( get_option( 'page_for_posts' ) ); ?>" class="coconpm-back-link">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						Terug naar blog
					</a>
				</div>
				
				<!-- Categories -->
				<?php
				$categories = get_the_category();
				if ( ! empty( $categories ) ) :
				?>
					<div class="coconpm-blog-single-categories">
						<?php foreach ( $categories as $category ) : ?>
							<a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>" class="coconpm-blog-category">
								<?php echo esc_html( $category->name ); ?>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
				
				<!-- Title -->
				<h1 class="coconpm-blog-single-title"><?php the_title(); ?></h1>
				
				<!-- Meta (Date & Author) -->
				<div class="coconpm-blog-single-meta">
					<span class="coconpm-blog-date">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<?php echo get_the_date(); ?>
					</span>
					<span class="coconpm-blog-author">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<?php echo get_the_author(); ?>
					</span>
				</div>
				
				<!-- Featured Image -->
				<?php if ( has_post_thumbnail() ) : ?>
					<div class="coconpm-blog-single-image">
						<?php the_post_thumbnail( 'full', array( 'class' => 'coconpm-featured-image' ) ); ?>
					</div>
				<?php endif; ?>
				
				<!-- Content -->
				<div class="coconpm-blog-single-content">
					<?php
					the_content();
					
					wp_link_pages( array(
						'before' => '<div class="coconpm-page-links"><span class="page-links-title">' . esc_html__( 'Pagina\'s:', 'Divi' ) . '</span>',
						'after'  => '</div>',
						'link_before' => '<span>',
						'link_after'  => '</span>',
					) );
					?>
				</div>
				
				<!-- Tags -->
				<?php
				$tags = get_the_tags();
				if ( $tags ) :
				?>
					<div class="coconpm-blog-tags">
						<span class="coconpm-tags-label">Tags:</span>
						<?php foreach ( $tags as $tag ) : ?>
							<a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>" class="coconpm-blog-tag">
								<?php echo esc_html( $tag->name ); ?>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
				
				<!-- Author Bio -->
				<?php if ( get_the_author_meta( 'description' ) ) : ?>
					<div class="coconpm-author-bio">
						<div class="coconpm-author-avatar">
							<?php echo get_avatar( get_the_author_meta( 'ID' ), 80 ); ?>
						</div>
						<div class="coconpm-author-info">
							<h3 class="coconpm-author-name"><?php echo get_the_author(); ?></h3>
							<p class="coconpm-author-description"><?php echo get_the_author_meta( 'description' ); ?></p>
						</div>
					</div>
				<?php endif; ?>
				
				<!-- Post Navigation -->
				<div class="coconpm-post-navigation">
					<?php
					$prev_post = get_previous_post();
					$next_post = get_next_post();
					?>
					
					<?php if ( $prev_post ) : ?>
						<a href="<?php echo get_permalink( $prev_post->ID ); ?>" class="coconpm-nav-link coconpm-nav-prev">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<span>
								<span class="coconpm-nav-label">Vorig bericht</span>
								<span class="coconpm-nav-title"><?php echo get_the_title( $prev_post->ID ); ?></span>
							</span>
						</a>
					<?php endif; ?>
					
					<?php if ( $next_post ) : ?>
						<a href="<?php echo get_permalink( $next_post->ID ); ?>" class="coconpm-nav-link coconpm-nav-next">
							<span>
								<span class="coconpm-nav-label">Volgend bericht</span>
								<span class="coconpm-nav-title"><?php echo get_the_title( $next_post->ID ); ?></span>
							</span>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</a>
					<?php endif; ?>
				</div>
				
				<!-- Comments -->
				<?php
				if ( ( comments_open() || get_comments_number() ) && 'on' === et_get_option( 'divi_show_postcomments', 'on' ) ) {
					?>
					<div class="coconpm-blog-comments">
						<?php comments_template( '', true ); ?>
					</div>
					<?php
				}
				?>
				
			</article>
			
		<?php endwhile; ?>
		
	</div>
</div>
<?php endif; ?>

<?php get_footer(); ?>
