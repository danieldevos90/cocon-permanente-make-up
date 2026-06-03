# Cocon Cosmetics — WhatsApp Automations

WhatsApp automation **scaffold** voor PMU-behandelingen, parallel aan `../marketing-automations` (e-mail/Mailchimp).

Gebaseerd op `cocon-whatsapp-automatisering.md` (Fase 1 MVP):

- nazorg direct na behandeling (alle behandelingen)
- brows refresh reminder na ~10 maanden
- lips refresh reminder na ~10 maanden

> Status: **SCAFFOLD** — alle templates staan op `metaStatus: 'pending'`
> en `WHATSAPP_DRY_RUN=true`. Er worden geen berichten naar Meta gestuurd
> tot je dit expliciet aanzet (zie "Live gaan").

---

## Architectuur

```
Salonized iCal
   ↓
marketing-automations/src/salonized-daily-sync.js
   ├─ Mailchimp (LASTTRTDT update + aftercare e-mail)
   └─ onTreatmentProcessed()  ←─── lazy import van deze module
                                   ├─ aftercare WhatsApp (direct)
                                   └─ refresh WhatsApp (geplande Redis ZSET)
                                          ↓
                                  Vercel cron → runScheduledSends()
                                          ↓
                                  Meta WhatsApp Cloud API
                                          ↓
                                       Klant
                                          │
                  ┌───────── coexistence ─┴─────────┐
                  ↓                                 ↓
       Daniela's Business app           webhook → dashboard
       (zij antwoordt persoonlijk)      (observer mode, alleen loggen)
```

**Coexistence**: het nummer +31 6 23943507 staat in BEIDE — de WhatsApp
Business app op Daniela's telefoon (voor handmatige antwoorden) en de
Cloud API (voor automation). Onze webhook draait in **observer mode**:
inkomende klant-berichten worden gelogd voor het dashboard, maar er
wordt nooit automatisch geantwoord. Daniela blijft zoals nu reageren
vanaf de telefoon.

De WhatsApp-module is **optioneel**: als deze folder niet bestaat,
blijft `marketing-automations` zonder fouten draaien.

## Folder structuur

```
whatsapp-automations/
├── src/
│   ├── index.js                 ← exports voor consumers
│   ├── config.js                ← env-gedreven config
│   ├── phone.js                 ← E.164 normalisatie
│   ├── whatsapp-client.js       ← Meta Graph API (dry-run safe)
│   ├── opt-in-manager.js        ← lookup via Mailchimp WAOPTIN merge field
│   ├── delivery-log.js          ← Redis log + dedupe tags
│   ├── automation-manager.js    ← stage → template → send flow
│   ├── salonized-hook.js        ← bridge naar marketing-automations
│   ├── cli.js                   ← debug/test commands
│   └── templates/
│       ├── index.js
│       ├── template-helpers.js
│       ├── aftercare-templates.js
│       └── refresh-templates.js
├── .env.example
├── package.json
└── README.md
```

## Setup (lokaal)

```bash
cd whatsapp-automations
npm install
cp .env.example .env
```

Vul minimaal in:

- `SALONIZED_ICAL_URL` (dezelfde als marketing-automations)
- `API_KEY_MAILCHIMP` + `MAILCHIMP_LIST_ID` (voor opt-in lookup)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (delivery log + schedule queue)

Meta credentials zijn **nog niet vereist** zolang `WHATSAPP_DRY_RUN=true` staat.

## CLI commands

```bash
# Toon huidige config + warnings
node src/cli.js status

# Test Meta connection (in dry-run: skip)
node src/cli.js test-connection

# Lijst lokale templates + (--remote) Meta status
node src/cli.js templates
node src/cli.js templates --remote

# Preview een specifieke template
node src/cli.js preview --stage aftercare --treatment wenkbrauwen
node src/cli.js preview --stage browsRefresh --treatment wenkbrauwen --first-name Anna

# Stuur een test (respecteert dry-run en opt-in)
node src/cli.js send \
  --stage aftercare \
  --treatment wenkbrauwen \
  --first-name Anna \
  --email klant@example.com

# Override telefoonnummer en skip opt-in voor lokale test
node src/cli.js send \
  --stage aftercare \
  --treatment wenkbrauwen \
  --first-name Anna \
  --email klant@example.com \
  --phone "+31612345678" \
  --skip-opt-in

# Bekijk geplande refresh-sends in Redis
node src/cli.js queue

# Verwerk alle due scheduled sends (handmatig, normaal via cron)
node src/cli.js run-scheduled

# Registreer een opt-in in Mailchimp
node src/cli.js opt-in --email klant@example.com --phone "+31612345678"

# Check opt-in status van een klant
node src/cli.js opt-in-check --email klant@example.com

# Laatste 7 dagen delivery events
node src/cli.js recent
```

## Mailchimp merge fields (one-time setup)

Voor opt-in tracking voeg je in Mailchimp Audience → Settings → Audience fields
twee merge fields toe:

| Naam     | Tag      | Type | Default |
|----------|----------|------|---------|
| WhatsApp opt-in | `WAOPTIN` | dropdown (yes/no) | no |
| Telefoonnummer  | `PHONE`   | phone (international) | - |

> Het bestaande `PHONE` veld in Mailchimp kun je hergebruiken als het al bestaat.

## Live gaan (coexistence-veilig) — checklist

> ⛔️ **KRITIEK — telefoon mag NIET geblokkeerd worden.**
> Het nummer **+31 6 23943507** staat live op de **WhatsApp Business-app**
> op Daniela's telefoon. Gebruik **uitsluitend de Coexistence-route**.
>
> Doe **NOOIT**:
> - WhatsApp Manager → "Add phone number" + **SMS/voice-verificatie**
> - "Migrate to Cloud API" op het bestaande nummer
> - het nummer uit de WhatsApp Business-app verwijderen
>
> Elk van deze acties **koppelt het nummer los van de telefoon** (Daniela
> raakt haar WhatsApp kwijt). De code in dit pakket kan dit niet doen
> (zie de coexistence-guard in `whatsapp-client.js`), maar in de Meta-UI
> moet je dit zelf vermijden.

Houd deze volgorde aan. Pas **na stap 5** zet je `WHATSAPP_DRY_RUN=false`.

### 1. Business verificatie

- Meta Business Account: <https://business.facebook.com>
- Verifieer het bedrijf (Business Verification — KvK + adresbewijs; kan 1–2 weken duren)
- Domeinverificatie staat al live (`mu-plugins/coconpm-facebook-domain-verification.php`)

### 2. Coexistence onboarding (nummer blijft op de telefoon)

> **Alt F Awesome Tech Provider:** volledig stappenplan in
> [`reports/ALT-F-TECH-PROVIDER-SETUP.md`](reports/ALT-F-TECH-PROVIDER-SETUP.md).
> Onboarding-UI: `marketing-automations/app/whatsapp/onboard` → `/whatsapp/onboard`.

Coexistence laat hetzelfde nummer **tegelijk** op de Business-app én de
Cloud API draaien. Bestaande chats blijven op de telefoon; nieuwe berichten
synchroniseren beide kanten op.

Voorwaarden (Meta, doc bijgewerkt 2026):
- WhatsApp **Business-app** v**2.24.17+** op de telefoon (niet de consumenten-app)
- Nummer ≥ **7 dagen** (liefst 30–60) actief gebruikt op de Business-app
- Ondersteund land (NL/EER = ja)
- Nummer **niet** al gekoppeld aan een andere Cloud-API-provider

Onboarding-flow (via **Embedded Signup → "Connect a WhatsApp Business App"**):
1. Start de Coexistence Embedded Signup (zelf opzetten, of via een Meta
   Tech/Solution Partner zoals 360dialog, Twilio, Wati, Whautomate — zij
   draaien de signup namens Cocon).
2. Voer **+31 6 23943507** in → je krijgt een **verificatiecode**.
3. Op de telefoon: WhatsApp Business-app → **Instellingen → Account →
   Business Platform → Connect** → plak de code → bevestig.
4. Na succes geeft de flow de **Phone Number ID** + **WABA ID** terug
   → vul `META_WHATSAPP_PHONE_NUMBER_ID` en `META_WHATSAPP_BUSINESS_ACCOUNT_ID`.

> **Huidige status van het nummer** (gecheckt via `node src/cli.js phone-status`):
> `platform_type=ON_PREMISE`, `code_verification_status=NOT_VERIFIED`,
> `is_on_biz_app=YES`. Het nummer staat dus op de Business-app (goed voor
> coexistence) maar hangt in een half-afgeronde ON_PREMISE-staat en heeft
> nog geen leesbare WABA (`node src/cli.js waba` geeft een #100-fout).
> **Rond de ON_PREMISE-migratie NIET af.** Laat de coexistence-onboarding
> bij voorkeur door een Tech Provider doen; mogelijk moet de oude
> ON_PREMISE/WABA-koppeling eerst opgeschoond worden (Meta vereist soms
> 1–2 maanden cooldown vóór coexistence). Verifieer dit met de provider.

> **Alternatief (100% telefoonveilig):** gebruik een **apart, nieuw nummer**
> voor de Cloud API. Dan raakt Daniela's huidige nummer gegarandeerd niet.
> Nadeel: klanten zien een ander afzendernummer dan ze gewend zijn.

### 3. System User access token (langlevend)

- **Meta Business Settings → Users → System Users → Add**
- Geef rol `Admin` op de WhatsApp Business Account
- Genereer een **non-expiring** access token met permissions:
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`
- Token → `META_WHATSAPP_ACCESS_TOKEN`

### 4. Templates indienen ter goedkeuring

Voor elke template in `src/templates/`:

1. Ga naar WhatsApp Manager → Message templates → **Create template**
2. **Naam**: gebruik exact dezelfde naam als in de code, bijv. `cocon_aftercare_brows_v1`
3. **Category**: `UTILITY` voor aftercare, `MARKETING` voor refresh-reminders
4. **Language**: `Dutch (nl)`
5. **Body**: kopieer de tekst uit `renderPreview()` output (CLI: `node src/cli.js preview ...`)
6. **Variables**: definieer `{{1}}` als voornaam, voorbeeldwaarde `Anna`
7. **Submit** — goedkeuring duurt meestal < 1 uur, soms een dag

Na goedkeuring: pas `metaStatus: 'pending'` aan naar `metaStatus: 'approved'` in
het corresponderende template-bestand.

> Tip: gebruik `node src/cli.js templates --remote` na goedkeuring om te
> verifiëren dat lokaal en Meta synchroon lopen.

### 5. Opt-in flow live

- Voeg de WhatsApp-opt-in checkbox toe aan:
  - intake formulier op de site
  - bevestigingsmail (link naar opt-in pagina)
- Op de opt-in pagina: POST naar een endpoint die `recordOptIn({ email, phone })` aanroept
- Update privacy policy met expliciete tekst over WhatsApp communicatie

### 6. Webhook configureren (observer mode — al gebouwd)

We draaien in **coexistence**: Daniela antwoordt vanaf de WhatsApp
Business app, onze webhook logt alleen.

- **Webhook URL**: `https://marketing-automations-kohl.vercel.app/api/whatsapp-webhook`
- **Verify token**: zelfde waarde als `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`
- **App secret**: vul `META_WHATSAPP_APP_SECRET` in (Meta App → Settings → Basic → App Secret)
- **Subscribe op velden**: `messages` (omvat berichten + statuses)

Setup in Meta App Dashboard:

1. <https://developers.facebook.com/apps/> → kies "Cocon - Business API"
2. WhatsApp → Configuration → **Webhook**
3. **Edit** → vul URL + verify token in → **Verify and save**
4. Bij "Webhook fields" → **Subscribe** op `messages`

Daarna verschijnen klant-replies in het dashboard onder
"Recente klant-replies". Geen auto-replies — alle communicatie blijft
via Daniela's telefoon zoals nu.

### 7. Live zetten

Zodra alle templates approved zijn en opt-in flow live is:

```bash
# Pas de relevante template-bestanden aan: metaStatus: 'approved'
# Zet vervolgens in Vercel env:
WHATSAPP_DRY_RUN=false
```

Voor de eerste live week: monitor het dashboard `/dashboard` dagelijks op
delivery errors en de Meta WhatsApp Manager op quality rating.

## Restricties & aandachtspunten

Conform `cocon-whatsapp-automatisering.md`:

- **Opt-in verplicht** — geen send zonder `WAOPTIN=yes` in Mailchimp
- **Template approval** — `metaStatus !== 'approved'` blokkeert verzending
- **Geen bulk-spam** — Meta verlaagt quality rating bij te veel ongewenste sends
- **24-uurs service-window** voor vrije tekst — automation gebruikt enkel templates
- **Fallback** — `WHATSAPP_FALLBACK_TO_EMAIL=true` zorgt dat marketing-automations
  altijd de e-mail verstuurt; WhatsApp komt daar bovenop

## Kosten (indicatie)

| Onderdeel | Bedrag |
|-----------|--------|
| Per UTILITY conversatie (NL) | ~€0.03 – €0.04 |
| Per MARKETING conversatie (NL) | ~€0.06 – €0.09 |
| Verwacht volume Cocon | 200–400 berichten / maand |
| Indicatie maandbudget | **€10 – €25** |

(Conversatie = 24-uurs venster vanaf eerste bericht.)

## Demo tenant: Store / Gym (marketing test)

Tenant `demo-store-gym` in `config/clients/demo-store-gym.json` — **geen PMU**, geen Mailchimp/Salonized.

| | Cocon (`pmu`) | Demo Store / Gym (`marketing`) |
|--|--|--|
| Segmenten | wenkbrauwen, eyeliner, lippen | store, gym |
| Stages | aftercare, browsRefresh, lipsRefresh | welcome, promo, reminder |
| Templates | `cocon_*` (UTILITY) | `demo_*` (MARKETING) |

Test via dashboard: `/t/demo-store-gym/dashboard` → **Send test** (phone + stage + segment).

API:

```http
POST /api/v1/whatsapp/messages
{ "client": "demo-store-gym", "phone": "316…", "stage": "welcome", "treatmentType": "store", "firstName": "Test" }
```

## Roadmap

### Fase 1 — MVP (huidige scaffold)
- [x] Architectuur + Salonized-hook
- [x] Templates: aftercare (3) + brows refresh + lips refresh
- [x] Dashboard tab in marketing-automations
- [ ] Templates indienen en approven bij Meta
- [ ] Opt-in flow in intake formulier
- [ ] Live zetten

### Fase 2 — Verdieping
- [ ] Eyeliner long-term refresh (~2 jaar)
- [ ] Magic Pencil cross-sell
- [ ] Webhook endpoint voor reply handling (`JA` → booking link)
- [ ] Automatische fallback naar e-mail bij delivery failure
- [ ] Segmentatie per behandeling in dashboard

## Troubleshooting

**`Cannot find module '../../whatsapp-automations/...'` in marketing-automations**

De lazy import faalt als `npm install` nog niet gedraaid is in deze folder.
Run `cd whatsapp-automations && npm install`. De fout wordt verder
silently weggevangen; alleen `WHATSAPP_HOOK_DEBUG=true` logt 'm.

**`mailchimp-not-configured` bij alle sends**

`API_KEY_MAILCHIMP` of `MAILCHIMP_LIST_ID` ontbreekt. Dit is een
veiligheidsmechanisme — zonder Mailchimp lookup kan opt-in niet
geverifieerd worden, dus de send wordt geweigerd.

**`template-not-approved` bij alle sends**

Standaard staan alle templates op `metaStatus: 'pending'`. Pas dit
veld aan naar `'approved'` zodra Meta de template heeft goedgekeurd.

**Geen events in `recent` dashboard view**

Redis is niet geconfigureerd of er zijn nog geen sends gedaan.
Check `node src/cli.js status` voor de Redis-status.
