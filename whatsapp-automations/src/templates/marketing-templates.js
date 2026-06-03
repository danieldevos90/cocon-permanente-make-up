/**
 * Demo Store / Gym — algemene marketing WhatsApp templates.
 * Category: MARKETING (test tenant demo-store-gym).
 * {{1}} = firstName
 */

const store = {
  welcome: {
    name: 'demo_welcome_store_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'welcome',
    treatmentType: 'store',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}! 👋\n\n' +
      'Welkom bij onze demo webshop — bedankt voor je interesse.\n\n' +
      'Bekijk nieuwe collecties en acties: https://example.com/demo-store\n\n' +
      'Antwoord STOP om geen marketing meer te ontvangen.',
  },
  promo: {
    name: 'demo_promo_store_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'promo',
    treatmentType: 'store',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}! 🛍️\n\n' +
      'Deze week: 15% korting op geselecteerde items in de demo store.\n\n' +
      'Shop nu: https://example.com/demo-store\n\n' +
      'Antwoord STOP om uit te schrijven.',
  },
  reminder: {
    name: 'demo_reminder_store_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'reminder',
    treatmentType: 'store',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}!\n\n' +
      'Je liet nog iets in je winkelwagen staan — nog steeds interesse?\n\n' +
      'Ga verder: https://example.com/demo-store\n\n' +
      'Antwoord STOP om uit te schrijven.',
  },
};

const gym = {
  welcome: {
    name: 'demo_welcome_gym_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'welcome',
    treatmentType: 'gym',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}! 💪\n\n' +
      'Welkom bij onze demo gym — fijn dat je meedoet.\n\n' +
      'Bekijk proeflessen en lidmaatschap: https://example.com/demo-gym\n\n' +
      'Antwoord STOP om geen marketing meer te ontvangen.',
  },
  promo: {
    name: 'demo_promo_gym_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'promo',
    treatmentType: 'gym',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}! 🏋️\n\n' +
      'Gratis proefweek in de demo gym — beperkte plekken deze maand.\n\n' +
      'Meld je aan: https://example.com/demo-gym\n\n' +
      'Antwoord STOP om uit te schrijven.',
  },
  reminder: {
    name: 'demo_reminder_gym_v1',
    metaStatus: 'pending',
    language: 'nl',
    category: 'MARKETING',
    stage: 'reminder',
    treatmentType: 'gym',
    bodyParams: ['firstName'],
    body:
      'Hoi {{1}}!\n\n' +
      'Je proefles staat nog open — wil je een moment inplannen?\n\n' +
      'Boek hier: https://example.com/demo-gym\n\n' +
      'Antwoord STOP om uit te schrijven.',
  },
};

/** stage → segment (treatmentType) → template */
export const marketingTemplates = {
  welcome: { store: store.welcome, gym: gym.welcome },
  promo: { store: store.promo, gym: gym.promo },
  reminder: { store: store.reminder, gym: gym.reminder },
};

export default marketingTemplates;
