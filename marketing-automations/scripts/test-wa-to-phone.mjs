#!/usr/bin/env node
/**
 * Test WhatsApp connection + send to a phone (dry-run or live).
 * Usage: node scripts/test-wa-to-phone.mjs [phone] [--live]
 * Default phone: 0614509296
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const phoneArg =
  process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "0614509296";
const live = process.argv.includes("--live");

for (const rel of ["../whatsapp-automations/.env", "../.env"]) {
  const p = resolve(__dirname, rel);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

if (live) process.env.WHATSAPP_DRY_RUN = "false";

const { testConnection } = await import(
  `${root}/vendor/whatsapp-automations/src/whatsapp-client.js`
);
const { sendWhatsAppForStage } = await import(
  `${root}/vendor/whatsapp-automations/src/automation-manager.js`
);
const { normalizePhone, prettyPhone } = await import(
  `${root}/vendor/whatsapp-automations/src/phone.js`
);
const { config } = await import(`${root}/vendor/whatsapp-automations/src/config.js`);

const normalized = normalizePhone(phoneArg);
console.log("\n📱 Target:", phoneArg, "→", normalized, prettyPhone(normalized));
console.log("   dryRun:", config.dryRun);

console.log("\n1) Meta connection test…");
const conn = await testConnection();
console.log(JSON.stringify(conn, null, 2));

console.log("\n2) Template send (aftercare / wenkbrauwen)…");
const send = await sendWhatsAppForStage({
  stage: "aftercare",
  treatmentType: "wenkbrauwen",
  firstName: "Test",
  email: "wa-api-test@local",
  phone: normalized,
  skipOptInCheck: true,
  skipDedupe: true,
});
console.log(JSON.stringify(send, null, 2));

if (!send.ok) {
  console.log("\n❌ Send blocked:", send.reason);
  if (String(send.reason).includes("template-not-approved")) {
    console.log("   Templates pending in Meta — gebruik dry-run of keur templates goed.");
  }
  process.exit(config.dryRun ? 0 : 1);
}

console.log(
  config.dryRun ? "\n✓ Dry-run OK (geen echt bericht)" : "\n✓ Live send OK — check WhatsApp"
);
