<?php
/**
 * Pure business logic. No DB. No WP-globals. Unit-testable.
 *
 * Verantwoordelijk voor:
 *   - Welke termijn-aantallen mag een klant nog kiezen, gegeven (vandaag, startdatum)?
 *   - Hoe wordt het totaalbedrag verdeeld over (aanbetaling + N termijnen)?
 *   - Wat zijn de vervaldata van iedere termijn?
 *
 * Regels:
 *   final_payment_deadline = startdatum - DEADLINE_DAYS (default 14)
 *   - Bij N=1: 1 betaling = totaal, vandaag
 *   - Bij N=2 of N=3 met deposit > 0:  termijn 1 = aanbetaling vandaag, rest gelijk verdeeld over (N-1) maanden eindigend op deadline
 *   - Bij N=2 of N=3 zonder deposit:    bedrag in N gelijke delen, eerste vandaag, laatste op deadline, tussentermijnen gelijkmatig daartussen
 *   - Restbedrag van centen-afronding altijd op LAATSTE termijn
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Payment_Plan {

	/**
	 * @param int $total_cents       Totaalbedrag van de opleiding in centen
	 * @param int $deposit_cents     Aanbetaling in centen (kan 0 zijn)
	 * @param int $num_termijnen     1, 2 of 3
	 * @param string $start_date     YYYY-MM-DD startdatum opleiding
	 * @param string|null $today     YYYY-MM-DD (default: vandaag, override voor tests)
	 * @param int $deadline_days     Aantal dagen voor startdatum waarop laatste termijn binnen moet zijn
	 *
	 * @return array<int, array{termijn:int, is_deposit:bool, amount_cents:int, due_date:string}>
	 *
	 * @throws \InvalidArgumentException als invoer ongeldig is of deadline al gepasseerd voor gekozen aantal termijnen
	 */
	public static function build(
		int $total_cents,
		int $deposit_cents,
		int $num_termijnen,
		string $start_date,
		?string $today = null,
		int $deadline_days = CPM_OPL_DEADLINE_DAYS
	): array {
		if ( $total_cents <= 0 ) {
			throw new \InvalidArgumentException( 'total_cents moet > 0' );
		}
		if ( $deposit_cents < 0 || $deposit_cents > $total_cents ) {
			throw new \InvalidArgumentException( 'deposit_cents buiten bereik' );
		}
		if ( ! in_array( $num_termijnen, [ 1, 2, 3 ], true ) ) {
			throw new \InvalidArgumentException( 'num_termijnen moet 1, 2 of 3 zijn' );
		}

		$today_dt    = new \DateTimeImmutable( $today ?: gmdate( 'Y-m-d' ) );
		$start_dt    = new \DateTimeImmutable( $start_date );
		$deadline_dt = $start_dt->modify( '-' . $deadline_days . ' days' );

		if ( $start_dt <= $today_dt ) {
			throw new \InvalidArgumentException( 'Opleidingsdatum ligt in het verleden of is vandaag.' );
		}

		// Single payment: full amount today.
		if ( $num_termijnen === 1 ) {
			return [
				[
					'termijn'      => 1,
					'is_deposit'   => false,
					'amount_cents' => $total_cents,
					'due_date'     => $today_dt->format( 'Y-m-d' ),
				],
			];
		}

		// Multi-termijn: laatste termijn moet ten laatste op deadline_dt.
		if ( $deadline_dt <= $today_dt ) {
			throw new \InvalidArgumentException(
				sprintf(
					'Te kort dag: meer dan 1 termijn vereist dat vandaag minimaal %d dagen vóór startdatum (%s) ligt. Deadline laatste termijn was %s.',
					$deadline_days,
					$start_dt->format( 'Y-m-d' ),
					$deadline_dt->format( 'Y-m-d' )
				)
			);
		}

		$termijnen = [];

		if ( $deposit_cents > 0 ) {
			// Aanbetaling vandaag, daarna (N-1) gelijke termijnen.
			$rest          = $total_cents - $deposit_cents;
			$remaining_n   = $num_termijnen - 1;
			$per_termijn   = intdiv( $rest, $remaining_n );
			$correction    = $rest - ( $per_termijn * $remaining_n );
			$dates         = self::distribute_dates( $today_dt, $deadline_dt, $remaining_n );

			$termijnen[] = [
				'termijn'      => 1,
				'is_deposit'   => true,
				'amount_cents' => $deposit_cents,
				'due_date'     => $today_dt->format( 'Y-m-d' ),
			];
			foreach ( $dates as $i => $d ) {
				$is_last = ( $i === count( $dates ) - 1 );
				$termijnen[] = [
					'termijn'      => $i + 2,
					'is_deposit'   => false,
					'amount_cents' => $per_termijn + ( $is_last ? $correction : 0 ),
					'due_date'     => $d,
				];
			}
			return $termijnen;
		}

		// Geen aparte aanbetaling: N gelijke termijnen, eerste vandaag, laatste op deadline.
		$per_termijn = intdiv( $total_cents, $num_termijnen );
		$correction  = $total_cents - ( $per_termijn * $num_termijnen );
		$dates       = self::distribute_dates( $today_dt, $deadline_dt, $num_termijnen, true );

		foreach ( $dates as $i => $d ) {
			$is_last = ( $i === count( $dates ) - 1 );
			$termijnen[] = [
				'termijn'      => $i + 1,
				'is_deposit'   => false,
				'amount_cents' => $per_termijn + ( $is_last ? $correction : 0 ),
				'due_date'     => $d,
			];
		}
		return $termijnen;
	}

	/**
	 * Verdeel N due-dates tussen `from` en `to` (inclusief `to`).
	 *
	 * Bij include_first=true valt de eerste termijn op `from` (= vandaag).
	 * Bij include_first=false (default) is `from` slechts ondergrens; eerste termijn ligt na vandaag.
	 *
	 * @return string[] YYYY-MM-DD list, altijd N elementen, oplopend, laatste = $to.
	 */
	private static function distribute_dates(
		\DateTimeImmutable $from,
		\DateTimeImmutable $to,
		int $count,
		bool $include_first = false
	): array {
		if ( $count === 1 ) {
			return [ $to->format( 'Y-m-d' ) ];
		}
		$start = $include_first ? $from : $from;
		$total_secs = $to->getTimestamp() - $start->getTimestamp();
		$step       = (int) floor( $total_secs / ( $include_first ? ( $count - 1 ) : $count ) );

		$dates = [];
		if ( $include_first ) {
			for ( $i = 0; $i < $count; $i++ ) {
				$ts      = $start->getTimestamp() + ( $step * $i );
				$dates[] = ( new \DateTimeImmutable( '@' . $ts ) )->format( 'Y-m-d' );
			}
			$dates[ $count - 1 ] = $to->format( 'Y-m-d' );
		} else {
			for ( $i = 1; $i <= $count; $i++ ) {
				$ts      = $start->getTimestamp() + ( $step * $i );
				$dates[] = ( new \DateTimeImmutable( '@' . $ts ) )->format( 'Y-m-d' );
			}
			$dates[ $count - 1 ] = $to->format( 'Y-m-d' );
		}
		return $dates;
	}

	/**
	 * Welke termijn-keuzes mag een klant nu nog zien?
	 * Beperkt door cohort-config (max_termijnen) en de deadline (vandaag - startdatum).
	 *
	 * @return int[] subset van [1,2,3]
	 */
	public static function available_options(
		int $cohort_max_termijnen,
		string $start_date,
		?string $today = null,
		int $deadline_days = CPM_OPL_DEADLINE_DAYS
	): array {
		$today_dt    = new \DateTimeImmutable( $today ?: gmdate( 'Y-m-d' ) );
		$start_dt    = new \DateTimeImmutable( $start_date );
		$deadline_dt = $start_dt->modify( '-' . $deadline_days . ' days' );

		$options = [ 1 ];
		if ( $deadline_dt > $today_dt ) {
			for ( $n = 2; $n <= min( 3, $cohort_max_termijnen ); $n++ ) {
				$options[] = $n;
			}
		}
		return $options;
	}
}
