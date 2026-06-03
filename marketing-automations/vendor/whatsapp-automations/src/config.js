import 'dotenv/config';
import { platform, client } from './client-config.js';

/**
 * Configuration for AFA Message Platform (WhatsApp automations).
 *
 * Platform credentials (Meta app) + tenant client config (JSON under config/clients/).
 * Env vars override JSON defaults.
 */
export const config = {
  provider: 'meta-cloud-api',

  platform: {
    name: platform.appName || 'AFA - Message Platform',
    appId: platform.appId || '',
    businessPortfolioId: platform.businessPortfolioId || '',
    businessPortfolioName: platform.businessPortfolioName || '',
  },

  client: {
    id: client.id || 'default',
    displayName: client.displayName || client.id || 'Client',
    businessPortfolioId:
      client.businessPortfolioId || platform.businessPortfolioId || '',
    wabaId: client.wabaId || '',
    displayPhone: client.displayPhone || '',
    onboardContactName: client.onboardContactName || '',
    templatePrefix: client.templatePrefix || client.id || 'client',
  },

  meta: {
    appId: process.env.META_APP_ID || platform.appId || '',
    appSecret:
      process.env.META_APP_SECRET ||
      process.env.META_WHATSAPP_APP_SECRET ||
      '',
    embeddedSignupConfigId:
      process.env.META_EMBEDDED_SIGNUP_CONFIG_ID ||
      platform.embeddedSignupConfigId ||
      '',
    accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId:
      process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID ||
      client.wabaId ||
      '',
    apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v21.0',
    webhookVerifyToken: process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  },

  dryRun: (process.env.WHATSAPP_DRY_RUN || 'true').toLowerCase() !== 'false',
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '31',
  fallbackToEmail: (process.env.WHATSAPP_FALLBACK_TO_EMAIL || 'true').toLowerCase() === 'true',
  triggerToken: process.env.WHATSAPP_TRIGGER_TOKEN || '',

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
  },

  salonized: {
    icalUrl: process.env.SALONIZED_ICAL_URL || '',
  },

  mailchimp: {
    apiKey: process.env.API_KEY_MAILCHIMP || '',
    listId: process.env.MAILCHIMP_LIST_ID || '',
  },

  urls: {
    booking: process.env.BOOKING_URL || client.urls?.booking || '',
    aftercare: {
      wenkbrauwen:
        process.env.AFTERCARE_BROWS_URL ||
        client.urls?.aftercare?.wenkbrauwen ||
        '',
      eyeliner:
        process.env.AFTERCARE_EYELINER_URL ||
        client.urls?.aftercare?.eyeliner ||
        '',
      lippen:
        process.env.AFTERCARE_LIPS_URL ||
        client.urls?.aftercare?.lippen ||
        '',
    },
  },

  treatmentTypes: client.treatmentTypes || ['wenkbrauwen', 'eyeliner', 'lippen'],

  messageTiming: {
    aftercare: client.messageTiming?.aftercare ?? 0,
    browsRefresh: client.messageTiming?.browsRefresh ?? 300,
    lipsRefresh: client.messageTiming?.lipsRefresh ?? 300,
  },

  optIn: {
    mergeField: 'WAOPTIN',
    phoneMergeField: 'PHONE',
    optInValue: 'yes',
  },

  sender: {
    name: client.senderName || client.displayName || 'Client',
    displayPhone:
      process.env.WHATSAPP_DISPLAY_PHONE ||
      client.displayPhone ||
      '',
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
    if (!config.meta.businessAccountId) {
      warnings.push('META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt (vereist voor template management)');
    }
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
