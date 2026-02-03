<?php
/**
 * Blog Archive Page Template
 * Custom COCONPM Blog Archive - 100% Custom Classes
 * 
 * @package Divi
 * @subpackage Blog
 */

get_header();
?>

<div id="main-content">
	<div class="coconpm-blog-archive">
		
		<!-- Header: 2 Columns (Title + Subscribe | Description) -->
		<div class="coconpm-blog-header">
			<div class="coconpm-blog-header-left">
				<?php
				if ( is_category() ) {
					echo '<h1 class="coconpm-blog-title">' . single_cat_title( '', false ) . '</h1>';
				} elseif ( is_tag() ) {
					echo '<h1 class="coconpm-blog-title">' . single_tag_title( '', false ) . '</h1>';
				} elseif ( is_author() ) {
					echo '<h1 class="coconpm-blog-title">' . get_the_author() . '</h1>';
				} elseif ( is_date() ) {
					echo '<h1 class="coconpm-blog-title">' . get_the_date( 'F Y' ) . '</h1>';
				} else {
					echo '<h1 class="coconpm-blog-title">Blog Archief</h1>';
				}
				?>
				
				<!-- Subscribe Form -->
				<div class="coconpm-blog-subscribe">
					<?php echo do_shortcode( '[noptin form=8574]' ); ?>
				</div>
			</div>
			
			<div class="coconpm-blog-header-right">
				<?php
				if ( term_description() ) {
					echo '<p class="coconpm-blog-intro">' . term_description() . '</p>';
				} else {
					echo '<p class="coconpm-blog-intro">Welkom op onze blog! Hier vind je alle tips, tutorials en nieuws over permanente make-up. Blijf op de hoogte van de laatste trends en technieken in de PMU-wereld.</p>';
				}
				?>
			</div>
		</div>
		
		<!-- Tags Filter Bar -->
		<?php
		$tags = get_tags( array(
			'orderby' => 'count',
			'order'   => 'DESC',
			'number'  => 10, // Show top 10 tags
		) );
		
		if ( ! empty( $tags ) && ! is_wp_error( $tags ) ) :
		?>
			<div class="coconpm-tags-filter">
				<a href="<?php echo get_permalink( get_option( 'page_for_posts' ) ); ?>" 
				   class="coconpm-tag-filter-btn <?php echo ( ! is_tag() ) ? 'active' : ''; ?>">
					Alle berichten
				</a>
				<?php foreach ( $tags as $tag ) : ?>
					<a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>" 
					   class="coconpm-tag-filter-btn <?php echo ( is_tag( $tag->slug ) ) ? 'active' : ''; ?>">
						<?php echo esc_html( $tag->name ); ?>
					</a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<?php if ( have_posts() ) : ?>

			<!-- Blog Grid -->
			<div class="coconpm-blog-grid">
				<?php
				while ( have_posts() ) : the_post();
					$post_format = et_pb_post_format();
				?>
					
					<article id="post-<?php the_ID(); ?>" <?php post_class( 'coconpm-blog-card' ); ?>>
						<a href="<?php the_permalink(); ?>" class="coconpm-blog-card-link">
							
							<!-- Featured Image -->
							<?php if ( has_post_thumbnail() && ! in_array( $post_format, array( 'link', 'audio', 'quote' ) ) ) : ?>
								<div class="coconpm-blog-image">
									<?php the_post_thumbnail( 'large', array( 'class' => 'coconpm-thumbnail' ) ); ?>
								</div>
							<?php else : ?>
								<div class="coconpm-blog-image coconpm-no-image">
									<div class="coconpm-placeholder-image">
										<svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M2.67004 18.95L7.60004 15.64C8.39004 15.11 9.53004 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</div>
								</div>
							<?php endif; ?>
							
							<!-- Post Content -->
							<div class="coconpm-blog-content">
								
								<!-- Title -->
								<h2 class="coconpm-blog-card-title">
									<?php the_title(); ?>
								</h2>
								
								<!-- Excerpt -->
								<div class="coconpm-blog-excerpt">
									<?php echo wp_trim_words( get_the_excerpt(), 15, '...' ); ?>
								</div>
								
								<!-- Read More Link -->
								<span class="coconpm-blog-read-more">
									Lees meer →
								</span>
								
							</div>
							
						</a>
					</article>
				
				<?php endwhile; ?>
			</div>

			<!-- Pagination -->
			<div class="coconpm-blog-pagination">
				<?php
				// WP Pagenavi if installed, otherwise default pagination
				if ( function_exists( 'wp_pagenavi' ) ) {
					wp_pagenavi();
				} else {
					the_posts_pagination( array(
						'mid_size'  => 2,
						'prev_text' => '← Vorige',
						'next_text' => 'Volgende →',
					) );
				}
				?>
			</div>

		<?php else : ?>

			<!-- No Posts Found -->
			<div class="coconpm-no-posts">
				<p>Geen berichten gevonden.</p>
			</div>

		<?php endif; ?>

	</div>
</div>

<?php get_footer(); ?>

