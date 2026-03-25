#!/usr/bin/env node
/**
 * Full health check: Mailchimp, templates, recent emails, config
 */
import chalk from 'chalk';
import { config, validateConfig } from './config.js';
import {
  testConnection,
  listTemplates,
  listRecentCampaigns,
  listCampaignsSentSince,
} from './mailchimp-client.js';
import { listAllTemplates } from './templates/index.js';

const JOURNEY_TEMPLATE_NAMES = [
  'Aftercare',
  'Week Follow-up',
  '6-Month Refresh',
  '10-Month Refresh',
  '18-Month Refresh',
  '2-Year Refresh',
  'confirmation',
];

function templateMatchesJourney(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return JOURNEY_TEMPLATE_NAMES.some((t) => n.includes(t.toLowerCase()));
}

export async function runHealthCheck() {
  const results = { ok: true, checks: [] };

  // 1. Config
  const configValidation = validateConfig();
  results.checks.push({
    name: 'Config',
    ok: configValidation.valid,
    detail: configValidation.valid ? 'API key + list ID aanwezig' : configValidation.errors.join('; '),
  });
  if (!configValidation.valid) results.ok = false;

  // 2. Mailchimp connection
  const ping = await testConnection();
  results.checks.push({
    name: 'Mailchimp',
    ok: ping.success,
    detail: ping.success ? ping.message : ping.message,
  });
  if (!ping.success) results.ok = false;

  // 3. Templates in Mailchimp
  let templates = [];
  try {
    templates = await listTemplates({ count: 100 });
  } catch (_) {}
  templates = Array.isArray(templates) ? templates : [];
  const journeyTemplates = templates.filter((t) => templateMatchesJourney(t?.name));
  const templateCount = templates.length;
  results.checks.push({
    name: 'Templates',
    ok: templateCount > 0,
    detail: `${templateCount} templates in Mailchimp, ${journeyTemplates.length} journey-templates`,
  });
  if (templateCount === 0) results.ok = false;

  // 4. Recent emails (last 7 days)
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const campaignsResult = await listCampaignsSentSince(since7d);
  const recentCampaigns = campaignsResult.success ? campaignsResult.campaigns : [];
  const totalSent = recentCampaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
  results.checks.push({
    name: 'Emails (7d)',
    ok: true,
    detail: `${recentCampaigns.length} campagnes, ${totalSent} emails verzonden`,
  });
  results.recentEmails = campaignsResult.success
    ? recentCampaigns.slice(0, 10).map((c) => ({
        subject: c.settings?.subject_line || c.settings?.title,
        sent: c.send_time,
        count: c.emails_sent,
        type: c.type,
      }))
    : [];

  // 5. Env vars for cron (CRON_SECRET alleen nodig op Vercel)
  const hasCronSecret = Boolean(process.env.CRON_SECRET);
  const hasIcalUrl = Boolean(process.env.SALONIZED_ICAL_URL);
  const cronOk = hasIcalUrl && (hasCronSecret || !process.env.VERCEL); // Vercel = production
  results.checks.push({
    name: 'Cron env',
    ok: cronOk,
    detail: `SALONIZED_ICAL_URL: ${hasIcalUrl ? '✓' : '✗'}, CRON_SECRET: ${hasCronSecret ? '✓' : 'alleen op Vercel'}`,
  });
  if (!hasIcalUrl) results.ok = false;

  // 6. Local template definitions
  const localTemplates = listAllTemplates();
  results.checks.push({
    name: 'Local templates',
    ok: localTemplates.length >= 10,
    detail: `${localTemplates.length} templates gedefinieerd`,
  });

  return results;
}

function formatReport(report) {
  const lines = [];
  lines.push('');
  lines.push(chalk.bold('Cocon Marketing Automations — Health Check'));
  lines.push(chalk.gray(new Date().toISOString()));
  lines.push('');

  for (const check of report.checks) {
    const icon = check.ok ? chalk.green('✓') : chalk.red('✗');
    lines.push(`  ${icon} ${check.name}: ${check.detail}`);
  }

  if (report.recentEmails?.length > 0) {
    lines.push('');
    lines.push(chalk.bold('  Recente emails (laatste 7d):'));
    for (const e of report.recentEmails) {
      lines.push(chalk.gray(`    - ${e.subject || '?'} | ${e.count} verzonden | ${e.sent || '-'}`));
    }
  }

  lines.push('');
  lines.push(report.ok ? chalk.green('Alles OK') : chalk.red('Er zijn problemen'));
  lines.push('');
  return lines.join('\n');
}

const isDirectRun = process.argv[1]?.includes('health-check');
if (isDirectRun) {
  const report = await runHealthCheck();
  console.log(formatReport(report));
  process.exit(report.ok ? 0 : 1);
}
