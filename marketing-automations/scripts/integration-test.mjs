#!/usr/bin/env node
/**
 * Integration test for marketing automations (Mailchimp + Redis).
 * Run: node scripts/integration-test.mjs
 */
import 'dotenv/config';
import { validateConfig, config } from '../src/config.js';
import {
  initMailchimp,
  testConnection,
  ensureMergeFields,
  getSubscriber,
  updateSubscriberLastEmail,
  sendAftercareCampaign,
  deleteCampaign,
  createCampaign,
  setCampaignContent,
  listRecentCampaigns,
} from '../src/mailchimp-client.js';
import {
  logEmailSend,
  getRecentEvents,
  getLastSendForEmail,
} from '../src/email-delivery-log.js';
import { previewEmail } from '../src/automation-manager.js';

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\n=== Marketing Automations Integration Test ===\n');

  // 1. Config
  const v = validateConfig();
  if (v.valid) pass('Config valid');
  else fail('Config valid', v.errors.join('; '));

  if (config.sender.email !== 'info@coconcosmetics.nl' && !process.env.SENDER_EMAIL) {
    fail('Sender email', `expected info@coconcosmetics.nl, got ${config.sender.email}`);
  } else {
    pass('Sender email', config.sender.email);
  }

  // 2. Mailchimp connection
  const ping = await testConnection();
  if (ping.success) pass('Mailchimp connection', ping.message);
  else fail('Mailchimp connection', ping.message);

  // 3. Merge fields
  const mf = await ensureMergeFields([
    { tag: 'LASTEMAIL', name: 'Last Automation Email', type: 'text' },
    { tag: 'LASTEMAILD', name: 'Last Automation Email Date', type: 'date' },
  ]);
  const mfOk = mf.every(r => r.success);
  if (mfOk) pass('LASTEMAIL merge fields', mf.map(r => r.status).join(', '));
  else fail('LASTEMAIL merge fields', JSON.stringify(mf));

  // 4. Template preview
  const preview = previewEmail('aftercare', 'wenkbrauwen', { firstName: 'Test' });
  if (preview?.html?.length > 100) pass('Template preview', preview.subject);
  else fail('Template preview', 'no HTML');

  // 5. Redis logging
  const testEmail = process.env.TEST_EMAIL || 'integration-test@example.com';
  const logResult = await logEmailSend({
    email: testEmail,
    stage: 'aftercare',
    treatmentType: 'wenkbrauwen',
    subject: '[integration-test] Nazorg',
    success: true,
    campaignId: 'test-integration',
  });
  if (config.redis.url && config.redis.token) {
    if (logResult.logged) pass('Redis email log write');
    else fail('Redis email log write', logResult.reason);
    const recent = await getRecentEvents({ days: 1 });
    const found = recent.events.some(
      e => e.email === testEmail && e.subject?.includes('integration-test'),
    );
    if (found) pass('Redis email log read');
    else fail('Redis email log read', 'test event not found');
  } else {
    pass('Redis email log', 'skipped — no UPSTASH_REDIS_* in env');
  }

  // 6. Mailchimp updateSubscriberLastEmail (only if TEST_EMAIL is a real list member)
  if (process.env.TEST_EMAIL) {
    const sub = await getSubscriber(process.env.TEST_EMAIL);
    if (sub.success) {
      const upd = await updateSubscriberLastEmail(process.env.TEST_EMAIL, {
        subject: '[integration-test] LASTEMAIL',
        stage: 'aftercare',
      });
      if (upd.success) {
        pass('updateSubscriberLastEmail', process.env.TEST_EMAIL);
        const after = await getSubscriber(process.env.TEST_EMAIL);
        const last = after.subscriber?.merge_fields?.LASTEMAIL;
        if (last?.includes('integration-test')) pass('LASTEMAIL merge field on contact', last);
        else fail('LASTEMAIL merge field on contact', last || 'empty');
        const lastDt = after.subscriber?.merge_fields?.LASTEMAILD;
        if (lastDt) pass('LASTEMAILD merge field on contact', lastDt);
        else fail('LASTEMAILD merge field on contact', 'empty');
      } else {
        fail('updateSubscriberLastEmail', upd.error);
      }
    } else {
      pass('updateSubscriberLastEmail', 'skipped — TEST_EMAIL not in audience');
    }
  } else {
    pass('updateSubscriberLastEmail', 'skipped — set TEST_EMAIL in .env');
  }

  // 7. Campaign create + delete (no send)
  initMailchimp();
  const draft = await createCampaign({
    subject: '[integration-test] delete me',
    previewText: 'test',
  });
  if (draft.success) {
    pass('createCampaign', draft.campaign.id);
    await setCampaignContent(draft.campaign.id, '<html><body>test</body></html>');
    const del = await deleteCampaign(draft.campaign.id);
    if (del.success) pass('deleteCampaign');
    else fail('deleteCampaign', del.error);
  } else {
    fail('createCampaign', draft.error);
  }

  // 8. Live send test (optional — TEST_EMAIL + TEST_SEND=1)
  if (process.env.TEST_EMAIL && process.env.TEST_SEND === '1') {
    const sub = await getSubscriber(process.env.TEST_EMAIL);
    if (!sub.success) {
      fail('Live sendAftercareCampaign', 'TEST_EMAIL not in audience');
    } else {
      const html = preview.html;
      const send = await sendAftercareCampaign({
        emails: [process.env.TEST_EMAIL],
        subject: '[integration-test] Nazorg send',
        previewText: 'Automated test',
        htmlContent: html,
      });
      if (send.success) {
        pass('sendAftercareCampaign live', `sent=${send.sent}, deleted=${send.deleted}`);
        await logEmailSend({
          email: process.env.TEST_EMAIL,
          stage: 'aftercare',
          treatmentType: 'wenkbrauwen',
          subject: '[integration-test] Nazorg send',
          success: true,
          campaignId: send.campaignId,
        });
        const { campaigns } = await listRecentCampaigns({ count: 5 });
        const leftover = (campaigns || []).find(
          c => c.settings?.subject_line?.includes('[integration-test]'),
        );
        if (!leftover) pass('Campaign cleaned up after send');
        else fail('Campaign cleaned up after send', leftover.id);
      } else {
        fail('sendAftercareCampaign live', send.error);
      }
    }
  } else {
    pass('Live sendAftercareCampaign', 'skipped — set TEST_EMAIL + TEST_SEND=1');
  }

  // 9. Dry-run sync
  try {
    const { runSalonizedDailySync } = await import('../src/salonized-daily-sync.js');
    if (!process.env.SALONIZED_ICAL_URL) {
      pass('Salonized dry-run sync', 'skipped — no SALONIZED_ICAL_URL');
    } else {
      const report = await runSalonizedDailySync({
        icalUrl: process.env.SALONIZED_ICAL_URL,
        dryRun: true,
        mailchimpPageSize: 50,
        reportPath: '/tmp/integration-sync-test.json',
      });
      pass(
        'Salonized dry-run sync',
        `appointments=${report.totals.todayAppointments}, planned=${report.totals.plannedUpdates || 0}`,
      );
    }
  } catch (e) {
    fail('Salonized dry-run sync', e.message);
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===\n`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
