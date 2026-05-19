<?php
/**
 * Variables in scope (set by Shortcode::render):
 *  - $cohort  array
 *  - $options int[]
 *  - $preview array{ base: array<int, …>, with_addon?: array<int, …> }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$fmt = static fn( int $cents ) => '€&nbsp;' . number_format( $cents / 100, 2, ',', '.' );
$fmt_excl = static fn( int $excl_cents ) => $fmt( $excl_cents ) . ' excl. btw';
$fmt_plan = static fn( int $incl_cents ) => $fmt_excl( Pricing::excl_from_incl_cents( $incl_cents ) );

$dutch_date = static function ( string $iso ): string {
	if ( ! $iso ) {
		return '';
	}
	$ts = strtotime( $iso );
	if ( ! $ts ) {
		return $iso;
	}
	$months = [ 1=>'januari', 2=>'februari', 3=>'maart', 4=>'april', 5=>'mei', 6=>'juni', 7=>'juli', 8=>'augustus', 9=>'september', 10=>'oktober', 11=>'november', 12=>'december' ];
	return (int) date( 'j', $ts ) . ' ' . $months[ (int) date( 'n', $ts ) ] . ' ' . date( 'Y', $ts );
};

$date_label = $cohort['end_date']
	? $dutch_date( $cohort['start_date'] ) . ' &amp; ' . $dutch_date( $cohort['end_date'] )
	: $dutch_date( $cohort['start_date'] );

$preview_base       = isset( $preview['base'] ) && is_array( $preview['base'] ) ? $preview['base'] : $preview;
$preview_with_addon = isset( $preview['with_addon'] ) && is_array( $preview['with_addon'] ) ? $preview['with_addon'] : null;
$total_excl = (int) ( $cohort['total_price_excl_cents'] ?? 0 );
if ( $total_excl <= 0 ) {
	$total_excl = (int) ( $cohort['total_price_cents'] ?? 0 );
}
$addon_price_excl = (int) ( $cohort['addon_price_excl_cents'] ?? 0 );
if ( $addon_price_excl <= 0 ) {
	$addon_price_excl = (int) ( $cohort['addon_price_cents'] ?? 0 );
}
$addon_date         = (string) ( $cohort['addon_date'] ?? '' );
$addon_label        = trim( (string) ( $cohort['addon_label'] ?? '' ) );
if ( $addon_date === '' && $addon_price_excl > 0 && ( $cohort['template'] ?? '' ) === 'masterclass-3d-nano-brows' ) {
	$start_iso = (string) ( $cohort['start_date'] ?? '' );
	if ( $start_iso !== '' ) {
		$month = (int) substr( $start_iso, 5, 2 );
		if ( $month <= 9 ) {
			$addon_date = '2026-11-18';
		} elseif ( $month === 11 ) {
			$addon_date = '2026-11-27';
		}
	}
}
$has_addon          = $addon_price_excl > 0 && $addon_date !== '';
if ( $addon_label === '' ) {
	$addon_label = 'Combi Brows-vervolgdag';
}
?>
<section class="cpm-opl-page" data-cohort-id="<?php echo esc_attr( $cohort['id'] ); ?>">

	<header class="cpm-opl-hero">
		<?php if ( ! empty( $cohort['eyebrow'] ) ) : ?>
			<span class="cpm-opl-eyebrow"><?php echo esc_html( $cohort['eyebrow'] ); ?></span>
		<?php endif; ?>
		<h2 class="cpm-opl-hero__title"><?php echo esc_html( $cohort['title'] ); ?></h2>
		<?php if ( $cohort['subtitle'] ) : ?>
			<p class="cpm-opl-hero__subtitle"><?php echo esc_html( $cohort['subtitle'] ); ?></p>
		<?php endif; ?>

		<dl class="cpm-opl-keyfacts">
			<div>
				<dt>Datum</dt>
				<dd><?php echo wp_kses_post( $date_label ); ?></dd>
			</div>
			<?php if ( $cohort['duration_label'] ) : ?>
				<div>
					<dt>Duur</dt>
					<dd><?php echo esc_html( $cohort['duration_label'] ); ?></dd>
				</div>
			<?php endif; ?>
			<?php if ( $cohort['location'] ) : ?>
				<div>
					<dt>Locatie</dt>
					<dd><?php echo esc_html( $cohort['location'] ); ?></dd>
				</div>
			<?php endif; ?>
			<?php if ( $cohort['trainer_name'] ) : ?>
				<div>
					<dt>Trainer</dt>
					<dd><?php echo esc_html( $cohort['trainer_name'] ); ?></dd>
				</div>
			<?php endif; ?>
			<div>
				<dt>Prijs</dt>
				<dd>
					<span
						class="cpm-opl-investment"
						data-cpm-inv-base="<?php echo esc_attr( (string) $total_excl ); ?>"
						data-cpm-inv-addon="<?php echo esc_attr( (string) $addon_price_excl ); ?>"
						data-cpm-inv-base-incl="<?php echo esc_attr( (string) (int) ( $cohort['total_price_cents'] ?? 0 ) ); ?>"
						data-cpm-inv-addon-incl="<?php echo esc_attr( (string) (int) round( $addon_price_excl * 1.21 ) ); ?>"
					>
						<?php echo wp_kses_post( $fmt_excl( $total_excl ) ); ?>
					</span>
				</dd>
			</div>
		</dl>
	</header>

	<?php if ( $cohort['intro_html'] ) : ?>
		<section class="cpm-opl-intro">
			<?php echo wp_kses_post( $cohort['intro_html'] ); ?>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $cohort['what_you_learn'] ) || ! empty( $cohort['includes'] ) ) : ?>
		<section class="cpm-opl-twocol">
			<?php if ( ! empty( $cohort['what_you_learn'] ) ) : ?>
				<article class="cpm-opl-card">
					<h3>Wat je leert</h3>
					<ul class="cpm-opl-checklist">
						<?php foreach ( $cohort['what_you_learn'] as $item ) : ?>
							<li><?php echo esc_html( $item ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
			<?php endif; ?>
			<?php if ( ! empty( $cohort['includes'] ) ) : ?>
				<article class="cpm-opl-card">
					<h3>Praktisch</h3>
					<ul class="cpm-opl-checklist">
						<?php foreach ( $cohort['includes'] as $item ) : ?>
							<li><?php echo esc_html( $item ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
			<?php endif; ?>
		</section>
	<?php endif; ?>

	<form class="cpm-opl-form" data-cpm-form="1" data-cohort-id="<?php echo esc_attr( $cohort['id'] ); ?>" novalidate>
		<?php if ( $has_addon && $preview_with_addon ) : ?>
			<section class="cpm-opl-section cpm-opl-addon">
				<label class="cpm-opl-addon__choice">
					<input type="checkbox" name="addon_combi" value="1">
					<span class="cpm-opl-addon__box">
						<span class="cpm-opl-addon__title">Optioneel — <?php echo esc_html( $addon_label ); ?></span>
						<span class="cpm-opl-addon__detail">
							Datum: <?php echo esc_html( $dutch_date( $addon_date ) ); ?>
							&nbsp;·&nbsp;+ <?php echo wp_kses_post( $fmt_excl( $addon_price_excl ) ); ?>
						</span>
					</span>
				</label>
			</section>
		<?php endif; ?>

		<section class="cpm-opl-section">
			<h3>Kies je betaalplan</h3>

			<?php if ( count( $options ) === 1 ) : ?>
				<p class="cpm-opl-note">
					De startdatum is binnen <?php echo (int) CPM_OPL_DEADLINE_DAYS; ?> dagen.
					Alleen <strong>1× volledig</strong> betalen is nu nog mogelijk.
				</p>
			<?php endif; ?>

			<div class="cpm-opl-plans" role="radiogroup" aria-label="Betaalplan">
				<?php foreach ( $options as $idx => $n ) : ?>
					<?php
					$plan       = $preview_base[ $n ] ?? [];
					$first_amt  = $plan[0]['amount_cents'] ?? 0;
					$per_term   = ( $n > 1 && ! empty( $plan ) ) ? end( $plan )['amount_cents'] : 0;
					$plan_label = $n === 1 ? 'In één keer' : ( $n === 2 ? 'In 2 termijnen' : 'In 3 termijnen' );
					?>
					<label class="cpm-opl-plan" data-cpm-plan-n="<?php echo (int) $n; ?>">
						<input type="radio" name="num_termijnen" value="<?php echo (int) $n; ?>" <?php checked( $idx === 0 ); ?> required>
						<span class="cpm-opl-plan-card">
							<span class="cpm-opl-plan-card__title"><?php echo esc_html( $plan_label ); ?></span>
							<span class="cpm-opl-plan-card__amount"><?php echo wp_kses_post( $fmt_plan( (int) $first_amt ) ); ?></span>
							<span class="cpm-opl-plan-card__sub">
								<?php if ( $n === 1 ) : ?>
									totaal, vandaag
								<?php else : ?>
									vandaag<?php echo $cohort['deposit_cents'] > 0 && $first_amt === (int) $cohort['deposit_cents'] ? ' (aanbetaling)' : ''; ?>
								<?php endif; ?>
							</span>
							<span class="cpm-opl-plan-card__rest">
								<?php if ( $n === 1 ) : ?>
									Geen vervolg&shy;termijnen
								<?php else : ?>
									Daarna <?php echo (int) ( $n - 1 ); ?>× <?php echo wp_kses_post( $fmt_plan( (int) $per_term ) ); ?>
								<?php endif; ?>
							</span>
						</span>
					</label>
				<?php endforeach; ?>
			</div>

			<div class="cpm-opl-schedule">
				<h4>Betalingsschema</h4>
				<p class="cpm-opl-note">Alle bedragen zijn excl. 21% btw.</p>
				<?php
				$default_n    = $options[0];
				$default_plan = $preview_base[ $default_n ] ?? [];
				?>
				<div data-cpm-schedule>
					<table class="cpm-opl-table">
						<thead><tr><th>Termijn</th><th>Vervalt</th><th>Bedrag</th></tr></thead>
						<tbody>
						<?php foreach ( $default_plan as $row ) : ?>
							<tr>
								<td><?php echo $row['is_deposit'] ? 'Aanbetaling' : 'Termijn ' . (int) $row['termijn']; ?></td>
								<td><?php echo esc_html( $dutch_date( (string) $row['due_date'] ) ); ?></td>
								<td><?php echo wp_kses_post( $fmt_plan( (int) $row['amount_cents'] ) ); ?></td>
							</tr>
						<?php endforeach; ?>
						</tbody>
					</table>
				</div>
			</div>

			<script type="application/json" id="cpm-opl-preview-data" data-cohort-id="<?php echo (int) $cohort['id']; ?>">
				<?php echo wp_json_encode( $preview ); ?>
			</script>
		</section>

		<section class="cpm-opl-section">
			<h3>Jouw gegevens</h3>
			<div class="cpm-opl-grid">
				<label>Voornaam<input name="first_name" required></label>
				<label>Achternaam<input name="last_name" required></label>
				<label>E-mail<input name="email" type="email" required></label>
				<label>Telefoon<input name="phone" type="tel" inputmode="tel"></label>
				<label class="cpm-opl-full">Bedrijf (optioneel)<input name="company"></label>
				<label class="cpm-opl-full">Adres<input name="address"></label>
				<label>Postcode<input name="postcode"></label>
				<label>Plaats<input name="city"></label>
				<label>Land<select name="country"><option value="NL" selected>Nederland</option><option value="BE">België</option><option value="DE">Duitsland</option></select></label>
			</div>
			<label class="cpm-opl-full cpm-opl-textarea">Opmerkingen (optioneel)<textarea name="notes" rows="3"></textarea></label>
			<label class="cpm-opl-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
		</section>

		<div class="cpm-opl-submit">
			<button type="submit" class="cpm-opl-button">
				<span>Inschrijven &amp; betalen</span>
			</button>
			<p class="cpm-opl-trust">
				Direct doorgestuurd naar <strong>Mollie</strong> — iDEAL, creditcard of Bancontact.
			</p>
		</div>
		<div class="cpm-opl-feedback" data-cpm-feedback role="status" aria-live="polite"></div>
	</form>

	<aside class="cpm-opl-help">
		<span>Vragen? <a href="mailto:info@coconpermanentemakeup.nl">info@coconpermanentemakeup.nl</a> · <a href="tel:+31104353799">010&nbsp;435&nbsp;3799</a></span>
	</aside>
</section>
