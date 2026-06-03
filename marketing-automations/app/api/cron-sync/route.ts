import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";

export const maxDuration = 300;
import { runSalonizedDailySync, runJourneyEmails } from "../../../src/salonized-daily-sync.js";
import { listCampaignsSentSince } from "../../../src/mailchimp-client.js";
import { Redis } from "@upstash/redis";
import { appendCronRun } from "../../../src/cron-history-store.js";

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

type CronRun = {
  date: string;
  time: string;
  appointments: number;
  updated: number;
  errors: number;
  aftercareSent: number;
  aftercareErrors: number;
  journeySent: number;
  journeyErrors: number;
  elapsed: string;
};

async function writeCronToRedis(
  date: string,
  totals: {
    todayAppointments?: number;
    rawTodayAppointments?: number;
    updated?: number;
    errors?: number;
    aftercareSent?: number;
    aftercareErrors?: number;
  },
  journeyTotals: { sent?: number; errors?: number } | null,
  elapsed: string
) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const run: CronRun = {
      date,
      time: new Date().toISOString(),
      appointments: totals.todayAppointments ?? totals.rawTodayAppointments ?? 0,
      updated: totals.updated ?? 0,
      errors: totals.errors ?? 0,
      aftercareSent: totals.aftercareSent ?? 0,
      aftercareErrors: totals.aftercareErrors ?? 0,
      journeySent: journeyTotals?.sent ?? 0,
      journeyErrors: journeyTotals?.errors ?? 0,
      elapsed: `${elapsed}s`,
    };
    await appendCronRun(redis, date, run);
  } catch (err) {
    console.error("[cron-sync] Redis write failed:", (err as Error).message);
  }
}

export async function GET(request: NextRequest) {
  return handleCronSync(request);
}

export async function POST(request: NextRequest) {
  return handleCronSync(request);
}

async function handleCronSync(request: NextRequest) {
  const start = Date.now();
  const log = (msg: string) => console.log(`[cron-sync] ${msg}`);

  try {
    const auth = await authorizeApiRequest(request);
    if (!auth.ok) {
      log(`Unauthorized (${auth.error})`);
      return unauthorizedResponse(auth);
    }
    log(`Authorized via ${auth.via}`);

    const icalUrl = process.env.SALONIZED_ICAL_URL ?? "";
    if (!icalUrl) {
      log("Missing SALONIZED_ICAL_URL");
      return NextResponse.json(
        { ok: false, error: "Missing SALONIZED_ICAL_URL" },
        { status: 500 }
      );
    }

    const report = await runSalonizedDailySync({
      icalUrl,
      date: "",
      dryRun: false,
      mailchimpPageSize: 200,
      includeUnsubscribed: true,
      reportPath: "/tmp/salonized-daily-sync-report.json",
    });

    const t = report.totals;
    const dayIso = report.date ?? new Date().toISOString().slice(0, 10);
    const skipped = (t.skippedOlderOrEqual || 0) + (t.skippedNoMatch || 0) + (t.skippedAmbiguous || 0) + (t.skippedFollowup || 0) + (t.skippedTooRecent || 0);
    log(
      `Sync done — appointments: ${t.todayAppointments}, updated: ${t.updated}, aftercare: ${t.aftercareSent || 0}, aftercareErrors: ${t.aftercareErrors || 0}, skipped: ${skipped}, errors: ${t.errors}`
    );
    if (report.details?.aftercareErrors?.length) {
      for (const err of report.details.aftercareErrors) {
        log(`Aftercare send failed (${err.treatmentType}): ${err.error}`);
      }
    }

    const journeyReport = await runJourneyEmails({ dryRun: false, mailchimpPageSize: 200 });
    const j = journeyReport.totals;
    log(`Journey done — checked: ${j.checked}, sent: ${j.sent}, skippedOverdue: ${j.skippedOverdue}, errors: ${j.errors}`);

    let whatsappReport: { checked?: number; sent?: number; skipped?: number; failed?: number } | null = null;
    try {
      const waMod = await import("whatsapp-automations/src/salonized-hook.js");
      whatsappReport = await waMod.runScheduledSends();
      log(
        `WhatsApp scheduled done — checked: ${whatsappReport?.checked ?? 0}, ` +
        `sent: ${whatsappReport?.sent ?? 0}, skipped: ${whatsappReport?.skipped ?? 0}, ` +
        `failed: ${whatsappReport?.failed ?? 0}`,
      );
    } catch (error) {
      log(`WhatsApp scheduled skipped (module not available): ${(error as Error).message}`);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    await writeCronToRedis(dayIso, t, j, elapsed);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const campaignsResult = await listCampaignsSentSince(since24h);
    if (campaignsResult.success && campaignsResult.campaigns?.length) {
      const lines = campaignsResult.campaigns.map(
        (c: { settings?: { subject_line?: string; title?: string }; emails_sent?: number; send_time?: string }) =>
          `  - ${c.settings?.subject_line ?? c.settings?.title ?? "?"} | ${c.emails_sent ?? 0} verzonden | ${c.send_time ?? "-"}`
      );
      log(`Mailchimp emails (laatste 24u): ${campaignsResult.campaigns.length}`);
      lines.forEach((line: string) => log(line));
    } else if (!campaignsResult.success) {
      log(`Mailchimp campaigns check failed: ${campaignsResult.error}`);
    }

    return NextResponse.json({ ok: true, elapsed: `${elapsed}s`, report, journeyReport, whatsappReport });
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log(`FAILED after ${elapsed}s — ${(error as Error).message}`);
    console.error(error);
    if (REDIS_URL && REDIS_TOKEN) {
      const dayIso = new Date().toISOString().slice(0, 10);
      await writeCronToRedis(
        dayIso,
        { todayAppointments: 0, updated: 0, errors: 1 },
        null,
        elapsed
      );
    }
    return NextResponse.json(
      { ok: false, elapsed: `${elapsed}s`, error: (error as Error).message },
      { status: 500 }
    );
  }
}
