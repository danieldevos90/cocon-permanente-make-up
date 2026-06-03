import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { resolveClientId } from "@/lib/tenants";

export const dynamic = "force-dynamic";

type MessageBody = {
  client?: string;
  phone?: string;
  stage?: string;
  treatmentType?: string;
  firstName?: string;
  email?: string;
  skipOptInCheck?: boolean;
};

/**
 * POST /api/v1/whatsapp/messages
 * Send (or dry-run) a template message. Requires JWT or legacy bearer.
 */
export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return unauthorizedResponse(auth);

  let body: MessageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = resolveClientId(
    body.client || request.headers.get("x-afa-client")
  );

  const rawPhone = body.phone ?? "";
  const phone = rawPhone.replace(/\D/g, "");
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "phone required (06… or 316…)" },
      { status: 400 }
    );
  }

  // NL 06… → 316…
  const normalized =
    phone.startsWith("0") && phone.length >= 10
      ? `31${phone.slice(1)}`
      : phone;

  try {
    const { sendWhatsAppForStage } = await import(
      "whatsapp-automations/src/automation-manager.js"
    );
    const { buildConfigForClient } = await import(
      "whatsapp-automations/src/build-config.js"
    );
    const { prettyPhone } = await import("whatsapp-automations/src/phone.js");

    const config = await buildConfigForClient(clientId);

    const result = (await sendWhatsAppForStage({
      clientId,
      stage: body.stage || "aftercare",
      treatmentType: body.treatmentType || "wenkbrauwen",
      firstName: body.firstName || "Test",
      email: body.email || "api-test@local",
      phone: normalized,
      skipOptInCheck: body.skipOptInCheck !== false,
      skipDedupe: true,
    })) as {
      ok: boolean;
      dryRun?: boolean;
      messageId?: string;
      templateName?: string;
      phone?: string;
      preview?: string;
      reason?: string;
    };

    return NextResponse.json({
      ok: result.ok,
      authVia: auth.via,
      clientId,
      dryRun: config.dryRun,
      phone: result.phone || normalized,
      phonePretty: prettyPhone(normalized),
      messageId: result.messageId,
      templateName: result.templateName,
      preview: result.preview,
      reason: result.reason,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
