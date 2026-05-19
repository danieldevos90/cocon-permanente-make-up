<?php
/**
 * Admin-only REST routes voor seed/automation vanuit MCP of WP-CLI.
 *
 * Auth: vereist user met 'manage_options' (Daniel JWT-user is admin).
 *
 * Endpoints:
 *   POST /cpm/v1/admin/cohort   → maak cohort + meta in één call
 *   PUT  /cpm/v1/admin/cohort/{id} → update cohort + meta
 *   POST /cpm/v1/admin/settings → upsert Mollie keys / test-mode
 *   GET  /cpm/v1/admin/diag     → snelle diagnostic (plugin loaded, db ok, keys gezet)
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Admin_REST {

	public static function register(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'routes' ] );
	}

	public static function routes(): void {
		$ns   = Checkout_Handler::NAMESPACE_REST;
		$auth = static fn() => current_user_can( 'manage_options' );

		register_rest_route( $ns, '/admin/cohort', [
			'methods'             => 'POST',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'create_cohort' ],
		] );
		register_rest_route( $ns, '/admin/cohort/(?P<id>\d+)', [
			'methods'             => 'POST,PUT,PATCH',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'update_cohort' ],
		] );
		register_rest_route( $ns, '/admin/settings', [
			'methods'             => 'GET, POST, PUT',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'save_settings' ],
			'args'                => [
				'cpm_opl_mollie_key_live' => [ 'type' => 'string', 'required' => false ],
				'cpm_opl_mollie_key_test' => [ 'type' => 'string', 'required' => false ],
				'cpm_opl_test_mode'       => [ 'type' => 'integer', 'required' => false ],
			],
		] );
		register_rest_route( $ns, '/admin/diag', [
			'methods'             => 'GET',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'diag' ],
		] );
		register_rest_route( $ns, '/admin/enrollments', [
			'methods'             => 'GET',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'list_enrollments' ],
		] );
		register_rest_route( $ns, '/admin/enrollment/(?P<id>\d+)', [
			'methods'             => 'GET',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'get_enrollment' ],
		] );
		register_rest_route( $ns, '/admin/cohort/(?P<id>\d+)/delete', [
			'methods'             => 'POST,DELETE',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'delete_cohort' ],
		] );
		register_rest_route( $ns, '/admin/cohort/(?P<id>\d+)', [
			'methods'             => 'DELETE',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'delete_cohort' ],
		] );
		register_rest_route( $ns, '/admin/page/(?P<id>\d+)/delete', [
			'methods'             => 'POST,DELETE',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'delete_page' ],
		] );
		register_rest_route( $ns, '/admin/wipe-enrollments', [
			'methods'             => 'POST,DELETE',
			'permission_callback' => $auth,
			'callback'            => [ __CLASS__, 'wipe_enrollments' ],
			'args'                => [
				'ids'    => [ 'required' => false ],
				'cohort' => [ 'required' => false, 'type' => 'integer' ],
				'all'    => [ 'required' => false, 'type' => 'boolean' ],
			],
		] );
	}

	public static function delete_cohort( \WP_REST_Request $req ) {
		$id = (int) $req['id'];
		if ( get_post_type( $id ) !== Cohort_CPT::POST_TYPE ) {
			return new \WP_Error( 'cpm_not_found', 'Cohort niet gevonden', [ 'status' => 404 ] );
		}
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$pay_table = DB::table_payments();
		$enr_ids   = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$enr_table} WHERE cohort_id = %d", $id ) );
		if ( $enr_ids ) {
			$placeholders = implode( ',', array_fill( 0, count( $enr_ids ), '%d' ) );
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$pay_table} WHERE enrollment_id IN ($placeholders)", $enr_ids ) );
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$enr_table} WHERE id IN ($placeholders)", $enr_ids ) );
		}
		// Cascade: gekoppelde inschrijfpagina ook opruimen
		$page_id     = (int) get_post_meta( $id, Cohort_Auto_Page::META_PAGE_ID, true );
		$page_purged = false;
		if ( $page_id && get_post_type( $page_id ) === 'page' ) {
			wp_delete_post( $page_id, true );
			$page_purged = true;
		}
		wp_delete_post( $id, true );
		return [
			'ok'                 => true,
			'cohort_id'          => $id,
			'enrollments_purged' => count( $enr_ids ),
			'page_purged'        => $page_purged,
			'page_id'            => $page_id ?: null,
		];
	}

	public static function delete_page( \WP_REST_Request $req ) {
		$id = (int) $req['id'];
		if ( get_post_type( $id ) !== 'page' ) {
			return new \WP_Error( 'cpm_not_found', 'Page niet gevonden', [ 'status' => 404 ] );
		}
		$res = wp_delete_post( $id, true );
		return [
			'ok'        => (bool) $res,
			'page_id'   => $id,
			'permanent' => true,
		];
	}

	public static function wipe_enrollments( \WP_REST_Request $req ) {
		$src = self::all_params( $req );
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$pay_table = DB::table_payments();

		$ids = [];
		if ( ! empty( $src['ids'] ) ) {
			$raw = $src['ids'];
			if ( is_string( $raw ) ) {
				$raw = array_map( 'trim', explode( ',', $raw ) );
			}
			$ids = array_values( array_filter( array_map( 'intval', (array) $raw ) ) );
		} elseif ( ! empty( $src['cohort'] ) ) {
			$ids = array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
				"SELECT id FROM {$enr_table} WHERE cohort_id = %d",
				(int) $src['cohort']
			) ) );
		} elseif ( ! empty( $src['all'] ) ) {
			$ids = array_map( 'intval', $wpdb->get_col( "SELECT id FROM {$enr_table}" ) );
		}

		if ( ! $ids ) {
			return [ 'ok' => true, 'deleted' => 0, 'note' => 'no enrollments matched' ];
		}
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		$pay_count    = (int) $wpdb->query( $wpdb->prepare( "DELETE FROM {$pay_table} WHERE enrollment_id IN ($placeholders)", $ids ) );
		$enr_count    = (int) $wpdb->query( $wpdb->prepare( "DELETE FROM {$enr_table} WHERE id IN ($placeholders)", $ids ) );
		return [
			'ok'                 => true,
			'enrollments_wiped'  => $enr_count,
			'payments_wiped'     => $pay_count,
			'enrollment_ids'     => $ids,
		];
	}

	public static function create_cohort( \WP_REST_Request $req ) {
		$src     = self::all_params( $req );
		$post_id = wp_insert_post( [
			'post_type'    => Cohort_CPT::POST_TYPE,
			'post_status'  => 'publish',
			'post_title'   => sanitize_text_field( (string) ( $src['title'] ?? '' ) ),
			'post_content' => wp_kses_post( (string) ( $src['content'] ?? '' ) ),
		], true );
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}
		self::apply_meta( (int) $post_id, $src );
		Cohort_Auto_Page::ensure_page( (int) $post_id );
		return self::cohort_payload( (int) $post_id );
	}

	public static function update_cohort( \WP_REST_Request $req ) {
		$id  = (int) $req['id'];
		$src = self::all_params( $req );
		if ( get_post_type( $id ) !== Cohort_CPT::POST_TYPE ) {
			return new \WP_Error( 'cpm_not_found', 'Cohort niet gevonden', [ 'status' => 404 ] );
		}
		$update = [ 'ID' => $id ];
		if ( array_key_exists( 'title', $src ) ) {
			$update['post_title'] = sanitize_text_field( (string) $src['title'] );
		}
		if ( array_key_exists( 'content', $src ) ) {
			$update['post_content'] = wp_kses_post( (string) $src['content'] );
		}
		if ( count( $update ) > 1 ) {
			wp_update_post( $update );
		}
		self::apply_meta( $id, $src );
		Cohort_Auto_Page::ensure_page( $id );
		return self::cohort_payload( $id );
	}

	private static function all_params( \WP_REST_Request $req ): array {
		return array_merge(
			(array) $req->get_query_params(),
			(array) $req->get_body_params(),
			(array) $req->get_json_params()
		);
	}

	private static function apply_meta( int $id, array $src ): void {
		foreach ( Cohort_CPT::meta_schema() as $meta_key => $type ) {
			$param_key = ltrim( $meta_key, '_' );
			if ( ! array_key_exists( $param_key, $src ) ) {
				continue;
			}
			$v = $src[ $param_key ];
			if ( $type === 'integer' ) {
				$v = (int) $v;
			} elseif ( $type === 'longtext' ) {
				$v = wp_kses_post( (string) $v );
			} else {
				$v = sanitize_text_field( (string) $v );
			}
			update_post_meta( $id, $meta_key, $v );
		}
		self::apply_pricing_defaults( $id, $src );
	}

	/**
	 * Vul lege prijsvelden vanuit Pricing::products() wanneer template bekend is.
	 */
	private static function apply_pricing_defaults( int $id, array $src ): void {
		$template = (string) ( $src['cpm_template'] ?? get_post_meta( $id, '_cpm_template', true ) );
		if ( $template === '' ) {
			return;
		}
		$defaults = Pricing::defaults_for_template( $template );
		if ( ! $defaults ) {
			return;
		}
		$map = [
			'total_price_cents' => '_cpm_total_price_cents',
			'deposit_cents'     => '_cpm_deposit_cents',
			'max_termijnen'     => '_cpm_max_termijnen',
			'max_students'      => '_cpm_max_students',
			'location'          => '_cpm_location',
			'currency'          => '_cpm_currency',
			'addon_price_cents' => '_cpm_addon_price_cents',
			'addon_label'       => '_cpm_addon_label',
		];
		foreach ( $map as $key => $meta_key ) {
			if ( ! array_key_exists( $key, $defaults ) ) {
				continue;
			}
			$current = get_post_meta( $id, $meta_key, true );
			if ( $current !== '' && $current !== null && (int) $current !== 0 ) {
				continue;
			}
			if ( array_key_exists( ltrim( $meta_key, '_' ), $src ) && $src[ ltrim( $meta_key, '_' ) ] !== '' ) {
				continue;
			}
			update_post_meta( $id, $meta_key, $defaults[ $key ] );
		}
		if ( empty( get_post_meta( $id, '_cpm_template', true ) ) ) {
			update_post_meta( $id, '_cpm_template', $template );
		}
	}

	private static function cohort_payload( int $id ): array {
		$cohort     = Cohort_CPT::get( $id );
		$page_id    = (int) get_post_meta( $id, Cohort_Auto_Page::META_PAGE_ID, true );
		$page_link  = $page_id ? get_permalink( $page_id ) : null;
		$page_title = $page_id ? get_the_title( $page_id ) : null;
		return [
			'ok'             => $cohort !== null,
			'cohort_id'      => $id,
			'edit_link'      => get_edit_post_link( $id, 'raw' ),
			'enroll_page_id' => $page_id ?: null,
			'enroll_page'    => $page_id ? [
				'id'    => $page_id,
				'title' => $page_title,
				'url'   => $page_link,
			] : null,
			'cohort'         => $cohort,
		];
	}

	public static function save_settings( \WP_REST_Request $req ) {
		// Accepteer parameters uit body OR query string OR JSON body — wpmcp gebruikt
		// diverse formaten afhankelijk van methode + tool implementatie.
		$source = array_merge(
			(array) $req->get_query_params(),
			(array) $req->get_body_params(),
			(array) $req->get_json_params()
		);
		$allowed = [
			'cpm_opl_mollie_key_live',
			'cpm_opl_mollie_key_test',
			'cpm_opl_test_mode',
			'cpm_opl_thankyou_page_id',
			'cpm_opl_mailchimp_api_key',
			'cpm_opl_mailchimp_list_id',
		];
		$updated = [];
		foreach ( $allowed as $opt ) {
			if ( array_key_exists( $opt, $source ) && $source[ $opt ] !== '' && $source[ $opt ] !== null ) {
				update_option( $opt, $source[ $opt ], false );
				$updated[] = $opt;
			}
		}
		return [ 'ok' => true, 'updated' => $updated, 'sources_seen' => array_keys( $source ) ];
	}

	public static function list_enrollments( \WP_REST_Request $req ): array {
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$rows = $wpdb->get_results( "SELECT * FROM {$enr_table} ORDER BY id DESC LIMIT 50", ARRAY_A );
		return [ 'enrollments' => $rows ?: [] ];
	}

	public static function get_enrollment( \WP_REST_Request $req ): array {
		$id        = (int) $req['id'];
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$pay_table = DB::table_payments();
		$enr       = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$enr_table} WHERE id = %d", $id ), ARRAY_A );
		$payments  = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$pay_table} WHERE enrollment_id = %d ORDER BY termijn_index", $id ), ARRAY_A );
		return [
			'enrollment' => $enr,
			'payments'   => $payments ?: [],
		];
	}

	public static function diag(): array {
		$live_key = cpm_opl_get_mollie_key( 'live' );
		$test_key = cpm_opl_get_mollie_key( 'test' );
		global $wpdb;
		$enr_table = DB::table_enrollments();
		$pay_table = DB::table_payments();
		$tables    = $wpdb->get_col( "SHOW TABLES LIKE '{$wpdb->prefix}cpm_%'" );
		$thankyou = (int) get_option( 'cpm_opl_thankyou_page_id', 0 );
		return [
			'plugin_version'        => CPM_OPL_VERSION,
			'db_version'            => get_option( 'cpm_opl_db_version', '0' ),
			'tables'                => $tables,
			'has_live_key'          => $live_key !== '' ? substr( $live_key, 0, 5 ) . '…' : false,
			'has_test_key'          => $test_key !== '' ? substr( $test_key, 0, 5 ) . '…' : false,
			'is_test_mode'          => cpm_opl_is_test_mode(),
			'webhook_url'           => Checkout_Handler::webhook_url(),
			'mailchimp_configured'  => Mailchimp::is_configured(),
			'thankyou_page_id'      => $thankyou ?: null,
			'thankyou_page_url'     => $thankyou ? get_permalink( $thankyou ) : null,
			'pricing_products'      => array_keys( Pricing::products() ),
			'pricing_audit'         => Pricing::audit_report(),
			'cohort_count'          => (int) wp_count_posts( Cohort_CPT::POST_TYPE )->publish,
			'enrollment_count'      => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$enr_table}" ),
		];
	}
}
