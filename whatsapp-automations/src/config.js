import 'dotenv/config';

/**
 * Configuration for Cocon Cosmetics WhatsApp Automations
 *
 * Provider: Meta WhatsApp Cloud API (direct, geen tussenpartij).
 * In SCAFFOLD-mode draait alles dry-run: geen echte API calls naar Meta.
 */
export const config = {
  provider: 'meta-cloud-api',

  meta: {
    accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v21.0',
    appSecret: process.env.META_WHATSAPP_APP_SECRET || '',
    webhookVerifyToken: process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  },

  // Operational toggles
  dryRun: (process.env.WHATSAPP_DRY_RUN || 'true').toLowerCase() !== 'false',
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '31',
  fallbackToEmail: (process.env.WHATSAPP_FALLBACK_TO_EMAIL || 'true').toLowerCase() === 'true',
  triggerToken: process.env.WHATSAPP_TRIGGER_TOKEN || '',

  // Redis (gedeeld met marketing-automations voor cron/delivery history)
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
  },

  // Salonized (gedeeld met marketing-automations)
  salonized: {
    icalUrl: process.env.SALONIZED_ICAL_URL || '',
  },

  // Mailchimp (voor opt-in lookup + fallback email)
  mailchimp: {
    apiKey: process.env.API_KEY_MAILCHIMP || '',
    listId: process.env.MAILCHIMP_LIST_ID || '',
  },

  // URLs in WhatsApp template parameters
  urls: {
    booking: process.env.BOOKING_URL || 'https://www.coconpermanentemakeup.nl/afspraak-maken',
    aftercare: {
      wenkbrauwen: process.env.AFTERCARE_BROWS_URL || 'https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-wenkbrauwen/',
      eyeliner: process.env.AFTERCARE_EYELINER_URL || 'https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-eyeliner/',
      lippen: process.env.AFTERCARE_LIPS_URL || 'https://www.coconpermanentemakeup.nl/kennisbank/nazorg-permanente-make-up-lippen/',
    },
  },

  // Treatment types — moet overeenkomen met marketing-automations
  treatmentTypes: ['wenkbrauwen', 'eyeliner', 'lippen'],

  // Timing voor WhatsApp berichten (in dagen na behandeling)
  // Fase 1 (MVP-scope volgens cocon-whatsapp-automatisering.md):
  //   - aftercare:        direct (0)  — alle behandelingen
  //   - brows refresh:    300 dagen   — wenkbrauwen
  //   - lips refresh:     300 dagen   — lippen
  // Fase 2 (later toe te voegen):
  //   - eyeliner long-term refresh, magic pencil cross-sell, reply handling
  messageTiming: {
    aftercare: 0,
    browsRefresh: 300,
    lipsRefresh: 300,
  },

  // Mailchimp merge field waarin opt-in voor WhatsApp staat
  // Suggestie: nieuw merge field "WAOPTIN" met value "yes"/"no"
  // En "PHONE" voor het telefoonnummer (E.164).
  optIn: {
    mergeField: 'WAOPTIN',
    phoneMergeField: 'PHONE',
    optInValue: 'yes',
  },

  // Sender info (voor logging)
  sender: {
    name: 'Cocon Cosmetics',
    displayPhone: process.env.WHATSAPP_DISPLAY_PHONE || '',
  },
};

/**
 * Validate runtime config. Returns { valid, errors, warnings }.
 * In dry-run mode zijn Meta credentials niet vereist.
 */
export function validateConfig({ requireMeta = !config.dryRun } = {}) {
  const errors = [];
  const warnings = [];

  if (requireMeta) {
    if (!config.meta.accessToken) errors.push('META_WHATSAPP_ACCESS_TOKEN ontbreekt');
    if (!config.meta.phoneNumberId) errors.push('META_WHATSAPP_PHONE_NUMBER_ID ontbreekt');
    if (!config.meta.businessAccountId) warnings.push('META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt (vereist voor template management)');
  }

  if (!config.salonized.icalUrl) {
    warnings.push('SALONIZED_ICAL_URL ontbreekt — gedeelde sync via marketing-automations werkt dan niet');
  }

  if (config.fallbackToEmail && !config.mailchimp.apiKey) {
    warnings.push('Fallback naar e-mail is aan, maar API_KEY_MAILCHIMP ontbreekt');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default config;
