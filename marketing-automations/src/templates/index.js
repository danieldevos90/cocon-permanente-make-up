/**
 * Email Templates Index
 * All email templates for Cocon Cosmetics Marketing Automations
 */

export { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
export { aftercareEmails } from './aftercare-emails.js';
export { weekFollowupEmails } from './week-followup-emails.js';
export { reviewRequestEmails } from './review-request-emails.js';
export { touchupReminderEmails } from './touchup-reminder-emails.js';
export { leadNurtureEmails } from './lead-nurture-emails.js';

import { aftercareEmails } from './aftercare-emails.js';
import { weekFollowupEmails } from './week-followup-emails.js';
import { reviewRequestEmails } from './review-request-emails.js';
import { touchupReminderEmails } from './touchup-reminder-emails.js';
import { leadNurtureEmails } from './lead-nurture-emails.js';

/**
 * Get all emails for a treatment type's journey
 */
export function getJourneyEmails(treatmentType) {
  return {
    aftercare: aftercareEmails[treatmentType],
    weekFollowup: weekFollowupEmails[treatmentType],
    reviewRequest: reviewRequestEmails[treatmentType],
    touchupReminder: touchupReminderEmails[treatmentType],
  };
}

/**
 * Get a specific email template
 */
export function getEmailTemplate(stage, treatmentType) {
  const stages = {
    aftercare: aftercareEmails,
    weekFollowup: weekFollowupEmails,
    reviewRequest: reviewRequestEmails,
    touchupReminder: touchupReminderEmails,
    education: { default: leadNurtureEmails.education },
    socialProof: { default: leadNurtureEmails.socialProof },
  };

  const stageEmails = stages[stage];
  if (!stageEmails) return null;

  return stageEmails[treatmentType] || stageEmails.default || null;
}

/**
 * List all available email templates
 */
export function listAllTemplates() {
  const treatmentTypes = ['wenkbrauwen', 'eyeliner', 'lippen'];
  const journeyStages = ['aftercare', 'weekFollowup', 'reviewRequest', 'touchupReminder'];

  const templates = [];

  // Treatment journey emails
  for (const treatment of treatmentTypes) {
    for (const stage of journeyStages) {
      templates.push({
        id: `${stage}-${treatment}`,
        stage,
        treatmentType: treatment,
        type: 'journey',
      });
    }
  }

  // Lead nurture emails
  templates.push(
    { id: 'education', stage: 'education', treatmentType: null, type: 'nurture' },
    { id: 'socialProof', stage: 'socialProof', treatmentType: null, type: 'nurture' }
  );

  return templates;
}

export default {
  aftercareEmails,
  weekFollowupEmails,
  reviewRequestEmails,
  touchupReminderEmails,
  leadNurtureEmails,
  getJourneyEmails,
  getEmailTemplate,
  listAllTemplates,
};
