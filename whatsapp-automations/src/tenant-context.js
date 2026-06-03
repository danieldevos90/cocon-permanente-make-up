/**
 * Run async work with a tenant-specific config (AsyncLocalStorage).
 */

import { AsyncLocalStorage } from 'async_hooks';
import { buildConfigForClient } from './build-config.js';

export const tenantContext = new AsyncLocalStorage();

export function getContextConfig() {
  return tenantContext.getStore()?.config || null;
}

export function getContextClientId() {
  return tenantContext.getStore()?.clientId || null;
}

/**
 * @param {string} clientId
 * @param {() => Promise<unknown>} fn
 */
export async function withTenant(clientId, fn) {
  const cfg = await buildConfigForClient(clientId);
  return tenantContext.run({ clientId, config: cfg }, fn);
}

export default { withTenant, getContextConfig, getContextClientId, tenantContext };
