/**
 * WhatsApp automation manager.
 *
 * Verantwoordelijkheden:
 *   - bepaal welke template een (stage, treatmentType) krijgt
 *   - controleer opt-in
 *   - controleer of Meta-template is goedgekeurd (metaStatus !== 'pending')
 *   - stuur via whatsapp-client (in dry-run: alleen loggen)
 *   - log delivery status naar Redis
 *   - voorkom dubbele sends via Redis tag
 *   - optioneel: fallback naar e-mail trigger
 */

import { config } from './config.js';
import { getWhatsAppTemplate, buildComponents, renderPreview } from './templates/index.js';
import { sendTemplate } from './whatsapp-client.js';
import { lookupOptIn } from './opt-in-manager.js';
import { logSend, markSent, hasSent } from './delivery-log.js';
import { normalizePhone } from './phone.js';

/**
 * Stages waarvoor WhatsApp wordt overwogen.
 * Fase 1 (volgens cocon-whatsapp-automatisering.md):
 *   - aftercare         → alle treatmentTypes
 *   - browsRefresh      → wenkbrauwen
 *   - lipsRefresh       → lippen
 */
export const whatsappStages = {
  aftercare: { name: 'Aftercare', daysAfter: config.messageTiming.aftercare, tag: 'whatsapp-aftercare-sent' },
  browsRefresh: { name: 'Brows refresh', daysAfter: config.messageTiming.browsRefresh, tag: 'whatsapp-brows-refresh-sent' },
  lipsRefresh: { name: 'Lips refresh', daysAfter: config.messageTiming.lipsRefresh, tag: 'whatsapp-lips-refresh-sent' },
};

/**
 * Wat een gebruiker moet doorgeven om een WhatsApp te versturen.
 *
 * @typedef {object} WhatsAppSendInput
 * @property {string} stage              aftercare | browsRefresh | lipsRefresh
 * @property {string} treatmentType      wenkbrauwen | eyeliner | lippen
 * @property {string} firstName
 * @property {string} email              Voor opt-in lookup + dedupe + fallback
 * @property {string} [phone]            Optional override (anders uit Mailchimp)
 * @property {boolean} [skipOptInCheck]  Alleen voor lokale CLI test
 * @property {boolean} [skipDedupe]
 */

/**
 * Verstuur een WhatsApp-bericht voor (stage, treatmentType).
 *
 * Returnt een uniform result object dat door de Salonized hook / CLI
 * gebruikt wordt om de status te rapporteren.
 */
export async function sendWhatsAppForStage(input) {
  const {
    stage,
    treatmentType,
    firstName = '',
    email,
    phone: phoneOverride,
    skipOptInCheck = false,
    skipDedupe = false,
  } = input;

  const result = {
    ok: false,
    stage,
    treatmentType,
    email,
    reason: '',
  };

  const stageInfo = whatsappStages[stage];
  if (!stageInfo) {
    result.reason = `unknown-stage:${stage}`;
    return result;
  }

  const template = getWhatsAppTemplate(stage, treatmentType);
  if (!template) {
    result.reason = `no-template:${stage}/${treatmentType}`;
    await logSend({
      to: '',
      templateName: '',
      stage,
      treatmentType,
      email,
      success: false,
      error: result.reason,
    });
    return result;
  }

  if (template.metaStatus !== 'approved') {
    result.reason = `template-not-approved:${template.name}`;
    await logSend({
      to: '',
      templateName: template.name,
      stage,
      treatmentType,
      email,
      success: false,
      error: result.reason,
      dryRun: config.dryRun,
    });
    return result;
  }

  if (!skipDedupe && (await hasSent({ stage, treatmentType, email }))) {
    result.reason = 'already-sent';
    return result;
  }

  let phone = normalizePhone(phoneOverride);
  if (!phone) {
    if (skipOptInCheck) {
      result.reason = 'no-phone-and-opt-in-check-skipped';
      return result;
    }
    const optIn = await lookupOptIn(email);
    if (!optIn.optedIn) {
      result.reason = `no-opt-in:${optIn.reason}`;
      return result;
    }
    phone = optIn.phone;
  }

  const components = buildComponents(template, { firstName });
  const sendResult = await sendTemplate({
    to: phone,
    templateName: template.name,
    languageCode: template.language,
    components,
    context: { stage, treatmentType, email },
  });

  await logSend({
    to: phone,
    templateName: template.name,
    stage,
    treatmentType,
    email,
    success: sendResult.success,
    dryRun: !!sendResult.dryRun,
    messageId: sendResult.messageId,
    error: sendResult.success ? undefined : sendResult.error,
  });

  if (sendResult.success && !sendResult.dryRun) {
    await markSent({ stage, treatmentType, email });
  }

  result.ok = !!sendResult.success;
  result.dryRun = !!sendResult.dryRun;
  result.messageId = sendResult.messageId;
  result.phone = phone;
  result.templateName = template.name;
  result.preview = renderPreview(template, { firstName });
  if (!result.ok) result.reason = sendResult.error || 'send-failed';
  return result;
}

/**
 * Plan alle WhatsApp-stages voor een nieuwe behandeling.
 * Wordt gebruikt door de gedeelde Salonized-hook na een behandeling.
 *
 * Returns een lijst geplande stages met scheduledDate.
 */
export function planStagesForTreatment({ treatmentType, treatmentDate = new Date() }) {
  const stages = [];
  const date = treatmentDate instanceof Date ? treatmentDate : new Date(treatmentDate);

  // Aftercare voor alle treatments
  if (whatsappStages.aftercare && config.treatmentTypes.includes(treatmentType)) {
    stages.push({
      stage: 'aftercare',
      treatmentType,
      scheduledDate: addDays(date, whatsappStages.aftercare.daysAfter),
    });
  }
  if (treatmentType === 'wenkbrauwen' && whatsappStages.browsRefresh) {
    stages.push({
      stage: 'browsRefresh',
      treatmentType,
      scheduledDate: addDays(date, whatsappStages.browsRefresh.daysAfter),
    });
  }
  if (treatmentType === 'lippen' && whatsappStages.lipsRefresh) {
    stages.push({
      stage: 'lipsRefresh',
      treatmentType,
      scheduledDate: addDays(date, whatsappStages.lipsRefresh.daysAfter),
    });
  }
  return stages;
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default {
  whatsappStages,
  sendWhatsAppForStage,
  planStagesForTreatment,
};
