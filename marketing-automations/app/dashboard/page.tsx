"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, LogOut, MessageCircle, Send } from "lucide-react";
import { dashboardTitle, metaAppId, clientId } from "@/lib/platform";

type Overview = {
  generatedAt: string;
  mailchimp: { healthy: boolean; message?: string };
  latestSync: { totals?: { updated: number; errors: number } } | null;
  recentEmailsLast7Days: Array<{
    subject?: string;
    title?: string;
    sendTime?: string;
    emailsSent?: number;
    type?: string;
  }>;
};

type CronEntry = {
  date: string;
  syncs: number;
  appointments: number;
  updated: number;
  errors: number;
  aftercareSent?: number;
  aftercareErrors?: number;
  journeySent?: number;
  journeyErrors?: number;
  elapsed: string;
};

type WhatsAppStatus = {
  ok: boolean;
  installed: boolean;
  reason?: string;
  platform?: { name?: string; appId?: string };
  client?: { id?: string; displayName?: string; displayPhone?: string; wabaId?: string };
  config?: {
    dryRun: boolean;
    provider: string;
    apiVersion: string;
    appId?: string;
    embeddedSignupConfigured?: boolean;
    accessTokenConfigured?: boolean;
    phoneNumberConfigured: boolean;
    wabaConfigured: boolean;
    fallbackToEmail: boolean;
    redisConfigured: boolean;
  };
  templates?: Array<{
    name: string;
    stage: string;
    treatmentType: string;
    metaStatus: string;
    category: string;
    language: string;
  }>;
  recent?: {
    configured: boolean;
    events: Array<{
      timestamp: string;
      to?: string;
      templateName?: string;
      stage?: string;
      treatmentType?: string;
      email?: string;
      success: boolean;
      dryRun?: boolean;
      error?: string;
    }>;
  };
  inbox?: {
    configured: boolean;
    messages: Array<{
      timestamp: string;
      from?: string;
      profileName?: string | null;
      type?: string;
      text?: string;
      waMessageId?: string;
      signatureVerified?: boolean;
    }>;
  };
  scheduled?: Array<{
    stage: string;
    treatmentType: string;
    email: string;
    due: string;
  }>;
  integrations?: { mailchimp?: boolean; salonized?: boolean };
};

type EmailHistoryEvent = {
  timestamp: string;
  email?: string;
  emails?: string[];
  stage?: string;
  treatmentType?: string;
  subject?: string;
  success: boolean;
  error?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const routeClient = useMemo(
    () => pathname.match(/^\/t\/([^/]+)\/dashboard/)?.[1],
    [pathname]
  );
  const activeClient = routeClient || clientId;
  const [showMailchimp, setShowMailchimp] = useState(activeClient === "cocon");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [cronHistory, setCronHistory] = useState<{ entries: CronEntry[]; configured: boolean } | null>(null);
  const [emailHistory, setEmailHistory] = useState<{ events: EmailHistoryEvent[]; configured: boolean } | null>(null);
  const [whatsapp, setWhatsApp] = useState<WhatsAppStatus | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testFirstName, setTestFirstName] = useState("Test");
  const [testStage, setTestStage] = useState("aftercare");
  const [testTreatment, setTestTreatment] = useState("wenkbrauwen");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const waRes = await fetch(
          `/api/whatsapp-status?client=${encodeURIComponent(activeClient)}`
        );
        let mailchimpEnabled = activeClient === "cocon";
        if (waRes.ok) {
          const wa = (await waRes.json()) as WhatsAppStatus;
          setWhatsApp(wa);
          mailchimpEnabled = wa.integrations?.mailchimp ?? activeClient === "cocon";
        }
        setShowMailchimp(mailchimpEnabled);

        const fetches: Promise<void>[] = [];
        if (mailchimpEnabled) {
          fetches.push(
            fetch("/api/overview").then(async (overviewRes) => {
              if (overviewRes.ok) setOverview(await overviewRes.json());
            }),
            fetch("/api/cron-history").then(async (cronRes) => {
              if (cronRes.ok) setCronHistory(await cronRes.json());
            }),
            fetch("/api/email-history").then(async (emailRes) => {
              if (emailRes.ok) setEmailHistory(await emailRes.json());
            })
          );
        } else {
          setOverview(null);
          setCronHistory(null);
          setEmailHistory(null);
        }
        await Promise.all(fetches);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeClient]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault();
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp-test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: activeClient,
          stage: testStage,
          treatmentType: testTreatment,
          phone: testPhone,
          firstName: testFirstName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const mode = data.dryRun ? "DRY RUN" : "LIVE";
        setTestResult(`${mode}: ${data.templateName} → ${data.phone}${data.messageId ? ` (${data.messageId})` : ""}`);
        const waRes = await fetch(
          `/api/whatsapp-status?client=${encodeURIComponent(activeClient)}`
        );
        if (waRes.ok) setWhatsApp(await waRes.json());
      } else {
        setTestResult(data.reason || data.error || "Send failed");
      }
    } catch {
      setTestResult("Network error");
    } finally {
      setTestSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {whatsapp?.client?.displayName || activeClient}
            </h1>
            <Button variant="link" size="sm" className="px-0" asChild>
              <Link href="/platform">Alle tenants</Link>
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {!showMailchimp && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">E-mail (Mailchimp)</CardTitle>
              <CardDescription>
                Voor tenant <code>{activeClient}</code> is alleen WhatsApp geconfigureerd.
                Mailchimp + Salonized-sync draaien op <Link href="/t/cocon/dashboard" className="underline">Cocon</Link>.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {showMailchimp && (
        <>
        {/* Mailchimp health */}
        <Card>
          <CardHeader>
            <CardTitle>Mailchimp status</CardTitle>
            <CardDescription>
              {overview?.generatedAt
                ? `Laatst bijgewerkt: ${new Date(overview.generatedAt).toLocaleString("nl-NL")}`
                : "Geen data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.mailchimp ? (
              <div className="flex items-center gap-2">
                {overview.mailchimp.healthy ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className={overview.mailchimp.healthy ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                  {overview.mailchimp.healthy ? "OK" : "FAIL"}
                </span>
                <span className="text-muted-foreground">
                  {overview.mailchimp.message || "-"}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Geen health data beschikbaar</p>
            )}
            {overview?.latestSync?.totals && (
              <p className="mt-2 text-sm text-muted-foreground">
                Laatste sync: updated {overview.latestSync.totals.updated}, errors{" "}
                {overview.latestSync.totals.errors}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cron history */}
        <Card>
          <CardHeader>
            <CardTitle>Cron trigger status</CardTitle>
            <CardDescription>
              Dagelijkse sync runs — {cronHistory?.configured ? "data uit Redis" : "Redis niet geconfigureerd"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cronHistory?.entries && cronHistory.entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-center">Syncs</TableHead>
                    <TableHead className="text-center">Appointments</TableHead>
                    <TableHead className="text-center">Updated</TableHead>
                    <TableHead className="text-center">Nazorg</TableHead>
                    <TableHead className="text-center">Journey</TableHead>
                    <TableHead className="text-center">Errors</TableHead>
                    <TableHead>Elapsed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronHistory.entries.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell className="text-center">{row.syncs ?? 1}</TableCell>
                      <TableCell className="text-center">{row.appointments}</TableCell>
                      <TableCell className="text-center">{row.updated}</TableCell>
                      <TableCell className="text-center">{row.aftercareSent ?? 0}</TableCell>
                      <TableCell className="text-center">{row.journeySent ?? 0}</TableCell>
                      <TableCell className="text-center">{row.errors}</TableCell>
                      <TableCell>{row.elapsed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">
                {cronHistory?.configured
                  ? "Geen cron runs gevonden in Redis."
                  : "Configureer UPSTASH_REDIS_REST_URL en UPSTASH_REDIS_REST_TOKEN voor cron history."}
              </p>
            )}
          </CardContent>
        </Card>
        </>
        )}

        {/* WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp automation
            </CardTitle>
            <CardDescription>
              {whatsapp?.installed
                ? whatsapp.config?.dryRun
                  ? "Module geïnstalleerd — DRY RUN (geen live verzending)"
                  : "Module geïnstalleerd — LIVE"
                : `Niet geïnstalleerd${whatsapp?.reason ? ` (${whatsapp.reason})` : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm">
              Client:{" "}
              <span className="font-medium">
                {whatsapp?.client?.displayName || clientId}
              </span>
              {whatsapp?.client?.displayPhone ? (
                <> · {whatsapp.client.displayPhone}</>
              ) : null}
              {" · "}
              <a
                href={`/whatsapp/onboard?client=${encodeURIComponent(activeClient)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                WhatsApp onboarding
              </a>
              {" · "}
              Meta app <span className="font-mono text-xs">{metaAppId}</span>
            </p>
            {whatsapp?.installed && whatsapp.config && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Mode:</span>{" "}
                  <span className={whatsapp.config.dryRun ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
                    {whatsapp.config.dryRun ? "DRY RUN" : "LIVE"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{" "}
                  <span className="font-medium">{whatsapp.config.provider}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">API:</span>{" "}
                  <span className="font-medium">{whatsapp.config.apiVersion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Embedded Signup:</span>{" "}
                  <span
                    className={
                      whatsapp.config.embeddedSignupConfigured
                        ? "text-green-600"
                        : "text-yellow-600 font-medium"
                    }
                  >
                    {whatsapp.config.embeddedSignupConfigured ? "ok" : "config ID ontbreekt"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Access token:</span>{" "}
                  <span
                    className={
                      whatsapp.config.accessTokenConfigured
                        ? "text-green-600"
                        : "text-yellow-600 font-medium"
                    }
                  >
                    {whatsapp.config.accessTokenConfigured ? "ok" : "nieuw token nodig"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <span className={whatsapp.config.phoneNumberConfigured ? "text-green-600" : "text-muted-foreground"}>
                    {whatsapp.config.phoneNumberConfigured ? "configured" : "not set"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">WABA:</span>{" "}
                  <span className={whatsapp.config.wabaConfigured ? "text-green-600" : "text-muted-foreground"}>
                    {whatsapp.config.wabaConfigured ? "configured" : "not set"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fallback email:</span>{" "}
                  <span className="font-medium">{whatsapp.config.fallbackToEmail ? "aan" : "uit"}</span>
                </div>
              </div>
            )}

            {whatsapp?.installed && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Test send (App Review / QA)
                </h3>
                <form onSubmit={handleTestSend} className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="text-xs text-muted-foreground">Phone (E.164, no +)</label>
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="31612345678"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">First name</label>
                    <Input
                      value={testFirstName}
                      onChange={(e) => setTestFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Stage</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={testStage}
                      onChange={(e) => setTestStage(e.target.value)}
                    >
                      <option value="aftercare">aftercare</option>
                      <option value="browsRefresh">browsRefresh</option>
                      <option value="lipsRefresh">lipsRefresh</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Treatment</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={testTreatment}
                      onChange={(e) => setTestTreatment(e.target.value)}
                    >
                      <option value="wenkbrauwen">wenkbrauwen</option>
                      <option value="eyeliner">eyeliner</option>
                      <option value="lippen">lippen</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={testSending}>
                      {testSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send test"
                      )}
                    </Button>
                  </div>
                </form>
                {testResult && (
                  <p className="text-sm text-muted-foreground font-mono">{testResult}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Skips opt-in and dedupe. In DRY RUN mode logs only; set WHATSAPP_DRY_RUN=false for live App Review video.
                </p>
              </div>
            )}

            {whatsapp?.templates && whatsapp.templates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Templates</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Meta status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsapp.templates.map((t) => (
                      <TableRow key={t.name}>
                        <TableCell className="font-mono text-xs">{t.name}</TableCell>
                        <TableCell>{t.stage}</TableCell>
                        <TableCell>{t.treatmentType}</TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell>
                          <span
                            className={
                              t.metaStatus === "approved"
                                ? "text-green-600 font-medium"
                                : t.metaStatus === "pending"
                                  ? "text-yellow-600 font-medium"
                                  : "text-destructive font-medium"
                            }
                          >
                            {t.metaStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {whatsapp?.scheduled && whatsapp.scheduled.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Geplande sends ({whatsapp.scheduled.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsapp.scheduled.slice(0, 20).map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.stage}</TableCell>
                        <TableCell>{s.treatmentType}</TableCell>
                        <TableCell className="font-mono text-xs">{s.email}</TableCell>
                        <TableCell>{new Date(s.due).toLocaleString("nl-NL")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {whatsapp?.inbox && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Recente klant-replies (observer mode)
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Incoming messages are logged only — the business replies from their phone (coexistence).
                </p>
                {whatsapp.inbox.messages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tijd</TableHead>
                        <TableHead>Van</TableHead>
                        <TableHead>Naam</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Bericht</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whatsapp.inbox.messages.slice(0, 15).map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{new Date(m.timestamp).toLocaleString("nl-NL")}</TableCell>
                          <TableCell className="font-mono text-xs">{m.from || "-"}</TableCell>
                          <TableCell>{m.profileName || "-"}</TableCell>
                          <TableCell className="text-xs">{m.type || "-"}</TableCell>
                          <TableCell className="text-sm max-w-md truncate" title={m.text || ""}>{m.text || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {whatsapp.inbox.configured
                      ? "Geen inkomende berichten in laatste 7 dagen"
                      : "Redis niet geconfigureerd — geen historie"}
                  </p>
                )}
              </div>
            )}

            {whatsapp?.recent && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Recente events (laatste 7 dagen)
                </h3>
                {whatsapp.recent.events.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tijd</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whatsapp.recent.events.slice(0, 15).map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{new Date(e.timestamp).toLocaleString("nl-NL")}</TableCell>
                          <TableCell className="font-mono text-xs">{e.templateName || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{e.to || e.email || "-"}</TableCell>
                          <TableCell>
                            {e.success ? (
                              <span className="text-green-600 font-medium">
                                {e.dryRun ? "DRY" : "OK"}
                              </span>
                            ) : (
                              <span className="text-destructive font-medium" title={e.error}>
                                FAIL
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {whatsapp.recent.configured
                      ? "Geen events in laatste 7 dagen"
                      : "Redis niet geconfigureerd — geen historie"}
                  </p>
                )}
              </div>
            )}

            {!whatsapp?.installed && (
              <p className="text-muted-foreground text-sm">
                Installeer de WhatsApp-module: <code className="font-mono">cd whatsapp-automations && npm install</code>.
                Zie <code className="font-mono">whatsapp-automations/README.md</code> voor de Meta setup.
              </p>
            )}
          </CardContent>
        </Card>

        {showMailchimp && (
        <>
        {/* Automation email log (Redis) */}
        <Card>
          <CardHeader>
            <CardTitle>Automation email log</CardTitle>
            <CardDescription>
              Wie wanneer gemaild — laatste 7 dagen uit Redis + LASTEMAIL in Mailchimp
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailHistory?.events && emailHistory.events.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Behandeling</TableHead>
                    <TableHead>Onderwerp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailHistory.events.slice(0, 25).map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString("nl-NL")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.email || (e.emails || []).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="text-xs">{e.stage || "-"}</TableCell>
                      <TableCell className="text-xs">{e.treatmentType || "-"}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={e.subject || ""}>
                        {e.subject || "-"}
                      </TableCell>
                      <TableCell>
                        {e.success ? (
                          <span className="text-green-600 font-medium">OK</span>
                        ) : (
                          <span className="text-destructive font-medium" title={e.error}>
                            FAIL
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">
                {emailHistory?.configured
                  ? "Geen automation sends gelogd in laatste 7 dagen"
                  : "Configureer UPSTASH_REDIS_REST_URL en UPSTASH_REDIS_REST_TOKEN"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent emails */}
        <Card>
          <CardHeader>
            <CardTitle>Recent verzonden emails</CardTitle>
            <CardDescription>
              Laatste 7 dagen — journey/automation templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.recentEmailsLast7Days && overview.recentEmailsLast7Days.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Verzonden</TableHead>
                    <TableHead>Aantal</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentEmailsLast7Days.slice(0, 15).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.subject || c.title || "-"}</TableCell>
                      <TableCell>{c.sendTime ? new Date(c.sendTime).toLocaleString("nl-NL") : "-"}</TableCell>
                      <TableCell>{c.emailsSent ?? "-"}</TableCell>
                      <TableCell>{c.type || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Geen emails in de laatste 7 dagen</p>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </main>
    </div>
  );
}
