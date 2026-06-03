import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { resolveClientId } from "@/lib/tenants";

export const dynamic = "force-dynamic";

type TestSendBody = {
  client?: string;
  stage?: string;
  treatmentType?: string;
  phone?: string;
  firstName?: string;
  email?: string;
};

/**
 * POST /api/whatsapp-test-send
 * Dashboard test send for App Review / QA (requires dashboard login when password set).
 */
export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request, { allowCookie: true });
  if (!auth.ok) return unauthorizedResponse(auth);

  let body: TestSendBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const stage = body.stage || "aftercare";
  const treatmentType = body.treatmentType || "wenkbrauwen";
  const phone = (body.phone || "").replace(/\D/g, "");
  const firstName = body.firstName || "Test";
  const email = body.email || "platform-test@local";

  if (!phone) {
    return NextResponse.json({ ok: false, error: "phone is required (E.164 without +)" }, { status: 400 });
  }

  const clientId = resolveClientId(body.client);

  try {
    const { sendWhatsAppForStage } = await import(
      "whatsapp-automations/src/automation-manager.js"
    );
    const { buildConfigForClient } = await import(
      "whatsapp-automations/src/build-config.js"
    );
    const config = await buildConfigForClient(clientId);

    const result = await sendWhatsAppForStage({
      clientId,
      stage,
      treatmentType,
      firstName,
      email,
      phone,
      skipOptInCheck: true,
      skipDedupe: true,
    }) as {
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
      clientId,
      dryRun: config.dryRun,
      messageId: result.messageId,
      templateName: result.templateName,
      phone: result.phone,
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
