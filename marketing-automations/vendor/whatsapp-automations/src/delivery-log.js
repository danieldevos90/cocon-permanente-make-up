/**
 * @param {{ days?: number }} [_opts]
 * @returns {Promise<{ configured: boolean, events: Array<Record<string, unknown>> }>}
 */
export async function getRecentEvents(_opts = {}) {
  return { configured: false, events: [] };
}

/**
 * @param {{ days?: number }} [_opts]
 * @returns {Promise<{ configured: boolean, messages: Array<Record<string, unknown>> }>}
 */
export async function getRecentInbox(_opts = {}) {
  return { configured: false, messages: [] };
}

/**
 * @param {Record<string, unknown>} [_event]
 */
export async function logSend(_event = {}) {
  return { logged: false };
}

/**
 * @param {Record<string, unknown>} [_message]
 */
export async function logInbound(_message = {}) {
  return { logged: false };
}

/**
 * @param {Record<string, unknown>} [_status]
 */
export async function logStatus(_status = {}) {
  return { logged: false };
}
