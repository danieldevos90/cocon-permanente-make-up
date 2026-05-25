/**
 * @param {string} _rawBody
 * @param {string} _signatureHeader
 */
export function verifyMetaSignature(_rawBody, _signatureHeader) {
  return false;
}

/**
 * @param {Record<string, unknown>} [_payload]
 * @returns {{ messages: Array<Record<string, unknown>>, statuses: Array<Record<string, unknown>> }}
 */
export function parseInboundWebhook(_payload = {}) {
  return { messages: [], statuses: [] };
}
