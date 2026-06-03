import { NextResponse, type NextRequest } from "next/server";
import { looksLikeJwt, verifyApiJwt } from "@/lib/jwt-auth";
import { isDashboardAuthenticated } from "@/lib/dashboard-auth";

export type AuthVia = "jwt" | "sync" | "cron" | "cookie" | "none";

export type ApiAuthResult =
  | { ok: true; via: AuthVia }
  | { ok: false; via: AuthVia; error: string };

function bearerToken(request: NextRequest): string {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice(7).trim();
}

/**
 * API auth: JWT (preferred), legacy SYNC/CRON bearer, optional dashboard cookie.
 */
export async function authorizeApiRequest(
  request: NextRequest,
  options: { allowCookie?: boolean } = {}
): Promise<ApiAuthResult> {
  const token = bearerToken(request);

  if (token && looksLikeJwt(token)) {
    const jwt = await verifyApiJwt(token);
    if (jwt.valid) return { ok: true, via: "jwt" };
    return { ok: false, via: "none", error: jwt.error };
  }

  if (token) {
    const sync = process.env.SYNC_API_TOKEN ?? "";
    const cron = process.env.CRON_SECRET ?? "";
    if (sync && token === sync) return { ok: true, via: "sync" };
    if (cron && token === cron) return { ok: true, via: "cron" };
  }

  if (options.allowCookie && (await isDashboardAuthenticated())) {
    return { ok: true, via: "cookie" };
  }

  return { ok: false, via: "none", error: "Unauthorized" };
}

export function unauthorizedResponse(auth: ApiAuthResult) {
  return NextResponse.json(
    { ok: false, error: auth.ok ? undefined : auth.error },
    { status: 401 }
  );
}
