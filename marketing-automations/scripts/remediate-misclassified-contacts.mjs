#!/usr/bin/env node
/**
 * Find and reset Mailchimp contacts who received PMU automation
 * after a non-PMU Salonized appointment (lash lift, brow tint, etc.).
 *
 * Usage:
 *   node scripts/remediate-misclassified-contacts.mjs           # dry run
 *   node scripts/remediate-misclassified-contacts.mjs --apply   # apply fixes
 */
import 'dotenv/config';
import { pickMostRecentMember } from '../src/salonized-daily-sync.js';
import { journeyStages } from '../src/automation-manager.js';
import { config, validateConfig } from '../src/config.js';
import { listAudienceMembers, getSubscriber, setSubscriberTags, initMailchimp } from '../src/mailchimp-client.js';

const NON_PMU_SERVICE_KEYWORDS = [
  'lash lift', 'lash-lift', 'lashlift',
  'browlamination', 'browlift', 'brow lift',
  'tint', 'shape (wax)', 'only shape', 'hybrid tint',
  'gelaat', 'nagel',
];
const NEW_TREATMENT_KEYWORDS = ['nieuwe behandeling', 'eerste behandeling'];
const RENEW_CYCLE_KEYWORDS = ['opfris', 'op fris', 'refresh', 'touch-up', 'touch up'];
const INTERNAL_SUMMARY_KEYWORDS = [
  'pauze', 'blok', 'opruimen', 'afsluiten', 'aanwezig', 'vakantie', 'vrij',
  'lunch', 'overleg', 'gesloten', 'administratie', 'cocon cosmetics', 'specialist', 'ici paris',
];
const FOLLOWUP_KEYWORDS = ['perfectiebehandeling', 'servicebehandeling', 'extra nabehandeling'];
const JOURNEY_TAGS = Object.values(journeyStages).map(stage => stage.tag);
const PMU_TYPES = new Set(['wenkbrauwen', 'eyeliner', 'lippen']);
const TREATMENT_TAGS = {
  wenkbrauwen: 'TAG: Wenkbrauwen',
  eyeliner: 'TAG: Eyeliner',
  lippen: 'TAG: PMU Lippen',
  laser: 'TAG: Laser',
};

function normalizeName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeIcalText(value = '') {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseIcalEvents(rawText) {
  const lines = rawText.split(/\r?\n/);
  const unfolded = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1);
      continue;
    }
    unfolded.push(line);
  }

  const events = [];
  let currentEvent = null;
  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = [];
      continue;
    }
    if (line === 'END:VEVENT') {
      if (currentEvent) {
        const event = {};
        for (const eventLine of currentEvent) {
          const separatorIndex = eventLine.indexOf(':');
          if (separatorIndex < 0) continue;
          const name = eventLine.slice(0, separatorIndex).split(';')[0];
          event[name] = eventLine.slice(separatorIndex + 1);
        }
        events.push(event);
      }
      currentEvent = null;
      continue;
    }
    if (currentEvent) currentEvent.push(line);
  }
  return events;
}

function isRenewCycleAppointment(summary = '') {
  const text = summary.toLowerCase();
  return RENEW_CYCLE_KEYWORDS.some(keyword => text.includes(keyword));
}

function isFollowupAppointment(summary = '') {
  if (isRenewCycleAppointment(summary)) return false;
  const text = summary.toLowerCase();
  return FOLLOWUP_KEYWORDS.some(keyword => text.includes(keyword));
}

function isLikelyInternalEvent(summary = '', description = '') {
  const haystack = `${summary} ${description}`.toLowerCase();
  return INTERNAL_SUMMARY_KEYWORDS.some(keyword => haystack.includes(keyword));
}

function detectPmuTypeInText(text) {
  if (
    text.includes('wenkbrauw') ||
    text.includes(' wb ') ||
    text.startsWith('wb ') ||
    text.endsWith(' wb')
  ) {
    return 'wenkbrauwen';
  }
  if (text.includes('eyeliner')) return 'eyeliner';
  if (
    text.includes('lippen') ||
    text.includes('lipblush') ||
    text.includes(' lips') ||
    text.endsWith(' lips') ||
    text.includes('lip blush')
  ) {
    return 'lippen';
  }
  return '';
}

function segmentPriority(segment) {
  const text = segment.toLowerCase();
  if (NEW_TREATMENT_KEYWORDS.some(keyword => text.includes(keyword))) return 3;
  if (isRenewCycleAppointment(segment)) return 2;
  return 1;
}

function inferTreatmentNew(summary = '') {
  const text = summary.toLowerCase();
  if (NON_PMU_SERVICE_KEYWORDS.some(keyword => text.includes(keyword))) return '';

  const segments = summary.split(',').map(segment => segment.trim()).filter(Boolean);
  const candidates = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const type = detectPmuTypeInText(segment.toLowerCase());
    if (!type) continue;
    candidates.push({ type, priority: segmentPriority(segment), order: index });
  }
  if (!candidates.length) return '';
  candidates.sort((a, b) => b.priority - a.priority || a.order - b.order);
  return candidates[0].type;
}

function inferTreatmentOld(summary = '') {
  const text = summary.toLowerCase();
  if (text.includes('laser')) return 'laser';
  if (text.includes('eyeliner')) return 'eyeliner';
  if (text.includes('lip')) return 'lippen';
  if (
    text.includes('wenkbrauw') ||
    text.includes('brow') ||
    text.includes(' wb ') ||
    text.startsWith('wb ') ||
    text.endsWith(' wb')
  ) {
    return 'wenkbrauwen';
  }
  return '';
}

function toIsoDateFromIcalDay(dayKey) {
  if (!/^\d{8}$/.test(dayKey)) return '';
  return `${dayKey.slice(0, 4)}-${dayKey.slice(4, 6)}-${dayKey.slice(6, 8)}`;
}

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function fetchIcal(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'cocon-remediation/1.0' } });
  if (!response.ok) throw new Error(`iCal fetch failed: HTTP ${response.status}`);
  return response.text();
}

function buildMemberIndex(members) {
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

function hasActiveTag(member, tagName) {
  return (member.tags || []).some(tag => tag.name === tagName);
}

async function resetSubscriber(email, { wrongType, appointmentDate, summary, apply }) {
  const subResult = await getSubscriber(email);
  if (!subResult.success) {
    return { email, status: 'skipped', reason: `subscriber not found: ${subResult.error}` };
  }

  const member = subResult.subscriber;
  const merge = member.merge_fields || {};
  const lastTrtDt = merge.LASTTRTDT || merge.TDATE || '';
  const lastEmailDt = merge.LASTEMAILD || '';
  const hasAftercareTag = hasActiveTag(member, 'email-aftercare-sent');

  const dateMatches = lastTrtDt === appointmentDate || lastEmailDt === appointmentDate;
  if (!dateMatches) {
    return {
      email,
      status: 'skipped',
      reason: `date mismatch (LASTTRTDT=${lastTrtDt || '-'}, LASTEMAILD=${lastEmailDt || '-'})`,
    };
  }

  if (!hasAftercareTag && !PMU_TYPES.has(merge.LASTTRT) && merge.LASTTRT !== 'laser') {
    return { email, status: 'skipped', reason: 'no aftercare tag / not recently updated by automation' };
  }

  const deactivateTags = [
    ...JOURNEY_TAGS,
    TREATMENT_TAGS[wrongType],
    `behandeling-${wrongType}`,
  ].filter(Boolean);

  const action = {
    email,
    name: `${merge.FNAME || ''} ${merge.LNAME || ''}`.trim(),
    appointmentDate,
    summary,
    wrongType,
    currentLastTrt: merge.LASTTRT || '',
    currentTreatment: merge.TREATMENT || '',
    deactivateTags,
    clearFields: ['LASTTRT', 'TREATMENT', 'TDATE', 'LASTTRTDT', 'LASTEMAIL', 'LASTEMAILD', 'REFRSHDUE'],
  };

  if (!apply) {
    return { ...action, status: 'would-reset' };
  }

  const tagResult = await setSubscriberTags(email, { deactivate: deactivateTags });
  if (!tagResult.success) {
    return { ...action, status: 'error', reason: tagResult.error };
  }

  const client = initMailchimp();
  const listId = config.mailchimp.listId;
  const subscriberHash = (await import('../src/mailchimp-client.js')).getSubscriberHash(email);
  const clearedFields = { ...merge };
  for (const field of action.clearFields) clearedFields[field] = '';

  await client.lists.setListMember(listId, subscriberHash, {
    email_address: email,
    status_if_new: member.status || 'subscribed',
    merge_fields: clearedFields,
  });

  return { ...action, status: 'reset' };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('Config invalid:', validation.errors.join('; '));
    process.exit(1);
  }

  const icalUrl = process.env.SALONIZED_ICAL_URL;
  if (!icalUrl) {
    console.error('Missing SALONIZED_ICAL_URL');
    process.exit(1);
  }

  console.log(`\n=== Remediate misclassified PMU contacts (${apply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  const icalText = await fetchIcal(icalUrl);
  const events = parseIcalEvents(icalText);

  const misclassifiedAppointments = [];
  for (const event of events) {
    const summary = decodeIcalText(event.SUMMARY || '');
    const description = decodeIcalText(event.DESCRIPTION || '');
    const dtstart = event.DTSTART || '';
    const day = dtstart.slice(0, 8);
    if (!day) continue;
    if (isLikelyInternalEvent(summary, description)) continue;
    if (isFollowupAppointment(summary)) continue;

    const oldType = inferTreatmentOld(summary);
    const newType = inferTreatmentNew(summary);
    const wronglySentPmuEmail = PMU_TYPES.has(oldType) && !newType;
    const wronglyUpdatedByLaser = oldType === 'laser' && !newType;

    if (!wronglySentPmuEmail && !wronglyUpdatedByLaser) continue;

    const firstLine = (description.split('\n')[0] || '').trim();
    const { firstName, lastName } = splitName(firstLine);
    if (!firstName || !lastName) continue;

    misclassifiedAppointments.push({
      uid: event.UID || '',
      summary,
      appointmentDate: toIsoDateFromIcalDay(day),
      firstName,
      lastName,
      oldType,
      newType,
      issue: wronglySentPmuEmail ? 'pmu-email-on-non-pmu' : 'laser-journey-reset',
    });
  }

  console.log(`Misclassified appointments in iCal: ${misclassifiedAppointments.length}`);

  const membersResult = await listAudienceMembers({ count: 500, statuses: ['subscribed', 'unsubscribed'] });
  if (!membersResult.success) {
    console.error('Unable to load Mailchimp members:', membersResult.error);
    process.exit(1);
  }

  const membersByName = buildMemberIndex(membersResult.members);
  const candidates = [];

  for (const appointment of misclassifiedAppointments) {
    const key = `${normalizeName(appointment.firstName)}|${normalizeName(appointment.lastName)}`;
    const matches = membersByName.get(key) || [];
    if (!matches.length) continue;

    const chosen = pickMostRecentMember(matches);
    if (matches.length > 1) {
      console.log(`ℹ️  Ambiguous name resolved: ${appointment.firstName} ${appointment.lastName} → ${chosen.email_address}`);
    }

    candidates.push({
      ...appointment,
      email: chosen.email_address,
      member: chosen,
    });
  }

  const uniqueByEmailDate = new Map();
  for (const candidate of candidates) {
    const dedupeKey = `${candidate.email}|${candidate.appointmentDate}`;
    if (!uniqueByEmailDate.has(dedupeKey)) uniqueByEmailDate.set(dedupeKey, candidate);
  }

  const results = [];
  for (const candidate of uniqueByEmailDate.values()) {
    const result = await resetSubscriber(candidate.email, {
      wrongType: candidate.oldType,
      appointmentDate: candidate.appointmentDate,
      summary: candidate.summary,
      apply,
    });
    results.push(result);
  }

  const reset = results.filter(r => r.status === 'reset' || r.status === 'would-reset');
  const skipped = results.filter(r => r.status === 'skipped');
  const errors = results.filter(r => r.status === 'error');

  console.log(`\nCandidates matched in Mailchimp: ${uniqueByEmailDate.size}`);
  console.log(`${apply ? 'Reset' : 'Would reset'}: ${reset.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}\n`);

  for (const item of reset) {
    console.log(`${apply ? '✅ RESET' : '🔍 WOULD RESET'} ${item.email}`);
    console.log(`   ${item.name} | ${item.appointmentDate} | was: ${item.wrongType}`);
    console.log(`   ${item.summary}`);
  }

  for (const item of skipped) {
    console.log(`⏭️  SKIP ${item.email} — ${item.reason}`);
  }

  for (const item of errors) {
    console.log(`❌ ERROR ${item.email} — ${item.reason}`);
  }

  if (!apply && reset.length > 0) {
    console.log('\nRun with --apply to execute resets.\n');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
