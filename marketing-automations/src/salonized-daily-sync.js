import fs from 'fs';
import path from 'path';
import { listAudienceMembers, syncSalonizedContact, addTagsToSubscriber, setSubscriberTags, sendAftercareCampaign } from './mailchimp-client.js';
import { getEmailTemplate } from './templates/index.js';
import { getNextJourneyEmail, journeyStages } from './automation-manager.js';

const INTERNAL_SUMMARY_KEYWORDS = [
  'pauze',
  'blok',
  'opruimen',
  'afsluiten',
  'aanwezig',
  'vakantie',
  'vrij',
  'lunch',
  'overleg',
  'gesloten',
  'administratie',
  'cocon cosmetics',
  'specialist',
  'ici paris',
];

const FOLLOWUP_KEYWORDS = [
  'perfectiebehandeling',
  'servicebehandeling',
  'extra nabehandeling',
];

/** Treatments that reset the refresh/cycle timeline (must update LASTTRTDT like a new round). */
const RENEW_CYCLE_KEYWORDS = [
  'opfris',
  'op fris',
  'refresh',
  'touch-up',
  'touch up',
];

const MIN_HOURS_AFTER_APPOINTMENT = 3;

function normalizeName(value) {
  return (value || '')
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

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function inferTreatment(summary = '') {
  const text = summary.toLowerCase();
  if (text.includes('laser')) return 'laser';
  if (text.includes('eyeliner')) return 'eyeliner';
  if (text.includes('lip')) return 'lippen';
  if (text.includes('wenkbrauw') || text.includes('brow') || text.includes(' wb ') || text.startsWith('wb ') || text.endsWith(' wb')) return 'wenkbrauwen';
  return '';
}

function isLikelyInternalEvent(summary = '', description = '') {
  const haystack = `${summary} ${description}`.toLowerCase();
  return INTERNAL_SUMMARY_KEYWORDS.some(keyword => haystack.includes(keyword));
}

function isRenewCycleAppointment(summary = '') {
  const text = summary.toLowerCase();
  return RENEW_CYCLE_KEYWORDS.some(keyword => text.includes(keyword));
}

/** Skip-only voor echte vervolg (perfectie/service/nabehandeling), níet voor opfris: die start de cyclus opnieuw. */
function isFollowupAppointment(summary = '') {
  if (isRenewCycleAppointment(summary)) return false;
  const text = summary.toLowerCase();
  return FOLLOWUP_KEYWORDS.some(keyword => text.includes(keyword));
}

function isAppointmentPastThreshold(dtstart, thresholdHours = MIN_HOURS_AFTER_APPOINTMENT) {
  if (!dtstart || dtstart.length < 13) return true;

  const apptHour = parseInt(dtstart.slice(9, 11), 10);
  const apptMinute = parseInt(dtstart.slice(11, 13), 10);
  if (Number.isNaN(apptHour) || Number.isNaN(apptMinute)) return true;

  const nowAmsterdam = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  const [nowHour, nowMinute] = nowAmsterdam.split(':').map(Number);

  const diffMinutes = (nowHour * 60 + nowMinute) - (apptHour * 60 + apptMinute);
  return diffMinutes >= thresholdHours * 60;
}

function parseIcalProperty(line) {
  if (!line || !line.includes(':')) return null;
  const separatorIndex = line.indexOf(':');
  const left = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1);
  const [name] = left.split(';');
  return { name, value };
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
          const prop = parseIcalProperty(eventLine);
          if (!prop) continue;
          event[prop.name] = prop.value;
        }
        events.push(event);
      }
      currentEvent = null;
      continue;
    }

    if (currentEvent) {
      currentEvent.push(line);
    }
  }

  return events;
}

function amsterdamDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

function toIcalDayKey(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return amsterdamDateString(date).replace(/-/g, '');
}

function toIsoDateFromIcalDay(dayKey) {
  if (!/^\d{8}$/.test(dayKey)) return '';
  return `${dayKey.slice(0, 4)}-${dayKey.slice(4, 6)}-${dayKey.slice(6, 8)}`;
}

function ensureReportDirectory(reportFilePath) {
  if (!reportFilePath) return;
  const dir = path.dirname(reportFilePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeReport(reportPath, reportData) {
  if (!reportPath) return;
  ensureReportDirectory(reportPath);
  fs.writeFileSync(reportPath, `${JSON.stringify(reportData, null, 2)}\n`, 'utf8');
}

async function fetchIcalWithTimeout(icalUrl, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'cocon-salonized-sync/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`iCal fetch timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runSalonizedDailySync({
  icalUrl,
  date = '',
  dryRun = false,
  reportPath = '',
  mailchimpPageSize = 200,
  includeUnsubscribed = true,
} = {}) {
  if (!icalUrl) {
    throw new Error('Missing iCal URL. Set SALONIZED_ICAL_URL or pass --ical-url.');
  }

  const dayKey = toIcalDayKey(date);
  if (!dayKey) {
    throw new Error(`Invalid date "${date}". Expected YYYY-MM-DD.`);
  }
  const dayIso = toIsoDateFromIcalDay(dayKey);

  const icalText = await fetchIcalWithTimeout(icalUrl, 20000);
  const events = parseIcalEvents(icalText);

  const rawTodayAppointments = events
    .map(event => {
      const dtstart = event.DTSTART || '';
      const summary = decodeIcalText(event.SUMMARY || '');
      const description = decodeIcalText(event.DESCRIPTION || '');
      const uid = event.UID || '';
      const day = dtstart.slice(0, 8);
      const time = dtstart.slice(9, 15);
      const firstLine = (description.split('\n')[0] || '').trim();
      const treatmentType = inferTreatment(summary);
      const { firstName, lastName } = splitName(firstLine);

      return {
        uid,
        dtstart,
        day,
        time,
        summary,
        description,
        customerRaw: firstLine,
        firstName,
        lastName,
        treatmentType,
      };
    })
    .filter(item => item.day === dayKey)
    .filter(item => !isLikelyInternalEvent(item.summary, item.description))
    .filter(item => item.firstName && item.lastName);

  // Keep only the latest appointment per normalized full name.
  const latestByName = new Map();
  let collapsedDuplicateAppointments = 0;
  for (const appointment of rawTodayAppointments) {
    const key = `${normalizeName(appointment.firstName)}|${normalizeName(appointment.lastName)}`;
    const current = latestByName.get(key);
    if (!current || appointment.dtstart > current.dtstart) {
      if (current) {
        collapsedDuplicateAppointments += 1;
      }
      latestByName.set(key, appointment);
    } else {
      collapsedDuplicateAppointments += 1;
    }
  }
  const todayAppointments = [...latestByName.values()];

  if (todayAppointments.length === 0) {
    const emptyReport = {
      dryRun,
      date: dayIso,
      totals: {
        rawTodayAppointments: 0,
        todayAppointments: 0,
        collapsedDuplicateAppointments: 0,
        updated: 0,
        plannedUpdates: 0,
        skippedNoMatch: 0,
        skippedAmbiguous: 0,
        skippedOlderOrEqual: 0,
        skippedUnknownTreatment: 0,
        skippedFollowup: 0,
        skippedTooRecent: 0,
        aftercareSent: 0,
        aftercareErrors: 0,
        errors: 0,
      },
      details: {
        updated: [],
        plannedUpdates: [],
        skippedNoMatch: [],
        skippedAmbiguous: [],
        skippedOlderOrEqual: [],
        skippedUnknownTreatment: [],
        skippedFollowup: [],
        skippedTooRecent: [],
        aftercareSent: [],
        aftercareErrors: [],
        errors: [],
      },
    };
    writeReport(reportPath, emptyReport);
    return emptyReport;
  }

  const memberResult = await listAudienceMembers({
    count: Math.min(Math.max(Number(mailchimpPageSize) || 200, 50), 500),
    statuses: includeUnsubscribed ? ['subscribed', 'unsubscribed'] : ['subscribed'],
  });
  if (!memberResult.success) {
    throw new Error(`Unable to fetch Mailchimp members: ${memberResult.error}`);
  }

  const membersByName = new Map();
  for (const member of memberResult.members) {
    const firstName = normalizeName(member?.merge_fields?.FNAME || '');
    const lastName = normalizeName(member?.merge_fields?.LNAME || '');
    if (!firstName || !lastName) continue;
    const key = `${firstName}|${lastName}`;
    const list = membersByName.get(key) || [];
    list.push(member);
    membersByName.set(key, list);
  }

  const report = {
    dryRun,
    date: dayIso,
    totals: {
      rawTodayAppointments: rawTodayAppointments.length,
      todayAppointments: todayAppointments.length,
      collapsedDuplicateAppointments,
      updated: 0,
      plannedUpdates: 0,
      skippedNoMatch: 0,
      skippedAmbiguous: 0,
      skippedOlderOrEqual: 0,
      skippedUnknownTreatment: 0,
      skippedFollowup: 0,
      skippedTooRecent: 0,
      aftercareSent: 0,
      aftercareErrors: 0,
      errors: 0,
    },
    details: {
      updated: [],
      plannedUpdates: [],
      skippedNoMatch: [],
      skippedAmbiguous: [],
      skippedOlderOrEqual: [],
      skippedUnknownTreatment: [],
      skippedFollowup: [],
      skippedTooRecent: [],
      aftercareSent: [],
      aftercareErrors: [],
      errors: [],
    },
  };

  const aftercareQueue = { wenkbrauwen: [], eyeliner: [], lippen: [] };

  for (const appointment of todayAppointments) {
    if (isFollowupAppointment(appointment.summary)) {
      report.totals.skippedFollowup += 1;
      report.details.skippedFollowup.push({
        name: `${appointment.firstName} ${appointment.lastName}`.trim(),
        summary: appointment.summary,
        uid: appointment.uid,
      });
      continue;
    }

    if (!isAppointmentPastThreshold(appointment.dtstart)) {
      report.totals.skippedTooRecent += 1;
      report.details.skippedTooRecent.push({
        name: `${appointment.firstName} ${appointment.lastName}`.trim(),
        summary: appointment.summary,
        dtstart: appointment.dtstart,
      });
      continue;
    }

    const key = `${normalizeName(appointment.firstName)}|${normalizeName(appointment.lastName)}`;
    const matchingMembers = membersByName.get(key) || [];

    if (!appointment.treatmentType) {
      report.totals.skippedUnknownTreatment += 1;
      report.details.skippedUnknownTreatment.push({
        name: `${appointment.firstName} ${appointment.lastName}`.trim(),
        summary: appointment.summary,
        uid: appointment.uid,
      });
      continue;
    }

    if (matchingMembers.length === 0) {
      report.totals.skippedNoMatch += 1;
      report.details.skippedNoMatch.push({
        name: `${appointment.firstName} ${appointment.lastName}`.trim(),
        summary: appointment.summary,
        uid: appointment.uid,
      });
      continue;
    }

    if (matchingMembers.length > 1) {
      report.totals.skippedAmbiguous += 1;
      report.details.skippedAmbiguous.push({
        name: `${appointment.firstName} ${appointment.lastName}`.trim(),
        candidates: matchingMembers.map(m => m.email_address),
        uid: appointment.uid,
      });
      continue;
    }

    const member = matchingMembers[0];
    const existingDate = member?.merge_fields?.LASTTRTDT || member?.merge_fields?.TDATE || '';
    if (existingDate && existingDate >= dayIso) {
      report.totals.skippedOlderOrEqual += 1;
      report.details.skippedOlderOrEqual.push({
        email: member.email_address,
        existingDate,
        incomingDate: dayIso,
      });
      continue;
    }

    if (dryRun) {
      report.totals.plannedUpdates += 1;
      report.details.plannedUpdates.push({
        email: member.email_address,
        firstName: appointment.firstName,
        lastName: appointment.lastName,
        treatmentType: appointment.treatmentType,
        date: dayIso,
      });
      continue;
    }

    const updateResult = await syncSalonizedContact({
      email: member.email_address,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      treatmentType: appointment.treatmentType,
      lastTreatmentDate: dayIso,
      sourceSystem: 'salonized',
    });

    if (!updateResult.success) {
      report.totals.errors += 1;
      report.details.errors.push({
        email: member.email_address,
        error: updateResult.error,
      });
      continue;
    }

    report.totals.updated += 1;
    report.details.updated.push({
      email: member.email_address,
      treatmentType: appointment.treatmentType,
      date: dayIso,
    });

    const allJourneyTags = Object.values(journeyStages).map(s => s.tag);
    const existingJourneyTags = allJourneyTags.filter(tag =>
      (member.tags || []).some(t => t.name === tag),
    );
    if (existingJourneyTags.length > 0) {
      await setSubscriberTags(member.email_address, { deactivate: existingJourneyTags });
    }

    if (aftercareQueue[appointment.treatmentType]) {
      aftercareQueue[appointment.treatmentType].push(member.email_address);
    }
  }

  if (!dryRun) {
    for (const [treatmentType, emails] of Object.entries(aftercareQueue)) {
      if (!emails.length) continue;
      const template = getEmailTemplate('aftercare', treatmentType);
      if (!template) continue;

      const result = await sendAftercareCampaign({
        emails,
        subject: template.subject,
        previewText: template.previewText,
        htmlContent: template.getContent({}),
      });

      if (result.success) {
        report.totals.aftercareSent += emails.length;
        report.details.aftercareSent.push({ treatmentType, emails, campaignId: result.campaignId });
        for (const email of emails) {
          await addTagsToSubscriber(email, ['email-aftercare-sent']);
        }
      } else {
        report.totals.aftercareErrors += 1;
        report.details.aftercareErrors.push({ treatmentType, emails, error: result.error });
      }
    }
  }

  writeReport(reportPath, report);
  return report;
}

const MAX_OVERDUE_DAYS = 30;
const VALID_TREATMENTS = ['wenkbrauwen', 'eyeliner', 'lippen'];

/**
 * Process all subscribers and send journey emails that are due.
 * Only processes subscribers who already received aftercare (entry gate).
 * Emails older than MAX_OVERDUE_DAYS are auto-tagged as sent without sending.
 */
export async function runJourneyEmails({ dryRun = false, mailchimpPageSize = 200 } = {}) {
  const memberResult = await listAudienceMembers({
    count: Math.min(Math.max(Number(mailchimpPageSize) || 200, 50), 500),
    statuses: ['subscribed'],
  });

  const report = {
    totals: { checked: 0, sent: 0, skippedOverdue: 0, skippedNoTemplate: 0, errors: 0 },
    details: { sent: [], skipped: [], errors: [] },
  };

  if (!memberResult.success) {
    report.error = memberResult.error;
    return report;
  }

  const sendQueue = {};

  for (const member of memberResult.members) {
    const treatmentDate = member.merge_fields?.LASTTRTDT || '';
    const treatmentType = (member.merge_fields?.TREATMENT || member.merge_fields?.LASTTRT || '').toLowerCase();

    if (!treatmentDate || !VALID_TREATMENTS.includes(treatmentType)) continue;

    const sentTags = (member.tags || []).map(t => t.name);
    if (!sentTags.includes('email-aftercare-sent')) continue;

    report.totals.checked += 1;

    const nextEmail = getNextJourneyEmail(treatmentType, treatmentDate, sentTags);
    if (!nextEmail || !nextEmail.dueDate) continue;

    const overdueDays = Math.floor((new Date() - nextEmail.dueDate) / (1000 * 60 * 60 * 24));
    if (overdueDays > MAX_OVERDUE_DAYS) {
      if (!dryRun) {
        const stageInfo = journeyStages[nextEmail.stage];
        if (stageInfo) {
          await addTagsToSubscriber(member.email_address, [stageInfo.tag]);
        }
      }
      report.totals.skippedOverdue += 1;
      report.details.skipped.push({
        email: member.email_address,
        stage: nextEmail.stage,
        treatmentType,
        overdueDays,
        reason: 'auto-tagged-overdue',
      });
      continue;
    }

    const key = `${nextEmail.stage}-${treatmentType}`;
    if (!sendQueue[key]) {
      sendQueue[key] = { stage: nextEmail.stage, treatmentType, emails: [] };
    }
    sendQueue[key].emails.push(member.email_address);
  }

  for (const [, group] of Object.entries(sendQueue)) {
    const template = getEmailTemplate(group.stage, group.treatmentType);
    if (!template) {
      report.totals.skippedNoTemplate += group.emails.length;
      report.details.skipped.push({
        stage: group.stage,
        treatmentType: group.treatmentType,
        emails: group.emails,
        reason: 'no-template',
      });
      continue;
    }

    if (dryRun) {
      report.totals.sent += group.emails.length;
      report.details.sent.push({
        stage: group.stage,
        treatmentType: group.treatmentType,
        emails: group.emails,
        action: 'dry-run',
      });
      continue;
    }

    const result = await sendAftercareCampaign({
      emails: group.emails,
      subject: template.subject,
      previewText: template.previewText,
      htmlContent: template.getContent({}),
    });

    if (result.success) {
      report.totals.sent += group.emails.length;
      report.details.sent.push({
        stage: group.stage,
        treatmentType: group.treatmentType,
        emails: group.emails,
        campaignId: result.campaignId,
      });
      const stageInfo = journeyStages[group.stage];
      if (stageInfo) {
        for (const email of group.emails) {
          await addTagsToSubscriber(email, [stageInfo.tag]);
        }
      }
    } else {
      report.totals.errors += 1;
      report.details.errors.push({
        stage: group.stage,
        treatmentType: group.treatmentType,
        emails: group.emails,
        error: result.error,
      });
    }
  }

  return report;
}

