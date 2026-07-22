#!/usr/bin/env node
/**
 * Archive inactive duplicate Mailchimp contacts (same first+last name).
 * Keeps the most recently updated profile; archives empty duplicates only.
 *
 * Usage:
 *   node scripts/cleanup-mailchimp-duplicates.mjs           # dry run
 *   node scripts/cleanup-mailchimp-duplicates.mjs --apply   # archive stale duplicates
 */
import 'dotenv/config';
import { listAudienceMembers, archiveListMember } from '../src/mailchimp-client.js';
import { pickMostRecentMember, memberRecencyScore } from '../src/salonized-daily-sync.js';
import { validateConfig } from '../src/config.js';

const JOURNEY_TAG_PREFIXES = ['email-', 'behandeling-'];

function normalizeName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasJourneyOrTreatmentTags(member) {
  return (member.tags || []).some(tag => {
    const name = tag.name || '';
    return JOURNEY_TAG_PREFIXES.some(prefix => name.startsWith(prefix));
  });
}

function hasMeaningfulMergeData(member) {
  const merge = member.merge_fields || {};
  return Boolean(
    merge.LASTTRT ||
    merge.TREATMENT ||
    merge.TDATE ||
    merge.LASTTRTDT ||
    merge.LASTEMAIL ||
    merge.LASTEMAILD,
  );
}

function isSafeToArchive(member) {
  return !hasMeaningfulMergeData(member) && !hasJourneyOrTreatmentTags(member);
}

function buildNameIndex(members) {
  const index = new Map();
  for (const member of members) {
    const firstName = normalizeName(member?.merge_fields?.FNAME || '');
    const lastName = normalizeName(member?.merge_fields?.LNAME || '');
    if (!firstName || !lastName) continue;
    const key = `${firstName}|${lastName}`;
    const list = index.get(key) || [];
    list.push(member);
    index.set(key, list);
  }
  return index;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('Config invalid:', validation.errors.join('; '));
    process.exit(1);
  }

  console.log(`\n=== Mailchimp duplicate cleanup (${apply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  const membersResult = await listAudienceMembers({ count: 1000, statuses: ['subscribed', 'unsubscribed'] });
  if (!membersResult.success) {
    console.error('Unable to load members:', membersResult.error);
    process.exit(1);
  }

  const members = membersResult.members;
  const byName = buildNameIndex(members);
  const duplicateGroups = [...byName.entries()].filter(([, list]) => list.length > 1);

  console.log(`Loaded ${members.length} members`);
  console.log(`Duplicate name groups: ${duplicateGroups.length}\n`);

  const toArchive = [];
  const manualReview = [];

  for (const [nameKey, group] of duplicateGroups) {
    const keeper = pickMostRecentMember(group);
    const staleMembers = group.filter(member => member.email_address !== keeper.email_address);

    for (const member of staleMembers) {
      if (isSafeToArchive(member)) {
        toArchive.push({
          name: `${member.merge_fields?.FNAME || ''} ${member.merge_fields?.LNAME || ''}`.trim(),
          email: member.email_address,
          keeper: keeper.email_address,
          score: memberRecencyScore(member),
          keeperScore: memberRecencyScore(keeper),
        });
      } else {
        manualReview.push({
          name: `${member.merge_fields?.FNAME || ''} ${member.merge_fields?.LNAME || ''}`.trim(),
          email: member.email_address,
          keeper: keeper.email_address,
          reason: 'both profiles have treatment or journey data',
        });
      }
    }
  }

  console.log(`Safe to archive (inactive duplicate): ${toArchive.length}`);
  console.log(`Manual review needed: ${manualReview.length}\n`);

  for (const item of toArchive.slice(0, 50)) {
    console.log(`${apply ? '🗑️  ARCHIVE' : '🔍 WOULD ARCHIVE'} ${item.email}`);
    console.log(`   keeper: ${item.keeper} (score ${item.keeperScore})`);
  }
  if (toArchive.length > 50) {
    console.log(`... and ${toArchive.length - 50} more`);
  }

  if (manualReview.length) {
    console.log('\n--- Manual review (not auto-archived) ---');
    for (const item of manualReview.slice(0, 15)) {
      console.log(`⚠️  ${item.email} — keeper ${item.keeper} — ${item.reason}`);
    }
    if (manualReview.length > 15) {
      console.log(`... and ${manualReview.length - 15} more`);
    }
  }

  if (!apply) {
    if (toArchive.length) {
      console.log('\nRun with --apply to archive inactive duplicates.\n');
    }
    return;
  }

  let archived = 0;
  let failed = 0;
  for (const item of toArchive) {
    const result = await archiveListMember(item.email);
    if (result.success) {
      archived += 1;
    } else {
      failed += 1;
      console.log(`❌ Failed to archive ${item.email}: ${result.error}`);
    }
  }

  console.log(`\nArchived: ${archived}, failed: ${failed}\n`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
