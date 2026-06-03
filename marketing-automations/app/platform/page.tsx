"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, LogOut, MessageCircle, Plus } from "lucide-react";

type Tenant = {
  id: string;
  displayName: string;
  description?: string;
  isTestTenant?: boolean;
  displayPhone?: string;
  wabaId?: string;
  phoneNumberId?: string;
  accessTokenConfigured?: boolean;
  onboardUrl?: string;
};

export default function PlatformPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformName, setPlatformName] = useState("AFA - Message Platform");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => {
        if (d.platform) setPlatformName(d.platform);
        setTenants(d.tenants || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{platformName}</h1>
            <p className="text-sm text-muted-foreground">
              Kies een tenant — productie (Cocon) of de algemene WhatsApp marketing test (Store / Gym).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Laden…</p>
        ) : (
          <div className="grid gap-4">
            {tenants.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    {t.displayName}
                    {t.isTestTenant && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Marketing test
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Tenant <code className="text-xs">{t.id}</code>
                    {t.displayPhone ? ` · ${t.displayPhone}` : ""}
                    {t.description ? (
                      <span className="mt-1 block text-xs">{t.description}</span>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-sm">
                    {t.phoneNumberId && t.accessTokenConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-600" />
                    )}
                    WhatsApp {t.wabaId ? `WABA ${t.wabaId}` : "niet gekoppeld"}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/t/${t.id}/dashboard`}>Dashboard</Link>
                  </Button>
                  {t.onboardUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={t.onboardUrl} target="_blank" rel="noreferrer">
                        <Plus className="mr-1 h-4 w-4" />
                        Onboard
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nieuwe tenant</CardTitle>
            <CardDescription>
              Voeg <code>config/clients/naam.json</code> toe in whatsapp-automations, deploy, en
              open onboard met <code>?client=naam</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
