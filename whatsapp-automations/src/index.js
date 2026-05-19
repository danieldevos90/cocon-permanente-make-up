/**
 * Cocon Cosmetics WhatsApp Automations — main entrypoint.
 *
 * Importeer vanuit:
 *   - marketing-automations/src/salonized-daily-sync.js → roept onTreatmentProcessed()
 *   - marketing-automations/app/api/*                    → roept runScheduledSends()
 *
 * Of gebruik direct via CLI:
 *   node src/cli.js templates
 *   node src/cli.js preview --stage aftercare --treatment wenkbrauwen
 */

export { config, validateConfig } from './config.js';
export { normalizePhone, prettyPhone } from './phone.js';

export {
  sendTemplate,
  listMessageTemplates,
  testConnection,
  verifyWebhook,
} from './whatsapp-client.js';

export {
  sendWhatsAppForStage,
  planStagesForTreatment,
  whatsappStages,
} from './automation-manager.js';

export {
  onTreatmentProcessed,
  schedulePendingSend,
  runScheduledSends,
} from './salonized-hook.js';

export {
  logSend,
  markSent,
  hasSent,
  getRecentEvents,
  logInbound,
  logStatus,
  getRecentInbox,
} from './delivery-log.js';

export {
  parseInboundWebhook,
  verifyMetaSignature,
} from './webhook-parser.js';

export {
  lookupOptIn,
  recordOptIn,
} from './opt-in-manager.js';

export {
  getWhatsAppTemplate,
  listAllWhatsAppTemplates,
  aftercareTemplates,
  refreshTemplates,
  renderPreview,
  buildComponents,
} from './templates/index.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  // Quick info banner als script direct gestart wordt
  // eslint-disable-next-line no-console
  console.log(`
╔════════════════════════════════════════════════════════════╗
║      Cocon Cosmetics WhatsApp Automations (scaffold)       ║
╚════════════════════════════════════════════════════════════╝

Status: SCAFFOLD-MODE — geen live verzending, geen Meta API calls.

Quick start:
  node src/cli.js test-connection      Verifieer credentials (dry-run safe)
  node src/cli.js templates            Lijst alle templates + status
  node src/cli.js preview --stage aftercare --treatment wenkbrauwen
  node src/cli.js queue                Toon geplande sends in Redis

Voor live deployment: lees README.md sectie "Live gaan".
`);
}
