import mailchimp from '@mailchimp/mailchimp_marketing';
import { config } from './config.js';
import crypto from 'crypto';

const LIFECYCLE_MERGE_FIELDS = [
  { tag: 'CLIENTTYPE', name: 'Client Type', type: 'dropdown', options: { choices: ['new', 'returning'] } },
  { tag: 'LASTTRT', name: 'Last Treatment', type: 'dropdown', options: { choices: ['wenkbrauwen', 'eyeliner', 'lippen', 'laser'] } },
  { tag: 'LASTTRTDT', name: 'Last Treatment Date', type: 'date' },
  { tag: 'PERFBOOKED', name: 'Perfectie Booked', type: 'dropdown', options: { choices: ['yes', 'no'] } },
  { tag: 'PERFDATE', name: 'Perfectie Date', type: 'date' },
  { tag: 'REFRSHDUE', name: 'Refresh Due Date', type: 'date' },
  { tag: 'SOURCESYS', name: 'Source System', type: 'dropdown', options: { choices: ['salonized', 'woocommerce', 'import', 'mixed'] } },
  { tag: 'LASTEMAIL', name: 'Last Automation Email', type: 'text' },
  { tag: 'LASTEMAILDT', name: 'Last Automation Email Date', type: 'date' },
];

function normalizeDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function calculateRefreshDueDate(lastTreatmentDate) {
  const date = lastTreatmentDate instanceof Date ? new Date(lastTreatmentDate) : new Date(lastTreatmentDate);
  if (Number.isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + 10);
  return normalizeDate(date);
}

function getErrorMessage(error) {
  return error?.response?.body?.detail || error?.message || 'Unknown Mailchimp error';
}

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
    return { success: false, error: getErrorMessage(error) };
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
 * Activate and/or deactivate tags on a subscriber
 */
export async function setSubscriberTags(email, { activate = [], deactivate = [] } = {}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);
  const tagsBody = [
    ...activate.filter(Boolean).map(name => ({ name, status: 'active' })),
    ...deactivate.filter(Boolean).map(name => ({ name, status: 'inactive' })),
  ];

  if (!tagsBody.length) {
    return { success: true, message: 'No tag changes requested' };
  }

  try {
    await client.lists.updateListMemberTags(listId, subscriberHash, { tags: tagsBody });
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
 * List all audience members with merge fields (paginated)
 */
function withTimeout(promise, timeoutMs, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function getMembersPageWithRetry(client, listId, params, { timeoutMs = 15000, retries = 2 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(
        client.lists.getListMembersInfo(listId, params),
        timeoutMs,
        `getListMembersInfo(${params.status}, offset=${params.offset})`,
      );
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delayMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export async function listAudienceMembers({ count = 200, statuses = ['subscribed', 'unsubscribed'] } = {}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const pageSize = Math.min(Math.max(Number(count) || 1000, 1), 1000);
  const members = [];
  const selectedStatuses = Array.isArray(statuses) && statuses.length ? statuses : ['subscribed', 'unsubscribed'];
  const seenMemberIds = new Set();
  const pageTimeoutMs = 90000;

  try {
    for (const status of selectedStatuses) {
      let offset = 0;
      let totalItems = 0;

      do {
        const response = await getMembersPageWithRetry(
          client,
          listId,
          {
            count: pageSize,
            offset,
            status,
            fields: [
              'members.id',
              'members.email_address',
              'members.status',
              'members.merge_fields.FNAME',
              'members.merge_fields.LNAME',
              'members.merge_fields.TDATE',
              'members.merge_fields.LASTTRTDT',
              'members.merge_fields.TREATMENT',
              'members.merge_fields.LASTTRT',
              'members.tags',
              'total_items',
            ],
          },
          { timeoutMs: pageTimeoutMs, retries: 2 },
        );

        const pageMembers = response?.members || [];
        for (const member of pageMembers) {
          const id = member?.id || member?.email_id || member?.email_address;
          if (!id || seenMemberIds.has(id)) continue;
          seenMemberIds.add(id);
          members.push(member);
        }

        totalItems = Number(response?.total_items || offset + pageMembers.length);
        offset += pageMembers.length;

        if (!pageMembers.length) {
          break;
        }
      } while (offset < totalItems);
    }

    return { success: true, members };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Search audience members by Mailchimp search endpoint
 */
export async function searchAudienceMembers(query, { listId = config.mailchimp.listId } = {}) {
  const client = initMailchimp();
  if (!query) {
    return { success: true, members: [] };
  }

  try {
    const response = await client.searchMembers.search(query, { listId });
    return { success: true, members: response?.exact_matches?.members || response?.full_search?.members || [] };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List recent campaigns for health dashboards
 */
export async function listRecentCampaigns({
  count = 25,
  status = '',
} = {}) {
  const client = initMailchimp();
  const params = {
    count: Math.min(Math.max(Number(count) || 25, 1), 100),
    sortField: 'send_time',
    sortDir: 'DESC',
  };

  if (status) {
    params.status = status;
  }

  try {
    const response = await client.campaigns.list(params);
    return { success: true, campaigns: response?.campaigns || [] };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * List campaigns sent since a given date (for logging automation/journey emails)
 * @param {string} sinceIso - ISO date string, e.g. from 24h ago
 */
export async function listCampaignsSentSince(sinceIso) {
  const client = initMailchimp();
  try {
    const response = await client.campaigns.list({
      count: 50,
      status: 'sent',
      sinceSendTime: sinceIso,
      sortField: 'send_time',
      sortDir: 'DESC',
    });
    return { success: true, campaigns: response?.campaigns || [] };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
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
  return ensureMergeFields([
    { tag: 'TREATMENT', name: 'Behandeling Type', type: 'dropdown', options: { choices: ['wenkbrauwen', 'eyeliner', 'lippen', 'laser'] } },
    { tag: 'TDATE', name: 'Behandeling Datum', type: 'date' },
  ]);
}

/**
 * Ensure a set of merge fields exists
 */
export async function ensureMergeFields(mergeFieldsToCreate) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const existingResponse = await client.lists.getListMergeFields(listId, { count: 200 });
  const existingTags = new Set((existingResponse.merge_fields || []).map(field => field.tag));

  const results = [];

  for (const field of mergeFieldsToCreate) {
    if (existingTags.has(field.tag)) {
      results.push({ success: true, field: field.tag, status: 'exists' });
      continue;
    }

    try {
      await client.lists.addListMergeField(listId, field);
      results.push({ success: true, field: field.tag, status: 'created' });
    } catch (error) {
      results.push({ success: false, field: field.tag, error: getErrorMessage(error) });
    }
  }

  return results;
}

/**
 * Setup lifecycle merge fields for Salonized/WooCommerce journeys
 */
export async function setupLifecycleMergeFields() {
  return ensureMergeFields(LIFECYCLE_MERGE_FIELDS);
}

/**
 * Sync a Salonized contact into Mailchimp lifecycle model
 */
export async function syncSalonizedContact({
  email,
  firstName = '',
  lastName = '',
  treatmentType = '',
  lastTreatmentDate = '',
  clientType = '',
  perfectionBooked = '',
  perfectionDate = '',
  sourceSystem = 'salonized',
  activateTags = [],
  deactivateTags = [],
  statusIfNew = 'subscribed',
}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);
  const normalizedTreatmentType = (treatmentType || '').toLowerCase();
  const normalizedClientType = (clientType || '').toLowerCase();
  const normalizedSourceSystem = (sourceSystem || '').toLowerCase();
  const normalizedPerfBooked = (perfectionBooked || '').toLowerCase();
  const lastTreatment = normalizeDate(lastTreatmentDate);
  const perfDate = normalizeDate(perfectionDate);
  const refreshDue = lastTreatment ? calculateRefreshDueDate(lastTreatment) : '';
  const treatmentFieldValue = ['wenkbrauwen', 'eyeliner', 'lippen'].includes(normalizedTreatmentType)
    ? normalizedTreatmentType
    : '';

  const mergeFields = {
    FNAME: firstName,
    LNAME: lastName,
    // TREATMENT dropdown currently allows only wenkbrauwen/eyeliner/lippen in this audience.
    // Keep LASTTRT as the source-of-truth for full set (including laser).
    TREATMENT: treatmentFieldValue,
    TDATE: lastTreatment || '',
    CLIENTTYPE: normalizedClientType || '',
    LASTTRT: normalizedTreatmentType || '',
    LASTTRTDT: lastTreatment || '',
    PERFBOOKED: normalizedPerfBooked || '',
    PERFDATE: perfDate || '',
    REFRSHDUE: refreshDue || '',
    SOURCESYS: normalizedSourceSystem || '',
  };

  try {
    const subscriber = await client.lists.setListMember(listId, subscriberHash, {
      email_address: email,
      status_if_new: statusIfNew,
      merge_fields: mergeFields,
    });

    const treatmentTags = [];
    if (normalizedTreatmentType === 'wenkbrauwen') treatmentTags.push('TAG: Wenkbrauwen');
    if (normalizedTreatmentType === 'eyeliner') treatmentTags.push('TAG: Eyeliner');
    if (normalizedTreatmentType === 'lippen') treatmentTags.push('TAG: PMU Lippen');
    if (normalizedTreatmentType === 'laser') treatmentTags.push('TAG: Laser');

    const tagResult = await setSubscriberTags(email, {
      activate: [...treatmentTags, ...activateTags],
      deactivate: deactivateTags,
    });

    if (!tagResult.success) {
      return { success: false, error: tagResult.error };
    }

    return { success: true, subscriber };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
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

  // Use updateTemplate method (PATCH /templates/{template_id})
  const response = await client.templates.updateTemplate(templateId, payload);
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
    const template = await client.templates.updateTemplate(existing.id, {
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

/**
 * Delete a Mailchimp template by ID
 */
export async function deleteTemplate(templateId) {
  const client = initMailchimp();
  await client.templates.deleteTemplate(templateId);
  return { success: true };
}

/**
 * Delete a Mailchimp campaign (cleanup after send or failed draft)
 */
export async function deleteCampaign(campaignId) {
  if (!campaignId) return { success: true, skipped: true };
  const client = initMailchimp();
  try {
    await client.campaigns.remove(campaignId);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update subscriber merge fields for last automation email sent
 */
export async function updateSubscriberLastEmail(email, { subject = '', stage = '', sentAt = new Date() } = {}) {
  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = getSubscriberHash(email);
  const label = (subject || stage || '').slice(0, 255);

  try {
    await client.lists.updateListMember(listId, subscriberHash, {
      merge_fields: {
        LASTEMAIL: label,
        LASTEMAILDT: normalizeDate(sentAt),
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Send a campaign to specific email addresses (used for aftercare batch sends)
 */
export async function sendAftercareCampaign({
  emails,
  subject,
  previewText = '',
  htmlContent,
  fromName = config.sender.name,
  replyTo = config.sender.email,
}) {
  if (!emails || !emails.length) return { success: true, sent: 0 };

  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  let campaignId = null;

  const conditions = emails.map(email => ({
    condition_type: 'EmailAddress',
    field: 'EMAIL',
    op: 'is',
    value: email,
  }));

  try {
    const campaign = await client.campaigns.create({
      type: 'regular',
      recipients: {
        list_id: listId,
        segment_opts: {
          match: emails.length > 1 ? 'any' : 'all',
          conditions,
        },
      },
      settings: {
        subject_line: subject,
        preview_text: previewText,
        from_name: fromName,
        reply_to: replyTo,
      },
    });

    campaignId = campaign.id;
    await client.campaigns.setContent(campaignId, { html: htmlContent });
    await client.campaigns.send(campaignId);
    await deleteCampaign(campaignId);

    return { success: true, campaignId, sent: emails.length, deleted: true };
  } catch (error) {
    if (campaignId) {
      await deleteCampaign(campaignId);
    }
    return { success: false, error: getErrorMessage(error), campaignId };
  }
}

export default {
  initMailchimp,
  testConnection,
  getLists,
  getListInfo,
  addOrUpdateSubscriber,
  addTagsToSubscriber,
  setSubscriberTags,
  getSubscriber,
  getSubscribersByTag,
  listAudienceMembers,
  searchAudienceMembers,
  listRecentCampaigns,
  listCampaignsSentSince,
  createCampaign,
  setCampaignContent,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
  setupMergeFields,
  ensureMergeFields,
  setupLifecycleMergeFields,
  syncSalonizedContact,
  sendAftercareCampaign,
  deleteCampaign,
  updateSubscriberLastEmail,
  listTemplates,
  createTemplate,
  updateTemplate,
  upsertTemplate,
  deleteTemplate,
};
