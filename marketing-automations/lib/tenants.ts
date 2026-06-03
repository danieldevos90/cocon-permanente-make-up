/**
 * Multi-tenant helpers for AFA Message Platform (Next.js).
 */

export type TenantSummary = {
  id: string;
  displayName: string;
  displayPhone?: string;
  wabaId?: string;
  phoneNumberId?: string;
  accessTokenConfigured?: boolean;
  onboardUrl?: string;
};

export function onboardUrlForClient(
  clientId: string,
  baseUrl: string,
  gateToken: string
): string {
  const u = new URL(`${baseUrl.replace(/\/$/, "")}/whatsapp/onboard`);
  u.searchParams.set("client", clientId);
  if (gateToken) u.searchParams.set("token", gateToken);
  return u.toString();
}

export async function loadTenantSummaries(): Promise<TenantSummary[]> {
  const { listClientIds, getClientById } = await import(
    "whatsapp-automations/src/client-config.js"
  );
  const { getTenant, listTenantIds, seedTenantFromEnv } = await import(
    "whatsapp-automations/src/tenant-store.js"
  );

  const ids = Array.from(
    new Set([...(await listTenantIds()), ...listClientIds()])
  ).sort();
  const gate = process.env.WHATSAPP_ONBOARD_ACCESS_TOKEN || "";
  const host =
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://marketing-automations-kohl.vercel.app";

  const out: TenantSummary[] = [];
  for (const id of ids) {
    const client = getClientById(id);
    let tenant = await getTenant(id);
    if (!tenant?.phoneNumberId) {
      tenant = (await seedTenantFromEnv(id)) || tenant;
    }
    out.push({
      id,
      displayName: client.displayName || id,
      displayPhone: client.displayPhone,
      wabaId: tenant?.wabaId,
      phoneNumberId: tenant?.phoneNumberId,
      accessTokenConfigured: Boolean(tenant?.accessToken),
      onboardUrl: onboardUrlForClient(id, host, gate),
    });
  }
  return out;
}

export function resolveClientId(
  value: string | null | undefined,
  fallback = process.env.CLIENT_ID || "cocon"
): string {
  const id = (value || fallback).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(id)) return fallback;
  return id;
}
