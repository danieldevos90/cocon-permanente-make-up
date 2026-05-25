/**
 * @param {{ mode?: string | null, token?: string | null, challenge?: string | null }} [_opts]
 * @returns {{ ok: boolean, challenge?: string | null }}
 */
export function verifyWebhook(_opts = {}) {
  return { ok: false };
}
