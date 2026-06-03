import { NextRequest, NextResponse } from "next/server";
import { runSalonizedDailySync } from "../../../src/salonized-daily-sync.js";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return unauthorizedResponse(auth);

  const icalUrl = process.env.SALONIZED_ICAL_URL ?? "";
  if (!icalUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing SALONIZED_ICAL_URL environment variable" },
      { status: 500 }
    );
  }

  let body: { dryRun?: boolean; date?: string; mailchimpPageSize?: number; includeUnsubscribed?: boolean } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    // empty body ok
  }

  const dryRun = Boolean(body.dryRun);
  const date = body.date ?? "";
  const mailchimpPageSize = Number(body.mailchimpPageSize ?? 200);
  const includeUnsubscribed = Boolean(body.includeUnsubscribed);

  try {
    const report = await runSalonizedDailySync({
      icalUrl,
      date,
      dryRun,
      mailchimpPageSize,
      includeUnsubscribed,
      reportPath: "/tmp/salonized-daily-sync-report.json",
    });
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message ?? "Sync failed" },
      { status: 500 }
    );
  }
}
