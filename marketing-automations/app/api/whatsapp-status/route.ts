import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp-status
 *
 * Verzamelt status van de ../whatsapp-automations module voor het dashboard:
 *   - config (dry-run, geconfigureerde providers)
 *   - lokale templates + Meta-status
 *   - recente delivery events uit Redis (laatste 7 dagen)
 *   - geplande sends uit Redis ZSET
 *
 * Faalt gracefully wanneer de WhatsApp-module nog niet geïnstalleerd is.
 */
export async function GET() {
  try {
    const [{ config }, { listAllWhatsAppTemplates }, deliveryLog] = await Promise.all([
      import("whatsapp-automations/src/config.js"),
      import("whatsapp-automations/src/templates/index.js"),
      import("whatsapp-automations/src/delivery-log.js"),
    ]);

    const templates = listAllWhatsAppTemplates();
    const recent = await deliveryLog.getRecentEvents({ days: 7 });
    const inbox = await deliveryLog.getRecentInbox({ days: 7 });

    let scheduled: Array<{ stage: string; treatmentType: string; email: string; due: string }> = [];
    if (config.redis.url && config.redis.token) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({ url: config.redis.url, token: config.redis.token });
        const raw = await redis.zrange<string[]>("wa:schedule", 0, -1, { withScores: true });
        for (let i = 0; i < raw.length; i += 2) {
          const member = raw[i] as unknown as string;
          const score = Number(raw[i + 1]);
          try {
            const parsed = typeof member === "string" ? JSON.parse(member) : member;
            scheduled.push({
              stage: parsed.stage,
              treatmentType: parsed.treatmentType,
              email: parsed.email,
              due: new Date(score * 1000).toISOString(),
            });
          } catch {
            // skip invalid entry
          }
        }
      } catch (error) {
        console.warn("[whatsapp-status] redis read failed", (error as Error).message);
      }
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      installed: true,
      config: {
        dryRun: config.dryRun,
        provider: config.provider,
        apiVersion: config.meta.apiVersion,
        phoneNumberConfigured: Boolean(config.meta.phoneNumberId),
        wabaConfigured: Boolean(config.meta.businessAccountId),
        fallbackToEmail: config.fallbackToEmail,
        redisConfigured: Boolean(config.redis.url),
      },
      templates: templates.map((t) => ({
        name: t.name,
        stage: t.stage,
        treatmentType: t.treatmentType,
        metaStatus: t.metaStatus,
        category: t.category,
        language: t.language,
      })),
      recent: {
        configured: recent.configured,
        events: recent.events.slice(0, 30),
      },
      inbox: {
        configured: inbox.configured,
        messages: inbox.messages.slice(0, 30),
      },
      scheduled,
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      installed: false,
      reason: (error as Error).message,
      generatedAt: new Date().toISOString(),
    });
  }
}
