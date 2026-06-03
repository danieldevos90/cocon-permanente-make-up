import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { loadCronHistoryEntries } from "../../../src/cron-history-store.js";

export const dynamic = "force-dynamic";

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function GET(request: Request) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ entries: [], configured: false });
  }

  try {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 60), 1), 90);
    const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const entries = await loadCronHistoryEntries(redis, { limit: days });

    return NextResponse.json({ entries, configured: true });
  } catch (error) {
    console.error("[api/cron-history]", error);
    return NextResponse.json(
      {
        entries: [],
        configured: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
