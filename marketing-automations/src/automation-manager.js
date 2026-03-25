import { addDays, isBefore, isAfter, parseISO, format } from 'date-fns';
import { config } from './config.js';
import {
  addOrUpdateSubscriber,
  addTagsToSubscriber,
  createCampaign,
  setCampaignContent,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
} from './mailchimp-client.js';
import { getEmailTemplate, getJourneyEmails } from './templates/index.js';

/**
 * Email Journey Stages with their timing (in days after treatment)
 * Touch-up wordt automatisch gepland bij behandeling, niet via e-mail.
 */
export const journeyStages = {
  aftercare: { name: 'Aftercare', daysAfter: 0, tag: 'email-aftercare-sent' },
  weekFollowup: { name: 'Week Follow-up', daysAfter: 7, tag: 'email-week-sent' },
  refresh6Months: { name: '6-Month Refresh (cross-sell)', daysAfter: 180, tag: 'email-refresh6m-sent' },
  refresh10Months: { name: '10-Month Refresh', daysAfter: 300, tag: 'email-refresh10m-sent' },
  refresh18Months: { name: '18-Month Refresh (no-response)', daysAfter: 547, tag: 'email-refresh18m-sent' },
  refresh24Months: { name: '2-Year Refresh', daysAfter: 730, tag: 'email-refresh24m-sent' },
  refresh36Months: { name: '3-Year Refresh (no-response)', daysAfter: 1095, tag: 'email-refresh36m-sent' },
};

function getJourneyStagesForTreatment(treatmentType) {
  const stagesByTreatment = {
    wenkbrauwen: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh10Months'],
    eyeliner: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh24Months'],
    lippen: ['aftercare', 'weekFollowup', 'refresh6Months', 'refresh10Months', 'refresh18Months'],
  };
  const stages = stagesByTreatment[treatmentType] || ['aftercare', 'weekFollowup'];
  return stages.map(stage => [stage, journeyStages[stage]]).filter(([, info]) => info);
}

/**
 * Register a new treatment and schedule the email journey
 */
export async function registerTreatment({
  email,
  firstName,
  lastName = '',
  treatmentType,
  treatmentDate = new Date(),
}) {
  // Validate treatment type
  if (!config.treatmentTypes.includes(treatmentType)) {
    return {
      success: false,
      error: `Invalid treatment type. Must be one of: ${config.treatmentTypes.join(', ')}`,
    };
  }

  // Add/update subscriber with treatment info
  const subscriberResult = await addOrUpdateSubscriber({
    email,
    firstName,
    lastName,
    treatmentType,
    treatmentDate,
    tags: [`behandeling-${treatmentType}`, 'active-journey'],
  });

  if (!subscriberResult.success) {
    return subscriberResult;
  }

  // Calculate scheduled dates for each email
  const scheduledEmails = getJourneyStagesForTreatment(treatmentType).map(([stage, info]) => {
    const sendDate = addDays(treatmentDate, info.daysAfter);
    return {
      stage,
      stageName: info.name,
      treatmentType,
      scheduledDate: sendDate,
      tag: info.tag,
    };
  });

  return {
    success: true,
    subscriber: subscriberResult.subscriber,
    scheduledEmails,
    message: `Treatment registered. ${scheduledEmails.length} emails scheduled.`,
  };
}

/**
 * Send an email from the journey immediately
 */
export async function sendJourneyEmail({
  email,
  firstName,
  treatmentType,
  stage,
  testMode = false,
  testEmails = [],
}) {
  const template = getEmailTemplate(stage, treatmentType);
  
  if (!template) {
    return {
      success: false,
      error: `Template not found for stage "${stage}" and treatment "${treatmentType}"`,
    };
  }

  // Generate email content
  const htmlContent = template.getContent({ firstName });

  // Create campaign
  const campaignResult = await createCampaign({
    subject: template.subject,
    previewText: template.previewText,
  });

  if (!campaignResult.success) {
    return campaignResult;
  }

  const campaignId = campaignResult.campaign.id;

  // Set content
  const contentResult = await setCampaignContent(campaignId, htmlContent);
  if (!contentResult.success) {
    return contentResult;
  }

  // Test mode - send test email instead of real send
  if (testMode) {
    const testResult = await sendTestEmail(campaignId, testEmails.length ? testEmails : [email]);
    return {
      success: testResult.success,
      campaignId,
      message: testResult.success ? 'Test email sent' : testResult.error,
    };
  }

  // Send the campaign
  const sendResult = await sendCampaign(campaignId);

  // Mark email as sent with tag
  if (sendResult.success) {
    const stageInfo = journeyStages[stage];
    if (stageInfo) {
      await addTagsToSubscriber(email, [stageInfo.tag]);
    }
  }

  return {
    success: sendResult.success,
    campaignId,
    message: sendResult.success ? 'Email sent successfully' : sendResult.error,
  };
}

/**
 * Schedule an email for later
 */
export async function scheduleJourneyEmail({
  email,
  firstName,
  treatmentType,
  stage,
  scheduleTime,
}) {
  const template = getEmailTemplate(stage, treatmentType);
  
  if (!template) {
    return {
      success: false,
      error: `Template not found for stage "${stage}" and treatment "${treatmentType}"`,
    };
  }

  // Generate email content
  const htmlContent = template.getContent({ firstName });

  // Create campaign
  const campaignResult = await createCampaign({
    subject: template.subject,
    previewText: template.previewText,
  });

  if (!campaignResult.success) {
    return campaignResult;
  }

  const campaignId = campaignResult.campaign.id;

  // Set content
  const contentResult = await setCampaignContent(campaignId, htmlContent);
  if (!contentResult.success) {
    return contentResult;
  }

  // Schedule the campaign
  const scheduleResult = await scheduleCampaign(campaignId, scheduleTime);

  return {
    success: scheduleResult.success,
    campaignId,
    scheduledFor: scheduleTime.toISOString(),
    message: scheduleResult.success 
      ? `Email scheduled for ${format(scheduleTime, 'dd-MM-yyyy HH:mm')}` 
      : scheduleResult.error,
  };
}

/**
 * Get the next email to send for a subscriber based on treatment date
 */
export function getNextJourneyEmail(treatmentType, treatmentDate, sentStages = []) {
  const now = new Date();
  
  for (const [stage, info] of getJourneyStagesForTreatment(treatmentType)) {
    // Skip if already sent
    if (sentStages.includes(info.tag)) continue;
    
    const sendDate = addDays(parseISO(treatmentDate), info.daysAfter);
    
    // If the send date is today or in the past, this email is due
    if (isBefore(sendDate, now) || sendDate.toDateString() === now.toDateString()) {
      return {
        stage,
        stageName: info.name,
        treatmentType,
        dueDate: sendDate,
        overdue: isBefore(sendDate, now),
      };
    }
    
    // If the send date is in the future, return it as the next scheduled
    return {
      stage,
      stageName: info.name,
      treatmentType,
      scheduledDate: sendDate,
      daysUntil: Math.ceil((sendDate - now) / (1000 * 60 * 60 * 24)),
    };
  }

  // All emails sent
  return null;
}

/**
 * Preview an email template (returns HTML)
 */
export function previewEmail(stage, treatmentType, data = {}) {
  const template = getEmailTemplate(stage, treatmentType);
  
  if (!template) {
    return null;
  }

  return {
    subject: template.subject,
    previewText: template.previewText,
    html: template.getContent(data),
  };
}

/**
 * Get journey summary for a treatment type
 */
export function getJourneySummary(treatmentType) {
  const emails = getJourneyEmails(treatmentType);
  
  return getJourneyStagesForTreatment(treatmentType).map(([stage, info]) => {
    const template = emails[stage];
    return {
      stage,
      stageName: info.name,
      daysAfterTreatment: info.daysAfter,
      subject: template?.subject || 'N/A',
      tag: info.tag,
    };
  });
}

export default {
  journeyStages,
  registerTreatment,
  sendJourneyEmail,
  scheduleJourneyEmail,
  getNextJourneyEmail,
  previewEmail,
  getJourneySummary,
};
