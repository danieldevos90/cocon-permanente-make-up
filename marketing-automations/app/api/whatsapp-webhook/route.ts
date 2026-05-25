import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Meta WhatsApp webhook endpoint.
 *
 * GET  /api/whatsapp-webhook
 *   Handshake verificatie (Meta App Dashboard → Webhooks subscribe).
 *
 * POST /api/whatsapp-webhook
 *   Events: inkomende klant-berichten + delivery statuses.
 *   Werkt in OBSERVER MODE — alleen loggen, geen auto-replies.
 *
 * Coexistence: in deze modus krijgt zowel de Business app op de telefoon
 * als deze webhook hetzelfde bericht. Daniela antwoordt vanaf de telefoon;
 * deze webhook is alleen audit/dashboard.
 *
 * Setup in Meta App Dashboard:
 *   1. Meta for Developers → App → WhatsApp → Configuration
 *   2. Webhook URL: https://<vercel-url>/api/whatsapp-webhook
 *   3. Verify token: gebruik dezelfde waarde als META_WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *   4. Subscribe op velden: messages
 */

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  try {
    const { verifyWebhook } = await import("whatsapp-automations/src/whatsapp-client.js");
    const result = verifyWebhook({ mode, token, challenge });
    if (result.ok && challenge) {
      return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    console.warn("[wa-webhook] Handshake mismatch — check META_WHATSAPP_WEBHOOK_VERIFY_TOKEN");
    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[wa-webhook GET] module load failed:", (error as Error).message);
    return new NextResponse("Not configured", { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to read body" }, { status: 400 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    console.warn("[wa-webhook] Invalid JSON payload");
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const [{ verifyMetaSignature, parseInboundWebhook }, { logInbound, logStatus }] = await Promise.all([
      import("whatsapp-automations/src/webhook-parser.js"),
      import("whatsapp-automations/src/delivery-log.js"),
    ]);

    const signature = request.headers.get("x-hub-signature-256") || "";
    const signatureOk = verifyMetaSignature(rawBody, signature);
    if (!signatureOk) {
      // Meta verstuurt vanaf hun servers — als signature niet matcht is dit
      // verdacht. We accepteren toch (status 200) zodat Meta niet retries
      // gaat doen, maar loggen het wel als suspicious.
      console.warn("[wa-webhook] Signature mismatch — request afkomst onbekend");
    }

    const { messages, statuses } = parseInboundWebhook(payload);

    for (const msg of messages) {
      await logInbound({
        ...msg,
        signatureVerified: signatureOk,
      });
    }
    for (const st of statuses) {
      await logStatus(st);
    }

    return NextResponse.json({
      ok: true,
      received: { messages: messages.length, statuses: statuses.length },
    });
  } catch (error) {
    console.error("[wa-webhook POST]", (error as Error).message);
    // Altijd 200 terug naar Meta zodat ze geen retries triggeren —
    // we hebben de payload al; fout zit aan onze kant.
    return NextResponse.json({ ok: false, error: (error as Error).message });
  }
}
