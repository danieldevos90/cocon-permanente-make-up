/**
 * Delivery log — schrijft WhatsApp send events naar Upstash Redis.
 *
 * Sleutels:
 *   wa:log:YYYY-MM-DD                     → LIST met JSON events per dag
 *   wa:tag:{stage}:{treatmentType}:{email}→ STRING "yes" om dubbele sends te
 *                                            voorkomen (parallel aan Mailchimp
 *                                            sent-tags in marketing-automations)
 *
 * Bewaartijd: 180 dagen per dag-log.
 *
 * Als Redis niet geconfigureerd is, faalt geen enkele log-call — events
 * worden dan alleen naar console geprint.
 */

import { config } from './config.js';
import { getContextClientId } from './tenant-context.js';

let redisClientPromise = null;

function resolveClientId(clientId) {
  return clientId || getContextClientId() || config.client?.id || process.env.CLIENT_ID || 'cocon';
}

function ns(clientId) {
  return `wa:${resolveClientId(clientId)}`;
}

async function getRedis() {
  if (!config.redis.url || !config.redis.token) return null;
  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis').then(({ Redis }) =>
      new Redis({ url: config.redis.url, token: config.redis.token }),
    );
  }
  return redisClientPromise;
}

function todayKey(date = new Date(), clientId) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${ns(clientId)}:log:${yyyy}-${mm}-${dd}`;
}

/**
 * Log een WhatsApp send event (success of failure).
 *
 * @param {object} event
 * @param {string} event.to             E.164 zonder +
 * @param {string} event.templateName
 * @param {string} event.stage          aftercare | browsRefresh | lipsRefresh
 * @param {string} event.treatmentType
 * @param {string} [event.email]
 * @param {boolean} event.success
 * @param {boolean} [event.dryRun]
 * @param {string} [event.messageId]
 * @param {string} [event.error]
 * @param {string} [event.fallback]     "email-sent" | "none"
 */
export async function logSend(event, { clientId } = {}) {
  const enriched = {
    timestamp: new Date().toISOString(),
    clientId: resolveClientId(clientId),
    dryRun: !!event.dryRun,
    ...event,
  };

  console.log(
    `[wa-log] ${enriched.success ? 'OK ' : 'FAIL'} ` +
    `${enriched.dryRun ? '(dry) ' : ''}` +
    `${enriched.templateName} → ${enriched.to} ` +
    `[${enriched.stage}/${enriched.treatmentType}] ` +
    `${enriched.error ? `err=${enriched.error}` : ''}`,
  );

  const redis = await getRedis();
  if (!redis) return { logged: false, reason: 'redis-not-configured' };

  try {
    const key = todayKey(new Date(), enriched.clientId);
    await redis.rpush(key, JSON.stringify(enriched));
    await redis.expire(key, 60 * 60 * 24 * 180);
    return { logged: true };
  } catch (error) {
    console.warn('[wa-log] Redis write failed:', error.message);
    return { logged: false, reason: error.message };
  }
}

/**
 * Markeer een (stage + email) als verstuurd, om dubbele sends te voorkomen
 * binnen dezelfde cron-cyclus.
 */
export async function markSent({ stage, treatmentType, email, clientId }) {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const key = `${ns(clientId)}:tag:${stage}:${treatmentType}:${(email || '').toLowerCase()}`;
    await redis.set(key, 'yes', { ex: 60 * 60 * 24 * 400 }); // ~13 maanden
    return true;
  } catch (error) {
    console.warn('[wa-log] markSent failed:', error.message);
    return false;
  }
}

export async function hasSent({ stage, treatmentType, email, clientId }) {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const key = `${ns(clientId)}:tag:${stage}:${treatmentType}:${(email || '').toLowerCase()}`;
    const result = await redis.get(key);
    return result === 'yes';
  } catch {
    return false;
  }
}

/**
 * Laad de laatste N dagen aan WhatsApp send events voor het dashboard.
 */
export async function getRecentEvents({ days = 7, clientId } = {}) {
  const redis = await getRedis();
  if (!redis) return { configured: false, events: [] };

  const events = [];
  const cid = resolveClientId(clientId);
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    const key = todayKey(date, cid);
    try {
      const raw = await redis.lrange(key, 0, -1);
      for (const item of raw) {
        try {
          events.push(typeof item === 'string' ? JSON.parse(item) : item);
        } catch {
          // skip corrupt entry
        }
      }
    } catch {
      // skip missing key
    }
  }

  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return { configured: true, events };
}

function inboxKey(date = new Date(), clientId) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${ns(clientId)}:inbox:${yyyy}-${mm}-${dd}`;
}

/**
 * Log een inkomend WhatsApp-bericht (van klant) naar Redis.
 *
 * Observer-mode: er wordt NIETS automatisch teruggestuurd. Daniela
 * antwoordt vanaf de telefoon (coexistence). Dit log dient als audit
 * trail + dashboard view.
 *
 * @param {object} message Meta webhook message object (genormaliseerd)
 * @param {string} message.from           afzender E.164 zonder +
 * @param {string} [message.profileName]  WhatsApp display name
 * @param {string} message.type           text | image | reaction | ...
 * @param {string} [message.text]
 * @param {string} [message.replyToTemplate] template naam waar dit antwoord op is
 * @param {string} [message.waMessageId]
 * @param {string} [message.timestamp]    ISO of Meta timestamp seconds
 */
export async function logInbound(message, { clientId } = {}) {
  const cid = resolveClientId(clientId);
  const enriched = {
    direction: 'inbound',
    clientId: cid,
    timestamp: message.timestamp
      ? (typeof message.timestamp === 'number' || /^\d+$/.test(String(message.timestamp))
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : message.timestamp)
      : new Date().toISOString(),
    ...message,
  };

  console.log(
    `[wa-inbox] ${enriched.from} (${enriched.profileName || '?'}) ` +
    `${enriched.type}: ${(enriched.text || '').slice(0, 80)}`,
  );

  const redis = await getRedis();
  if (!redis) return { logged: false, reason: 'redis-not-configured' };

  try {
    const key = inboxKey(new Date(), cid);
    await redis.rpush(key, JSON.stringify(enriched));
    await redis.expire(key, 60 * 60 * 24 * 180);
    return { logged: true };
  } catch (error) {
    console.warn('[wa-inbox] Redis write failed:', error.message);
    return { logged: false, reason: error.message };
  }
}

/**
 * Log een delivery-status update van Meta (sent/delivered/read/failed).
 */
export async function logStatus(status, { clientId } = {}) {
  const cid = resolveClientId(clientId);
  const enriched = {
    direction: 'status',
    clientId: cid,
    timestamp: status.timestamp
      ? (typeof status.timestamp === 'number' || /^\d+$/.test(String(status.timestamp))
        ? new Date(Number(status.timestamp) * 1000).toISOString()
        : status.timestamp)
      : new Date().toISOString(),
    ...status,
  };

  console.log(
    `[wa-status] ${enriched.recipient || '?'} ${enriched.status} ` +
    `msgId=${enriched.waMessageId || '-'}`,
  );

  const redis = await getRedis();
  if (!redis) return { logged: false, reason: 'redis-not-configured' };

  try {
    const key = todayKey(new Date(), enriched.clientId);
    await redis.rpush(key, JSON.stringify(enriched));
    await redis.expire(key, 60 * 60 * 24 * 180);
    return { logged: true };
  } catch (error) {
    return { logged: false, reason: error.message };
  }
}

/**
 * Laad recente inkomende klant-berichten (laatste N dagen).
 */
export async function getRecentInbox({ days = 7, clientId } = {}) {
  const redis = await getRedis();
  if (!redis) return { configured: false, messages: [] };

  const messages = [];
  const cid = resolveClientId(clientId);
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    const key = inboxKey(date, cid);
    try {
      const raw = await redis.lrange(key, 0, -1);
      for (const item of raw) {
        try {
          messages.push(typeof item === 'string' ? JSON.parse(item) : item);
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }

  messages.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return { configured: true, messages };
}

export default {
  logSend,
  markSent,
  hasSent,
  getRecentEvents,
  logInbound,
  logStatus,
  getRecentInbox,
};
