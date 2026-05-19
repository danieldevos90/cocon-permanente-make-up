<?php
/**
 * Standalone test for Payment_Plan. Geen WP, geen PHPUnit.
 * Run: php tests/test-payment-plan.php   (vanaf de plugin root)
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
if ( ! defined( 'CPM_OPL_DEADLINE_DAYS' ) ) {
	define( 'CPM_OPL_DEADLINE_DAYS', 14 );
}

require_once __DIR__ . '/../includes/class-payment-plan.php';

use CPM_Opleidingen\Payment_Plan;

$tests   = 0;
$passed  = 0;
$failed  = [];

function assert_equal( $expected, $actual, string $label ): void {
	global $tests, $passed, $failed;
	$tests++;
	if ( $expected === $actual ) {
		$passed++;
		echo "  ✓ {$label}\n";
		return;
	}
	$failed[] = $label;
	echo "  ✗ {$label}\n";
	echo "      expected: " . var_export( $expected, true ) . "\n";
	echo "      got:      " . var_export( $actual, true ) . "\n";
}

function assert_throws( callable $fn, string $needle, string $label ): void {
	global $tests, $passed, $failed;
	$tests++;
	try {
		$fn();
	} catch ( \Throwable $e ) {
		if ( str_contains( $e->getMessage(), $needle ) ) {
			$passed++;
			echo "  ✓ {$label}\n";
			return;
		}
		$failed[] = $label;
		echo "  ✗ {$label} — wrong message: " . $e->getMessage() . "\n";
		return;
	}
	$failed[] = $label;
	echo "  ✗ {$label} — geen exception\n";
}

echo "\n[suite] Payment_Plan::build\n";

// 1 termijn = volledig nu
$plan = Payment_Plan::build( 595000, 0, 1, '2026-12-01', '2026-04-28' );
assert_equal( 1, count( $plan ),                 '1-termijn: één entry' );
assert_equal( 595000, $plan[0]['amount_cents'],  '1-termijn: volledig bedrag' );
assert_equal( '2026-04-28', $plan[0]['due_date'], '1-termijn: due_date = vandaag' );

// 2 termijnen + aanbetaling van 1250 op 5950
$plan = Payment_Plan::build( 595000, 125000, 2, '2026-12-01', '2026-04-28' );
assert_equal( 2, count( $plan ),                 '2-termijn: twee entries' );
assert_equal( 125000, $plan[0]['amount_cents'], '2-termijn: termijn1 = aanbetaling' );
assert_equal( true, $plan[0]['is_deposit'],     '2-termijn: termijn1 is_deposit=true' );
assert_equal( 470000, $plan[1]['amount_cents'], '2-termijn: termijn2 = totaal - aanbetaling' );
assert_equal( '2026-11-17', $plan[1]['due_date'], '2-termijn: termijn2 due = startdatum -14 dgn' );

// 3 termijnen + aanbetaling — sum moet exact total zijn
$plan = Payment_Plan::build( 595000, 125000, 3, '2026-12-01', '2026-04-28' );
assert_equal( 3, count( $plan ),                 '3-termijn: drie entries' );
assert_equal( 125000, $plan[0]['amount_cents'], '3-termijn: aanbetaling' );
$sum  = array_sum( array_column( $plan, 'amount_cents' ) );
assert_equal( 595000, $sum,                     '3-termijn: som = totaal (cent-precisie)' );
assert_equal( '2026-11-17', $plan[2]['due_date'], '3-termijn: laatste due = startdatum -14 dgn' );
$rest_termijnen = $plan[1]['amount_cents'] + $plan[2]['amount_cents'];
assert_equal( 470000, $rest_termijnen,          '3-termijn: 2x rest = totaal - aanbetaling' );

// 3 termijnen ZONDER aanbetaling — N gelijke delen
$plan = Payment_Plan::build( 600000, 0, 3, '2026-12-01', '2026-04-28' );
assert_equal( 3, count( $plan ),                 '3-zonder-deposit: 3 entries' );
$sum = array_sum( array_column( $plan, 'amount_cents' ) );
assert_equal( 600000, $sum,                     '3-zonder-deposit: som = totaal' );
assert_equal( false, $plan[0]['is_deposit'],   '3-zonder-deposit: geen deposit flag' );
assert_equal( '2026-04-28', $plan[0]['due_date'], '3-zonder-deposit: termijn1 = vandaag' );
assert_equal( '2026-11-17', $plan[2]['due_date'], '3-zonder-deposit: laatste = -14 dgn' );

// Cent-rounding edge case (totaal niet deelbaar door 3)
$plan = Payment_Plan::build( 100, 0, 3, '2026-12-01', '2026-04-28' );
$sum  = array_sum( array_column( $plan, 'amount_cents' ) );
assert_equal( 100, $sum,                         'rounding: 100c / 3 = 33+33+34' );
assert_equal( 34, $plan[2]['amount_cents'],     'rounding: laatste termijn vangt rest op' );

// Deadline al verstreken → 2 termijnen niet meer mogelijk
assert_throws(
	static fn() => Payment_Plan::build( 595000, 125000, 2, '2026-05-05', '2026-04-28' ),
	'Te kort dag',
	'deadline: 2 termijnen geblokkeerd als <14 dgn voor start'
);

// Deadline al verstreken → 1 termijn nog wel mogelijk
$plan = Payment_Plan::build( 595000, 0, 1, '2026-05-05', '2026-04-28' );
assert_equal( 1, count( $plan ),                 'deadline: 1-termijn werkt altijd' );

// Startdatum in verleden → exception
assert_throws(
	static fn() => Payment_Plan::build( 595000, 0, 1, '2025-01-01', '2026-04-28' ),
	'verleden',
	'verleden: startdatum in verleden geweigerd'
);

// Available options
echo "\n[suite] Payment_Plan::available_options\n";
assert_equal( [ 1, 2, 3 ], Payment_Plan::available_options( 3, '2026-12-01', '2026-04-28' ), 'opties: ruim van te voren = alle' );
assert_equal( [ 1, 2 ],    Payment_Plan::available_options( 2, '2026-12-01', '2026-04-28' ), 'opties: cohort cap respect' );
assert_equal( [ 1 ],       Payment_Plan::available_options( 3, '2026-05-05', '2026-04-28' ), 'opties: <14 dgn = alleen 1' );
assert_equal( [ 1, 2, 3 ], Payment_Plan::available_options( 3, '2026-05-13', '2026-04-28' ), 'opties: precies 15 dgn = nog 3 mogelijk' );

echo "\n=========================================\n";
echo "Tests:  {$tests}\n";
echo "Passed: {$passed}\n";
echo "Failed: " . count( $failed ) . "\n";
if ( $failed ) {
	echo "Failed tests:\n";
	foreach ( $failed as $f ) {
		echo "  - {$f}\n";
	}
	exit( 1 );
}
echo "All green ✓\n";
