/**
 * Email Templates Index
 * All email templates for Cocon Cosmetics Marketing Automations
 */

export { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
export { aftercareEmails } from './aftercare-emails.js';
export { weekFollowupEmails } from './week-followup-emails.js';
export { touchupReminderEmails } from './touchup-reminder-emails.js';
export { confirmationEmails } from './confirmation-emails.js';
export { refreshReminderEmails } from './refresh-reminder-emails.js';

import { aftercareEmails } from './aftercare-emails.js';
import { weekFollowupEmails } from './week-followup-emails.js';
import { touchupReminderEmails } from './touchup-reminder-emails.js';
import { confirmationEmails } from './confirmation-emails.js';
import { refreshReminderEmails } from './refresh-reminder-emails.js';

/**
 * Get all emails for a treatment type's journey
 */
export function getJourneyEmails(treatmentType) {
  const refreshByTreatment = {
    wenkbrauwen: {
      refresh6Months: refreshReminderEmails.wenkbrauwen6m,
      refresh10Months: refreshReminderEmails.wenkbrauwen10m,
    },
    eyeliner: {
      refresh6Months: refreshReminderEmails.eyeliner6m,
      refresh24Months: refreshReminderEmails.eyeliner30m,
    },
    lippen: {
      refresh6Months: refreshReminderEmails.lippen6m,
      refresh10Months: refreshReminderEmails.lippen10m,
      refresh18Months: refreshReminderEmails.lippen18m,
    },
  };
  const refresh = refreshByTreatment[treatmentType] || {};
  return {
    aftercare: aftercareEmails[treatmentType],
    weekFollowup: weekFollowupEmails[treatmentType],
    ...refresh,
  };
}

/**
 * Get a specific email template
 */
export function getEmailTemplate(stage, treatmentType) {
  const stages = {
    confirmation: confirmationEmails,
    aftercare: aftercareEmails,
    weekFollowup: weekFollowupEmails,
    refresh6Months: {
      wenkbrauwen: refreshReminderEmails.wenkbrauwen6m,
      eyeliner: refreshReminderEmails.eyeliner6m,
      lippen: refreshReminderEmails.lippen6m,
    },
    refresh10Months: {
      wenkbrauwen: refreshReminderEmails.wenkbrauwen10m,
      lippen: refreshReminderEmails.lippen10m,
    },
    refresh18Months: { lippen: refreshReminderEmails.lippen18m },
    refresh24Months: { eyeliner: refreshReminderEmails.eyeliner30m },
  };

  const stageEmails = stages[stage];
  if (!stageEmails) return null;

  return stageEmails[treatmentType] || stageEmails.default || null;
}

/**
 * List all available email templates (only templates with actual content)
 */
export function listAllTemplates() {
  const treatmentTypes = ['wenkbrauwen', 'eyeliner', 'lippen'];
  const journeyStagesByTreatment = {
    wenkbrauwen: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh10Months'],
    eyeliner: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh24Months'],
    lippen: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh10Months', 'refresh18Months'],
  };

  const templates = [];

  templates.push({
    id: 'confirmation-magicPencil',
    stage: 'confirmation',
    treatmentType: 'magicPencil',
    type: 'confirmation',
  });

  for (const treatment of treatmentTypes) {
    for (const stage of journeyStagesByTreatment[treatment]) {
      templates.push({
        id: `${stage}-${treatment}`,
        stage,
        treatmentType: treatment,
        type: 'journey',
      });
    }
  }

  return templates;
}

export default {
  confirmationEmails,
  aftercareEmails,
  weekFollowupEmails,
  touchupReminderEmails,
  refreshReminderEmails,
  getJourneyEmails,
  getEmailTemplate,
  listAllTemplates,
};
