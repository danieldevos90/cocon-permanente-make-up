<?php
/**
 * Cart Page - Custom Two Column Layout with Custom Classes
 *
 * @package WooCommerce\Templates
 * @version 7.4.0
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_before_cart' ); ?>

<div class="coconpm-cart-grid">
	
	<!-- Left Column: Cart Table -->
	<div class="coconpm-cart-left">
		<form class="woocommerce-cart-form" action="<?php echo esc_url( wc_get_cart_url() ); ?>" method="post">
			<?php do_action( 'woocommerce_before_cart_table' ); ?>

			<div class="coconpm-cart-table">
				<!-- Table Header -->
				<div class="coconpm-cart-header">
					<div class="coconpm-header-remove"></div>
					<div class="coconpm-header-thumb"></div>
					<div class="coconpm-header-name"><?php esc_html_e( 'Product', 'woocommerce' ); ?></div>
					<div class="coconpm-header-price"><?php esc_html_e( 'Price', 'woocommerce' ); ?></div>
					<div class="coconpm-header-qty"><?php esc_html_e( 'Quantity', 'woocommerce' ); ?></div>
					<div class="coconpm-header-total"><?php esc_html_e( 'Subtotal', 'woocommerce' ); ?></div>
				</div>

				<!-- Cart Items -->
				<div class="coconpm-cart-items">
					<?php do_action( 'woocommerce_before_cart_contents' ); ?>

					<?php
					foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
						$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
						$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );

						if ( $_product && $_product->exists() && $cart_item['quantity'] > 0 && apply_filters( 'woocommerce_cart_item_visible', true, $cart_item, $cart_item_key ) ) {
							$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
							?>
							<div class="coconpm-cart-item <?php echo esc_attr( apply_filters( 'woocommerce_cart_item_class', 'cart_item', $cart_item, $cart_item_key ) ); ?>">

								<!-- Remove Button -->
								<div class="coconpm-item-remove">
									<?php
										echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
											'woocommerce_cart_item_remove_link',
											sprintf(
												'<a href="%s" class="coconpm-remove-btn" aria-label="%s" data-product_id="%s" data-product_sku="%s">&times;</a>',
												esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
												esc_html__( 'Remove this item', 'woocommerce' ),
												esc_attr( $product_id ),
												esc_attr( $_product->get_sku() )
											),
											$cart_item_key
										);
									?>
								</div>

								<!-- Product Thumbnail -->
								<div class="coconpm-item-thumb">
									<?php
									$thumbnail = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key );
									if ( ! $product_permalink ) {
										echo $thumbnail; // PHPCS: XSS ok.
									} else {
										printf( '<a href="%s">%s</a>', esc_url( $product_permalink ), $thumbnail ); // PHPCS: XSS ok.
									}
									?>
								</div>

								<!-- Product Name -->
								<div class="coconpm-item-name" data-title="<?php esc_attr_e( 'Product', 'woocommerce' ); ?>">
									<?php
									if ( ! $product_permalink ) {
										echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) );
									} else {
										echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', sprintf( '<a href="%s">%s</a>', esc_url( $product_permalink ), $_product->get_name() ), $cart_item, $cart_item_key ) );
									}
									do_action( 'woocommerce_after_cart_item_name', $cart_item, $cart_item_key );
									echo wc_get_formatted_cart_item_data( $cart_item ); // PHPCS: XSS ok.
									if ( $_product->backorders_require_notification() && $_product->is_on_backorder( $cart_item['quantity'] ) ) {
										echo wp_kses_post( apply_filters( 'woocommerce_cart_item_backorder_notification', '<p class="backorder_notification">' . esc_html__( 'Available on backorder', 'woocommerce' ) . '</p>', $product_id ) );
									}
									?>
								</div>

								<!-- Product Price -->
								<div class="coconpm-item-price" data-title="<?php esc_attr_e( 'Price', 'woocommerce' ); ?>">
									<?php echo apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key ); // PHPCS: XSS ok. ?>
								</div>

								<!-- Quantity -->
								<div class="coconpm-item-qty" data-title="<?php esc_attr_e( 'Quantity', 'woocommerce' ); ?>">
									<?php
									if ( $_product->is_sold_individually() ) {
										$product_quantity = sprintf( '1 <input type="hidden" name="cart[%s][qty]" value="1" />', $cart_item_key );
									} else {
										$product_quantity = woocommerce_quantity_input(
											array(
												'input_name'   => "cart[{$cart_item_key}][qty]",
												'input_value'  => $cart_item['quantity'],
												'max_value'    => $_product->get_max_purchase_quantity(),
												'min_value'    => '0',
												'product_name' => $_product->get_name(),
											),
											$_product,
											false
										);
									}
									echo apply_filters( 'woocommerce_cart_item_quantity', $product_quantity, $cart_item_key, $cart_item ); // PHPCS: XSS ok.
									?>
								</div>

								<!-- Subtotal -->
								<div class="coconpm-item-total" data-title="<?php esc_attr_e( 'Subtotal', 'woocommerce' ); ?>">
									<?php echo apply_filters( 'woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ), $cart_item, $cart_item_key ); // PHPCS: XSS ok. ?>
								</div>

							</div>
							<?php
						}
					}
					?>
					<?php do_action( 'woocommerce_cart_contents' ); ?>
				</div>

				<!-- Cart Actions -->
				<div class="coconpm-cart-actions">
					<?php if ( wc_coupons_enabled() ) { ?>
						<div class="coconpm-coupon">
							<label for="coupon_code"><?php esc_html_e( 'Coupon:', 'woocommerce' ); ?></label> 
							<input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="<?php esc_attr_e( 'Coupon code', 'woocommerce' ); ?>" /> 
							<button type="submit" class="button" name="apply_coupon" value="<?php esc_attr_e( 'Apply coupon', 'woocommerce' ); ?>"><?php esc_attr_e( 'Apply coupon', 'woocommerce' ); ?></button>
							<?php do_action( 'woocommerce_cart_coupon' ); ?>
						</div>
					<?php } ?>

					<button type="submit" class="button" name="update_cart" value="<?php esc_attr_e( 'Update cart', 'woocommerce' ); ?>"><?php esc_html_e( 'Update cart', 'woocommerce' ); ?></button>

					<?php do_action( 'woocommerce_cart_actions' ); ?>
					<?php wp_nonce_field( 'woocommerce-cart', 'woocommerce-cart-nonce' ); ?>
				</div>

				<?php do_action( 'woocommerce_after_cart_contents' ); ?>
			</div>

			<?php do_action( 'woocommerce_after_cart_table' ); ?>
		</form>
	</div>
	
	<!-- Right Column: Cart Totals -->
	<div class="coconpm-cart-right">
		<?php do_action( 'woocommerce_before_cart_collaterals' ); ?>

		<div class="cart-collaterals">
			<div class="cart_totals <?php echo ( WC()->customer->has_calculated_shipping() ) ? 'calculated_shipping' : ''; ?>">
				
				<?php do_action( 'woocommerce_before_cart_totals' ); ?>
				
				<h2><?php esc_html_e( 'Cart totals', 'woocommerce' ); ?></h2>
				
				<table cellspacing="0" class="shop_table shop_table_responsive">
					
					<tr class="cart-subtotal">
						<th><?php esc_html_e( 'Subtotal', 'woocommerce' ); ?></th>
						<td data-title="<?php esc_attr_e( 'Subtotal', 'woocommerce' ); ?>"><?php wc_cart_totals_subtotal_html(); ?></td>
					</tr>
					
					<?php foreach ( WC()->cart->get_coupons() as $code => $coupon ) : ?>
						<tr class="cart-discount coupon-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
							<th><?php wc_cart_totals_coupon_label( $coupon ); ?></th>
							<td data-title="<?php echo esc_attr( wc_cart_totals_coupon_label( $coupon, false ) ); ?>"><?php wc_cart_totals_coupon_html( $coupon ); ?></td>
						</tr>
					<?php endforeach; ?>
					
					<?php if ( WC()->cart->needs_shipping() && WC()->cart->show_shipping() ) : ?>
						
						<?php do_action( 'woocommerce_cart_totals_before_shipping' ); ?>
						
						<?php
						// Custom shipping display - show only free shipping when available
						$packages = WC()->shipping()->get_packages();
						$package = reset( $packages ); // Get first package
						
						if ( $package && isset( $package['rates'] ) && ! empty( $package['rates'] ) ) {
							$available_methods = $package['rates'];
							$chosen_method = isset( WC()->session->chosen_shipping_methods[0] ) ? WC()->session->chosen_shipping_methods[0] : '';
							
							// Check if free shipping is available
							$has_free_shipping = false;
							$free_shipping_method = null;
							
							foreach ( $available_methods as $method_id => $method ) {
								if ( $method->cost == 0 || strpos( $method_id, 'free_shipping' ) !== false || strpos( strtolower( $method->label ), 'gratis' ) !== false ) {
									$has_free_shipping = true;
									$free_shipping_method = $method;
									// If free shipping exists, select it
									WC()->session->set( 'chosen_shipping_methods', array( $method_id ) );
									break;
								}
							}
							
							// Display shipping options
							?>
							<tr class="woocommerce-shipping-totals shipping">
								<th><?php echo esc_html( __( 'Shipping', 'woocommerce' ) ); ?></th>
								<td data-title="<?php echo esc_attr( __( 'Shipping', 'woocommerce' ) ); ?>">
									<?php if ( $has_free_shipping ) : ?>
										<!-- Show only free shipping when available -->
										<ul id="shipping_method" class="woocommerce-shipping-methods">
											<li>
												<input type="radio" name="shipping_method[0]" data-index="0" id="shipping_method_0_<?php echo esc_attr( sanitize_title( $free_shipping_method->id ) ); ?>" value="<?php echo esc_attr( $free_shipping_method->id ); ?>" class="shipping_method" checked="checked" />
												<label for="shipping_method_0_<?php echo esc_attr( sanitize_title( $free_shipping_method->id ) ); ?>"><?php echo wp_kses_post( wc_cart_totals_shipping_method_label( $free_shipping_method ) ); ?></label>
											</li>
										</ul>
									<?php else : ?>
										<!-- Show all shipping methods when no free shipping -->
										<ul id="shipping_method" class="woocommerce-shipping-methods">
											<?php foreach ( $available_methods as $method ) : ?>
												<li>
													<input type="radio" name="shipping_method[0]" data-index="0" id="shipping_method_0_<?php echo esc_attr( sanitize_title( $method->id ) ); ?>" value="<?php echo esc_attr( $method->id ); ?>" class="shipping_method" <?php checked( $method->id, $chosen_method ); ?> />
													<label for="shipping_method_0_<?php echo esc_attr( sanitize_title( $method->id ) ); ?>"><?php echo wp_kses_post( wc_cart_totals_shipping_method_label( $method ) ); ?></label>
												</li>
											<?php endforeach; ?>
										</ul>
									<?php endif; ?>
									
									<?php
									// Show shipping address
									if ( WC()->customer->get_shipping_postcode() ) {
										?>
										<p class="woocommerce-shipping-destination">
											<?php
											echo esc_html__( 'Shipping to', 'woocommerce' ) . ' <strong>' . esc_html( WC()->customer->get_shipping_postcode() ) . ' ' . esc_html( WC()->customer->get_shipping_city() ) . '</strong>.';
											?>
											<br>
											<a href="<?php echo esc_url( wc_get_cart_url() ); ?>#calc_shipping" class="shipping-calculator-button"><?php echo esc_html__( 'Change address', 'woocommerce' ); ?></a>
										</p>
										<?php
									}
									?>
								</td>
							</tr>
							<?php
						} else {
							// No shipping methods available or address not entered
							?>
							<tr class="shipping">
								<th><?php esc_html_e( 'Shipping', 'woocommerce' ); ?></th>
								<td data-title="<?php esc_attr_e( 'Shipping', 'woocommerce' ); ?>"><?php woocommerce_shipping_calculator(); ?></td>
							</tr>
							<?php
						}
						?>
						
						<?php do_action( 'woocommerce_cart_totals_after_shipping' ); ?>
						
					<?php elseif ( WC()->cart->needs_shipping() && 'yes' === get_option( 'woocommerce_enable_shipping_calc' ) ) : ?>
						
						<tr class="shipping">
							<th><?php esc_html_e( 'Shipping', 'woocommerce' ); ?></th>
							<td data-title="<?php esc_attr_e( 'Shipping', 'woocommerce' ); ?>"><?php woocommerce_shipping_calculator(); ?></td>
						</tr>
						
					<?php endif; ?>
					
					<?php foreach ( WC()->cart->get_fees() as $fee ) : ?>
						<tr class="fee">
							<th><?php echo esc_html( $fee->name ); ?></th>
							<td data-title="<?php echo esc_attr( $fee->name ); ?>"><?php wc_cart_totals_fee_html( $fee ); ?></td>
						</tr>
					<?php endforeach; ?>
					
					<?php
					if ( wc_tax_enabled() && ! WC()->cart->display_prices_including_tax() ) {
						$taxable_address = WC()->customer->get_taxable_address();
						$estimated_text  = '';
						
						if ( WC()->customer->is_customer_outside_base() && ! WC()->customer->has_calculated_shipping() ) {
							/* translators: %s location. */
							$estimated_text = sprintf( ' <small>' . esc_html__( '(estimated for %s)', 'woocommerce' ) . '</small>', WC()->countries->estimated_for_prefix( $taxable_address[0] ) . WC()->countries->countries[ $taxable_address[0] ] );
						}
						
						if ( 'itemized' === get_option( 'woocommerce_tax_total_display' ) ) {
							foreach ( WC()->cart->get_tax_totals() as $code => $tax ) { // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
								?>
								<tr class="tax-rate tax-rate-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
									<th><?php echo esc_html( $tax->label ) . $estimated_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></th>
									<td data-title="<?php echo esc_attr( $tax->label ); ?>"><?php echo wp_kses_post( $tax->formatted_amount ); ?></td>
								</tr>
								<?php
							}
						} else {
							?>
							<tr class="tax-total">
								<th><?php echo esc_html( WC()->countries->tax_or_vat() ) . $estimated_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></th>
								<td data-title="<?php echo esc_attr( WC()->countries->tax_or_vat() ); ?>"><?php wc_cart_totals_taxes_total_html(); ?></td>
							</tr>
							<?php
						}
					}
					?>
					
					<?php do_action( 'woocommerce_cart_totals_before_order_total' ); ?>
					
					<tr class="order-total">
						<th><?php esc_html_e( 'Total', 'woocommerce' ); ?></th>
						<td data-title="<?php esc_attr_e( 'Total', 'woocommerce' ); ?>"><?php wc_cart_totals_order_total_html(); ?></td>
					</tr>
					
					<?php do_action( 'woocommerce_cart_totals_after_order_total' ); ?>
					
				</table>
				
				<div class="wc-proceed-to-checkout">
					<?php do_action( 'woocommerce_proceed_to_checkout' ); ?>
				</div>
				
				<?php do_action( 'woocommerce_after_cart_totals' ); ?>
				
			</div>
		</div>
	</div>

</div><!-- .coconpm-cart-grid -->

<?php do_action( 'woocommerce_after_cart' ); ?>
