<?php
/**
 * [cpm_enrollment_status] — status na Mollie-return (?enr=123).
 * Plaats op de bedankt-pagina; geen marketing-copy.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Enrollment_Status {

	const SHORTCODE = 'cpm_enrollment_status';

	public static function register(): void {
		add_shortcode( self::SHORTCODE, [ __CLASS__, 'shortcode' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'maybe_enqueue' ] );
		add_filter( 'the_content', [ __CLASS__, 'auto_inject_on_thankyou' ], 12 );
		add_action( 'wp_footer', [ __CLASS__, 'footer_inject' ], 6 );
	}

	public static function footer_inject(): void {
		if ( ! isset( $_GET['enr'] ) || ! (int) $_GET['enr'] ) {
			return;
		}
		$page_id = self::thankyou_page_id();
		if ( $page_id && (int) get_queried_object_id() !== $page_id ) {
			return;
		}
		$html = self::shortcode();
		if ( $html === '' ) {
			return;
		}
		wp_enqueue_style( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.css', [], CPM_OPL_VERSION );
		echo '<div class="cpm-opl-status-wrap" style="max-width:880px;margin:2rem auto;padding:0 1rem">';
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</div>';
	}

	public static function thankyou_page_id(): int {
		return (int) get_option( 'cpm_opl_thankyou_page_id', 0 );
	}

	public static function auto_inject_on_thankyou( $content ) {
		if ( ! is_singular( 'page' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$page_id = self::thankyou_page_id();
		if ( $page_id && (int) get_queried_object_id() !== $page_id ) {
			return $content;
		}
		if ( ! isset( $_GET['enr'] ) || ! (int) $_GET['enr'] ) {
			return $content;
		}
		if ( has_shortcode( (string) $content, self::SHORTCODE ) ) {
			return $content;
		}
		return $content . self::shortcode();
	}

	public static function maybe_enqueue(): void {
		global $post;
		if ( ! is_singular() || ! $post || ! has_shortcode( (string) $post->post_content, self::SHORTCODE ) ) {
			return;
		}
		wp_enqueue_style( 'cpm-opl-checkout', CPM_OPL_URL . 'assets/checkout.css', [], CPM_OPL_VERSION );
	}

	public static function shortcode(): string {
		$enrollment_id = isset( $_GET['enr'] ) ? (int) $_GET['enr'] : 0;
		if ( ! $enrollment_id ) {
			return '';
		}

		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr ) {
			return '<div class="cpm-opl-error">Inschrijving niet gevonden.</div>';
		}

		$cohort   = Cohort_CPT::get( (int) $enr['cohort_id'] );
		$payments = DB::get_payments_for_enrollment( $enrollment_id );
		$paid     = array_filter(
			$payments,
			static fn( $p ) => in_array( $p['mollie_status'], [ 'paid', 'authorized' ], true )
		);

		ob_start();
		?>
		<section class="cpm-opl-page cpm-opl-status">
			<h2>Status van je inschrijving</h2>
			<p><strong><?php echo esc_html( $cohort['title'] ?? 'Opleiding' ); ?></strong></p>
			<p>
				<?php
				if ( count( $paid ) === count( $payments ) && $payments ) {
					echo 'Alle termijnen zijn betaald.';
				} elseif ( $paid ) {
					echo 'Je eerste betaling is ontvangen. Je plek is gereserveerd.';
				} else {
					echo 'We wachten nog op je eerste betaling. Controleer je e-mail voor de betaallink.';
				}
				?>
			</p>
			<?php if ( $payments && count( $paid ) < count( $payments ) ) : ?>
				<table class="cpm-opl-table">
					<thead>
						<tr>
							<th>Termijn</th>
							<th>Status</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $payments as $p ) : ?>
							<?php
							$is_paid = in_array( $p['mollie_status'], [ 'paid', 'authorized' ], true );
							$label   = $p['is_deposit'] ? 'Aanbetaling' : 'Termijn ' . (int) $p['termijn_index'];
							?>
							<tr>
								<td><?php echo esc_html( $label ); ?></td>
								<td><?php echo $is_paid ? 'Betaald' : 'Open'; ?></td>
								<td>
									<?php if ( ! $is_paid && ! empty( $p['mollie_url'] ) ) : ?>
										<a href="<?php echo esc_url( $p['mollie_url'] ); ?>">Betalen</a>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</section>
		<?php
		return (string) ob_get_clean();
	}
}
