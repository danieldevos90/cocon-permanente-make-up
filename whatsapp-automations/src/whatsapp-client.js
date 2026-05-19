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

import { config } from './config.js';

const GRAPH_API_BASE = 'https://graph.facebook.com';

function endpoint(path) {
  return `${GRAPH_API_BASE}/${config.meta.apiVersion}${path}`;
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${config.meta.accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Test of de credentials werken door het phone number resource op te vragen.
 * In dry-run returnt dit een gefakete response.
 */
export async function testConnection() {
  if (config.dryRun) {
    return {
      success: true,
      dryRun: true,
      message: 'DRY RUN — geen connection test uitgevoerd. Zet WHATSAPP_DRY_RUN=false om echt te testen.',
    };
  }

  if (!config.meta.accessToken || !config.meta.phoneNumberId) {
    return {
      success: false,
      error: 'Missing META_WHATSAPP_ACCESS_TOKEN of META_WHATSAPP_PHONE_NUMBER_ID',
    };
  }

  try {
    const response = await fetch(endpoint(`/${config.meta.phoneNumberId}`), {
      method: 'GET',
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
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
export async function sendTemplate({
  to,
  templateName,
  languageCode = 'nl',
  components = [],
  context = {},
}) {
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

  if (config.dryRun) {
    return {
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
  }

  if (!config.meta.accessToken || !config.meta.phoneNumberId) {
    return { success: false, error: 'Meta credentials ontbreken — kan niet live versturen' };
  }

  try {
    const response = await fetch(endpoint(`/${config.meta.phoneNumberId}/messages`), {
      method: 'POST',
      headers: authHeaders(),
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
export async function listMessageTemplates() {
  if (config.dryRun) {
    return {
      success: true,
      dryRun: true,
      templates: [],
      message: 'DRY RUN — geen call naar Meta gedaan.',
    };
  }
  if (!config.meta.accessToken || !config.meta.businessAccountId) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN of META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt' };
  }

  try {
    const response = await fetch(
      endpoint(`/${config.meta.businessAccountId}/message_templates?limit=100`),
      { method: 'GET', headers: authHeaders() },
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
  if (mode === 'subscribe' && token && token === config.meta.webhookVerifyToken) {
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
export async function listPhoneNumbers() {
  if (!config.meta.accessToken) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN ontbreekt' };
  }
  if (!config.meta.businessAccountId) {
    return { success: false, error: 'META_WHATSAPP_BUSINESS_ACCOUNT_ID ontbreekt' };
  }

  try {
    const url = endpoint(
      `/${config.meta.businessAccountId}/phone_numbers` +
      `?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status,platform_type`,
    );
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
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
export async function listWhatsAppBusinessAccounts({ businessId } = {}) {
  if (!config.meta.accessToken) {
    return { success: false, error: 'META_WHATSAPP_ACCESS_TOKEN ontbreekt' };
  }

  const target = businessId
    ? `/${businessId}/owned_whatsapp_business_accounts`
    : `/me/businesses`;

  try {
    const response = await fetch(endpoint(target), {
      method: 'GET',
      headers: authHeaders(),
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

export default {
  testConnection,
  sendTemplate,
  listMessageTemplates,
  listPhoneNumbers,
  listWhatsAppBusinessAccounts,
  verifyWebhook,
};
