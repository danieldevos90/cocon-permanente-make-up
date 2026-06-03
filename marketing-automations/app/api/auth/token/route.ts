import { NextRequest, NextResponse } from "next/server";
import { signApiJwt } from "@/lib/jwt-auth";

export const dynamic = "force-dynamic";

type TokenBody = {
  password?: string;
  clientId?: string;
  clientSecret?: string;
  expiresIn?: string;
};

/**
 * POST /api/auth/token
 * Exchange dashboard password or API client credentials for a JWT.
 *
 * Password grant: { "password": "..." }
 * Client grant:   { "clientId": "api", "clientSecret": "<SYNC_API_TOKEN>" }
 */
export async function POST(request: NextRequest) {
  let body: TokenBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const dashboardPassword = process.env.DASHBOARD_PASSWORD ?? "";
  const syncToken = process.env.SYNC_API_TOKEN ?? "";
  const apiClientId = process.env.API_CLIENT_ID ?? "api";
  const apiClientSecret = process.env.API_CLIENT_SECRET ?? syncToken;

  let subject = "api-user";

  if (body.password) {
    if (!dashboardPassword) {
      return NextResponse.json(
        { ok: false, error: "Dashboard password not configured" },
        { status: 500 }
      );
    }
    if (body.password !== dashboardPassword) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    subject = "dashboard";
  } else if (body.clientSecret) {
    if (body.clientId && body.clientId !== apiClientId) {
      return NextResponse.json({ ok: false, error: "Invalid clientId" }, { status: 401 });
    }
    if (!apiClientSecret || body.clientSecret !== apiClientSecret) {
      return NextResponse.json({ ok: false, error: "Invalid clientSecret" }, { status: 401 });
    }
    subject = "machine";
  } else {
    return NextResponse.json(
      { ok: false, error: "Provide password or clientSecret" },
      { status: 400 }
    );
  }

  try {
    const expiresIn = body.expiresIn || "24h";
    const accessToken = await signApiJwt(subject, expiresIn);
    return NextResponse.json({
      ok: true,
      tokenType: "Bearer",
      accessToken,
      expiresIn,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
