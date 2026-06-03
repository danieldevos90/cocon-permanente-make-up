import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, unauthorizedResponse } from "@/lib/api-auth";
import { resolveClientId } from "@/lib/tenants";

export const dynamic = "force-dynamic";

/** GET /api/v1/whatsapp/connection?client=cocon — Meta credentials (JWT). */
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return unauthorizedResponse(auth);

  const clientId = resolveClientId(
    request.nextUrl.searchParams.get("client") ||
      request.headers.get("x-afa-client")
  );

  try {
    const { buildConfigForClient } = await import(
      "whatsapp-automations/src/build-config.js"
    );
    const { testConnection } = await import(
      "whatsapp-automations/src/whatsapp-client.js"
    );
    const config = await buildConfigForClient(clientId);
    const result = await testConnection({ config });

    return NextResponse.json({
      ok: result.success,
      authVia: auth.via,
      clientId,
      dryRun: config.dryRun,
      phoneNumberId: config.meta.phoneNumberId,
      wabaId: config.meta.businessAccountId,
      displayName: config.client.displayName,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
