import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { loadTenantSummaries } from "@/lib/tenants";

export const dynamic = "force-dynamic";

/**
 * GET /api/tenants — list platform tenants (dashboard auth).
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request, { allowCookie: true });
  if (!auth.ok) return unauthorizedResponse(auth);
  try {
    const tenants = await loadTenantSummaries();
    return NextResponse.json({
      ok: true,
      platform: process.env.NEXT_PUBLIC_PLATFORM_NAME || "AFA - Message Platform",
      tenants,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
