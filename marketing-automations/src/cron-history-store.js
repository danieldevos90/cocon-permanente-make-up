/**
 * Cron run storage in Upstash Redis (no KEYS — compatible with REST API limits).
 */

export const CRON_INDEX_KEY = 'cron:index';
export const CRON_TTL_SEC = 60 * 60 * 24 * 90;

export function cronKeyForDate(dateStr) {
  return `cron:${dateStr}`;
}

/** @param {{ days?: number }} [opts] */
export function listRecentDateStrings({ days = 90 } = {}) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {number} [limit]
 */
export async function listCronDates(redis, limit = 60) {
  const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), 90);

  try {
    const indexed = await redis.zrange(CRON_INDEX_KEY, 0, safeLimit - 1, { rev: true });
    if (indexed?.length) {
      return indexed.map(String);
    }
  } catch {
    // index missing or zrange unsupported — fall through
  }

  const dates = [];
  const scanDays = Math.min(safeLimit, 30);
  const dateStrings = listRecentDateStrings({ days: scanDays });
  const chunkSize = 15;

  for (let index = 0; index < dateStrings.length; index += chunkSize) {
    const chunk = dateStrings.slice(index, index + chunkSize);
    const pipeline = redis.pipeline();
    for (const dateStr of chunk) {
      pipeline.llen(cronKeyForDate(dateStr));
    }

    let lengths = [];
    try {
      const result = await pipeline.exec();
      lengths = Array.isArray(result) ? result : [];
    } catch {
      for (const dateStr of chunk) {
        try {
          const len = await redis.llen(cronKeyForDate(dateStr));
          if (Number(len) > 0) dates.push(dateStr);
        } catch {
          // skip unreadable key
        }
      }
      if (dates.length >= safeLimit) break;
      continue;
    }

    for (let offset = 0; offset < chunk.length; offset += 1) {
      const len = Number(lengths[offset] ?? 0);
      if (len > 0) dates.push(chunk[offset]);
    }
    if (dates.length >= safeLimit) break;
  }

  return dates.slice(0, safeLimit);
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} dateStr
 */
export async function readCronRunsForDate(redis, dateStr) {
  const key = cronKeyForDate(dateStr);
  try {
    const raw = await redis.lrange(key, 0, -1);
    return (raw || [])
      .map((r) => {
        try {
          return typeof r === 'string' ? JSON.parse(r) : r;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    const legacy = await redis.get(key);
    if (legacy && typeof legacy === 'object') {
      return [legacy];
    }
    return [];
  }
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} dateStr
 * @param {Record<string, unknown>} run
 */
export async function appendCronRun(redis, dateStr, run) {
  const key = cronKeyForDate(dateStr);
  await redis.rpush(key, JSON.stringify(run));
  await redis.expire(key, CRON_TTL_SEC);
  try {
    await redis.zadd(CRON_INDEX_KEY, { score: Date.now(), member: dateStr });
    await redis.expire(CRON_INDEX_KEY, CRON_TTL_SEC);
  } catch {
    // non-fatal
  }
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {{ days?: number }} [opts]
 */
export async function loadCronHistoryEntries(redis, { days = 60 } = {}) {
  const safeDays = Math.min(Math.max(Number(days) || 60, 1), 90);
  const dates = await listCronDates(redis, safeDays);
  const entries = [];

  for (const dateStr of dates) {
    const runs = await readCronRunsForDate(redis, dateStr);
    if (!runs.length) continue;

    const last = runs[runs.length - 1];
    entries.push({
      date: dateStr,
      syncs: runs.length,
      appointments: Number(last.appointments) || 0,
      updated: runs.reduce((s, r) => s + (Number(r.updated) || 0), 0),
      errors: runs.reduce((s, r) => s + (Number(r.errors) || 0), 0),
      aftercareSent: runs.reduce((s, r) => s + (Number(r.aftercareSent) || 0), 0),
      aftercareErrors: runs.reduce((s, r) => s + (Number(r.aftercareErrors) || 0), 0),
      journeySent: runs.reduce((s, r) => s + (Number(r.journeySent) || 0), 0),
      journeyErrors: runs.reduce((s, r) => s + (Number(r.journeyErrors) || 0), 0),
      elapsed: last.elapsed ?? '-',
      lastRunAt: last.time ?? null,
    });
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  return entries;
}
