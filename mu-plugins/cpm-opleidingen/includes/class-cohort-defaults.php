<?php
/**
 * Centrale defaults voor cohort-rich-content.
 *
 * Doel: elk event-product (cohort) krijgt automatisch dezelfde stijl + structuur,
 * zonder dat we per cohort handmatig de meta hoeven te seedën.
 *
 * Strategie:
 *  - Per "kind" (template-key, bv. "masterclass-3d-nano-brows") definiëren we
 *    de originele content uit de cursus-landingspagina.
 *  - Cohort_CPT::get() vult lege velden aan met de defaults van de gekozen
 *    template (default: "masterclass-3d-nano-brows" — onze enige cursus nu).
 *  - Een cohort kan een eigen template kiezen via meta `_cpm_template`.
 *
 * Uitbreiden:
 *  - Voeg een nieuwe template toe in self::TEMPLATES.
 *  - Selecteer m via post_meta `_cpm_template` of via de filter
 *    `cpm_opl_default_template`.
 */

namespace CPM_Opleidingen;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Cohort_Defaults {

	/**
	 * Default template-key. Wordt gebruikt als een cohort geen eigen
	 * `_cpm_template` heeft. Filterable.
	 */
	const DEFAULT_TEMPLATE = 'masterclass-3d-nano-brows';

	/**
	 * Alle templates. Iedere template levert de SAME set keys als
	 * Cohort_CPT::meta_schema() (alleen de rich-content velden).
	 *
	 * Teksten zijn 1-op-1 overgenomen van de originele Cocon
	 * masterclass-pagina (https://www.coconpermanentemakeup.nl/masterclass-3d-nano-brows/).
	 */
	const TEMPLATES = [
		'masterclass-3d-nano-brows' => [
			'eyebrow'        => 'Masterclass',
			'subtitle'       => 'Leer de kunst van 3D-Nano brows in twee dagen',
			'level'          => 'Voor ervaren PMU-artiesten die met apparaat werken',
			'duration_label' => '2 dagen masterclass + 1-op-1 terugkomdag',
			'trainer_name'   => 'Sina Hashemi',
			'intro_html'     => 'Een exclusieve Masterclass voor ervaren permanente make-up professionals die al met apparaat kunnen werken. Deze 2-daagse geavanceerde training is ontworpen om de vaardigheden van ervaren cursisten te tillen naar een masterniveau, met een verfijnde focus op de detail- en perfectie-aspecten van 3D-Nano brows. Onder leiding van Sina Hashemi.',
			'what_you_learn' => [
				'Theorie en praktijk 3D-Nano brows',
				'Latex en echte model',
				'Autonomie en gezichtsvormen',
				'Hand, druk en diepte techniek',
				'Kleurtheorie en pigmentselectie',
				'Symmetrie en ontwerp',
				'Machinegebruik en naald keuzes',
				'Patronen met verschillende soorten wenkbrauwen',
				'Cliënt consultatie',
				'Hygiëne en veiligheid volgens de GGD-richtlijnen',
				"Het nemen van de mooiste foto's",
				'Communicatie en professionele klantbeleving',
			],
			'includes'       => [
				'2 dagen masterclass + 1 op 1 terugkomdag',
				'Oefenen op levend model',
				'Doorgroeien naar Combi brows en Powder brows',
				'Voor ervaren PMU-artiesten die met apparaat werken',
			],
		],

		/**
		 * 6-daagse basisopleiding wenkbrauwen — content 1-op-1 overgenomen
		 * van https://www.coconpermanentemakeup.nl/opleidingen/ (landingspagina
		 * "Permanente make-up opleiding wenkbrauwen").
		 */
		'pmu-opleiding-wenkbrauwen' => [
			'eyebrow'        => 'Basisopleiding',
			'subtitle'       => 'Word een gecertificeerd PMU-artiest',
			'level'          => 'Voor (startende) PMU-specialisten — geen voorkennis vereist',
			'duration_label' => '23 september t/m 18 november 2026 (6 trainingsdagen + examen)',
			'trainer_name'   => 'Sina Hashemi',
			'intro_html'     => 'Droom je van een carrière in de beautybranche? Of werk je al in de beauty-industrie, maar wil jij je skills naar een nóg hoger niveau tillen? Start met de exclusieve PMU-wenkbrauwtraining bij Cocon Cosmetics. Onder leiding van Sina Hashemi leer je niet alleen de techniek, maar ook de finesse en werkwijze van een van de meest gevraagde PMU-specialisten.',
			'what_you_learn' => [
				'Powder, Ombre & Full Shaded Brow',
				'3D Hairstroke & 3D Nano Brows',
				'Soft Combi & Full Combi',
				'Praktijkervaring met levende modellen',
				'Hygiëne en veiligheid volgens GGD-richtlijnen',
				'Anatomie van de huid en pigmentopname',
				'Kleurtheorie en pigmentkeuze',
				'Wenkbrauwmapping en vormgeving',
				'Volledige klantbehandeling — consult tot nazorg',
				'Productkennis: PMU-tools en pigmenten',
				'Marketing, foto’s, video en social media',
				'Carrièrebegeleiding en praktijkvoering',
			],
			'includes'       => [
				'Lesdagen herfst 2026: 23 & 30 september, 7, 14 & 21 oktober + examen 18 november',
				'14 hoofdstukken theorie + praktijk',
				'Max. 5 cursisten per groep',
				'Oefenen op latex én echte modellen',
				'Persoonlijke begeleiding van Sina Hashemi',
				'Certificaat na succesvolle afronding',
			],
		],
	];

	/**
	 * Levert de defaults voor een gegeven cohort. Filterable per cohort.
	 *
	 * @return array<string,mixed>
	 */
	public static function for_cohort( int $post_id ): array {
		$key = (string) get_post_meta( $post_id, '_cpm_template', true );
		if ( ! $key || ! isset( self::TEMPLATES[ $key ] ) ) {
			$key = self::DEFAULT_TEMPLATE;
		}
		$key = (string) apply_filters( 'cpm_opl_default_template', $key, $post_id );
		$tpl = self::TEMPLATES[ $key ] ?? self::TEMPLATES[ self::DEFAULT_TEMPLATE ];
		return (array) apply_filters( 'cpm_opl_template_data', $tpl, $key, $post_id );
	}

	/**
	 * Retourneert $value als die niet "leeg" is, anders $fallback.
	 * Voor arrays: leeg = count() === 0.
	 */
	public static function fallback( $value, $fallback ) {
		if ( is_array( $value ) ) {
			return count( $value ) > 0 ? $value : $fallback;
		}
		$str = is_string( $value ) ? trim( $value ) : $value;
		return $str !== '' && $str !== null ? $value : $fallback;
	}
}
