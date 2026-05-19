/**
 * Aftercare WhatsApp templates (direct na behandeling).
 *
 * WhatsApp Business Manager:
 *   Category: UTILITY (transactional, geen marketing-window-restrictie)
 *   Language: nl
 *
 * Submission notes:
 *   - Body mag GEEN harde marketing-claims bevatten
 *   - URL-button mag wel verwijzen naar nazorgpagina
 *   - {{1}} = firstName
 */

export const aftercareTemplates = {
  wenkbrauwen: {
    name: 'cocon_aftercare_brows_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'UTILITY',
    stage: 'aftercare',
    treatmentType: 'wenkbrauwen',
    bodyParams: ['firstName'],
    body:
      'Hi {{1}}! 👋\n\n' +
      'Je permanente wenkbrauwen zitten erop — fijn dat je vandaag bij Cocon Cosmetics was.\n\n' +
      'Belangrijke nazorg de eerste dagen:\n' +
      '• Houd je wenkbrauwen droog (geen sauna/sport/zwemmen)\n' +
      '• Niet krabben, korstjes vallen vanzelf\n' +
      '• Geen make-up of crème op de behandelde huid\n\n' +
      'Volledige nazorg: https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-wenkbrauwen/\n\n' +
      'Vragen? Reageer gerust op dit bericht.',
  },

  eyeliner: {
    name: 'cocon_aftercare_eyeliner_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'UTILITY',
    stage: 'aftercare',
    treatmentType: 'eyeliner',
    bodyParams: ['firstName'],
    body:
      'Hi {{1}}! 👋\n\n' +
      'Je permanente eyeliner zit erop. De eerste dagen kan het oog wat opgezet of gevoelig aanvoelen, dat is normaal.\n\n' +
      'Nazorg-tips:\n' +
      '• Geen oogmake-up tot alle korstjes los zijn\n' +
      '• Geen sauna, zwemmen of sporten\n' +
      '• Korstjes laten zitten\n\n' +
      'Volledige nazorg: https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-eyeliner/\n\n' +
      'Vragen? Reageer gerust op dit bericht.',
  },

  lippen: {
    name: 'cocon_aftercare_lips_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'UTILITY',
    stage: 'aftercare',
    treatmentType: 'lippen',
    bodyParams: ['firstName'],
    body:
      'Hi {{1}}! 👋\n\n' +
      'Je permanente lippen zijn klaar. De kleur lijkt nu intens, maar trekt de komende weken terug naar het uiteindelijke resultaat.\n\n' +
      'Nazorg-tips:\n' +
      '• Houd je lippen vochtig met de meegegeven balsem\n' +
      '• Vermijd pittig eten, koffie en alcohol de eerste dagen\n' +
      '• Geen lippenstift tot alle korstjes los zijn\n\n' +
      'Volledige nazorg: https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-lippen/\n\n' +
      'Vragen? Reageer gerust op dit bericht.',
  },
};

export default aftercareTemplates;
