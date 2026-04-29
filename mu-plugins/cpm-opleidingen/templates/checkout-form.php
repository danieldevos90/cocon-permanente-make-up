<?php
/**
 * Variables in scope (set by Shortcode::render):
 *  - $cohort  array
 *  - $options int[]
 *  - $preview array<int, array<int, array{termijn,is_deposit,amount_cents,due_date}>>
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$fmt = static fn( int $cents ) => '€&nbsp;' . number_format( $cents / 100, 2, ',', '.' );

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

$rest_after_deposit = max( 0, (int) $cohort['total_price_cents'] - (int) $cohort['deposit_cents'] );
$has_hero           = ! empty( $cohort['hero_image_url'] );
?>
<section class="cpm-opl-page" data-cohort-id="<?php echo esc_attr( $cohort['id'] ); ?>">

	<header class="cpm-opl-hero<?php echo $has_hero ? ' cpm-opl-hero--image' : ''; ?>"
			<?php if ( $has_hero ) : ?>style="background-image:url('<?php echo esc_url( $cohort['hero_image_url'] ); ?>')"<?php endif; ?>>
		<div class="cpm-opl-hero__inner">
			<?php if ( $cohort['level'] ) : ?>
				<span class="cpm-opl-eyebrow"><?php echo esc_html( $cohort['level'] ); ?></span>
			<?php endif; ?>
			<h2 class="cpm-opl-hero__title"><?php echo esc_html( $cohort['title'] ); ?></h2>
			<?php if ( $cohort['subtitle'] ) : ?>
				<p class="cpm-opl-hero__subtitle"><?php echo esc_html( $cohort['subtitle'] ); ?></p>
			<?php endif; ?>

			<dl class="cpm-opl-keyfacts">
				<div>
					<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10h5v5H7zM19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14z"/></svg> Datum</dt>
					<dd><?php echo wp_kses_post( $date_label ); ?></dd>
				</div>
				<?php if ( $cohort['duration_label'] ) : ?>
					<div>
						<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.5 11H7v-2h3.5V6.5h2V13z"/></svg> Duur</dt>
						<dd><?php echo esc_html( $cohort['duration_label'] ); ?></dd>
					</div>
				<?php endif; ?>
				<?php if ( $cohort['location'] ) : ?>
					<div>
						<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg> Locatie</dt>
						<dd><?php echo esc_html( $cohort['location'] ); ?></dd>
					</div>
				<?php endif; ?>
				<?php if ( $cohort['max_students'] ) : ?>
					<div>
						<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 0a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4zm8 0c-.3 0-.7 0-1.1.1A5.6 5.6 0 0 1 18 17v3h6v-3c0-2.7-5.3-4-8-4z"/></svg> Groep</dt>
						<dd>max. <?php echo (int) $cohort['max_students']; ?> studenten</dd>
					</div>
				<?php endif; ?>
				<div>
					<dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1v22M5 8h11.5a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 0 0 5h12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg> Investering</dt>
					<dd><?php echo wp_kses_post( $fmt( (int) $cohort['total_price_cents'] ) ); ?> excl. btw</dd>
				</div>
			</dl>
		</div>
	</header>

	<?php if ( $cohort['intro_html'] ) : ?>
		<section class="cpm-opl-intro">
			<?php echo wp_kses_post( $cohort['intro_html'] ); ?>
		</section>
	<?php endif; ?>

	<?php if ( ! empty( $cohort['what_you_learn'] ) || ! empty( $cohort['includes'] ) ) : ?>
		<section class="cpm-opl-twocol">
			<?php if ( ! empty( $cohort['what_you_learn'] ) ) : ?>
				<article class="cpm-opl-card cpm-opl-card--learn">
					<h3>Wat je gaat leren</h3>
					<ul class="cpm-opl-checklist">
						<?php foreach ( $cohort['what_you_learn'] as $item ) : ?>
							<li><?php echo esc_html( $item ); ?></li>
						<?php endforeach; ?>
					</ul>
				</article>
			<?php endif; ?>
			<?php if ( ! empty( $cohort['includes'] ) ) : ?>
				<article class="cpm-opl-card cpm-opl-card--includes">
					<h3>Wat zit erbij</h3>
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
		<section class="cpm-opl-section cpm-opl-section--plans">
			<div class="cpm-opl-section__head">
				<span class="cpm-opl-step">1</span>
				<div>
					<h3>Kies je betaalplan</h3>
					<p>Betaal in 1, 2 of 3 termijnen — eerste betaling vandaag, rest automatisch via een Mollie-link per e-mail.</p>
				</div>
			</div>

			<?php if ( count( $options ) === 1 ) : ?>
				<p class="cpm-opl-note">
					De startdatum (<strong><?php echo esc_html( $dutch_date( $cohort['start_date'] ) ); ?></strong>)
					is binnen <?php echo (int) CPM_OPL_DEADLINE_DAYS; ?> dagen, dus alleen
					<strong>1× volledig</strong> betalen is nog mogelijk.
				</p>
			<?php endif; ?>

			<div class="cpm-opl-plans" role="radiogroup" aria-label="Betaalplan">
				<?php foreach ( $options as $idx => $n ) : ?>
					<?php
					$plan      = $preview[ $n ] ?? [];
					$first_amt = $plan[0]['amount_cents'] ?? 0;
					$per_term  = ( $n > 1 && ! empty( $plan ) ) ? end( $plan )['amount_cents'] : 0;
					$plan_label = $n === 1 ? 'In één keer' : ( $n === 2 ? 'In 2 termijnen' : 'In 3 termijnen' );
					?>
					<label class="cpm-opl-plan">
						<input type="radio" name="num_termijnen" value="<?php echo (int) $n; ?>" <?php checked( $idx === 0 ); ?> required>
						<span class="cpm-opl-plan-card">
							<span class="cpm-opl-plan-card__badge"><?php echo (int) $n; ?>×</span>
							<strong class="cpm-opl-plan-card__title"><?php echo esc_html( $plan_label ); ?></strong>
							<span class="cpm-opl-plan-card__pay">
								<?php if ( $n === 1 ) : ?>
									<span class="cpm-opl-plan-card__amount"><?php echo wp_kses_post( $fmt( (int) $cohort['total_price_cents'] ) ); ?></span>
									<small>vandaag, klaar</small>
								<?php else : ?>
									<span class="cpm-opl-plan-card__amount"><?php echo wp_kses_post( $fmt( (int) $first_amt ) ); ?></span>
									<small>vandaag<?php echo $cohort['deposit_cents'] > 0 && $first_amt === (int) $cohort['deposit_cents'] ? ' (aanbetaling)' : ''; ?></small>
								<?php endif; ?>
							</span>
							<?php if ( $n > 1 ) : ?>
								<span class="cpm-opl-plan-card__rest">
									Daarna <?php echo (int) ( $n - 1 ); ?>× <?php echo wp_kses_post( $fmt( (int) $per_term ) ); ?>
								</span>
							<?php endif; ?>
						</span>
					</label>
				<?php endforeach; ?>
			</div>

			<div class="cpm-opl-schedule">
				<h4>Jouw betalingsschema</h4>
				<?php
				$default_n    = $options[0];
				$default_plan = $preview[ $default_n ] ?? [];
				?>
				<div data-cpm-schedule>
					<table class="cpm-opl-table">
						<thead><tr><th>Termijn</th><th>Vervalt</th><th>Bedrag</th></tr></thead>
						<tbody>
						<?php foreach ( $default_plan as $row ) : ?>
							<tr>
								<td><?php echo $row['is_deposit'] ? 'Aanbetaling' : 'Termijn ' . (int) $row['termijn']; ?></td>
								<td><?php echo esc_html( $dutch_date( (string) $row['due_date'] ) ); ?></td>
								<td><?php echo wp_kses_post( $fmt( (int) $row['amount_cents'] ) ); ?></td>
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

		<section class="cpm-opl-section cpm-opl-section--details">
			<div class="cpm-opl-section__head">
				<span class="cpm-opl-step">2</span>
				<div>
					<h3>Jouw gegevens</h3>
					<p>We sturen je bevestigingsmail naar dit adres met het complete betalingsschema.</p>
				</div>
			</div>
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
			<label class="cpm-opl-full cpm-opl-textarea">Opmerkingen (optioneel)<textarea name="notes" rows="3" placeholder="Allergieën, vragen of iets dat we moeten weten…"></textarea></label>
			<label class="cpm-opl-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
		</section>

		<section class="cpm-opl-submit">
			<button type="submit" class="cpm-opl-button">
				<span>Inschrijven &amp; eerste betaling</span>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
			<p class="cpm-opl-trust">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.4-1.4 2.6 2.6 6.6-6.6L18 9l-8 8z"/></svg>
				Je wordt direct doorgestuurd naar <strong>Mollie</strong> voor je eerste betaling. Veilig met iDEAL, creditcard of Bancontact.
			</p>
		</section>
		<div class="cpm-opl-feedback" data-cpm-feedback role="status" aria-live="polite"></div>
	</form>

	<aside class="cpm-opl-help">
		<strong>Vragen vóór je inschrijft?</strong>
		<a href="mailto:info@coconpermanentemakeup.nl">info@coconpermanentemakeup.nl</a>
		<a href="tel:+31102234123">010&nbsp;&minus;&nbsp;223&nbsp;4123</a>
	</aside>
</section>
