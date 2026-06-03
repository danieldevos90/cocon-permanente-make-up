import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toHtml(overview: Record<string, unknown>) {
  const mailchimp = overview.mailchimp as { healthy?: boolean; message?: string };
  const latestSync = overview.latestSync as { totals?: { updated?: number; errors?: number; skippedNoMatch?: number } } | null;
  const syncTotals = latestSync?.totals || null;
  const lastSyncLine = syncTotals
    ? `updated ${syncTotals.updated}, errors ${syncTotals.errors}, no-match ${syncTotals.skippedNoMatch ?? 0}`
    : "geen sync report beschikbaar";

  const templates = overview.templates as { total?: number; items?: Array<{ name?: string; updatedAt?: string; active?: boolean }> };
  const templateRows = (templates?.items ?? [])
    .slice(0, 20)
    .map(
      (item) =>
        `<tr><td>${item.name ?? ""}</td><td>${item.updatedAt ?? "-"}</td><td>${item.active ? "yes" : "no"}</td></tr>`
    )
    .join("");

  const campaigns = overview.campaigns as { sent?: Array<{ subject?: string; title?: string; sendTime?: string; emailsSent?: number; status?: string }> };
  const campaignRows = (campaigns?.sent ?? [])
    .slice(0, 20)
    .map(
      (c) =>
        `<tr><td>${c.subject ?? c.title ?? "-"}</td><td>${c.sendTime ?? "-"}</td><td>${c.emailsSent ?? ""}</td><td>${c.status ?? ""}</td></tr>`
    )
    .join("");

  const recentEmails = (overview.recentEmailsLast7Days ?? []) as Array<{ subject?: string; title?: string; sendTime?: string; emailsSent?: number; type?: string }>;
  const recentEmailRows = recentEmails
    .slice(0, 15)
    .map(
      (c) =>
        `<tr><td>${c.subject ?? c.title ?? "-"}</td><td>${c.sendTime ?? "-"}</td><td>${c.emailsSent ?? ""}</td><td>${c.type ?? "-"}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${process.env.NEXT_PUBLIC_PLATFORM_NAME || "Marketing Automations"} Sync Health</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    h1, h2 { margin: 0 0 12px 0; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; border-bottom: 1px solid #eee; padding: 8px; font-size: 14px; }
    .ok { color: #0a7a20; font-weight: 700; }
    .bad { color: #b00020; font-weight: 700; }
    .muted { color: #555; }
  </style>
</head>
<body>
  <h1>Marketing Automations Health</h1>
  <p class="muted">Generated: ${overview.generatedAt ?? ""}</p>

  <div class="card">
    <h2>Health</h2>
    <p>Mailchimp: <span class="${mailchimp?.healthy ? "ok" : "bad"}">${mailchimp?.healthy ? "OK" : "FAIL"}</span> (${mailchimp?.message ?? "-"})</p>
    <p>Laatste sync: ${lastSyncLine}</p>
  </div>

  <div class="card">
    <h2>Templates (${templates?.total ?? 0})</h2>
    <table>
      <thead><tr><th>Naam</th><th>Updated</th><th>Active</th></tr></thead>
      <tbody>${templateRows || "<tr><td colspan=\"3\">Geen templates</td></tr>"}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Sent Campaigns (${campaigns?.sent?.length ?? 0})</h2>
    <table>
      <thead><tr><th>Subject</th><th>Sent</th><th>Emails</th><th>Status</th></tr></thead>
      <tbody>${campaignRows || "<tr><td colspan=\"4\">Geen campagnes</td></tr>"}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Emails verzonden (laatste 7 dagen) — ${recentEmails.length}</h2>
    <p class="muted">Journey/automation templates die recent zijn uitgegaan</p>
    <table>
      <thead><tr><th>Subject</th><th>Verzonden</th><th>Aantal</th><th>Type</th></tr></thead>
      <tbody>${recentEmailRows || "<tr><td colspan=\"4\">Geen emails in laatste 7 dagen</td></tr>"}</tbody>
    </table>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  try {
    const { buildHealthOverview } = await import("../../../src/health-overview.js");
    const overview = await buildHealthOverview();
    const wantsHtml =
      request.nextUrl.searchParams.get("format") === "html" ||
      (request.headers.get("accept") ?? "").includes("text/html");

    if (wantsHtml) {
      return new NextResponse(toHtml(overview as Record<string, unknown>), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return NextResponse.json(overview);
  } catch (error) {
    console.error("[api/overview]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
