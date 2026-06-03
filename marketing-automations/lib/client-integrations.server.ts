import "server-only";
import { readFileSync, existsSync } from "fs";
import path from "path";

type ClientJson = {
  id?: string;
  integrations?: { mailchimp?: boolean; salonized?: boolean };
};

function readClientJson(clientId: string): ClientJson | null {
  const roots = [
    path.join(process.cwd(), "vendor/whatsapp-automations/config/clients"),
    path.join(process.cwd(), "../whatsapp-automations/config/clients"),
  ];
  for (const root of roots) {
    const file = path.join(root, `${clientId}.json`);
    if (existsSync(file)) {
      try {
        return JSON.parse(readFileSync(file, "utf8")) as ClientJson;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Mailchimp + Salonized sync zijn vandaag alleen voor Cocon geïmplementeerd. */
export function tenantHasMailchimp(clientId: string): boolean {
  const c = readClientJson(clientId);
  if (c?.integrations?.mailchimp === true) return true;
  if (c?.integrations?.mailchimp === false) return false;
  return clientId === "cocon";
}

export function tenantHasSalonized(clientId: string): boolean {
  const c = readClientJson(clientId);
  if (c?.integrations?.salonized === true) return true;
  if (c?.integrations?.salonized === false) return false;
  return clientId === "cocon";
}

export function tenantIntegrations(clientId: string): {
  mailchimp: boolean;
  salonized: boolean;
} {
  return {
    mailchimp: tenantHasMailchimp(clientId),
    salonized: tenantHasSalonized(clientId),
  };
}
