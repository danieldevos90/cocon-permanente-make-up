/**
 * Opt-in manager.
 *
 * WhatsApp Business policy verplicht expliciete opt-in voordat je
 * proactieve berichten mag sturen. Bron-of-truth voor opt-in is
 * Mailchimp (merge field WAOPTIN = "yes" + PHONE veld).
 *
 * Werkwijze:
 *   1. Klant geeft opt-in tijdens intake of in privacy policy checkbox.
 *   2. Bij intake/registratie schrijven we naar Mailchimp:
 *        merge_fields.WAOPTIN = "yes"
 *        merge_fields.PHONE   = "+31..."
 *   3. Deze module leest dit veld terug om te bepalen wie WhatsApp krijgt.
 *
 * In SCAFFOLD-mode (geen Mailchimp creds): returnt deze manager altijd
 * { optedIn: false, reason: 'mailchimp-not-configured' } zodat geen
 * berichten worden verstuurd zonder bewijs van opt-in.
 */

import { config } from './config.js';
import { normalizePhone } from './phone.js';

let mailchimpClientPromise = null;

async function getMailchimp() {
  if (!config.mailchimp.apiKey || !config.mailchimp.listId) return null;
  if (!mailchimpClientPromise) {
    mailchimpClientPromise = import('@mailchimp/mailchimp_marketing')
      .then(({ default: mc }) => {
        const serverPrefix = config.mailchimp.apiKey.split('-')[1] || 'us1';
        mc.setConfig({ apiKey: config.mailchimp.apiKey, server: serverPrefix });
        return mc;
      })
      .catch(() => null);
  }
  return mailchimpClientPromise;
}

function md5Lower(email) {
  // Mailchimp gebruikt MD5(lowercase(email)) als subscriber hash.
  // We laden crypto lazy zodat de module ook werkt zonder Node-omgeving.
  // eslint-disable-next-line global-require
  return import('node:crypto').then(({ createHash }) =>
    createHash('md5').update(email.toLowerCase().trim()).digest('hex'),
  );
}

/**
 * Lookup of een e-mailadres opt-in heeft voor WhatsApp.
 * Returnt { optedIn, phone, reason }.
 */
export async function lookupOptIn(email) {
  if (!email) return { optedIn: false, reason: 'no-email' };

  const mc = await getMailchimp();
  if (!mc) {
    return {
      optedIn: false,
      reason: 'mailchimp-not-configured',
    };
  }

  try {
    const hash = await md5Lower(email);
    const member = await mc.lists.getListMember(config.mailchimp.listId, hash);
    const merge = member?.merge_fields || {};
    const optInRaw = String(merge[config.optIn.mergeField] || '').toLowerCase().trim();
    const phoneRaw = merge[config.optIn.phoneMergeField] || merge.PHONE || '';
    const phone = normalizePhone(phoneRaw);

    if (optInRaw !== config.optIn.optInValue) {
      return { optedIn: false, reason: 'no-opt-in-flag', phone };
    }
    if (!phone) {
      return { optedIn: false, reason: 'no-phone', phone: null };
    }
    return { optedIn: true, phone, email };
  } catch (error) {
    if (error?.status === 404) {
      return { optedIn: false, reason: 'not-in-list' };
    }
    return { optedIn: false, reason: `mailchimp-error: ${error.message}` };
  }
}

/**
 * Markeer een (email, phone) combo als opt-in in Mailchimp.
 * Te gebruiken vanuit intake formulier endpoint.
 */
export async function recordOptIn({ email, phone }) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { success: false, error: 'Ongeldig telefoonnummer' };

  const mc = await getMailchimp();
  if (!mc) return { success: false, error: 'Mailchimp niet geconfigureerd' };

  try {
    const hash = await md5Lower(email);
    await mc.lists.updateListMember(config.mailchimp.listId, hash, {
      merge_fields: {
        [config.optIn.mergeField]: config.optIn.optInValue,
        [config.optIn.phoneMergeField]: `+${normalized}`,
      },
    });
    return { success: true, email, phone: normalized };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default { lookupOptIn, recordOptIn };
