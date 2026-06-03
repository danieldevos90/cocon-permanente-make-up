#!/usr/bin/env node
/**
 * Smoke-test all marketing-automations endpoints on production.
 * Usage: node scripts/test-endpoints.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "https://marketing-automations-kohl.vercel.app";

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.production.local");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const results = [];

async function req(label, method, path, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = { ...(opts.headers || {}) };
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(url, {
    method,
    headers,
    body,
    redirect: opts.redirect ?? "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* html/plain */
  }
  const ok = opts.expect ? opts.expect(res.status, text, json) : res.status < 500;
  results.push({ label, method, path, status: res.status, ok, snippet: text.slice(0, 120).replace(/\s+/g, " ") });
  return { res, text, json, headers: res.headers };
}

function pass(label, method, path, expectFn, opts = {}) {
  return req(label, method, path, { ...opts, expect: expectFn });
}

console.log(`\nEndpoint tests → ${BASE}\n`);

// Pages
await pass("GET /", "GET", "/", (s) => s === 302 || s === 307 || s === 200);
await pass("GET /login", "GET", "/login", (s) => s === 200);
await pass("GET /dashboard (no cookie)", "GET", "/dashboard", (s) => s === 302 || s === 307);
await pass("GET /whatsapp/onboard", "GET", "/whatsapp/onboard?client=cocon", (s) => s === 200);
await pass("GET /health", "GET", "/health", (s) => s === 200);
await pass("GET /overzicht", "GET", "/overzicht", (s) => s === 200);

// Public API
await pass("GET /api/overview json", "GET", "/api/overview?format=json", (s, _t, j) => s === 200 && j?.ok !== false);
await pass("GET /api/cron-history", "GET", "/api/cron-history", (s) => s === 200);
await pass("GET /api/email-history", "GET", "/api/email-history", (s) => s === 200);
await pass("GET /api/whatsapp-status", "GET", "/api/whatsapp-status?client=cocon", (s, _t, j) =>
  s === 200 && j?.integrations?.mailchimp === true
);
await pass("GET /api/whatsapp-status demo", "GET", "/api/whatsapp-status?client=demo-salon", (s, _t, j) =>
  s === 200 && j?.integrations?.mailchimp === false
);
await pass("GET /platform (no cookie)", "GET", "/platform", (s) => s === 302 || s === 307);
await pass("GET /api/auth/verify (no cookie)", "GET", "/api/auth/verify", (s) => s === 401 || s === 200);

// Unauthorized
await pass("GET /api/cron-sync no auth", "GET", "/api/cron-sync", (s) => s === 401);
await pass("POST /api/sync no auth", "POST", "/api/sync", (s) => s === 401, { body: {} });
await pass("POST /api/whatsapp-test-send no auth", "POST", "/api/whatsapp-test-send", (s) => s === 401, {
  body: { phone: "31600000000" },
});

// Webhook wrong token
await pass("GET /api/whatsapp-webhook bad token", "GET", "/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc", (s) =>
  s === 403 || s === 503
);

// Login flow
const dashboardPassword =
  process.env.DASHBOARD_PASSWORD || process.env.VERCEL_DASHBOARD_PASSWORD || "";
const login = await req("POST /api/auth/login", "POST", "/api/auth/login", {
  body: { password: dashboardPassword },
  redirect: "manual",
});
const setCookie = login.headers.get("set-cookie") || "";
const cookie = setCookie.split(";")[0].trim();
const loginOk = login.res.status === 200 && !!cookie;
results[results.length - 1].ok = loginOk;

if (cookie) {
  await pass("GET /api/auth/verify (logged in)", "GET", "/api/auth/verify", (s) => s === 200, {
    headers: { Cookie: cookie },
  });
  await pass("GET /api/whatsapp-status (cookie)", "GET", "/api/whatsapp-status", (s) => s === 200, {
    headers: { Cookie: cookie },
  });
  await pass("POST /api/whatsapp-test-send validation", "POST", "/api/whatsapp-test-send", (s) => s === 400, {
    headers: { Cookie: cookie },
    body: {},
  });
  await pass("POST /api/auth/logout", "POST", "/api/auth/logout", (s) => s === 200, {
    headers: { Cookie: cookie },
  });
} else {
  results.push({ label: "auth chain", method: "-", path: "-", status: 0, ok: false, snippet: "login failed — skip cookie tests" });
}

// Sync dry-run (authorized, no side effects)
const syncToken = process.env.SYNC_API_TOKEN;
if (syncToken) {
  await pass("POST /api/sync dryRun", "POST", "/api/sync", (s, _t, j) => s === 200 && j?.ok === true, {
    headers: { Authorization: `Bearer ${syncToken}` },
    body: { dryRun: true },
  });
}

// WhatsApp onboard gate
await pass("POST /api/whatsapp-onboard empty", "POST", "/api/whatsapp-onboard", (s) => s === 200 || (s >= 400 && s < 500), {
  body: {},
});

// Webhook POST empty (should 200 or 400, not 500)
await pass("POST /api/whatsapp-webhook empty", "POST", "/api/whatsapp-webhook", (s) => s === 200 || s === 400, {
  body: {},
});

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log("Result".padEnd(42), "HTTP", "OK");
console.log("-".repeat(72));
for (const r of results) {
  console.log(`${r.label.padEnd(42)} ${String(r.status).padEnd(4)} ${r.ok ? "✓" : "✗"}`);
  if (!r.ok && r.snippet) console.log(`  → ${r.snippet}`);
}

console.log(`\n${passed}/${results.length} passed`);
if (failed.length) process.exit(1);
