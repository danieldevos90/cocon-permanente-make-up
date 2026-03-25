import fs from 'fs';
import path from 'path';
import { testConnection, listTemplates, listRecentCampaigns, listCampaignsSentSince } from './mailchimp-client.js';

function resolveReportCandidates() {
  const configured = process.env.SYNC_REPORT_PATH ? [process.env.SYNC_REPORT_PATH] : [];
  return [
    ...configured,
    path.resolve(process.cwd(), 'reports/salonized-daily-sync-report.json'),
    '/tmp/salonized-daily-sync-report.json',
  ];
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (_error) {
    return null;
  }
}

function sanitizeCampaign(campaign) {
  return {
    id: campaign.id,
    status: campaign.status,
    type: campaign.type,
    sendTime: campaign.send_time || null,
    createTime: campaign.create_time || null,
    emailsSent: campaign.emails_sent || 0,
    recipients: campaign.recipients?.recipient_count || 0,
    subject: campaign.settings?.subject_line || '',
    title: campaign.settings?.title || '',
  };
}

function sanitizeTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    createdBy: template.created_by || '',
    updatedAt: template.date_edited || template.date_created || null,
    active: template.active,
    type: template.type || '',
  };
}

export async function buildHealthOverview() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [ping, templatesResult, sentCampaignsResult, allCampaignsResult, recentEmailsResult] = await Promise.all([
    testConnection(),
    listTemplates({ count: 100 }),
    listRecentCampaigns({ count: 25, status: 'sent' }),
    listRecentCampaigns({ count: 25 }),
    listCampaignsSentSince(since7d),
  ]);

  const reportPath = resolveReportCandidates().find(candidate => readJsonIfExists(candidate));
  const latestSync = reportPath ? readJsonIfExists(reportPath) : null;

  return {
    generatedAt: new Date().toISOString(),
    mailchimp: {
      healthy: ping.success,
      message: ping.message,
    },
    latestSync: latestSync
      ? {
          reportPath,
          ...latestSync,
        }
      : null,
    templates: {
      total: Array.isArray(templatesResult) ? templatesResult.length : 0,
      error: Array.isArray(templatesResult) ? null : (templatesResult?.error ?? 'Failed to fetch'),
      items: Array.isArray(templatesResult) ? templatesResult.slice(0, 50).map(sanitizeTemplate) : [],
    },
    campaigns: {
      sent: sentCampaignsResult.success ? sentCampaignsResult.campaigns.map(sanitizeCampaign) : [],
      recent: allCampaignsResult.success ? allCampaignsResult.campaigns.map(sanitizeCampaign) : [],
      sentError: sentCampaignsResult.success ? null : sentCampaignsResult.error,
      recentError: allCampaignsResult.success ? null : allCampaignsResult.error,
    },
    recentEmailsLast7Days: recentEmailsResult.success
      ? recentEmailsResult.campaigns.map(sanitizeCampaign)
      : [],
    recentEmailsError: recentEmailsResult.success ? null : recentEmailsResult.error,
  };
}

