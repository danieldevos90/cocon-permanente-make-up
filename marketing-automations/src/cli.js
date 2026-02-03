#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config, validateConfig } from './config.js';
import {
  testConnection,
  getLists,
  getListInfo,
  getSubscriber,
  setupMergeFields,
  listTemplates,
  upsertTemplate,
} from './mailchimp-client.js';
import {
  registerTreatment,
  sendJourneyEmail,
  previewEmail,
  getJourneySummary,
} from './automation-manager.js';
import { listAllTemplates } from './templates/index.js';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('cocon-automations')
  .description('Marketing email automations for Cocon Cosmetics')
  .version('1.0.0');

/**
 * Test Mailchimp connection
 */
program
  .command('test')
  .description('Test Mailchimp API connection')
  .action(async () => {
    console.log(chalk.blue('🔌 Testing Mailchimp connection...'));
    
    const result = await testConnection();
    
    if (result.success) {
      console.log(chalk.green(`✅ Connected! Status: ${result.message}`));
    } else {
      console.log(chalk.red(`❌ Connection failed: ${result.message}`));
    }
  });

/**
 * List available audiences/lists
 */
program
  .command('lists')
  .description('List all Mailchimp audiences/lists')
  .action(async () => {
    console.log(chalk.blue('📋 Fetching Mailchimp lists...'));
    
    try {
      const lists = await getLists();
      
      if (lists.length === 0) {
        console.log(chalk.yellow('No lists found. Create an audience in Mailchimp first.'));
        return;
      }

      console.log(chalk.green(`\nFound ${lists.length} list(s):\n`));
      
      for (const list of lists) {
        console.log(chalk.white(`  📧 ${list.name}`));
        console.log(chalk.gray(`     ID: ${list.id}`));
        console.log(chalk.gray(`     Members: ${list.stats.member_count}`));
        console.log('');
      }

      console.log(chalk.blue('💡 Add your list ID to .env as MAILCHIMP_LIST_ID'));
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

/**
 * Setup Mailchimp merge fields
 */
program
  .command('setup')
  .description('Setup required merge fields in Mailchimp')
  .action(async () => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.log(chalk.red('Configuration errors:'));
      validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      return;
    }

    console.log(chalk.blue('🔧 Setting up merge fields...'));
    
    try {
      const results = await setupMergeFields();
      
      for (const result of results) {
        if (result.success) {
          console.log(chalk.green(`  ✅ Created field: ${result.field}`));
        } else {
          console.log(chalk.yellow(`  ⚠️  Field ${result.field}: ${result.error}`));
        }
      }

      console.log(chalk.green('\n✅ Setup complete!'));
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

/**
 * Register a new treatment
 */
program
  .command('register')
  .description('Register a new treatment and schedule emails')
  .requiredOption('-e, --email <email>', 'Client email address')
  .requiredOption('-f, --firstname <name>', 'Client first name')
  .requiredOption('-t, --treatment <type>', 'Treatment type (wenkbrauwen, eyeliner, lippen)')
  .option('-l, --lastname <name>', 'Client last name', '')
  .option('-d, --date <date>', 'Treatment date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
  .action(async (options) => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.log(chalk.red('Configuration errors:'));
      validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      return;
    }

    console.log(chalk.blue(`📝 Registering treatment for ${options.email}...`));
    
    try {
      const result = await registerTreatment({
        email: options.email,
        firstName: options.firstname,
        lastName: options.lastname,
        treatmentType: options.treatment,
        treatmentDate: new Date(options.date),
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ ${result.message}`));
        console.log(chalk.white('\nScheduled emails:'));
        
        for (const email of result.scheduledEmails) {
          const dateStr = email.scheduledDate.toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          console.log(chalk.gray(`  📧 ${email.stageName}: ${dateStr}`));
        }
      } else {
        console.log(chalk.red(`❌ ${result.error}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

/**
 * Send an email
 */
program
  .command('send')
  .description('Send a journey email immediately')
  .requiredOption('-e, --email <email>', 'Client email address')
  .requiredOption('-f, --firstname <name>', 'Client first name')
  .requiredOption('-t, --treatment <type>', 'Treatment type (wenkbrauwen, eyeliner, lippen)')
  .requiredOption('-s, --stage <stage>', 'Email stage (aftercare, weekFollowup, reviewRequest, touchupReminder)')
  .option('--test', 'Send as test email instead of real campaign')
  .action(async (options) => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.log(chalk.red('Configuration errors:'));
      validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      return;
    }

    const mode = options.test ? 'test' : 'live';
    console.log(chalk.blue(`📤 Sending ${options.stage} email (${mode} mode)...`));
    
    try {
      const result = await sendJourneyEmail({
        email: options.email,
        firstName: options.firstname,
        treatmentType: options.treatment,
        stage: options.stage,
        testMode: options.test,
      });

      if (result.success) {
        console.log(chalk.green(`\n✅ ${result.message}`));
        console.log(chalk.gray(`   Campaign ID: ${result.campaignId}`));
      } else {
        console.log(chalk.red(`❌ ${result.error || result.message}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

/**
 * Preview an email template
 */
program
  .command('preview')
  .description('Preview an email template')
  .requiredOption('-t, --treatment <type>', 'Treatment type (wenkbrauwen, eyeliner, lippen)')
  .requiredOption('-s, --stage <stage>', 'Email stage')
  .option('-n, --name <name>', 'Preview name', 'Lisa')
  .option('-o, --output <file>', 'Output HTML to file')
  .action(async (options) => {
    console.log(chalk.blue(`👀 Previewing ${options.stage} email for ${options.treatment}...`));
    
    const preview = previewEmail(options.stage, options.treatment, {
      firstName: options.name,
    });

    if (!preview) {
      console.log(chalk.red('Template not found'));
      return;
    }

    console.log(chalk.white(`\n📧 Subject: ${preview.subject}`));
    console.log(chalk.gray(`   Preview: ${preview.previewText}\n`));

    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, preview.html);
      console.log(chalk.green(`✅ HTML saved to: ${outputPath}`));
      console.log(chalk.gray('   Open in browser to preview'));
    } else {
      console.log(chalk.yellow('💡 Use --output <file.html> to save preview'));
    }
  });

/**
 * List all templates
 */
program
  .command('templates')
  .description('List all available email templates')
  .action(() => {
    console.log(chalk.blue('📋 Available email templates:\n'));
    
    const templates = listAllTemplates();
    
    // Group by type
    const journey = templates.filter(t => t.type === 'journey');
    const nurture = templates.filter(t => t.type === 'nurture');

    console.log(chalk.white('Treatment Journey Emails:'));
    for (const t of journey) {
      console.log(chalk.gray(`  - ${t.stage} (${t.treatmentType})`));
    }

    console.log(chalk.white('\nLead Nurture Emails:'));
    for (const t of nurture) {
      console.log(chalk.gray(`  - ${t.stage}`));
    }

    console.log(chalk.blue('\n💡 Use "preview" command to see template content'));
  });

/**
 * Sync local templates to Mailchimp
 */
program
  .command('templates-sync')
  .description('Upload the local HTML templates to Mailchimp')
  .option('--stage <stage>', 'Only sync a specific journey stage')
  .option('--treatment <type>', 'Only sync a specific treatment type')
  .option('--prefix <prefix>', 'Name prefix for templates', 'Cocon - ')
  .option('--folder <folderId>', 'Mailchimp template folder ID to use')
  .option('--dry-run', 'Show actions without updating Mailchimp')
  .action(async (options) => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.log(chalk.red('Configuration errors:'));
      validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      return;
    }

    const stageFilter = options.stage || null;
    const treatmentFilter = options.treatment || null;
    const prefix = options.prefix || 'Cocon - ';
    const folderId = options.folder || null;
    const dryRun = Boolean(options.dryRun);

    const stageLabels = {
      aftercare: 'Aftercare',
      weekFollowup: 'Week Follow-up',
      reviewRequest: 'Review Request',
      touchupReminder: 'Touch-up Reminder',
      education: 'Education',
      socialProof: 'Social Proof',
    };

    const treatmentLabels = {
      wenkbrauwen: 'Wenkbrauwen',
      eyeliner: 'Eyeliner',
      lippen: 'Lippen',
    };

    const templates = listAllTemplates().filter(template => {
      if (stageFilter && template.stage !== stageFilter) {
        return false;
      }
      if (treatmentFilter && template.treatmentType !== treatmentFilter) {
        return false;
      }
      return true;
    });

    if (templates.length === 0) {
      console.log(chalk.yellow('No templates match the provided filters.'));
      return;
    }

    console.log(chalk.blue(`🚀 Syncing ${templates.length} template(s) to Mailchimp...`));
    if (dryRun) {
      console.log(chalk.yellow('Dry run enabled – no changes will be made.\n'));
    }

    let existingTemplates = [];
    try {
      existingTemplates = await listTemplates({ folderId });
    } catch (error) {
      console.log(chalk.red(`Failed to fetch existing templates: ${error.message}`));
      return;
    }

    const summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      dryRun: dryRun,
    };

    for (const templateMeta of templates) {
      const stage = templateMeta.stage;
      const treatmentType = templateMeta.treatmentType ?? null;
      const preview = previewEmail(stage, treatmentType, { firstName: '*|FNAME|*' });

      if (!preview) {
        console.log(chalk.yellow(`⚠️  Skipping ${stage}${treatmentType ? ` (${treatmentType})` : ''}: template not found.`));
        summary.skipped += 1;
        continue;
      }

      const readableStage = stageLabels[stage] || stage;
      const readableTreatment = treatmentType ? (treatmentLabels[treatmentType] || treatmentType) : null;
      const templateName = `${prefix}${readableStage}${readableTreatment ? ` (${readableTreatment})` : ''}`;
      const existing = existingTemplates.find(t => t.name === templateName);
      const plannedAction = existing ? 'update' : 'create';

      if (dryRun) {
        console.log(chalk.gray(`[dry-run] Would ${plannedAction} template "${templateName}" (subject: ${preview.subject})`));
        summary.skipped += 1;
        continue;
      }

      try {
        const result = await upsertTemplate({
          name: templateName,
          html: preview.html,
          folderId,
          existingTemplates,
        });

        if (result.created) {
          summary.created += 1;
          existingTemplates.push(result.template);
          console.log(chalk.green(`✅ Created template: ${templateName}`));
        } else {
          summary.updated += 1;
          console.log(chalk.green(`✅ Updated template: ${templateName}`));
        }
      } catch (error) {
        summary.failed += 1;
        console.log(chalk.red(`❌ Failed to sync ${templateName}: ${error.message}`));
      }
    }

    console.log('\n' + chalk.blue('Summary:'));
    if (dryRun) {
      console.log(chalk.white(`  Previewed: ${summary.skipped}`));
    } else {
      console.log(chalk.white(`  Created: ${summary.created}`));
      console.log(chalk.white(`  Updated: ${summary.updated}`));
      console.log(chalk.white(`  Skipped: ${summary.skipped}`));
      console.log(chalk.white(`  Failed: ${summary.failed}`));
    }
  });

/**
 * Show journey summary
 */
program
  .command('journey')
  .description('Show email journey for a treatment type')
  .requiredOption('-t, --treatment <type>', 'Treatment type (wenkbrauwen, eyeliner, lippen)')
  .action((options) => {
    const summary = getJourneySummary(options.treatment);
    
    console.log(chalk.blue(`\n📧 Email Journey: ${options.treatment}\n`));
    
    for (const step of summary) {
      const timing = step.daysAfterTreatment === 0 
        ? 'Immediately' 
        : `Day ${step.daysAfterTreatment}`;
      
      console.log(chalk.white(`${timing}: ${step.stageName}`));
      console.log(chalk.gray(`  Subject: ${step.subject}`));
      console.log('');
    }
  });

/**
 * Get subscriber info
 */
program
  .command('subscriber')
  .description('Get subscriber information')
  .requiredOption('-e, --email <email>', 'Subscriber email')
  .action(async (options) => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.log(chalk.red('Configuration errors:'));
      validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      return;
    }

    console.log(chalk.blue(`🔍 Looking up ${options.email}...`));
    
    try {
      const result = await getSubscriber(options.email);
      
      if (result.success) {
        const sub = result.subscriber;
        console.log(chalk.green('\n✅ Subscriber found:\n'));
        console.log(chalk.white(`  Name: ${sub.merge_fields.FNAME} ${sub.merge_fields.LNAME || ''}`));
        console.log(chalk.white(`  Email: ${sub.email_address}`));
        console.log(chalk.white(`  Status: ${sub.status}`));
        console.log(chalk.white(`  Treatment: ${sub.merge_fields.TREATMENT || 'N/A'}`));
        console.log(chalk.white(`  Treatment Date: ${sub.merge_fields.TDATE || 'N/A'}`));
        
        if (sub.tags && sub.tags.length > 0) {
          console.log(chalk.white(`  Tags: ${sub.tags.map(t => t.name).join(', ')}`));
        }
      } else {
        console.log(chalk.yellow(`Subscriber not found: ${result.error}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
    }
  });

program.parse();
