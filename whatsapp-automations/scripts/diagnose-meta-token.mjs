#!/usr/bin/env node
/**
 * Diagnose Meta WhatsApp token + print exact fix steps.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const root = resolve(__dirname, '..');
const { platform, client } = await import(`${root}/src/client-config.js`);

const appId = process.env.META_APP_ID || platform.appId;
const appSecret = process.env.META_APP_SECRET || process.env.META_WHATSAPP_APP_SECRET;
const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || client.wabaId;
const businessId = platform.businessPortfolioId || '880029304670791';
const v = process.env.META_WHATSAPP_API_VERSION || 'v21.0';

console.log('\n=== Platform ===');
console.log('Business portfolio:', platform.businessPortfolioName, `(${businessId})`);
console.log('Tenant:', client.displayName, `(${client.id})`);

if (!token) {
  console.error('META_WHATSAPP_ACCESS_TOKEN ontbreekt in .env');
  process.exit(1);
}

const appToken = `${appId}|${appSecret}`;
const debugRes = await fetch(
  `https://graph.facebook.com/${v}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`
);
const debug = await debugRes.json();
const d = debug.data || {};
console.log('\n=== Token debug ===');
console.log('Valid:', d.is_valid);
console.log('App:', d.application, `(${d.app_id})`);
console.log('Type:', d.type);
console.log('System user:', process.env.META_SYSTEM_USER_ID || platform.systemUserId || '-', platform.systemUserName ? `(${platform.systemUserName})` : '');
console.log('Scopes:', (d.scopes || []).join(', '));

const granular = d.granular_scopes || [];
const waTargets = granular
  .filter((g) => /whatsapp/i.test(g.scope))
  .flatMap((g) => g.target_ids || []);
if (granular.length && !waTargets.length) {
  console.log('\n⚠ Token heeft WhatsApp-scopes maar geen toegewezen WABA (target_ids leeg).');
  console.log('   Meta → System users → Assign assets → WhatsApp accounts → Full control');
  console.log('   Genereer daarna opnieuw een token voor app', appId);
}

if (!phoneId || !wabaId) {
  console.log('\n⚠ WABA/phone nog niet gezet — onboard via Alt F Awesome:');
  console.log(`   ${platform.metaUrls?.whatsappCustomize || 'Meta App → WhatsApp → Embedded Signup'}`);
  console.log(`   Of: https://marketing-automations-kohl.vercel.app/whatsapp/onboard?client=cocon&token=...`);
}

if (phoneId) {
  const phoneRes = await fetch(`https://graph.facebook.com/${v}/${phoneId}?fields=display_phone_number,status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const phone = await phoneRes.json();
  console.log('\n=== Phone', phoneId, '===');
  if (phone.error) {
    console.log('ERROR:', phone.error.message, `(code ${phone.error.code}, subcode ${phone.error.error_subcode || '-'})`);
  } else {
    console.log(JSON.stringify(phone, null, 2));
  }
}

if (wabaId) {
  const wabaRes = await fetch(`https://graph.facebook.com/${v}/${wabaId}?fields=name,account_review_status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const waba = await wabaRes.json();
  console.log('\n=== WABA', wabaId, '===');
  if (waba.error) console.log('ERROR:', waba.error.message);
  else console.log(JSON.stringify(waba, null, 2));
}

const needsAsset =
  phoneId &&
  wabaId &&
  (await fetch(`https://graph.facebook.com/${v}/${phoneId}?fields=id`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.json())
    .then((j) => j.error?.error_subcode === 33));

if (needsAsset) {
  console.log(`
=== FIX (Alt F Awesome Business Settings) ===
Token is geldig maar heeft geen toegang tot WABA/telefoon.

1. ${platform.metaUrls?.systemUsers || `https://business.facebook.com/latest/settings/system_users/?business_id=${businessId}`}
2. System user → Assign assets → WhatsApp accounts (onder Alt F Awesome, niet Cocon Cosmetics BM)
3. Selecteer de WABA van Embedded Signup → Full control
4. Generate new token → App: AFA - Message Platform (${appId})
5. Plak in .env → ./scripts/set-vercel-whatsapp-env.sh → vercel deploy --prod
`);
  process.exit(1);
}

if (phoneId && wabaId) {
  console.log('\n✓ Token + WABA/phone geconfigureerd onder Alt F Awesome');
}
