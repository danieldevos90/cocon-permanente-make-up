/**
 * Build runtime config for a specific tenant (client).
 */

import { platform, getClientById } from './client-config.js';
import { getTenant, seedTenantFromEnv } from './tenant-store.js';

function envBool(name, fallback = true) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v.toLowerCase() !== 'false';
}

/**
 * @param {string} clientId
 * @param {import('./tenant-store.js').TenantRecord | null} [tenantOverride]
 */
export async function buildConfigForClient(clientId, tenantOverride = null) {
  const client = getClientById(clientId);
  let tenant = tenantOverride || (await getTenant(clientId));
  if (!tenant?.phoneNumberId && !tenant?.accessToken) {
    tenant = (await seedTenantFromEnv(clientId)) || tenant;
  }

  const isDefaultClient =
    clientId === (process.env.CLIENT_ID || 'cocon') ||
    clientId === (process.env.DEFAULT_CLIENT_ID || 'cocon');

  const accessToken =
    tenant?.accessToken ||
    (isDefaultClient ? process.env.META_WHATSAPP_ACCESS_TOKEN : '') ||
    '';
  const phoneNumberId =
    tenant?.phoneNumberId ||
    (isDefaultClient ? process.env.META_WHATSAPP_PHONE_NUMBER_ID : '') ||
    '';
  const businessAccountId =
    tenant?.wabaId ||
    client.wabaId ||
    (isDefaultClient ? process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID : '') ||
    '';

  return {
    provider: 'meta-cloud-api',
    clientId,

    platform: {
      name: platform.appName || 'AFA - Message Platform',
      appId: platform.appId || '',
      businessPortfolioId: platform.businessPortfolioId || '',
      businessPortfolioName: platform.businessPortfolioName || '',
      vercelHost: platform.vercelHost || '',
      onboardPath: platform.onboardPath || '/whatsapp/onboard',
      webhookPath: platform.webhookPath || '/api/whatsapp-webhook',
    },

    client: {
      id: client.id || clientId,
      displayName: client.displayName || clientId,
      businessPortfolioId:
        client.businessPortfolioId || platform.businessPortfolioId || '',
      wabaId: businessAccountId,
      displayPhone: client.displayPhone || '',
      onboardContactName: client.onboardContactName || '',
      templatePrefix: client.templatePrefix || clientId,
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
      accessToken,
      phoneNumberId,
      businessAccountId,
      apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v21.0',
      webhookVerifyToken: process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    },

    dryRun: envBool('WHATSAPP_DRY_RUN', true),
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '31',
    fallbackToEmail: envBool('WHATSAPP_FALLBACK_TO_EMAIL', true),
    triggerToken: process.env.WHATSAPP_TRIGGER_TOKEN || '',

    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
      token:
        process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
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
          process.env.AFTERCARE_LIPS_URL || client.urls?.aftercare?.lippen || '',
      },
    },

    automationProfile: client.automationProfile || 'pmu',
    marketingStages: client.marketingStages || {},

    treatmentTypes: client.treatmentTypes || ['wenkbrauwen', 'eyeliner', 'lippen'],

    messageTiming: {
      aftercare: client.messageTiming?.aftercare ?? 0,
      browsRefresh: client.messageTiming?.browsRefresh ?? 300,
      lipsRefresh: client.messageTiming?.lipsRefresh ?? 300,
      welcome: client.messageTiming?.welcome ?? 0,
      promo: client.messageTiming?.promo ?? 3,
      reminder: client.messageTiming?.reminder ?? 14,
    },

    optIn: {
      mergeField: 'WAOPTIN',
      phoneMergeField: 'PHONE',
      optInValue: 'yes',
    },

    sender: {
      name: client.senderName || client.displayName || clientId,
      displayPhone:
        process.env.WHATSAPP_DISPLAY_PHONE || client.displayPhone || '',
    },
  };
}

export default { buildConfigForClient };
