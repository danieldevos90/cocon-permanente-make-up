/**
 * Per-tenant Meta credentials + lookup indexes (Upstash Redis).
 *
 * Keys:
 *   wa:tenant:{clientId}     → JSON tenant record
 *   wa:phone:{phoneNumberId} → clientId
 *   wa:waba:{wabaId}         → clientId
 *   wa:tenants               → SET of clientIds
 */

import { config } from './config.js';
import { getClientById } from './client-config.js';

let redisPromise = null;

async function getRedis() {
  if (!config.redis.url || !config.redis.token) return null;
  if (!redisPromise) {
    redisPromise = import('@upstash/redis').then(({ Redis }) =>
      new Redis({ url: config.redis.url, token: config.redis.token }),
    );
  }
  return redisPromise;
}

function tenantKey(clientId) {
  return `wa:tenant:${clientId}`;
}

/**
 * @typedef {object} TenantRecord
 * @property {string} clientId
 * @property {string} [wabaId]
 * @property {string} [phoneNumberId]
 * @property {string} [accessToken]
 * @property {string} [businessId]
 * @property {string} [storedAt]
 * @property {string} [source] onboard | env-seed | manual
 */

export async function saveTenant(record) {
  const clientId = record?.clientId;
  if (!clientId) throw new Error('saveTenant: clientId required');

  const payload = {
    clientId,
    wabaId: record.wabaId || '',
    phoneNumberId: record.phoneNumberId || '',
    accessToken: record.accessToken || '',
    businessId: record.businessId || '',
    storedAt: record.storedAt || new Date().toISOString(),
    source: record.source || 'manual',
  };

  const redis = await getRedis();
  if (!redis) {
    console.warn('[tenant-store] Redis not configured — tenant not persisted');
    return { saved: false, record: payload };
  }

  await redis.set(tenantKey(clientId), JSON.stringify(payload));
  await redis.sadd('wa:tenants', clientId);

  if (payload.phoneNumberId) {
    await redis.set(`wa:phone:${payload.phoneNumberId}`, clientId);
  }
  if (payload.wabaId) {
    await redis.set(`wa:waba:${payload.wabaId}`, clientId);
  }

  return { saved: true, record: payload };
}

export async function getTenant(clientId) {
  if (!clientId) return null;
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(tenantKey(clientId));
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export async function resolveClientByPhoneId(phoneNumberId) {
  if (!phoneNumberId) return null;
  const redis = await getRedis();
  if (!redis) return process.env.CLIENT_ID || 'cocon';
  try {
    const id = await redis.get(`wa:phone:${phoneNumberId}`);
    return id || null;
  } catch {
    return null;
  }
}

export async function resolveClientByWabaId(wabaId) {
  if (!wabaId) return null;
  const redis = await getRedis();
  if (!redis) return null;
  try {
    return await redis.get(`wa:waba:${wabaId}`);
  } catch {
    return null;
  }
}

/** Parse Meta webhook payload for phone_number_id → clientId */
export async function resolveClientFromWebhookPayload(payload) {
  const entries = payload?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const phoneId = change?.value?.metadata?.phone_number_id;
      if (phoneId) {
        const client = await resolveClientByPhoneId(phoneId);
        if (client) return client;
      }
    }
  }
  return process.env.CLIENT_ID || 'cocon';
}

export async function listTenantIds() {
  const redis = await getRedis();
  const fromDisk = [];
  try {
    const { readdirSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'clients');
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.json') && !f.startsWith('_')) {
        fromDisk.push(f.replace('.json', ''));
      }
    }
  } catch {
    // ignore
  }

  if (!redis) return [...new Set(fromDisk)];

  try {
    const ids = await redis.smembers('wa:tenants');
    return [...new Set([...fromDisk, ...(ids || [])])].sort();
  } catch {
    return [...new Set(fromDisk)].sort();
  }
}

/**
 * Seed tenant from env when Redis empty (migration / first deploy).
 */
export async function seedTenantFromEnv(clientId) {
  const existing = await getTenant(clientId);
  if (existing?.phoneNumberId && existing?.accessToken) return existing;

  const client = getClientById(clientId);
  const defaultId = process.env.CLIENT_ID || process.env.DEFAULT_CLIENT_ID || 'cocon';
  if (client.envSeed === false || clientId !== defaultId) return existing;

  const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';

  if (!wabaId && !phoneNumberId && !accessToken) return existing;

  return saveTenant({
    clientId,
    wabaId,
    phoneNumberId,
    accessToken,
    source: 'env-seed',
  }).then((r) => r.record);
}

export default {
  saveTenant,
  getTenant,
  resolveClientByPhoneId,
  resolveClientByWabaId,
  resolveClientFromWebhookPayload,
  listTenantIds,
  seedTenantFromEnv,
};
