<?php
/**
 * Checkout Form - Custom COCONPM Layout
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/checkout/form-checkout.php.
 *
 * @package WooCommerce\Templates
 * @version 3.5.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_before_checkout_form', $checkout );

// If checkout registration is disabled and not logged in, the user cannot checkout.
if ( ! $checkout->is_registration_enabled() && $checkout->is_registration_required() && ! is_user_logged_in() ) {
	echo esc_html( apply_filters( 'woocommerce_checkout_must_be_logged_in_message', __( 'You must be logged in to checkout.', 'woocommerce' ) ) );
	return;
}

?>

<div class="coconpm-checkout-page">
	<div class="coconpm-checkout-wrapper">
		
		<form name="checkout" method="post" class="checkout woocommerce-checkout coconpm-checkout-form" action="<?php echo esc_url( wc_get_checkout_url() ); ?>" enctype="multipart/form-data">

			<div class="coconpm-checkout-grid">
				
				<!-- Left Column: Customer Details -->
				<div class="coconpm-checkout-left">
					
					<?php if ( $checkout->get_checkout_fields() ) : ?>

						<?php do_action( 'woocommerce_checkout_before_customer_details' ); ?>

						<div class="coconpm-customer-details" id="customer_details">
							
							<!-- Billing Information -->
							<div class="coconpm-checkout-section coconpm-billing-section">
								<div class="coconpm-checkout-section-header">
									<h3 class="coconpm-checkout-section-title"><?php esc_html_e( 'Billing details', 'woocommerce' ); ?></h3>
								</div>
								<div class="coconpm-checkout-section-body">
									<?php do_action( 'woocommerce_checkout_billing' ); ?>
								</div>
							</div>

							<!-- Shipping Information -->
							<?php if ( WC()->cart->needs_shipping_address() === true ) : ?>
								<div class="coconpm-checkout-section coconpm-shipping-section">
									<div class="coconpm-checkout-section-header">
										<h3 class="coconpm-checkout-section-title"><?php esc_html_e( 'Shipping details', 'woocommerce' ); ?></h3>
									</div>
									<div class="coconpm-checkout-section-body">
										<?php do_action( 'woocommerce_checkout_shipping' ); ?>
									</div>
								</div>
							<?php endif; ?>

						</div>

						<?php do_action( 'woocommerce_checkout_after_customer_details' ); ?>

					<?php endif; ?>

					<!-- Additional Information -->
					<?php do_action( 'woocommerce_checkout_before_order_review_heading' ); ?>

				</div>
				
				<!-- Right Column: Order Review -->
				<div class="coconpm-checkout-right">
					
					<div class="coconpm-order-review">
						<div class="coconpm-order-review-header">
							<h3 class="coconpm-order-review-title" id="order_review_heading"><?php esc_html_e( 'Your order', 'woocommerce' ); ?></h3>
						</div>
						
						<div class="coconpm-order-review-body">
							
							<?php do_action( 'woocommerce_checkout_before_order_review' ); ?>

							<div id="order_review" class="woocommerce-checkout-review-order">
								<?php do_action( 'woocommerce_checkout_order_review' ); ?>
							</div>

							<?php do_action( 'woocommerce_checkout_after_order_review' ); ?>
							
						</div>
					</div>

				</div>

			</div><!-- .coconpm-checkout-grid -->

		</form>

	</div><!-- .coconpm-checkout-wrapper -->
</div><!-- .coconpm-checkout-page -->

<?php do_action( 'woocommerce_after_checkout_form', $checkout ); ?>

