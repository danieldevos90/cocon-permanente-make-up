#!/usr/bin/env node
import 'dotenv/config';
import { listAudienceMembers } from '../src/mailchimp-client.js';

const NON_PMU = [
  'lash lift', 'lash-lift', 'lashlift', 'browlamination', 'browlift', 'brow lift',
  'tint', 'shape (wax)', 'only shape', 'hybrid tint', 'gelaat', 'nagel',
];
const RENEW = ['opfris', 'op fris', 'refresh', 'touch-up', 'touch up'];
const FOLLOWUP = ['perfectiebehandeling', 'servicebehandeling', 'extra nabehandeling'];
const INTERNAL = [
  'pauze', 'blok', 'opruimen', 'afsluiten', 'aanwezig', 'vakantie', 'vrij', 'lunch',
  'overleg', 'gesloten', 'administratie', 'cocon cosmetics', 'specialist', 'ici paris',
];

function norm(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function decode(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseIcal(rawText) {
  const lines = rawText.split(/\r?\n/);
  const unfolded = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  const events = [];
  let current = null;
  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') { current = []; continue; }
    if (line === 'END:VEVENT') {
      if (current) {
        const event = {};
        for (const eventLine of current) {
          const sep = eventLine.indexOf(':');
          if (sep < 0) continue;
          event[eventLine.slice(0, sep).split(';')[0]] = eventLine.slice(sep + 1);
        }
        events.push(event);
      }
      current = null;
      continue;
    }
    if (current) current.push(line);
  }
  return events;
}

function isRenew(summary) {
  return RENEW.some(keyword => summary.toLowerCase().includes(keyword));
}

function isFollowup(summary) {
  return !isRenew(summary) && FOLLOWUP.some(keyword => summary.toLowerCase().includes(keyword));
}

function isInternal(summary, description) {
  const haystack = `${summary} ${description}`.toLowerCase();
  return INTERNAL.some(keyword => haystack.includes(keyword));
}

function detectPmu(text) {
  if (text.includes('wenkbrauw') || text.includes(' wb ') || text.startsWith('wb ') || text.endsWith(' wb')) return 'wenkbrauwen';
  if (text.includes('eyeliner')) return 'eyeliner';
  if (text.includes('lippen') || text.includes('lipblush') || text.includes(' lips') || text.endsWith(' lips') || text.includes('lip blush')) return 'lippen';
  return '';
}

function segmentPriority(segment) {
  const text = segment.toLowerCase();
  if (['nieuwe behandeling', 'eerste behandeling'].some(keyword => text.includes(keyword))) return 3;
  if (isRenew(segment)) return 2;
  return 1;
}

function inferNew(summary) {
  const text = summary.toLowerCase();
  if (NON_PMU.some(keyword => text.includes(keyword))) return '';
  const segments = summary.split(',').map(segment => segment.trim()).filter(Boolean);
  const candidates = [];
  for (let index = 0; index < segments.length; index += 1) {
    const type = detectPmu(segments[index].toLowerCase());
    if (!type) continue;
    candidates.push({ type, priority: segmentPriority(segments[index]), order: index });
  }
  if (!candidates.length) return '';
  candidates.sort((a, b) => b.priority - a.priority || a.order - b.order);
  return candidates[0].type;
}

function inferOld(summary) {
  const text = summary.toLowerCase();
  if (text.includes('laser')) return 'laser';
  if (text.includes('eyeliner')) return 'eyeliner';
  if (text.includes('lip')) return 'lippen';
  if (text.includes('wenkbrauw') || text.includes('brow') || text.includes(' wb ') || text.startsWith('wb ') || text.endsWith(' wb')) return 'wenkbrauwen';
  return '';
}

function toIso(dayKey) {
  if (!/^\d{8}$/.test(dayKey)) return '';
  return `${dayKey.slice(0, 4)}-${dayKey.slice(4, 6)}-${dayKey.slice(6, 8)}`;
}

const icalText = await (await fetch(process.env.SALONIZED_ICAL_URL)).text();
const events = parseIcal(icalText);
const membersResult = await listAudienceMembers({ count: 500, statuses: ['subscribed', 'unsubscribed'] });
const members = membersResult.members;

const byName = new Map();
for (const member of members) {
  const firstName = norm(member.merge_fields?.FNAME || '');
  const lastName = norm(member.merge_fields?.LNAME || '');
  if (!firstName || !lastName) continue;
  const key = `${firstName}|${lastName}`;
  const list = byName.get(key) || [];
  list.push(member);
  byName.set(key, list);
}

const ambiguousNames = [...byName.entries()].filter(([, list]) => list.length > 1);
console.log(`\n=== Dubbele namen in Mailchimp (${ambiguousNames.length}) ===\n`);

for (const [key, list] of ambiguousNames.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${list[0].merge_fields.FNAME} ${list[0].merge_fields.LNAME}`);
  for (const member of list) {
    const merge = member.merge_fields || {};
    const tags = (member.tags || []).map(tag => tag.name).filter(name => name.startsWith('email-') || name.startsWith('TAG:'));
    console.log(`  - ${member.email_address}`);
    console.log(`    LASTTRT=${merge.LASTTRT || '-'} | LASTTRTDT=${merge.LASTTRTDT || merge.TDATE || '-'} | LASTEMAILD=${merge.LASTEMAILD || '-'}`);
    if (tags.length) console.log(`    tags: ${tags.join(', ')}`);
  }
  console.log('');
}

console.log('=== Misclassified afspraken bij dubbele namen ===\n');
for (const event of events) {
  const summary = decode(event.SUMMARY || '');
  const description = decode(event.DESCRIPTION || '');
  if (isInternal(summary, description) || isFollowup(summary)) continue;

  const oldType = inferOld(summary);
  const newType = inferNew(summary);
  const wronglySentPmu = ['wenkbrauwen', 'eyeliner', 'lippen'].includes(oldType) && !newType;
  const wronglyUpdatedLaser = oldType === 'laser' && !newType;
  if (!wronglySentPmu && !wronglyUpdatedLaser) continue;

  const firstLine = (description.split('\n')[0] || '').trim();
  const parts = firstLine.split(/\s+/).filter(Boolean);
  if (parts.length < 2) continue;
  const nameKey = `${norm(parts[0])}|${norm(parts.slice(1).join(' '))}`;
  const matches = byName.get(nameKey) || [];
  if (matches.length < 2) continue;

  console.log(`${toIso((event.DTSTART || '').slice(0, 8))} | ${firstLine}`);
  console.log(`  Afspraak: ${summary}`);
  console.log(`  Issue: ${wronglySentPmu ? 'verkeerde PMU-mail' : 'laser journey reset'}`);
  for (const member of matches) {
    const merge = member.merge_fields || {};
    const dateMatch = [merge.LASTTRTDT, merge.TDATE, merge.LASTEMAILD].includes(toIso((event.DTSTART || '').slice(0, 8)));
    console.log(`  → ${member.email_address}${dateMatch ? '  ← datum matcht' : ''}`);
    console.log(`     LASTTRT=${merge.LASTTRT || '-'} LASTTRTDT=${merge.LASTTRTDT || '-'} LASTEMAILD=${merge.LASTEMAILD || '-'}`);
  }
  console.log('');
}
