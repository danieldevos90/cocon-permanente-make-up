import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 7), 1), 90);
    const { getRecentEvents } = await import("../../../src/email-delivery-log.js");
    const result = await getRecentEvents({ days });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/email-history]", error);
    return NextResponse.json(
      { configured: false, events: [], error: (error as Error).message },
      { status: 500 },
    );
  }
}
