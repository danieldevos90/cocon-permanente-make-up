import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

type CronRun = {
  date?: string;
  time?: string;
  appointments?: number;
  updated?: number;
  errors?: number;
  elapsed?: string;
};

export async function GET() {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ entries: [], configured: false });
  }

  try {
    const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const keys = await redis.keys("cron:*");
    const entries: Array<{
      date: string;
      syncs: number;
      appointments: number;
      updated: number;
      errors: number;
      elapsed: string;
    }> = [];

    for (const key of keys.sort().reverse().slice(0, 60)) {
      const dateStr = key.replace("cron:", "");
      let runs: CronRun[] = [];

      try {
        const raw = await redis.lrange(key, 0, -1);
        runs = raw
          .map((r) => {
            try {
              return typeof r === "string" ? (JSON.parse(r) as CronRun) : null;
            } catch {
              return null;
            }
          })
          .filter((r): r is CronRun => r != null);
      } catch {
        // Backward compat: oude keys waren SET (object), geen list
        const legacy = await redis.get<CronRun>(key);
        if (legacy && typeof legacy === "object") {
          runs = [legacy];
        }
      }

      if (runs.length === 0) continue;

      const last = runs[runs.length - 1];
      entries.push({
        date: dateStr,
        syncs: runs.length,
        appointments: last?.appointments ?? 0,
        updated: runs.reduce((s, r) => s + (r.updated ?? 0), 0),
        errors: runs.reduce((s, r) => s + (r.errors ?? 0), 0),
        elapsed: last?.elapsed ?? "-",
      });
    }

    entries.sort((a, b) => (b.date > a.date ? 1 : -1));
    return NextResponse.json({ entries, configured: true });
  } catch (error) {
    console.error("[api/cron-history]", error);
    return NextResponse.json(
      {
        entries: [],
        configured: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
