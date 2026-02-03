import mailchimp from '@mailchimp/mailchimp_marketing';
import { config } from './config.js';
import crypto from 'crypto';

/**
 * Initialize Mailchimp client
 */
export function initMailchimp() {
  mailchimp.setConfig({
    apiKey: config.mailchimp.apiKey,
    server: config.mailchimp.serverPrefix,
  });
  return mailchimp;
}

/**
 * Get MD5 hash of email for subscriber operations
 */
export function getSubscriberHash(email) {
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}

/**
 * Test Mailchimp connection
 */
export async function testConnection() {
  const client = initMailchimp();
  try {
    const response = await client.ping.get();
    return { success: true, message: response.health_status };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get all lists/audiences
 */
export async function getLists() {
  const client = initMailchimp();
  const response = await client.lists.getAllLists();
  return response.lists;
}

/**
 * Get list details
 */
export async function getListInfo(listId = config.mailchimp.listId) {
  const client = initMailchimp();
  return await client.lists.getList(listId);
}

/**
 * Add or update a subscriber with treatment info
 */
export async function addOrUpdateSubscriber({
  email,
  firstName,
  lastName = '',
  treatmentType,
  treatmentDate = new Date(),
  tags = [],
}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);

  // Merge fields for tracking treatment info
  const mergeFields = {
    FNAME: firstName,
    LNAME: lastName,
    TREATMENT: treatmentType,
    TDATE: treatmentDate.toISOString().split('T')[0], // YYYY-MM-DD format
  };

  try {
    // Try to update existing member
    const response = await client.lists.setListMember(listId, subscriberHash, {
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: mergeFields,
    });

    // Add treatment-specific tag
    if (treatmentType) {
      await addTagsToSubscriber(email, [`behandeling-${treatmentType}`, ...tags]);
    }

    return { success: true, subscriber: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Add tags to a subscriber
 */
export async function addTagsToSubscriber(email, tags) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);

  const tagsBody = tags.map(tag => ({
    name: tag,
    status: 'active',
  }));

  try {
    await client.lists.updateListMemberTags(listId, subscriberHash, {
      tags: tagsBody,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get subscriber by email
 */
export async function getSubscriber(email) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);

  try {
    const response = await client.lists.getListMember(listId, subscriberHash);
    return { success: true, subscriber: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all subscribers with a specific tag
 */
export async function getSubscribersByTag(tag) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;

  try {
    // First, get segments to find the tag segment
    const segments = await client.lists.listSegments(listId, { type: 'static' });
    const tagSegment = segments.segments.find(s => s.name === tag);
    
    if (!tagSegment) {
      return { success: true, subscribers: [] };
    }

    const members = await client.lists.getSegmentMembersList(listId, tagSegment.id);
    return { success: true, subscribers: members.members };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a campaign
 */
export async function createCampaign({
  subject,
  previewText,
  fromName = config.sender.name,
  replyTo = config.sender.email,
  templateId = null,
  segmentId = null,
}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;

  const campaignSettings = {
    type: 'regular',
    recipients: {
      list_id: listId,
    },
    settings: {
      subject_line: subject,
      preview_text: previewText,
      from_name: fromName,
      reply_to: replyTo,
    },
  };

  if (segmentId) {
    campaignSettings.recipients.segment_opts = {
      saved_segment_id: segmentId,
    };
  }

  try {
    const campaign = await client.campaigns.create(campaignSettings);
    return { success: true, campaign };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Set campaign content (HTML)
 */
export async function setCampaignContent(campaignId, html) {
  const client = initMailchimp();

  try {
    await client.campaigns.setContent(campaignId, { html });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send a campaign immediately
 */
export async function sendCampaign(campaignId) {
  const client = initMailchimp();

  try {
    await client.campaigns.send(campaignId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Schedule a campaign
 */
export async function scheduleCampaign(campaignId, scheduleTime) {
  const client = initMailchimp();

  try {
    await client.campaigns.schedule(campaignId, {
      schedule_time: scheduleTime.toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send a test email for a campaign
 */
export async function sendTestEmail(campaignId, testEmails) {
  const client = initMailchimp();

  try {
    await client.campaigns.sendTestEmail(campaignId, {
      test_emails: testEmails,
      send_type: 'html',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create merge fields for treatment tracking (run once during setup)
 */
export async function setupMergeFields() {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;

  const mergeFieldsToCreate = [
    { tag: 'TREATMENT', name: 'Behandeling Type', type: 'dropdown', options: { choices: ['wenkbrauwen', 'eyeliner', 'lippen'] } },
    { tag: 'TDATE', name: 'Behandeling Datum', type: 'date' },
  ];

  const results = [];

  for (const field of mergeFieldsToCreate) {
    try {
      const response = await client.lists.addListMergeField(listId, field);
      results.push({ success: true, field: field.tag });
    } catch (error) {
      // Field might already exist
      results.push({ success: false, field: field.tag, error: error.message });
    }
  }

  return results;
}

/**
 * List Mailchimp templates (user-created)
 */
export async function listTemplates({ folderId = null, count = 1000 } = {}) {
  const client = initMailchimp();
  const params = {
    count,
    type: 'user',
  };

  if (folderId) {
    params.folder_id = folderId;
  }

  const response = await client.templates.list(params);
  return response.templates || [];
}

/**
 * Create a Mailchimp template
 */
export async function createTemplate({
  name,
  html,
  folderId = null,
}) {
  const client = initMailchimp();
  const payload = {
    name,
    html,
  };

  if (folderId) {
    payload.folder_id = folderId;
  }

  const response = await client.templates.create(payload);
  return response;
}

/**
 * Update a Mailchimp template
 */
export async function updateTemplate(templateId, {
  name,
  html,
  folderId = null,
}) {
  const client = initMailchimp();
  const payload = {};

  if (name) {
    payload.name = name;
  }
  if (html) {
    payload.html = html;
  }
  if (folderId) {
    payload.folder_id = folderId;
  }

  const response = await client.templates.update(templateId, payload);
  return response;
}

/**
 * Create or update a Mailchimp template by name
 */
export async function upsertTemplate({
  name,
  html,
  folderId = null,
  existingTemplates = null,
}) {
  const client = initMailchimp();
  const templates = existingTemplates || await listTemplates({ folderId });
  const existing = templates.find(t => t.name === name);

  if (existing) {
    const template = await client.templates.update(existing.id, {
      name,
      html,
      ...(folderId ? { folder_id: folderId } : {}),
    });
    return { created: false, template };
  }

  const template = await client.templates.create({
    name,
    html,
    ...(folderId ? { folder_id: folderId } : {}),
  });
  return { created: true, template };
}

export default {
  initMailchimp,
  testConnection,
  getLists,
  getListInfo,
  addOrUpdateSubscriber,
  addTagsToSubscriber,
  getSubscriber,
  getSubscribersByTag,
  createCampaign,
  setCampaignContent,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
  setupMergeFields,
  listTemplates,
  createTemplate,
  updateTemplate,
  upsertTemplate,
};
