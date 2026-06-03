/**
 * Salonized-hook — gedeelde brug tussen marketing-automations en
 * whatsapp-automations.
 *
 * Werking:
 *   1. marketing-automations/src/salonized-daily-sync.js draait dagelijks
 *      (cron op Vercel) en verwerkt vandaag's iCal afspraken.
 *   2. NÁ de Mailchimp aftercare-send roept hij `onTreatmentProcessed()`
 *      hieronder aan met email + treatmentType + treatmentDate.
 *   3. Wij beslissen vervolgens wat er per stage met WhatsApp moet gebeuren:
 *        - aftercare: direct sturen (mits opt-in + template approved)
 *        - browsRefresh / lipsRefresh: plannen (cron checkt later of due)
 *
 * Voor de planned-stages bewaren we de schedule in Redis zodat een
 * latere cron-run ze kan oppakken zonder Mailchimp roundtrip.
 *
 * In SCAFFOLD-mode (template metaStatus = 'pending') worden alle sends
 * geweigerd vóór ze het Meta-pad bereiken. Dit is veilig.
 */

import { config } from './config.js';
import { listTenantIds } from './tenant-store.js';
import {
  sendWhatsAppForStage,
  planStagesForTreatment,
  whatsappStages,
} from './automation-manager.js';
import { logSend } from './delivery-log.js';

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

/**
 * Wordt aangeroepen door marketing-automations zodra een behandeling is
 * gesynced (LASTTRTDT updated, aftercare-email gequeued).
 *
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.firstName
 * @param {string} input.lastName
 * @param {string} input.treatmentType  wenkbrauwen | eyeliner | lippen
 * @param {Date|string} input.treatmentDate
 * @param {boolean} [input.dryRun]      Forceer dry-run regardless of config
 */
export async function onTreatmentProcessed(input) {
  const clientId = input.clientId || process.env.CLIENT_ID || 'cocon';
  const {
    email,
    firstName,
    lastName,
    treatmentType,
    treatmentDate,
    dryRun = false,
  } = input;

  const planned = planStagesForTreatment({ treatmentType, treatmentDate, clientId });
  const summary = {
    email,
    treatmentType,
    treatmentDate: new Date(treatmentDate).toISOString().slice(0, 10),
    aftercare: null,
    scheduled: [],
  };

  // 1. Aftercare direct (daysAfter = 0)
  const aftercareStage = planned.find(p => p.stage === 'aftercare');
  if (aftercareStage) {
    const result = await sendWhatsAppForStage({
      stage: 'aftercare',
      treatmentType,
      firstName,
      email,
      clientId,
    });
    summary.aftercare = result;
  }

  // 2. Refresh stages → planning bewaren in Redis voor latere cron-pickup
  const futureStages = planned.filter(p => p.stage !== 'aftercare');
  for (const stage of futureStages) {
    await schedulePendingSend({
      ...stage,
      email,
      firstName,
      lastName,
    });
    summary.scheduled.push({
      stage: stage.stage,
      treatmentType: stage.treatmentType,
      due: stage.scheduledDate.toISOString().slice(0, 10),
    });
  }

  if (dryRun) {
    summary.dryRunForced = true;
  }

  return summary;
}

/**
 * Bewaar een geplande WhatsApp-send in Redis (ZSET op timestamp).
 * Sleutel: wa:schedule
 *   member: JSON({email, firstName, treatmentType, stage})
 *   score:  unix-seconds van scheduledDate
 */
export async function schedulePendingSend({
  stage,
  treatmentType,
  scheduledDate,
  email,
  firstName,
  lastName,
  clientId,
}) {
  const redis = await getRedis();
  if (!redis) {
    console.warn('[wa-hook] Geen Redis — kan refresh-stage niet plannen voor', email);
    return { scheduled: false, reason: 'redis-not-configured' };
  }
  const cid = clientId || process.env.CLIENT_ID || 'cocon';
  const score = Math.floor(new Date(scheduledDate).getTime() / 1000);
  const member = JSON.stringify({ stage, treatmentType, email, firstName, lastName, clientId: cid });
  const scheduleKey = `wa:${cid}:schedule`;
  await redis.zadd(scheduleKey, { score, member });
  return { scheduled: true, score, member, scheduleKey };
}

/**
 * Cron-runner: pak alle gescheduled stages waarvan scheduledDate <= now.
 * Roept sendWhatsAppForStage aan en verwijdert succesvolle entries.
 */
export async function runScheduledSends({ now = new Date() } = {}) {
  const report = {
    checked: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const redis = await getRedis();
  if (!redis) {
    report.error = 'redis-not-configured';
    return report;
  }

  const nowScore = Math.floor(now.getTime() / 1000);
  const tenantIds = await listTenantIds();

  for (const cid of tenantIds) {
    const scheduleKey = `wa:${cid}:schedule`;
    const due = await redis.zrange(scheduleKey, 0, nowScore, { byScore: true });

    for (const raw of due) {
      report.checked += 1;
      let entry;
      try {
        entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        report.failed += 1;
        report.details.push({ raw, error: 'invalid-json' });
        await redis.zrem(scheduleKey, raw);
        continue;
      }

      const result = await sendWhatsAppForStage({
        stage: entry.stage,
        treatmentType: entry.treatmentType,
        firstName: entry.firstName,
        email: entry.email,
        clientId: entry.clientId || cid,
      });

      if (result.ok) {
        report.sent += 1;
        await redis.zrem(scheduleKey, raw);
      } else if (result.reason === 'template-not-approved' || result.reason?.startsWith('template-not-approved:')) {
        report.skipped += 1;
      } else if (result.reason === 'already-sent') {
        report.skipped += 1;
        await redis.zrem(scheduleKey, raw);
      } else if (result.reason?.startsWith('no-opt-in')) {
        report.skipped += 1;
        await redis.zrem(scheduleKey, raw);
        await logSend(
          {
            to: '',
            templateName: '',
            stage: entry.stage,
            treatmentType: entry.treatmentType,
            email: entry.email,
            success: false,
            error: result.reason,
          },
          { clientId: entry.clientId || cid },
        );
      } else {
        report.failed += 1;
      }

      report.details.push({ entry, result });
    }
  }

  // Legacy global schedule (pre multi-tenant)
  const legacyDue = await redis.zrange('wa:schedule', 0, nowScore, { byScore: true });
  for (const raw of legacyDue) {
    report.checked += 1;
    let entry;
    try {
      entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      report.failed += 1;
      await redis.zrem('wa:schedule', raw);
      continue;
    }
    const result = await sendWhatsAppForStage({
      stage: entry.stage,
      treatmentType: entry.treatmentType,
      firstName: entry.firstName,
      email: entry.email,
      clientId: entry.clientId || process.env.CLIENT_ID || 'cocon',
    });
    if (result.ok || result.reason === 'already-sent' || result.reason?.startsWith('no-opt-in')) {
      await redis.zrem('wa:schedule', raw);
    }
    report.details.push({ entry, result, legacy: true });
  }

  return report;
}

export { whatsappStages };
export default {
  onTreatmentProcessed,
  schedulePendingSend,
  runScheduledSends,
  whatsappStages,
};
