/**
 * Email delivery log — automation sends naar Upstash Redis.
 *
 * Sleutels:
 *   email:log:YYYY-MM-DD          → LIST met JSON events per dag
 *   email:last:{email}            → laatste send per contact (2 jaar TTL)
 *
 * Bewaartijd dag-logs: 180 dagen.
 */

import { config } from './config.js';
import { updateSubscriberLastEmail } from './mailchimp-client.js';

let redisClientPromise = null;

async function getRedis() {
  if (!config.redis.url || !config.redis.token) return null;
  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis').then(({ Redis }) =>
      new Redis({ url: config.redis.url, token: config.redis.token }),
    );
  }
  return redisClientPromise;
}

function todayKey(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `email:log:${yyyy}-${mm}-${dd}`;
}

function lastSendKey(email) {
  return `email:last:${(email || '').toLowerCase()}`;
}

/**
 * @param {object} event
 */
export async function logEmailSend(event) {
  const enriched = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  console.log(
    `[email-log] ${enriched.success ? 'OK ' : 'FAIL'} ` +
    `${enriched.stage || '?'}/${enriched.treatmentType || '?'} → ` +
    `${enriched.email || (enriched.emails || []).join(', ') || '?'} ` +
    `${enriched.error ? `err=${enriched.error}` : ''}`,
  );

  const redis = await getRedis();
  if (!redis) return { logged: false, reason: 'redis-not-configured' };

  try {
    const key = todayKey();
    await redis.rpush(key, JSON.stringify(enriched));
    await redis.expire(key, 60 * 60 * 24 * 180);

    const email = enriched.email || (Array.isArray(enriched.emails) ? enriched.emails[0] : '');
    if (email && enriched.success) {
      await redis.set(
        lastSendKey(email),
        JSON.stringify({
          email,
          stage: enriched.stage,
          treatmentType: enriched.treatmentType,
          subject: enriched.subject,
          timestamp: enriched.timestamp,
          campaignId: enriched.campaignId || null,
        }),
        { ex: 60 * 60 * 24 * 730 },
      );
    }

    return { logged: true };
  } catch (error) {
    console.warn('[email-log] Redis write failed:', error.message);
    return { logged: false, reason: error.message };
  }
}

/**
 * Na succesvolle send: Mailchimp merge fields + Redis per ontvanger.
 */
export async function recordSuccessfulEmailSends({
  emails,
  stage,
  treatmentType,
  subject,
  campaignId = null,
}) {
  const timestamp = new Date().toISOString();
  for (const email of emails) {
    await updateSubscriberLastEmail(email, { subject, stage, sentAt: timestamp });
    await logEmailSend({
      email,
      stage,
      treatmentType,
      subject,
      success: true,
      campaignId,
      timestamp,
    });
  }
}

export async function recordFailedEmailSend({
  emails,
  stage,
  treatmentType,
  subject,
  error,
  campaignId = null,
}) {
  await logEmailSend({
    emails,
    stage,
    treatmentType,
    subject,
    success: false,
    error,
    campaignId,
  });
}

export async function getRecentEvents({ days = 7 } = {}) {
  const redis = await getRedis();
  if (!redis) return { configured: false, events: [] };

  const events = [];
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    const key = todayKey(date);
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

export async function getLastSendForEmail(email) {
  const redis = await getRedis();
  if (!redis || !email) return null;
  try {
    const raw = await redis.get(lastSendKey(email));
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export default {
  logEmailSend,
  recordSuccessfulEmailSends,
  recordFailedEmailSend,
  getRecentEvents,
  getLastSendForEmail,
};
