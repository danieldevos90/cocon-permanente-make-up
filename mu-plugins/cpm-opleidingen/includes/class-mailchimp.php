<?php
/**
 * Mailchimp: tag inschrijvers na eerste betaling (segment-namen uit audience).
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Mailchimp {

	const META_SYNCED = '_cpm_mailchimp_synced';

	public static function register(): void {
		// Geen hooks — aangeroepen vanuit Webhook.
	}

	public static function is_configured(): bool {
		return self::api_key() !== '' && self::list_id() !== '';
	}

	public static function api_key(): string {
		if ( defined( 'CPM_OPL_MAILCHIMP_API_KEY' ) && CPM_OPL_MAILCHIMP_API_KEY ) {
			return (string) CPM_OPL_MAILCHIMP_API_KEY;
		}
		$opt = get_option( 'cpm_opl_mailchimp_api_key', '' );
		if ( $opt ) {
			return (string) $opt;
		}
		$from_env = self::env_value( 'MAILCHIMP_API_KEY' ) ?: self::env_value( 'API_KEY_MAILCHIMP' );
		if ( $from_env ) {
			return $from_env;
		}
		return (string) apply_filters( 'cpm_opl_mailchimp_api_key', '' );
	}

	public static function list_id(): string {
		if ( defined( 'CPM_OPL_MAILCHIMP_LIST_ID' ) && CPM_OPL_MAILCHIMP_LIST_ID ) {
			return (string) CPM_OPL_MAILCHIMP_LIST_ID;
		}
		$opt = get_option( 'cpm_opl_mailchimp_list_id', '' );
		if ( $opt ) {
			return (string) $opt;
		}
		$from_env = self::env_value( 'MAILCHIMP_LIST_ID' );
		if ( $from_env ) {
			return $from_env;
		}
		return (string) apply_filters( 'cpm_opl_mailchimp_list_id', '' );
	}

	private static function env_value( string $key ): string {
		$paths = [
			ABSPATH . '../.env',
			ABSPATH . '../marketing-automations/.env',
			CPM_OPL_PATH . '.env.local',
		];
		$paths = (array) apply_filters( 'cpm_opl_env_paths', $paths );
		foreach ( $paths as $env_path ) {
			if ( ! is_string( $env_path ) || ! file_exists( $env_path ) ) {
				continue;
			}
			$lines = @file( $env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
			foreach ( (array) $lines as $line ) {
				$line = ltrim( $line );
				if ( $line === '' || $line[0] === '#' ) {
					continue;
				}
				if ( strpos( $line, $key . '=' ) === 0 ) {
					$val = trim( substr( $line, strlen( $key ) + 1 ) );
					if ( $val !== '' ) {
						return $val;
					}
				}
			}
		}
		return '';
	}

	/**
	 * Na eerste geslaagde betaling: lid toevoegen/updaten + template-tag.
	 */
	public static function sync_after_first_payment( int $enrollment_id ): void {
		if ( ! self::is_configured() ) {
			return;
		}
		if ( get_post_meta( $enrollment_id, self::META_SYNCED, true ) ) {
			return;
		}

		$enr = DB::get_enrollment( $enrollment_id );
		if ( ! $enr || empty( $enr['student_email'] ) ) {
			return;
		}

		$cohort = Cohort_CPT::get( (int) $enr['cohort_id'] );
		if ( ! $cohort ) {
			return;
		}

		$template = (string) ( $cohort['template'] ?? Cohort_Defaults::DEFAULT_TEMPLATE );
		$tag      = Pricing::mailchimp_tag_for_template( $template );
		if ( $tag === '' ) {
			return;
		}

		$email = strtolower( trim( (string) $enr['student_email'] ) );
		$hash  = md5( $email );
		$dc    = self::datacenter_from_key( self::api_key() );
		if ( ! $dc ) {
			error_log( '[CPM][mailchimp] Ongeldige API key (geen datacenter suffix).' );
			return;
		}

		$list_id = self::list_id();
		$base    = "https://{$dc}.api.mailchimp.com/3.0";

		$member_body = [
			'email_address' => $email,
			'status_if_new' => 'subscribed',
			'merge_fields'  => [
				'FNAME' => (string) $enr['student_first_name'],
				'LNAME' => (string) $enr['student_last_name'],
			],
		];

		$res = self::request(
			'PUT',
			"{$base}/lists/{$list_id}/members/{$hash}",
			$member_body
		);
		if ( is_wp_error( $res ) ) {
			error_log( '[CPM][mailchimp] Member upsert: ' . $res->get_error_message() );
			return;
		}

		$tag_res = self::request(
			'POST',
			"{$base}/lists/{$list_id}/members/{$hash}/tags",
			[
				'tags' => [
					[ 'name' => $tag, 'status' => 'active' ],
					[ 'name' => 'Opleiding inschrijving', 'status' => 'active' ],
				],
			]
		);
		if ( is_wp_error( $tag_res ) ) {
			error_log( '[CPM][mailchimp] Tags: ' . $tag_res->get_error_message() );
			return;
		}

		update_post_meta( $enrollment_id, self::META_SYNCED, '1' );
	}

	private static function datacenter_from_key( string $api_key ): string {
		$pos = strrpos( $api_key, '-' );
		if ( $pos === false ) {
			return '';
		}
		return substr( $api_key, $pos + 1 );
	}

	/**
	 * @param array<string,mixed> $body
	 * @return true|\WP_Error
	 */
	private static function request( string $method, string $url, array $body ) {
		$response = wp_remote_request(
			$url,
			[
				'method'  => $method,
				'timeout' => 15,
				'headers' => [
					'Authorization' => 'Basic ' . base64_encode( 'anystring:' . self::api_key() ),
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( $body ),
			]
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code >= 200 && $code < 300 ) {
			return true;
		}

		$raw = wp_remote_retrieve_body( $response );
		return new \WP_Error(
			'cpm_mailchimp_http',
			sprintf( 'Mailchimp HTTP %d: %s', $code, substr( $raw, 0, 200 ) )
		);
	}
}
