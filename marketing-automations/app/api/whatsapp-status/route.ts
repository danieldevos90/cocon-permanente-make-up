import { NextRequest, NextResponse } from "next/server";
import { resolveClientId } from "@/lib/tenants";
import { tenantIntegrations } from "@/lib/client-integrations.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp-status?client=cocon
 */
export async function GET(request: NextRequest) {
  const clientId = resolveClientId(request.nextUrl.searchParams.get("client"));

  try {
    const { buildConfigForClient } = await import(
      "whatsapp-automations/src/build-config.js"
    );
    const { listAllWhatsAppTemplates } = await import(
      "whatsapp-automations/src/templates/index.js"
    );
    const { getClientById } = await import(
      "whatsapp-automations/src/client-config.js"
    );
    const deliveryLog = await import("whatsapp-automations/src/delivery-log.js");

    const config = await buildConfigForClient(clientId);
    const clientMeta = getClientById(clientId);
    const templates = listAllWhatsAppTemplates({
      clientId,
      profile: config.automationProfile,
    });
    const stages = Array.from(new Set(templates.map((t) => t.stage)));
    const logOpts = { days: 7, clientId };
    const recent = await deliveryLog.getRecentEvents(
      logOpts as { days?: number }
    );
    const inbox = await deliveryLog.getRecentInbox(
      logOpts as { days?: number }
    );

    let scheduled: Array<{
      stage: string;
      treatmentType: string;
      email: string;
      due: string;
    }> = [];

    if (config.redis.url && config.redis.token) {
      try {
        const { Redis } = await import("@upstash/redis");
        const redis = new Redis({ url: config.redis.url, token: config.redis.token });
        const scheduleKey = `wa:${clientId}:schedule`;
        const raw = await redis.zrange<string[]>(scheduleKey, 0, -1, { withScores: true });
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
            // skip
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
      clientId,
      integrations: tenantIntegrations(clientId),
      platform: {
        name: config.platform?.name,
        appId: config.meta.appId,
        businessPortfolioId: config.platform?.businessPortfolioId,
        businessPortfolioName: config.platform?.businessPortfolioName,
      },
      client: {
        id: config.client?.id,
        displayName: config.client?.displayName,
        description: clientMeta.description || "",
        displayPhone: config.sender?.displayPhone,
        wabaId: config.meta.businessAccountId,
        phoneNumberId: config.meta.phoneNumberId,
      },
      automation: {
        profile: config.automationProfile || "pmu",
        stages,
        segments: config.treatmentTypes || [],
        segmentLabel:
          config.automationProfile === "marketing" ? "segment" : "treatment",
      },
      config: {
        dryRun: config.dryRun,
        provider: config.provider,
        apiVersion: config.meta.apiVersion,
        appId: config.meta.appId || "",
        embeddedSignupConfigured: Boolean(config.meta.embeddedSignupConfigId),
        accessTokenConfigured: Boolean(config.meta.accessToken),
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
      clientId,
      integrations: tenantIntegrations(clientId),
      reason: (error as Error).message,
      generatedAt: new Date().toISOString(),
    });
  }
}
