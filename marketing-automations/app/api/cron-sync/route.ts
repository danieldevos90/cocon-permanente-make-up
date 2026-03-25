import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
import { runSalonizedDailySync } from "../../../src/salonized-daily-sync.js";
import { listCampaignsSentSince } from "../../../src/mailchimp-client.js";
import { Redis } from "@upstash/redis";

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
  elapsed: string;
};

async function writeCronToRedis(
  date: string,
  totals: { todayAppointments?: number; rawTodayAppointments?: number; updated?: number; errors?: number },
  elapsed: string
) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  try {
    const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const key = `cron:${date}`;
    const run: CronRun = {
      date,
      time: new Date().toISOString(),
      appointments: totals.todayAppointments ?? totals.rawTodayAppointments ?? 0,
      updated: totals.updated ?? 0,
      errors: totals.errors ?? 0,
      elapsed: `${elapsed}s`,
    };
    await redis.rpush(key, JSON.stringify(run));
    await redis.expire(key, 60 * 60 * 24 * 90); // 90 dagen bewaren
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
    const cronSecret = process.env.CRON_SECRET ?? "";
    const authHeader = request.headers.get("authorization") ?? "";
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      log("Unauthorized — check CRON_SECRET env var");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const t = report.totals;
    const dayIso = report.date ?? new Date().toISOString().slice(0, 10);
    await writeCronToRedis(dayIso, t, elapsed);
    const skipped = (t.skippedOlderOrEqual || 0) + (t.skippedNoMatch || 0) + (t.skippedAmbiguous || 0) + (t.skippedFollowup || 0) + (t.skippedTooRecent || 0);
    const summary = `[cron-sync] Done in ${elapsed}s — appointments: ${t.todayAppointments}, updated: ${t.updated}, aftercare: ${t.aftercareSent || 0}, skipped: ${skipped} (followup: ${t.skippedFollowup || 0}, tooRecent: ${t.skippedTooRecent || 0}), errors: ${t.errors}`;
    console.log(summary);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const campaignsResult = await listCampaignsSentSince(since24h);
    if (campaignsResult.success && campaignsResult.campaigns?.length) {
      const lines = campaignsResult.campaigns.map(
        (c: { settings?: { subject_line?: string; title?: string }; emails_sent?: number; send_time?: string }) =>
          `  - ${c.settings?.subject_line ?? c.settings?.title ?? "?"} | ${c.emails_sent ?? 0} verzonden | ${c.send_time ?? "-"}`
      );
      console.log(`[cron-sync] Mailchimp emails (laatste 24u): ${campaignsResult.campaigns.length}`);
      lines.forEach((line: string) => log(line));
    } else if (!campaignsResult.success) {
      log(`Mailchimp campaigns check failed: ${campaignsResult.error}`);
    }

    return NextResponse.json({ ok: true, elapsed: `${elapsed}s`, report });
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log(`FAILED after ${elapsed}s — ${(error as Error).message}`);
    console.error(error);
    if (REDIS_URL && REDIS_TOKEN) {
      const dayIso = new Date().toISOString().slice(0, 10);
      await writeCronToRedis(
        dayIso,
        { todayAppointments: 0, updated: 0, errors: 1 },
        elapsed
      );
    }
    return NextResponse.json(
      { ok: false, elapsed: `${elapsed}s`, error: (error as Error).message },
      { status: 500 }
    );
  }
}
