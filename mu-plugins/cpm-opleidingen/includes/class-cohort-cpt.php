<?php
/**
 * Cohort = a single instance of a training (e.g. "PMU wenkbrauwen — start 4 mei 2026").
 *
 * Stored as a CPT so we keep WP-native admin UX (lists, search, revisions).
 * Pricing & dates live in post_meta, not in the post_content body.
 *
 * Meta:
 *   _cpm_start_date          (YYYY-MM-DD)  — first training day
 *   _cpm_end_date            (YYYY-MM-DD)  — last training day (optional)
 *   _cpm_total_price_cents   (int)         — full course price in cents
 *   _cpm_deposit_cents       (int)         — non-refundable deposit (paid up-front in plan ≥ 2)
 *   _cpm_max_termijnen       (int 1..3)    — caps the dropdown the customer sees
 *   _cpm_max_students        (int)
 *   _cpm_location            (string)
 *   _cpm_currency            (default EUR)
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cohort_CPT {

	const POST_TYPE = 'cpm_cohort';

	public static function register(): void {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'init', [ __CLASS__, 'register_meta' ], 11 );
		add_action( 'add_meta_boxes', [ __CLASS__, 'register_meta_box' ] );
		add_action( 'save_post_' . self::POST_TYPE, [ __CLASS__, 'save_meta' ], 10, 2 );
	}

	/**
	 * Expose all cohort meta keys via REST so the agent + admins can create cohorts
	 * via POST /wp/v2/cpm_cohort with `meta: { … }`.
	 */
	public static function register_meta(): void {
		$auth = static fn() => current_user_can( 'edit_posts' );
		$keys = [
			'_cpm_start_date'        => 'string',
			'_cpm_end_date'          => 'string',
			'_cpm_total_price_cents' => 'integer',
			'_cpm_deposit_cents'     => 'integer',
			'_cpm_max_termijnen'     => 'integer',
			'_cpm_max_students'      => 'integer',
			'_cpm_location'          => 'string',
			'_cpm_currency'          => 'string',
		];
		foreach ( $keys as $key => $type ) {
			register_post_meta(
				self::POST_TYPE,
				$key,
				[
					'type'              => $type,
					'single'            => true,
					'show_in_rest'      => true,
					'auth_callback'     => $auth,
					'sanitize_callback' => $type === 'integer'
						? static fn( $v ) => (int) $v
						: 'sanitize_text_field',
				]
			);
		}
	}

	public static function register_post_type(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'       => [
					'name'          => 'Opleidingscohorten',
					'singular_name' => 'Cohort',
					'add_new_item'  => 'Nieuw cohort',
					'edit_item'     => 'Cohort bewerken',
					'menu_name'     => 'Opleidingen',
				],
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => true,
				'menu_icon'    => 'dashicons-welcome-learn-more',
				'menu_position'=> 58,
				'supports'     => [ 'title', 'editor' ],
				'has_archive'  => false,
				'show_in_rest' => true,
			]
		);
	}

	public static function register_meta_box(): void {
		add_meta_box(
			'cpm_cohort_details',
			'Cohort details',
			[ __CLASS__, 'render_meta_box' ],
			self::POST_TYPE,
			'normal',
			'high'
		);
	}

	public static function render_meta_box( \WP_Post $post ): void {
		wp_nonce_field( 'cpm_cohort_save', 'cpm_cohort_nonce' );
		$start    = get_post_meta( $post->ID, '_cpm_start_date', true );
		$end      = get_post_meta( $post->ID, '_cpm_end_date', true );
		$price    = (int) get_post_meta( $post->ID, '_cpm_total_price_cents', true );
		$deposit  = (int) get_post_meta( $post->ID, '_cpm_deposit_cents', true );
		$max_term = (int) get_post_meta( $post->ID, '_cpm_max_termijnen', true ) ?: 3;
		$max_stud = (int) get_post_meta( $post->ID, '_cpm_max_students', true ) ?: 5;
		$location = (string) get_post_meta( $post->ID, '_cpm_location', true );
		$currency = (string) get_post_meta( $post->ID, '_cpm_currency', true ) ?: 'EUR';
		?>
		<style>
			.cpm-cohort-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px 24px; max-width:780px; }
			.cpm-cohort-grid label { display:block; font-weight:600; margin-bottom:4px; }
			.cpm-cohort-grid input { width:100%; }
			.cpm-cohort-grid .full { grid-column: 1 / -1; }
			.cpm-money-hint { color:#6b6b6b; font-size:12px; margin-top:4px; }
		</style>
		<div class="cpm-cohort-grid">
			<div>
				<label>Startdatum opleiding</label>
				<input type="date" name="cpm_start_date" value="<?php echo esc_attr( $start ); ?>" required>
			</div>
			<div>
				<label>Einddatum (optioneel)</label>
				<input type="date" name="cpm_end_date" value="<?php echo esc_attr( $end ); ?>">
			</div>
			<div>
				<label>Totale prijs (in centen, excl. btw)</label>
				<input type="number" min="0" step="1" name="cpm_total_price_cents" value="<?php echo esc_attr( $price ); ?>" required>
				<div class="cpm-money-hint">Voorbeeld: <code>595000</code> = € 5.950,00</div>
			</div>
			<div>
				<label>Aanbetaling (in centen)</label>
				<input type="number" min="0" step="1" name="cpm_deposit_cents" value="<?php echo esc_attr( $deposit ); ?>">
				<div class="cpm-money-hint">Wordt direct bij inschrijving in rekening gebracht. Vul <code>0</code> als er géén aparte aanbetaling is.</div>
			</div>
			<div>
				<label>Max. aantal termijnen</label>
				<select name="cpm_max_termijnen">
					<?php foreach ( [ 1, 2, 3 ] as $opt ) : ?>
						<option value="<?php echo $opt; ?>" <?php selected( $max_term, $opt ); ?>><?php echo $opt; ?>x</option>
					<?php endforeach; ?>
				</select>
			</div>
			<div>
				<label>Max. studenten</label>
				<input type="number" min="1" step="1" name="cpm_max_students" value="<?php echo esc_attr( $max_stud ); ?>">
			</div>
			<div class="full">
				<label>Locatie</label>
				<input type="text" name="cpm_location" value="<?php echo esc_attr( $location ); ?>" placeholder="Korte Hoogstraat 29A, Vlaardingen">
			</div>
			<div>
				<label>Valuta</label>
				<input type="text" maxlength="3" name="cpm_currency" value="<?php echo esc_attr( $currency ); ?>">
			</div>
		</div>
		<p style="margin-top:16px;color:#6b6b6b;">
			Aanmeldings-deadline (laatste termijn) wordt automatisch berekend:
			<strong>startdatum &minus; <?php echo (int) CPM_OPL_DEADLINE_DAYS; ?> dagen</strong>.
			Klanten kunnen na die datum alléén nog 1× volledig betalen.
		</p>
		<?php
	}

	public static function save_meta( int $post_id, \WP_Post $post ): void {
		if ( ! isset( $_POST['cpm_cohort_nonce'] ) || ! wp_verify_nonce( $_POST['cpm_cohort_nonce'], 'cpm_cohort_save' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$map = [
			'_cpm_start_date'        => 'cpm_start_date',
			'_cpm_end_date'          => 'cpm_end_date',
			'_cpm_total_price_cents' => 'cpm_total_price_cents',
			'_cpm_deposit_cents'     => 'cpm_deposit_cents',
			'_cpm_max_termijnen'     => 'cpm_max_termijnen',
			'_cpm_max_students'      => 'cpm_max_students',
			'_cpm_location'          => 'cpm_location',
			'_cpm_currency'          => 'cpm_currency',
		];
		foreach ( $map as $meta_key => $post_key ) {
			if ( ! array_key_exists( $post_key, $_POST ) ) {
				continue;
			}
			$value = wp_unslash( $_POST[ $post_key ] );
			if ( in_array( $post_key, [ 'cpm_total_price_cents', 'cpm_deposit_cents', 'cpm_max_termijnen', 'cpm_max_students' ], true ) ) {
				$value = (int) $value;
			} else {
				$value = sanitize_text_field( (string) $value );
			}
			update_post_meta( $post_id, $meta_key, $value );
		}
	}

	/**
	 * Hydrate cohort meta into a typed array. Returns null if any required field is missing.
	 */
	public static function get( int $post_id ): ?array {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== self::POST_TYPE || $post->post_status !== 'publish' ) {
			return null;
		}
		$start = (string) get_post_meta( $post_id, '_cpm_start_date', true );
		$total = (int) get_post_meta( $post_id, '_cpm_total_price_cents', true );
		if ( ! $start || ! $total ) {
			return null;
		}
		return [
			'id'                 => $post_id,
			'title'              => get_the_title( $post ),
			'start_date'         => $start,
			'end_date'           => (string) get_post_meta( $post_id, '_cpm_end_date', true ),
			'total_price_cents'  => $total,
			'deposit_cents'      => (int) get_post_meta( $post_id, '_cpm_deposit_cents', true ),
			'max_termijnen'      => max( 1, min( 3, (int) get_post_meta( $post_id, '_cpm_max_termijnen', true ) ?: 3 ) ),
			'max_students'       => (int) get_post_meta( $post_id, '_cpm_max_students', true ) ?: 5,
			'location'           => (string) get_post_meta( $post_id, '_cpm_location', true ),
			'currency'           => (string) get_post_meta( $post_id, '_cpm_currency', true ) ?: 'EUR',
		];
	}
}
