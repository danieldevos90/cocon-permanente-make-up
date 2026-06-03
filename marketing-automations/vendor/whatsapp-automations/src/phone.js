/**
 * Phone number normalisation utilities.
 *
 * WhatsApp Cloud API verwacht E.164 zonder + prefix in het "to" veld.
 * Voorbeelden:
 *   "06 12 34 56 78"    → "31612345678"
 *   "+31 6 12345678"    → "31612345678"
 *   "0031612345678"     → "31612345678"
 */

import { config } from './config.js';

const NON_DIGIT = /\D+/g;

/**
 * Normalise een (mogelijk vies) telefoonnummer naar E.164 zonder +.
 * Returnt null als het nummer ongeldig is.
 */
export function normalizePhone(raw, { countryCode = config.defaultCountryCode } = {}) {
  if (raw == null) return null;
  let digits = String(raw).trim().replace(NON_DIGIT, '');
  if (!digits) return null;

  // 00xx → xx
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Mobiel NL begint vaak met "0" — vervang door landcode
  if (digits.startsWith('0')) {
    digits = `${countryCode}${digits.slice(1)}`;
  }

  // Te kort om plausibel te zijn (NL mobiel = 11 incl. landcode)
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Visueel formaat voor logs / dashboard ("+31 6 12345678").
 */
export function prettyPhone(e164) {
  if (!e164) return '';
  if (e164.startsWith('31') && e164.length === 11) {
    return `+${e164.slice(0, 2)} ${e164.slice(2, 3)} ${e164.slice(3)}`;
  }
  return `+${e164}`;
}

export default { normalizePhone, prettyPhone };
