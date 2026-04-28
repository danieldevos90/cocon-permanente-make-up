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

$fmt = static fn( int $cents ) => '€ ' . number_format( $cents / 100, 2, ',', '.' );
?>
<form class="cpm-opl-form" data-cpm-form="1" data-cohort-id="<?php echo esc_attr( $cohort['id'] ); ?>" novalidate>
	<header class="cpm-opl-header">
		<h2><?php echo esc_html( $cohort['title'] ); ?></h2>
		<dl class="cpm-opl-meta">
			<div><dt>Startdatum</dt><dd><?php echo esc_html( $cohort['start_date'] ); ?></dd></div>
			<?php if ( $cohort['end_date'] ) : ?>
				<div><dt>Einddatum</dt><dd><?php echo esc_html( $cohort['end_date'] ); ?></dd></div>
			<?php endif; ?>
			<?php if ( $cohort['location'] ) : ?>
				<div><dt>Locatie</dt><dd><?php echo esc_html( $cohort['location'] ); ?></dd></div>
			<?php endif; ?>
			<div><dt>Totaal</dt><dd><?php echo esc_html( $fmt( (int) $cohort['total_price_cents'] ) ); ?></dd></div>
			<?php if ( $cohort['deposit_cents'] > 0 ) : ?>
				<div><dt>Aanbetaling</dt><dd><?php echo esc_html( $fmt( (int) $cohort['deposit_cents'] ) ); ?></dd></div>
			<?php endif; ?>
		</dl>
	</header>

	<fieldset class="cpm-opl-section">
		<legend>1. Hoe wil je betalen?</legend>
		<?php if ( count( $options ) === 1 ) : ?>
			<p class="cpm-opl-note">
				De startdatum (<strong><?php echo esc_html( $cohort['start_date'] ); ?></strong>) is binnen
				<?php echo (int) CPM_OPL_DEADLINE_DAYS; ?> dagen, dus alleen <strong>1× volledig</strong>
				betalen is nog mogelijk.
			</p>
		<?php endif; ?>
		<div class="cpm-opl-plans">
			<?php foreach ( $options as $idx => $n ) : ?>
				<?php
				$plan        = $preview[ $n ] ?? [];
				$first_due   = $plan[0]['due_date'] ?? '';
				$first_amt   = $plan[0]['amount_cents'] ?? 0;
				?>
				<label class="cpm-opl-plan">
					<input type="radio" name="num_termijnen" value="<?php echo (int) $n; ?>" <?php checked( $idx === 0 ); ?> required>
					<span class="cpm-opl-plan-card">
						<strong><?php echo (int) $n; ?>x betalen</strong>
						<small>
							<?php
							if ( $n === 1 ) {
								echo 'Volledig nu (' . esc_html( $fmt( (int) $cohort['total_price_cents'] ) ) . ')';
							} else {
								echo 'Vandaag: <strong>' . esc_html( $fmt( (int) $first_amt ) ) . '</strong>';
							}
							?>
						</small>
					</span>
				</label>
			<?php endforeach; ?>
		</div>

		<div class="cpm-opl-schedule" data-cpm-schedule>
			<?php
			// Server-side preview voor de default keuze (eerste optie):
			$default_n    = $options[0];
			$default_plan = $preview[ $default_n ] ?? [];
			?>
			<table class="cpm-opl-table">
				<thead><tr><th>Termijn</th><th>Vervaldatum</th><th style="text-align:right">Bedrag</th></tr></thead>
				<tbody>
				<?php foreach ( $default_plan as $row ) : ?>
					<tr>
						<td><?php echo $row['is_deposit'] ? 'Aanbetaling' : 'Termijn ' . (int) $row['termijn']; ?></td>
						<td><?php echo esc_html( $row['due_date'] ); ?></td>
						<td style="text-align:right"><?php echo esc_html( $fmt( (int) $row['amount_cents'] ) ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		</div>

		<script type="application/json" id="cpm-opl-preview-data" data-cohort-id="<?php echo (int) $cohort['id']; ?>">
			<?php echo wp_json_encode( $preview ); ?>
		</script>
	</fieldset>

	<fieldset class="cpm-opl-section">
		<legend>2. Jouw gegevens</legend>
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
		<label class="cpm-opl-full">Opmerkingen (optioneel)<textarea name="notes" rows="3"></textarea></label>
		<label class="cpm-opl-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
	</fieldset>

	<div class="cpm-opl-submit">
		<button type="submit" class="cpm-opl-button">
			Inschrijven en betalen
		</button>
		<small>Je wordt na bevestiging direct doorgestuurd naar Mollie voor de eerste betaling. De resterende termijnen ontvang je per e-mail.</small>
	</div>
	<div class="cpm-opl-feedback" data-cpm-feedback role="status" aria-live="polite"></div>
</form>
