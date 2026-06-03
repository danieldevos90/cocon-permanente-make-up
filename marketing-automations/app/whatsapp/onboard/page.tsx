"use client";

import Script from "next/script";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react";

declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, string | boolean>) => void;
      login: (
        callback: (response: {
          status?: string;
          authResponse?: { code?: string };
        }) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type OnboardPhase = "idle" | "loading-sdk" | "ready" | "in-flow" | "success" | "error";

type SessionPayload = {
  event?: string;
  data?: {
    business_id?: string;
    waba_id?: string;
    phone_number_id?: string;
    current_step?: string;
    error_message?: string;
  };
};

function WhatsAppOnboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const clientSlug =
    searchParams.get("client") ||
    process.env.NEXT_PUBLIC_CLIENT_ID ||
    "cocon";

  const platformName =
    process.env.NEXT_PUBLIC_PLATFORM_NAME || "AFA Message Platform";
  const clientName =
    process.env.NEXT_PUBLIC_CLIENT_NAME || "Client";
  const clientPhone =
    process.env.NEXT_PUBLIC_CLIENT_DISPLAY_PHONE || "";
  const onboardContact =
    process.env.NEXT_PUBLIC_CLIENT_ONBOARD_CONTACT || "the business admin";

  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const configId = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ?? "";

  const [phase, setPhase] = useState<OnboardPhase>("idle");
  const [sdkReady, setSdkReady] = useState(false);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);

  const configOk = Boolean(appId && configId);
  const gateOk = useMemo(() => {
    const required = process.env.NEXT_PUBLIC_WHATSAPP_ONBOARD_GATE;
    if (!required) return true;
    return token === required;
  }, [token]);

  const persistResult = useCallback(
    async (payload: {
      session: SessionPayload | null;
      code: string | null;
    }) => {
      try {
        const res = await fetch("/api/whatsapp-onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            session: payload.session,
            code: payload.code,
            client: clientSlug,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || "Opslaan mislukt — kopieer IDs handmatig uit de console.");
          return;
        }
        if (data.exchanged) {
          setMessage("Onboarding voltooid. Business token opgeslagen in Redis (dev only).");
        } else if (data.stored) {
          setMessage("Onboarding-gegevens opgeslagen. Wissel de code binnen 30s om indien nodig.");
        }
      } catch {
        setMessage("Netwerkfout bij opslaan — noteer WABA ID en Phone Number ID handmatig.");
      }
    },
    [token, clientSlug]
  );

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!event.origin?.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(String(event.data));
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;

        if (
          data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" ||
          (data.event === "FINISH" && data.data?.phone_number_id)
        ) {
          setSession(data);
          setPhase("success");
          setMessage(
            "Coexistence onboarding completed. The business can keep using the WhatsApp Business app on their phone."
          );
        } else if (data.event === "ERROR") {
          setPhase("error");
          setMessage(data.data?.error_message || "Embedded Signup fout");
        } else if (data.event === "CANCEL") {
          setPhase("ready");
          setMessage("Geannuleerd. Je kunt opnieuw starten.");
        }
      } catch {
        // non-JSON postMessage — ignore
      }
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (phase !== "success" || !session) return;
    void persistResult({ session, code: authCode });
  }, [phase, session, authCode, persistResult]);

  useEffect(() => {
    if (!configOk || !gateOk) return;
    setPhase("loading-sdk");
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
      setSdkReady(true);
      setPhase("ready");
    };
  }, [appId, configOk, gateOk]);

  const launchSignup = () => {
    if (!window.FB || !configId) return;
    setPhase("in-flow");
    setMessage("Popup geopend — volg de stappen en kies “Connect existing WhatsApp Business app”.");

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          setAuthCode(response.authResponse.code);
        } else if (response.status !== "unknown") {
          setPhase("ready");
          setMessage("Login niet afgerond. Probeer opnieuw.");
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  if (!gateOk) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Toegang geweigerd</CardTitle>
            <CardDescription>
              Voeg <code className="text-xs">?token=...</code> toe aan de URL (WHATSAPP_ONBOARD_ACCESS_TOKEN).
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!configOk) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Configuratie ontbreekt</CardTitle>
            <CardDescription>
              Zet <code className="text-xs">NEXT_PUBLIC_META_APP_ID</code> en{" "}
              <code className="text-xs">NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID</code> in Vercel
              (zie <code className="text-xs">ALT-F-TECH-PROVIDER-SETUP.md</code>).
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.fbAsyncInit) window.fbAsyncInit();
        }}
      />

      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm font-medium">{platformName} · WhatsApp Coexistence</span>
            </div>
            <CardTitle>{clientName} — Connect WhatsApp</CardTitle>
            <CardDescription>
              {clientPhone ? (
                <>
                  Connect {clientPhone} to the Cloud API while {onboardContact} keeps using the
                  WhatsApp Business app on their phone. Log in with an admin account on the client
                  business portfolio.
                </>
              ) : (
                <>
                  Connect the client WhatsApp number to the Cloud API via coexistence onboarding.
                  Log in with an admin account on the client business portfolio.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Zorg dat WhatsApp Business-app ≥ v2.24.17 op de telefoon staat.</li>
              <li>Klik hieronder op Start onboarding.</li>
              <li>Kies <strong>Connect existing WhatsApp Business app</strong>.</li>
              <li>Bevestig op de telefoon via Instellingen → Account → Business Platform → Connect.</li>
            </ol>

            <Button
              className="w-full"
              size="lg"
              disabled={!sdkReady || phase === "in-flow"}
              onClick={launchSignup}
            >
              {phase === "in-flow" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wachten op Meta-flow…
                </>
              ) : phase === "loading-sdk" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Facebook SDK laden…
                </>
              ) : (
                "Start coexistence onboarding"
              )}
            </Button>

            {message ? (
              <div
                className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                  phase === "success"
                    ? "border-green-200 bg-green-50 text-green-900"
                    : phase === "error"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-border bg-background"
                }`}
              >
                {phase === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : phase === "error" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : null}
                <span>{message}</span>
              </div>
            ) : null}

            {session?.data ? (
              <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs">
                <p>business_id: {session.data.business_id ?? "—"}</p>
                <p>waba_id: {session.data.waba_id ?? "—"}</p>
                <p>phone_number_id: {session.data.phone_number_id ?? "—"}</p>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Config ID: <span className="font-mono">{configId || "—"}</span>. If you do not see
              &quot;Connect existing WhatsApp Business app&quot;, create a Meta config from the
              &quot;WhatsApp Embedded Signup&quot; template.
            </p>
            {clientPhone ? (
              <p className="text-xs text-muted-foreground">
                Do not use WhatsApp Manager → Add phone number + SMS for {clientPhone} if coexistence
                is the goal.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function WhatsAppOnboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <WhatsAppOnboardContent />
    </Suspense>
  );
}
