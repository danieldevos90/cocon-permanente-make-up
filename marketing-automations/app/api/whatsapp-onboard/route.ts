import { NextRequest, NextResponse } from "next/server";
import { resolveClientId } from "@/lib/tenants";

export const dynamic = "force-dynamic";

type OnboardBody = {
  token?: string;
  client?: string;
  code?: string | null;
  session?: {
    event?: string;
    data?: {
      business_id?: string;
      waba_id?: string;
      phone_number_id?: string;
    };
  } | null;
};

function gateOk(token?: string): boolean {
  const required = process.env.WHATSAPP_ONBOARD_ACCESS_TOKEN;
  if (!required) return true;
  return token === required;
}

async function exchangeCode(code: string): Promise<{ access_token?: string; error?: string }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const version = process.env.META_WHATSAPP_API_VERSION || "v21.0";

  if (!appId || !appSecret) {
    return { error: "META_APP_ID or META_APP_SECRET not configured" };
  }

  const url = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = (await res.json()) as { access_token?: string; error?: { message?: string } };

  if (!res.ok || data.error) {
    return { error: data.error?.message || `HTTP ${res.status}` };
  }

  return { access_token: data.access_token };
}

/**
 * POST /api/whatsapp-onboard
 * Embedded Signup → tenant record in Redis (multi-tenant).
 */
export async function POST(request: NextRequest) {
  let body: OnboardBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!gateOk(body.token)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const clientId = resolveClientId(body.client);
  let exchanged = false;
  let accessToken: string | undefined;
  let exchangeError: string | undefined;

  if (body.code) {
    const result = await exchangeCode(body.code);
    if (result.access_token) {
      accessToken = result.access_token;
      exchanged = true;
    } else {
      exchangeError = result.error;
    }
  }

  const wabaId = body.session?.data?.waba_id || "";
  const phoneNumberId = body.session?.data?.phone_number_id || "";
  const businessId = body.session?.data?.business_id || "";

  let tenantSaved = false;
  if (wabaId || phoneNumberId || accessToken) {
    const { saveTenant } = await import("whatsapp-automations/src/tenant-store.js");
    const saved = await saveTenant({
      clientId,
      wabaId,
      phoneNumberId,
      accessToken: accessToken || "",
      businessId,
      source: "onboard",
    });
    tenantSaved = saved.saved;
  }

  return NextResponse.json({
    ok: true,
    clientId,
    tenantSaved,
    exchanged,
    exchangeError,
    phoneNumberId: phoneNumberId || undefined,
    wabaId: wabaId || undefined,
    hint: tenantSaved
      ? `Tenant ${clientId} opgeslagen. Dashboard: /t/${clientId}/dashboard`
      : "Geen WABA/phone in session — probeer onboard opnieuw.",
  });
}
