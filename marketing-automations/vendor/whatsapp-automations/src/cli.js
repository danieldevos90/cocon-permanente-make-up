#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Cocon WhatsApp CLI (scaffold).
 *
 * Alle commando's werken in dry-run wanneer WHATSAPP_DRY_RUN=true (default).
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config, validateConfig } from './config.js';
import {
  listAllWhatsAppTemplates,
  getWhatsAppTemplate,
  renderPreview,
} from './templates/index.js';
import {
  testConnection,
  listMessageTemplates,
  listPhoneNumbers,
  listWhatsAppBusinessAccounts,
  getWabaForPhoneNumber,
} from './whatsapp-client.js';
import { sendWhatsAppForStage } from './automation-manager.js';
import { runScheduledSends } from './salonized-hook.js';
import { recordOptIn, lookupOptIn } from './opt-in-manager.js';
import { getRecentEvents } from './delivery-log.js';
import { normalizePhone, prettyPhone } from './phone.js';

const program = new Command();

program
  .name('afa-whatsapp')
  .description('CLI for AFA Message Platform WhatsApp automations')
  .version('0.1.0');

program
  .command('status')
  .description('Toon huidige config status (dry-run, env, etc.)')
  .action(() => {
    const validation = validateConfig({ requireMeta: !config.dryRun });
    console.log(chalk.bold('\nAFA WhatsApp Automation — status\n'));
    console.log(`  Client:         ${config.client.displayName} (${config.client.id})`);
    console.log(`  Mode:           ${config.dryRun ? chalk.yellow('DRY RUN') : chalk.green('LIVE')}`);
    console.log(`  Provider:       ${config.provider}`);
    console.log(`  API version:    ${config.meta.apiVersion}`);
    console.log(`  Phone number:   ${config.meta.phoneNumberId || chalk.gray('(niet gezet)')}`);
    console.log(`  WABA ID:        ${config.meta.businessAccountId || chalk.gray('(niet gezet)')}`);
    console.log(`  Salonized iCal: ${config.salonized.icalUrl ? chalk.green('configured') : chalk.gray('niet gezet')}`);
    console.log(`  Mailchimp:      ${config.mailchimp.apiKey ? chalk.green('configured') : chalk.gray('niet gezet')}`);
    console.log(`  Redis:          ${config.redis.url ? chalk.green('configured') : chalk.gray('niet gezet')}`);
    console.log(`  Fallback email: ${config.fallbackToEmail ? chalk.green('aan') : chalk.gray('uit')}`);
    if (validation.errors.length) {
      console.log(chalk.red(`\n  Errors:`));
      validation.errors.forEach(e => console.log(`    - ${e}`));
    }
    if (validation.warnings.length) {
      console.log(chalk.yellow(`\n  Warnings:`));
      validation.warnings.forEach(w => console.log(`    - ${w}`));
    }
    console.log();
  });

program
  .command('test-connection')
  .description('Test verbinding met Meta WhatsApp Cloud API')
  .action(async () => {
    const result = await testConnection();
    if (result.success) {
      console.log(chalk.green('✓ '), result.dryRun ? chalk.yellow('[DRY RUN]') : '', result.message || 'OK');
      if (!result.dryRun) {
        console.log(`  Display phone: ${result.displayPhone}`);
        console.log(`  Verified name: ${result.verifiedName}`);
        console.log(`  Quality:       ${result.qualityRating}`);
      }
    } else {
      console.log(chalk.red('✗'), result.error);
      process.exitCode = 1;
    }
  });

program
  .command('templates')
  .description('Lijst lokale WhatsApp templates + (optioneel) Meta status')
  .option('--remote', 'Vergelijk met goedgekeurde templates in WhatsApp Manager', false)
  .action(async ({ remote }) => {
    const local = listAllWhatsAppTemplates();
    console.log(chalk.bold('\nLokale templates:\n'));
    for (const t of local) {
      const status =
        t.metaStatus === 'approved' ? chalk.green(t.metaStatus) :
          t.metaStatus === 'pending' ? chalk.yellow(t.metaStatus) :
            chalk.red(t.metaStatus);
      console.log(`  ${chalk.cyan(t.name)}  [${status}]  ${t.stage}/${t.treatmentType}  ${t.category}`);
    }

    if (remote) {
      const remoteRes = await listMessageTemplates();
      if (!remoteRes.success) {
        console.log(chalk.red(`\nMeta lookup failed: ${remoteRes.error}`));
        return;
      }
      if (remoteRes.dryRun) {
        console.log(chalk.yellow('\n[DRY RUN] — geen Meta call uitgevoerd.'));
        return;
      }
      console.log(chalk.bold('\nMeta-side templates:\n'));
      for (const t of remoteRes.templates) {
        console.log(`  ${chalk.cyan(t.name)}  [${t.status}]  ${t.language}  ${t.category}`);
      }
    }
    console.log();
  });

program
  .command('preview')
  .description('Render een template-preview lokaal')
  .requiredOption('--stage <stage>', 'aftercare | browsRefresh | lipsRefresh')
  .requiredOption('--treatment <type>', 'wenkbrauwen | eyeliner | lippen')
  .option('--first-name <name>', 'Voornaam voor in de template', 'Anna')
  .action(({ stage, treatment, firstName }) => {
    const template = getWhatsAppTemplate(stage, treatment);
    if (!template) {
      console.log(chalk.red(`Geen template voor ${stage}/${treatment}`));
      process.exitCode = 1;
      return;
    }
    console.log(chalk.bold(`\nTemplate: ${chalk.cyan(template.name)}`));
    console.log(`Status:   ${template.metaStatus}`);
    console.log(`Category: ${template.category}\n`);
    console.log(chalk.gray('─'.repeat(60)));
    console.log(renderPreview(template, { firstName }));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
  });

program
  .command('send')
  .description('Verstuur een test-WhatsApp (respecteert dry-run + opt-in)')
  .requiredOption('--stage <stage>', 'aftercare | browsRefresh | lipsRefresh')
  .requiredOption('--treatment <type>', 'wenkbrauwen | eyeliner | lippen')
  .requiredOption('--email <email>', 'Email voor opt-in lookup + dedupe')
  .option('--first-name <name>', 'Voornaam', '')
  .option('--phone <phone>', 'Override telefoonnummer (skip Mailchimp lookup)')
  .option('--skip-opt-in', 'Sla opt-in check over (alleen voor lokale tests)', false)
  .action(async (opts) => {
    const result = await sendWhatsAppForStage({
      stage: opts.stage,
      treatmentType: opts.treatment,
      firstName: opts.firstName,
      email: opts.email,
      phone: opts.phone,
      skipOptInCheck: opts.skipOptIn,
    });
    if (result.ok) {
      console.log(
        chalk.green('✓'),
        result.dryRun ? chalk.yellow('[DRY RUN]') : '',
        `${result.templateName} → ${prettyPhone(result.phone)}`,
      );
      if (result.preview) {
        console.log(chalk.gray('─'.repeat(60)));
        console.log(result.preview);
        console.log(chalk.gray('─'.repeat(60)));
      }
    } else {
      console.log(chalk.red('✗'), result.reason);
      process.exitCode = 1;
    }
  });

program
  .command('queue')
  .description('Toon geplande WhatsApp sends in Redis')
  .action(async () => {
    if (!config.redis.url) {
      console.log(chalk.yellow('Redis niet geconfigureerd.'));
      return;
    }
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: config.redis.url, token: config.redis.token });
    const raw = await redis.zrange('wa:schedule', 0, -1, { withScores: true });
    console.log(chalk.bold(`\nGescheduled sends (${Math.floor(raw.length / 2)})\n`));
    for (let i = 0; i < raw.length; i += 2) {
      const member = raw[i];
      const score = raw[i + 1];
      const due = new Date(Number(score) * 1000).toISOString().slice(0, 16).replace('T', ' ');
      console.log(`  ${chalk.gray(due)}  ${member}`);
    }
    console.log();
  });

program
  .command('run-scheduled')
  .description('Verwerk alle scheduled sends waarvan due-date is gepasseerd')
  .action(async () => {
    const report = await runScheduledSends();
    console.log(JSON.stringify(report, null, 2));
  });

program
  .command('opt-in')
  .description('Registreer een opt-in voor een (email, phone) combo in Mailchimp')
  .requiredOption('--email <email>')
  .requiredOption('--phone <phone>')
  .action(async ({ email, phone }) => {
    const result = await recordOptIn({ email, phone });
    if (result.success) {
      console.log(chalk.green('✓'), `Opt-in geregistreerd voor ${email} → ${prettyPhone(result.phone)}`);
    } else {
      console.log(chalk.red('✗'), result.error);
      process.exitCode = 1;
    }
  });

program
  .command('opt-in-check')
  .description('Controleer of een email opt-in heeft + uit welk Mailchimp veld')
  .requiredOption('--email <email>')
  .action(async ({ email }) => {
    const result = await lookupOptIn(email);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('recent')
  .description('Toon recent verzonden WhatsApp events uit Redis (laatste 7 dagen)')
  .option('--days <n>', 'aantal dagen terug', '7')
  .action(async ({ days }) => {
    const result = await getRecentEvents({ days: Number(days) });
    if (!result.configured) {
      console.log(chalk.yellow('Redis niet geconfigureerd — geen historie beschikbaar.'));
      return;
    }
    console.log(chalk.bold(`\nLaatste ${days} dagen — ${result.events.length} events\n`));
    for (const evt of result.events.slice(0, 30)) {
      const status = evt.success ? chalk.green('OK  ') : chalk.red('FAIL');
      const dry = evt.dryRun ? chalk.yellow('[dry]') : '     ';
      console.log(`  ${evt.timestamp.slice(0, 16).replace('T', ' ')} ${status} ${dry} ${evt.templateName || '-'} → ${evt.to || '-'} ${evt.error ? chalk.red(`(${evt.error})`) : ''}`);
    }
    console.log();
  });

program
  .command('list-phone-numbers')
  .description('Toon alle phone numbers onder de geconfigureerde WABA')
  .action(async () => {
    const result = await listPhoneNumbers();
    if (!result.success) {
      console.log(chalk.red('✗'), result.error);
      if (result.errorDetail?.code) {
        console.log(chalk.gray(`  Meta error code: ${result.errorDetail.code} (${result.errorDetail.type || 'unknown'})`));
      }
      process.exitCode = 1;
      return;
    }
    console.log(chalk.bold(`\n${result.phoneNumbers.length} phone number(s) onder deze WABA:\n`));
    for (const p of result.phoneNumbers) {
      console.log(`  ${chalk.cyan(p.displayPhone)}`);
      console.log(`    Phone number ID:  ${p.id}`);
      console.log(`    Verified name:    ${p.verifiedName || '-'}`);
      console.log(`    Quality rating:   ${p.qualityRating || '-'}`);
      console.log(`    Verification:     ${p.codeVerificationStatus || '-'}`);
      console.log(`    Name status:      ${p.nameStatus || '-'}`);
      console.log();
    }
  });

program
  .command('find-phone <phone>')
  .description('Zoek een specifiek telefoonnummer onder de WABA (matcht na E.164 normalisatie)')
  .action(async (phone) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.log(chalk.red('Ongeldig telefoonnummer:'), phone);
      process.exitCode = 1;
      return;
    }
    console.log(chalk.gray(`Zoeken naar ${prettyPhone(normalized)} (E.164: ${normalized})...`));

    const result = await listPhoneNumbers();
    if (!result.success) {
      console.log(chalk.red('✗'), result.error);
      console.log(chalk.gray('\n  Zorg dat in .env staat:'));
      console.log(chalk.gray('    META_WHATSAPP_ACCESS_TOKEN=...'));
      console.log(chalk.gray('    META_WHATSAPP_BUSINESS_ACCOUNT_ID=...'));
      process.exitCode = 1;
      return;
    }

    const matches = result.phoneNumbers.filter((p) => {
      const apiNormalized = normalizePhone(p.displayPhone);
      return apiNormalized && apiNormalized === normalized;
    });

    if (matches.length === 0) {
      console.log(chalk.yellow(`\n  Niet gevonden onder deze WABA (${result.phoneNumbers.length} nummers gecheckt).`));
      console.log(chalk.gray('\n  Mogelijke oorzaken:'));
      console.log(chalk.gray('    - Het nummer is nog niet geregistreerd bij Meta'));
      console.log(chalk.gray('    - Het hangt onder een andere WABA (check `list-businesses`)'));
      console.log(chalk.gray('    - Het is nog in pending state — kijk in WhatsApp Manager'));
      return;
    }

    console.log(chalk.green(`\n✓ Gevonden: ${matches.length} match(es)\n`));
    for (const m of matches) {
      console.log(`  ${chalk.cyan(m.displayPhone)}`);
      console.log(`    Phone number ID:  ${chalk.green(m.id)}  ← gebruik dit in META_WHATSAPP_PHONE_NUMBER_ID`);
      console.log(`    Verified name:    ${m.verifiedName || chalk.gray('(niet ingesteld)')}`);
      console.log(`    Quality rating:   ${m.qualityRating || '-'}`);
      console.log(`    Verification:     ${m.codeVerificationStatus || '-'}`);
      console.log();
    }
  });

program
  .command('phone-status')
  .description('Inspecteer een Phone Number (platform, verification, quality) via Meta Graph API')
  .option('--id <id>', 'Phone Number ID (default: uit META_WHATSAPP_PHONE_NUMBER_ID)')
  .action(async ({ id }) => {
    const phoneId = id || config.meta.phoneNumberId;
    if (!phoneId) {
      console.log(chalk.red('Geen phone number ID — geef --id of zet META_WHATSAPP_PHONE_NUMBER_ID'));
      process.exitCode = 1;
      return;
    }
    if (!config.meta.accessToken) {
      console.log(chalk.red('META_WHATSAPP_ACCESS_TOKEN ontbreekt'));
      process.exitCode = 1;
      return;
    }

    const fields = 'display_phone_number,verified_name,quality_rating,code_verification_status,name_status,platform_type,is_on_biz_app,messaging_limit_tier';
    const url = `https://graph.facebook.com/${config.meta.apiVersion}/${phoneId}?fields=${fields}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.meta.accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      console.log(chalk.red('✗'), data?.error?.message || `HTTP ${response.status}`);
      process.exitCode = 1;
      return;
    }

    const platformColor = data.platform_type === 'CLOUD_API' ? chalk.green
      : data.platform_type === 'ON_PREMISE' ? chalk.yellow
        : chalk.gray;
    const verifyColor = data.code_verification_status === 'VERIFIED' ? chalk.green : chalk.yellow;
    const qualityColor =
      data.quality_rating === 'GREEN' ? chalk.green :
        data.quality_rating === 'YELLOW' ? chalk.yellow :
          data.quality_rating === 'RED' ? chalk.red : chalk.gray;

    console.log(chalk.bold(`\nPhone Number — ${chalk.cyan(data.display_phone_number)}`));
    console.log(`  ID:              ${data.id}`);
    console.log(`  Verified name:   ${data.verified_name || chalk.gray('(niet ingesteld)')}`);
    console.log(`  Platform:        ${platformColor(data.platform_type)}`);
    console.log(`  Verification:    ${verifyColor(data.code_verification_status)}`);
    console.log(`  Name status:     ${data.name_status || '-'}`);
    console.log(`  Quality rating:  ${qualityColor(data.quality_rating)}`);
    console.log(`  Messaging tier:  ${data.messaging_limit_tier || '-'}`);
    console.log(`  In Business app: ${data.is_on_biz_app
      ? chalk.green('YES  ← vereist voor coexistence, NIET loskoppelen')
      : chalk.yellow('NO   ← nummer staat niet op de Business-app')}`);

    // COEXISTENCE-VEILIG advies. We sturen NOOIT aan op de klassieke migratie
    // (nummer van de telefoon loskoppelen + SMS-verify) — dat blokkeert
    // Daniela's WhatsApp op de telefoon. Onboarding loopt via Embedded Signup.
    console.log(chalk.bold('\n  Coexistence-status:'));
    console.log(chalk.red('    ⚠ Doe NIET de klassieke "Migrate to Cloud API" + SMS-verificatie:'));
    console.log(chalk.red('      die koppelt dit nummer los van de WhatsApp Business-app op de telefoon.'));
    if (data.is_on_biz_app) {
      console.log(chalk.green('    ✓ Nummer staat op de Business-app — basis voor coexistence is aanwezig.'));
    } else {
      console.log(chalk.yellow('    - Nummer lijkt niet op de Business-app te staan; coexistence vereist'));
      console.log(chalk.yellow('      de WhatsApp Business-app (v2.24.17+) op de telefoon.'));
    }
    console.log(chalk.gray('    → Onboarden: Coexistence Embedded Signup ("Connect a WhatsApp Business App").'));
    console.log(chalk.gray('      Daniela krijgt een verificatiecode IN de Business-app — geen SMS-migratie.'));
    console.log(chalk.gray('      Zie README: "Live gaan (coexistence-veilig)".'));
    console.log();
  });

program
  .command('list-businesses')
  .description('Toon Meta Business accounts waar dit token toegang tot heeft (helpt om WABA ID te vinden)')
  .option('--business-id <id>', 'Filter op een specifieke Business Manager ID')
  .action(async ({ businessId }) => {
    const result = await listWhatsAppBusinessAccounts({ businessId });
    if (!result.success) {
      console.log(chalk.red('✗'), result.error);
      process.exitCode = 1;
      return;
    }
    if (!result.items.length) {
      console.log(chalk.yellow('Geen accounts gevonden — controleer permissions van dit token.'));
      return;
    }
    console.log(chalk.bold(`\n${result.items.length} item(s):\n`));
    for (const item of result.items) {
      console.log(`  ${chalk.cyan(item.name || item.id)}`);
      console.log(`    ID:    ${item.id}`);
      if (item.timezone_id) console.log(`    TZ:    ${item.timezone_id}`);
      if (item.currency) console.log(`    Cur:   ${item.currency}`);
      console.log();
    }
    if (!businessId) {
      console.log(chalk.gray('Tip: run nu  node src/cli.js list-businesses --business-id <ID>'));
      console.log(chalk.gray('     om de WABA(s) onder dat business te zien.'));
    }
  });

program
  .command('waba')
  .description('Haal de WABA ID op die bij het geconfigureerde nummer hoort (read-only)')
  .action(async () => {
    const result = await getWabaForPhoneNumber();
    if (!result.success) {
      console.log(chalk.red('✗'), result.error);
      if (/nonexisting field|#100/i.test(result.error || '')) {
        console.log(chalk.yellow('\n  Dit nummer hangt nog niet aan een leesbare WABA.'));
        console.log(chalk.gray('  Verwacht zolang het nummer nog niet via Coexistence Embedded Signup'));
        console.log(chalk.gray('  is onboard. De WABA ID komt terug uit die signup-flow (session logging).'));
      }
      process.exitCode = 1;
      return;
    }
    console.log(chalk.bold('\nWhatsApp Business Account:'));
    console.log(`  WABA ID:   ${chalk.green(result.wabaId || chalk.gray('(geen gevonden)'))}`);
    if (result.wabaName) console.log(`  Naam:      ${result.wabaName}`);
    console.log(chalk.gray('\n  Zet dit in .env als META_WHATSAPP_BUSINESS_ACCOUNT_ID'));
    console.log();
  });

program
  .command('normalize-phone <phone>')
  .description('Normaliseer een telefoonnummer naar E.164 (debug helper)')
  .action((phone) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.log(chalk.red('Ongeldig telefoonnummer'));
      process.exitCode = 1;
      return;
    }
    console.log(`${chalk.cyan(phone)} → ${chalk.green(normalized)}  (${prettyPhone(normalized)})`);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red('Fatal:'), error.message);
  process.exit(1);
});
