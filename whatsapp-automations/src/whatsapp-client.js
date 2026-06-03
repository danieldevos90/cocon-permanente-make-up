/**
 * Meta WhatsApp Cloud API client.
 *
 * Documentatie: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * In dry-run mode (config.dryRun === true) doet deze client GEEN echte
 * HTTP calls naar Meta. Hij logt de payload en returnt een fake success
 * response. Dit is bewust zo, zodat de scaffold veilig draait totdat:
 *   1. WhatsApp Business Account is geverifieerd bij Meta
 *   2. Templates zijn ingediend en goedgekeurd
 *   3. Opt-in flow live is (intake formulier + privacy policy checkbox)
 *
 * Wanneer alles klaar staat: zet WHATSAPP_DRY_RUN=false in .env.
 */

import { config as defaultConfig } from './config.js';
import { getContextClientId } from './tenant-context.js';

const GRAPH_API_BASE = 'https://graph.facebook.com';

function resolveConfig(override) {
  return override || defaultConfig;
}

function waLog(message, data) {
  const verbose =
    process.env.WHATSAPP_API_LOG === 'true' ||
    process.env.LOG_LEVEL === 'debug';
  if (!verbose) return;
  if (data) console.log(`[whatsapp-api] ${message}`, JSON.stringify(data));
  else console.log(`[whatsapp-api] ${message}`);
}

/**
 * COEXISTENCE SAFETY GUARD.
 *
 * Het nummer +31 6 23943507 draait in COEXISTENCE: tegelijk op de WhatsApp
 * Business-app (Daniela's telefoon) én de Cloud API. De Graph API endpoints
 * hieronder (her)registreren of migreren een nummer en zouden het van de
 * telefoon LOSKOPPELEN. Deze codebase mag ze NOOIT aanroepen — ook niet per
 * ongeluk in de toekomst.
 *
 * Onboarding/registratie gebeurt uitsluitend handmatig via Coexistence
 * Embedded Signup (verificatiecode in de Business-app), niet via dit pakket.
 * Zie README sectie "Live gaan (coexistence-veilig)".
 */
const FORBIDDEN_ENDPOINT = /\/(register|deregister|request_code|verify_code|migrate|two_step|set_two_step)(\/|\?|$)/i;

export function assertSafeEndpoint(path) {
  if (FORBIDDEN_ENDPOINT.test(path)) {
    throw new Error(
      `[coexistence-guard] Geblokkeerd endpoint "${path}". Dit zou het nummer ` +
      'loskoppelen van de WhatsApp Business-app op de telefoon. Registratie/' +
      'migratie mag ALLEEN handmatig via Coexistence Embedded Signup.',
    );
  }
  return path;
}

function endpoint(path, cfg = defaultConfig) {
  assertSafeEndpoint(path);
  return `${GRAPH_API_BASE}/${cfg.meta.apiVersion}${path}`;
}

function authHeaders(cfg = defaultConfig) {
  return {
    Authorization: `Bearer ${cfg.meta.accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Test of de credentials werken door het phone number resource op te vragen.
 * @param {{ config?: object }} [options]
 */
export async function testConnection(options = {}) {
  const cfg = resolveConfig(options.config);
  if (cfg.dryRun) {
    return {
      success: true,
      dryRun: true,
      message: 'DRY RUN — geen connection test uitgevoerd. Zet WHATSAPP_DRY_RUN=false om echt te testen.',
    };
  }

  if (!cfg.meta.accessToken || !cfg.meta.phoneNumberId) {
    return {
      success: false,
      error: 'Missing META_WHATSAPP_ACCESS_TOKEN of META_WHATSAPP_PHONE_NUMBER_ID',
    };
  }

  try {
    const response = await fetch(endpoint(`/${cfg.meta.phoneNumberId}`, cfg), {
      method: 'GET',
      headers: authHeaders(cfg),
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || `HTTP ${response.status}`;
      const hint =
        data?.error?.error_subcode === 33
          ? ' System user heeft geen toegang tot deze WABA — koppel WhatsApp-account in Business Settings → System users → Assign assets.'
          : '';
      return { success: false, error: msg + hint, errorCode: data?.error?.code };
    }
    return {
      success: true,
      phoneNumberId: data.id,
      displayPhone: data.display_phone_number,
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verstuur een goedgekeurd template-bericht.
 *
 * Voor opted-in nummers binnen het 24-uurs service-window mag je ook
 * vrije tekst sturen, maar voor automation (proactief) is template
 * verplicht.
 *
 * @param {object} params
 * @param {string} params.to               E.164 zonder + (bijv. "31612345678")
 * @param {string} params.templateName     Naam zoals goedgekeurd in WhatsApp Manager
 * @param {string} [params.languageCode]   Default "nl"
 * @param {Array<object>} [params.components]  Body/header/button componenten
 * @param {object} [params.context]        Trace info voor logging (treatmentType, stage, email)
 */
export async function sendTemplate(
  {
    to,
    templateName,
    languageCode = 'nl',
    components = [],
    context = {},
  },
  options = {},
) {
  const cfg = resolveConfig(options.config);
  if (!to || !templateName) {
    return { success: false, error: 'sendTemplate vereist "to" en "templateName"' };
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    },
  };

  if (cfg.dryRun) {
    const dryResult = {
      success: true,
      dryRun: true,
      messageId: `dryrun_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to,
      templateName,
      languageCode,
      payload,
      context,
      message: 'DRY RUN — bericht is NIET verstuurd, alleen gelogd.',
    };
    waLog('sendTemplate dry-run', { to, templateName, context });
    return dryResult;
  }

  if (!cfg.meta.accessToken || !cfg.meta.phoneNumberId) {
    return { success: false, error: 'Meta credentials ontbreken — kan niet live versturen' };
  }

  try {
    const response = await fetch(endpoint(`/${cfg.meta.phoneNumberId}/messages`, cfg), {
      method: 'POST',
      headers: authHeaders(cfg),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || `HTTP ${response.status}`,
        errorDetail: data?.error,
      };
    }
    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
      contactWaId: data?.contacts?.[0]?.wa_id,
      to,
      templateName,
      context,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lijst goedgekeurde templates op vanuit WhatsApp Business Account.
 * Handig voor de dashboard tab "WhatsApp templates".
 */
export async function listMessageTemplates(options = {}) {
  const cfg = resolveConfig(options.config);
  if (cfg.dryRun) {
    return {
      success: true,
      dryRun: true,
      templates: [],
      message: 'DRY RUN — geen call naar Meta gedaan.',
    };
  }
  if (!cfg.meta.accessToken || !cfg.meta.businessAccountId) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN of META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt' };
  }

  try {
    const response = await fetch(
      endpoint(`/${cfg.meta.businessAccountId}/message_templates?limit=100`, cfg),
      { method: 'GET', headers: authHeaders(cfg) },
    );
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
    }
    return {
      success: true,
      templates: (data.data || []).map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        language: t.language,
        category: t.category,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verifieer een Meta webhook handshake.
 * Gebruikt vanuit de Next.js webhook route in marketing-automations.
 */
export function verifyWebhook({ mode, token, challenge }) {
  const verifyToken =
    defaultConfig.meta.webhookVerifyToken || process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  if (mode === 'subscribe' && token && token === verifyToken) {
    return { ok: true, challenge };
  }
  return { ok: false };
}

/**
 * Lijst alle phone numbers die onder de geconfigureerde WhatsApp Business
 * Account (WABA) hangen.
 *
 * Bedoeld voor `find-phone` / debugging: helpt te bepalen of een specifiek
 * nummer al bij Meta geregistreerd is voor deze WABA.
 *
 * Werkt NIET in dry-run, want het is een read-only call die je expliciet
 * doet om setup te verifiëren.
 */
export async function listPhoneNumbers(options = {}) {
  const cfg = resolveConfig(options.config);
  if (!cfg.meta.accessToken) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN ontbreekt' };
  }
  if (!cfg.meta.businessAccountId) {
    return { success: false, error: 'META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt' };
  }

  try {
    const url = endpoint(
      `/${cfg.meta.businessAccountId}/phone_numbers` +
      `?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status,platform_type`,
      cfg,
    );
    const response = await fetch(url, { method: 'GET', headers: authHeaders(cfg) });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${response.status}`, errorDetail: data?.error };
    }
    return {
      success: true,
      phoneNumbers: (data.data || []).map(p => ({
        id: p.id,
        displayPhone: p.display_phone_number,
        verifiedName: p.verified_name,
        qualityRating: p.quality_rating,
        codeVerificationStatus: p.code_verification_status,
        nameStatus: p.name_status,
        platformType: p.platform_type,
      })),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lijst alle WhatsApp Business Accounts waar dit access token toegang
 * tot heeft, eventueel gefilterd op business ID.
 *
 * Nuttig wanneer je nog niet weet welke WABA ID Cocon gebruikt.
 *
 * Vereist een access token met `business_management` permission.
 *
 * @param {object} options
 * @param {string} [options.businessId]   Meta Business ID (Business Manager)
 */
export async function listWhatsAppBusinessAccounts({ businessId } = {}, options = {}) {
  const cfg = resolveConfig(options.config);
  if (!cfg.meta.accessToken) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN ontbreekt' };
  }

  const target = businessId
    ? `/${businessId}/owned_whatsapp_business_accounts`
    : `/me/businesses`;

  try {
    const response = await fetch(endpoint(target, cfg), {
      method: 'GET',
      headers: authHeaders(cfg),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${response.status}`, errorDetail: data?.error };
    }
    return { success: true, items: data.data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Haal de WhatsApp Business Account (WABA) ID op die bij het geconfigureerde
 * phone number hoort. Read-only GET — handig om META_WHATSAPP_BUSINESS_ACCOUNT_ID
 * te vinden zonder iets te wijzigen.
 */
export async function getWabaForPhoneNumber(
  { phoneNumberId } = {},
  options = {},
) {
  const cfg = resolveConfig(options.config);
  const pid = phoneNumberId || cfg.meta.phoneNumberId;
  if (!cfg.meta.accessToken) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN ontbreekt' };
  }
  if (!pid) {
    return { success: false, error: 'Geen phone number ID (META_WHATSAPP_PHONE_NUMBER_ID)' };
  }
  try {
    const response = await fetch(
      endpoint(`/${pid}?fields=whatsapp_business_account`, cfg),
      { method: 'GET', headers: authHeaders(cfg) },
    );
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${response.status}`, errorDetail: data?.error };
    }
    return {
      success: true,
      wabaId: data?.whatsapp_business_account?.id || null,
      wabaName: data?.whatsapp_business_account?.name || null,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
  testConnection,
  sendTemplate,
  listMessageTemplates,
  listPhoneNumbers,
  listWhatsAppBusinessAccounts,
  getWabaForPhoneNumber,
  verifyWebhook,
  assertSafeEndpoint,
};
