/**
 * Refresh-reminder WhatsApp templates (Fase 1).
 *
 * Category: MARKETING — alleen toegestaan bij expliciete opt-in.
 *
 * Timing volgens config.messageTiming:
 *   - browsRefresh: 300 dagen na behandeling
 *   - lipsRefresh:  300 dagen na behandeling
 *
 * Eyeliner long-term refresh + magic-pencil cross-sell zijn Fase 2.
 */

export const refreshTemplates = {
  wenkbrauwen: {
    name: 'cocon_refresh_brows_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'browsRefresh',
    treatmentType: 'wenkbrauwen',
    bodyParams: ['firstName'],
    body:
      'Hi {{1}}, het is ongeveer een jaar geleden dat we je wenkbrauwen hebben gezet ✨\n\n' +
      'Rond deze tijd vervaagt het pigment licht. Een opfrisbehandeling brengt de kleur weer mooi in balans.\n\n' +
      'Plan je opfris direct in:\n' +
      'https://www.coconpermanentemakeup.nl/afspraak-maken\n\n' +
      'Liever overleggen? Reageer op dit bericht.',
  },

  lippen: {
    name: 'cocon_refresh_lips_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'lipsRefresh',
    treatmentType: 'lippen',
    bodyParams: ['firstName'],
    body:
      'Hi {{1}}, het is bijna een jaar geleden sinds je permanente lippen behandeling 💋\n\n' +
      'Een opfrisbehandeling geeft je lippen weer net dat beetje extra kleur en frisheid.\n\n' +
      'Plan je afspraak:\n' +
      'https://www.coconpermanentemakeup.nl/afspraak-maken\n\n' +
      'Vragen? Reageer gerust.',
  },
};

export default refreshTemplates;
