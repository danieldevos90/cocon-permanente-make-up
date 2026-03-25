/**
 * Cocon Cosmetics Marketing Automations
 * 
 * Main entry point for programmatic usage
 */

export { config, validateConfig } from './config.js';

export {
  initMailchimp,
  testConnection,
  getLists,
  getListInfo,
  addOrUpdateSubscriber,
  addTagsToSubscriber,
  setSubscriberTags,
  getSubscriber,
  getSubscribersByTag,
  createCampaign,
  setCampaignContent,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
  setupMergeFields,
  ensureMergeFields,
  setupLifecycleMergeFields,
  syncSalonizedContact,
} from './mailchimp-client.js';

export {
  journeyStages,
  registerTreatment,
  sendJourneyEmail,
  scheduleJourneyEmail,
  getNextJourneyEmail,
  previewEmail,
  getJourneySummary,
} from './automation-manager.js';

export {
  runSalonizedDailySync,
} from './salonized-daily-sync.js';

export {
  aftercareEmails,
  weekFollowupEmails,
  reviewRequestEmails,
  touchupReminderEmails,
  leadNurtureEmails,
  getEmailTemplate,
  listAllTemplates,
} from './templates/index.js';

// Quick start example
console.log(`
╔═══════════════════════════════════════════════════════════╗
║          Cocon Cosmetics Marketing Automations            ║
╚═══════════════════════════════════════════════════════════╝

Quick Start Commands:
  npm run test-connection    Test Mailchimp API connection
  npm run list               List available audiences
  node src/cli.js setup      Setup merge fields
  node src/cli.js templates  List all email templates

Register a treatment:
  node src/cli.js register -e client@email.nl -f "Anna" -t wenkbrauwen

Send an email:
  node src/cli.js send -e client@email.nl -f "Anna" -t wenkbrauwen -s aftercare --test

Preview a template:
  node src/cli.js preview -t wenkbrauwen -s aftercare -o preview.html

For full CLI help:
  node src/cli.js --help
`);
