"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, LogOut } from "lucide-react";

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
  elapsed: string;
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cronHistory, setCronHistory] = useState<{ entries: CronEntry[]; configured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, cronRes] = await Promise.all([
          fetch("/api/overview"),
          fetch("/api/cron-history"),
        ]);
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data);
        }
        if (cronRes.ok) {
          const data = await cronRes.json();
          setCronHistory(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
          <h1 className="text-xl font-semibold">Cocon Marketing Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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
      </main>
    </div>
  );
}
