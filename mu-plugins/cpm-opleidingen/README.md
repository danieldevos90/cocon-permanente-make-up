# Cocon Cosmetics — Opleidingen Checkout

WordPress mu-plugin die de complete inschrijf- en betaalflow regelt voor de
PMU-opleidingen op `coconpermanentemakeup.nl`. Cursisten kunnen in **1, 2 of
3 termijnen** betalen via **Mollie** (iDEAL, creditcard, Bancontact), met een
verplichte aanbetaling vandaag en als hard regel dat de **laatste termijn
minimaal 14 dagen vóór startdatum** binnen moet zijn.

> Huidige versie: **0.6.0** • Status: **live** (Mollie live key actief)

---

## Inhoud

- [Wat doet de plugin?](#wat-doet-de-plugin)
- [Architectuur](#architectuur)
- [Cursus aanmaken — workflow](#cursus-aanmaken--workflow)
- [Templates: éen plek voor de content](#templates-één-plek-voor-de-content)
- [Auto-page systeem](#auto-page-systeem)
- ["Meld je aan" CTA op landingspagina's](#meld-je-aan-cta-op-landingspaginas)
- [Mollie configuratie (test ↔ live)](#mollie-configuratie-test--live)
- [Betaalplan-logica + 14-dagen-deadline](#betaalplan-logica--14-dagen-deadline)
- [Admin REST endpoints](#admin-rest-endpoints)
- [Database schema](#database-schema)
- [Cron jobs](#cron-jobs)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

---

## Wat doet de plugin?

Een student bezoekt een opleiding-landingspagina (bv.
`/3d-nano-brows-masterclass/`) → klikt op **"Meld je aan"** → komt op de
gegenereerde inschrijfpagina (bv. `/inschrijven-masterclass-3d-nano-brows-16-17-september-2026/`)
→ kiest 1, 2 of 3 termijnen → vult NAW in → wordt direct doorgestuurd naar
Mollie voor de eerste betaling. Na succesvolle betaling ontvangt zowel de
cursist als de administratie een e-mail; vervolgtermijnen worden automatisch
ingepland en gefactureerd vóór de vervaldatum.

Belangrijke voordelen ten opzichte van een standaard WooCommerce flow:

- Eén opleiding = één cohort = één URL. Geen "aanbetaling-producten" meer in
  de shop.
- Termijnenlogica leeft in de database, niet in een WC subscription.
- Content (wat-je-leert, praktisch-info, trainer) staat centraal in een PHP
  template-class — niet duizenden keren gekopieerd per cohort.
- Inschrijfpagina's worden **automatisch** aangemaakt zodra je een cohort
  publiceert.

## Architectuur

```text
cpm-opleidingen/
├── cpm-opleidingen.php            ← plugin bootstrap + globals
├── includes/
│   ├── class-db.php               ← schema migratie (cpm_enrollments, cpm_payments)
│   ├── class-cohort-cpt.php       ← CPT cpm_cohort + meta-schema + ::get()
│   ├── class-cohort-defaults.php  ← centrale rich-content templates
│   ├── class-cohort-auto-page.php ← auto-create inschrijfpagina per cohort
│   ├── class-payment-plan.php     ← 1/2/3 termijnen + cent-verdeling + deadline
│   ├── class-mollie-client.php    ← Mollie API wrapper
│   ├── class-emails.php           ← bevestigings- + reminder-mails
│   ├── class-checkout-handler.php ← REST /cpm/v1/checkout (form submit)
│   ├── class-webhook.php          ← REST /cpm/v1/webhook (Mollie callback)
│   ├── class-cron.php             ← daily termijn-due check + reminders
│   ├── class-shortcode.php        ← [cpm_opleiding_aanmelden cohort_id="…"]
│   ├── class-cta.php              ← [cpm_next_cohort_cta] + auto-injection
│   ├── class-admin.php            ← WP-admin tweaks (kolommen, etc.)
│   └── class-admin-rest.php       ← REST /cpm/v1/admin/* (seed/automation)
├── assets/
│   ├── checkout.css               ← styling inschrijfpagina + CTA
│   └── checkout.js                ← termijn-switcher + AJAX submit
└── templates/
    └── checkout-form.php          ← HTML template van de inschrijfpagina
```

Loader: `mu-plugins/cpm-opleidingen-loader.php` requires
`cpm-opleidingen/cpm-opleidingen.php`. mu-plugins worden altijd geladen
(geen activate-hook nodig); DB-migratie draait op `plugins_loaded` met een
version-gate.

## Cursus aanmaken — workflow

Drie wegen, allemaal even goed:

### 1. WP-admin (handmatig)

Dashboard → **Opleidingen** → **Nieuw cohort**.

Vul minimaal in:

| Veld | Voorbeeld |
|---|---|
| Titel | `Masterclass 3D Nano Brows — 16 + 17 september 2026` |
| Startdatum | `2026-09-16` |
| Einddatum (optioneel) | `2026-09-17` |
| Totale prijs (centen) | `240000` (= € 2.400) |
| Aanbetaling (centen) | `50000` (= € 500) — vul `0` als er geen aanbetaling is |
| Max. termijnen | `3` |
| Max. studenten | `5` |
| Locatie | `Korte Hoogstraat 29A, Vlaardingen` |

Publiceer → `Cohort_Auto_Page` maakt automatisch
`/inschrijven-{slug}/` aan met de styled inschrijfpagina. Standaard erft het
cohort alle rich-content van template `masterclass-3d-nano-brows`. Wil je
een andere template? Zet meta `_cpm_template` (bv. via Custom Fields panel
of via REST).

### 2. Admin REST (geautomatiseerd)

```bash
curl -X POST https://www.coconpermanentemakeup.nl/wp-json/cpm/v1/admin/cohort \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Masterclass 3D Nano Brows — voorjaar 2027",
    "cpm_template":   "masterclass-3d-nano-brows",
    "cpm_start_date": "2027-03-09",
    "cpm_end_date":   "2027-03-10",
    "cpm_total_price_cents": 240000,
    "cpm_deposit_cents":      50000,
    "cpm_max_termijnen": 3,
    "cpm_max_students":  5,
    "cpm_location": "Korte Hoogstraat 29A, Vlaardingen"
  }'
```

De response bevat `enroll_page_id` + `enroll_page.url`. Klaar.

### 3. WP-CLI

Mu-plugins zijn altijd actief op de live site, dus `wp post create
--post_type=cpm_cohort …` werkt direct. In de praktijk gebruiken we route 1
of 2.

## Templates: één plek voor de content

Alle rich content (subtitle, eyebrow, level, wat-je-leert, praktisch,
intro, trainer, duur) leeft in `Cohort_Defaults::TEMPLATES` in
[`class-cohort-defaults.php`](includes/class-cohort-defaults.php).

Huidige templates:

| Key | Voor welke opleiding |
|---|---|
| `masterclass-3d-nano-brows` | 3D Nano Brows masterclass (€2.400, 2-daags) |
| `pmu-opleiding-wenkbrauwen` | Basisopleiding wenkbrauwen (€5.950, 6 dagen / 6 weken) |

Iedere template definieert: `eyebrow`, `subtitle`, `level`,
`duration_label`, `trainer_name`, `intro_html`, `what_you_learn` (array),
`includes` (array).

### Een nieuwe template toevoegen

```php
// In class-cohort-defaults.php → const TEMPLATES
'masterclass-eyeliner' => [
    'eyebrow'        => 'Masterclass',
    'subtitle'       => 'Verfijn je eyeliner-techniek in één dag',
    'level'          => 'Voor ervaren PMU-artiesten',
    'duration_label' => '1 dag intensieve training',
    'trainer_name'   => 'Sina Hashemi',
    'intro_html'     => '…',
    'what_you_learn' => [ '…', '…' ],
    'includes'       => [ '…', '…' ],
],
```

Of inhaken via filter zonder de class te editen:

```php
add_filter( 'cpm_opl_template_data', function( $tpl, $key, $cohort_id ) {
    if ( $key === 'masterclass-eyeliner' ) {
        $tpl['intro_html'] = 'Andere intro voor cohort #' . $cohort_id;
    }
    return $tpl;
}, 10, 3 );
```

### Per-cohort override

Iedere veld in de template kan per cohort worden overschreven via post-meta.
Set bv. `_cpm_subtitle` op een cohort → die specifieke pagina toont de
override, alle andere cohorten blijven de template-default volgen. Zo
houden we de "single source of truth", maar blijft maatwerk per cohort
mogelijk.

## Auto-page systeem

`Cohort_Auto_Page` registreert op `save_post_cpm_cohort`:

1. Bij **publish** van een cohort wordt automatisch een pagina aangemaakt:
   - Slug: `inschrijven-{cohort-slug}`
   - Titel: `Inschrijven — {cohort-titel}`
   - Content: `[cpm_opleiding_aanmelden cohort_id="…"]`
2. De koppeling staat in post-meta `_cpm_enroll_page_id` op het cohort.
3. Bij **update** wordt de pagina-titel ge-sync't; content wordt enkel
   overschreven als de pagina nog **alleen onze shortcode** bevat — zo
   blijft handmatige Divi-customisatie intact.
4. Bij **delete** wordt de pagina ook permanent verwijderd (cascade) via
   `/cpm/v1/admin/cohort/{id}/delete`.

Geen pagina aangemaakt? Check:

- `get_post_meta( $cohort_id, '_cpm_enroll_page_id', true )` → moet een int zijn
- Cohort status moet `publish` zijn
- Forceer een sync: PUT `/cpm/v1/admin/cohort/{id}` met willekeurige meta — de hook draait dan opnieuw

## "Meld je aan" CTA op landingspagina's

`class-cta.php` zorgt dat je geen Divi hoeft te bewerken om een CTA-knop op
de bestaande opleiding-landingspagina te krijgen. Hij doet twee dingen:

### 1. Shortcode

```text
[cpm_next_cohort_cta template="masterclass-3d-nano-brows"]
[cpm_next_cohort_cta cohort_id="9320" label="Schrijf je in"]
```

Vindt het eerstvolgende publish-cohort met `_cpm_start_date >= vandaag` van
dat template. Fallback: meest recente cohort, ook als verlopen.

### 2. Automatisch geïnjecteerd onderaan de content

Mapping `page_id → template_key`:

| Pagina | Template |
|---|---|
| 6834 — `/3d-nano-brows-masterclass/` | `masterclass-3d-nano-brows` |
| 2901 — `/opleidingen/` | `pmu-opleiding-wenkbrauwen` |

Aanpasbaar zonder de plugin te editen:

```php
add_filter( 'cpm_opl_landing_cta_map', function( $map ) {
    $map[ 1234 ] = 'masterclass-eyeliner';
    return $map;
} );
```

De CTA toont:

- Eerstvolgende start (datum)
- Cohort-titel
- 1 pink knop "Meld je aan" → linkt naar de inschrijfpagina

De 1/2/3-termijnen-keuze zit op de inschrijfpagina zelf — bewust niet in de
CTA, om die luchtig te houden.

## Mollie configuratie (test ↔ live)

Resolutie-volgorde in `cpm_opl_get_mollie_key()`:

1. WP option `cpm_opl_mollie_key_live` / `cpm_opl_mollie_key_test`
2. Constants `CPM_OPL_MOLLIE_LIVE_KEY` / `CPM_OPL_MOLLIE_TEST_KEY` in `wp-config.php`
3. `.env` in project root (alleen relevant voor local dev)

Schakelen:

```bash
# Live mode aanzetten
curl -X POST https://www.coconpermanentemakeup.nl/wp-json/cpm/v1/admin/settings \
  -H "Authorization: Bearer $JWT" -d '{ "cpm_opl_test_mode": 0 }'

# Test mode aanzetten
curl -X POST … -d '{ "cpm_opl_test_mode": 1 }'

# Live key updaten
curl -X POST … -d '{ "cpm_opl_mollie_key_live": "live_xxxxx" }'
```

`cpm_opl_is_test_mode()` default is `false`, behalve op `localhost` waar
het automatisch op test gaat.

## Betaalplan-logica + 14-dagen-deadline

`Payment_Plan::build( $cohort, $num_termijnen, $now )` genereert een array
met per-termijn `amount_cents`, `due_date`, `is_deposit`. Regels:

- **1 termijn:** volledige prijs vandaag, geen deadline.
- **2 termijnen:** aanbetaling vandaag, restbedrag uiterlijk
  `startdatum - 14 dagen`.
- **3 termijnen:** aanbetaling vandaag, restbedrag in 2 gelijke termijnen
  verdeeld over de periode tot `startdatum - 14 dagen`. Centen worden
  eerlijk verdeeld (laatste termijn neemt eventueel restcent op).
- Is de startdatum binnen 14 dagen? Dan vervalt 2/3 termijnen — alléén
  optie 1 (volledig vandaag) is nog beschikbaar. De plugin filtert dit
  automatisch in de plan-keuzes op de inschrijfpagina.

## Admin REST endpoints

Alle endpoints vereisen `manage_options` capability (JWT user is admin).

| Method | Route | Doet |
|---|---|---|
| `POST` | `/cpm/v1/admin/cohort` | Nieuw cohort + meta in één call |
| `POST` `PUT` `PATCH` | `/cpm/v1/admin/cohort/{id}` | Cohort updaten (+ triggert auto-page) |
| `POST` `DELETE` | `/cpm/v1/admin/cohort/{id}/delete` | Cohort + enrollments + page cascading verwijderen |
| `POST` `DELETE` | `/cpm/v1/admin/page/{id}/delete` | Losse pagina verwijderen |
| `GET` `POST` `PUT` | `/cpm/v1/admin/settings` | Mollie keys + test_mode beheren |
| `GET` | `/cpm/v1/admin/diag` | Diagnostic: versie, keys, webhook-url, counts |
| `GET` | `/cpm/v1/admin/enrollments` | Laatste 50 inschrijvingen |
| `GET` | `/cpm/v1/admin/enrollment/{id}` | Inschrijving + losse termijnen |
| `POST` `DELETE` | `/cpm/v1/admin/wipe-enrollments` | Bulk verwijderen (`ids`, `cohort`, of `all`) |

Public endpoints (geen auth):

| Method | Route | Doet |
|---|---|---|
| `POST` | `/cpm/v1/checkout` | Form submit van de inschrijfpagina → Mollie payment URL |
| `POST` | `/cpm/v1/webhook` | Mollie callback voor payment status updates |

## Database schema

Twee custom tabellen (zie `class-db.php`):

```sql
{$wpdb->prefix}cpm_enrollments
  id              BIGINT PK
  cohort_id       BIGINT
  first_name, last_name, email, phone, company,
  address, postcode, city, country,
  notes           TEXT
  num_termijnen   TINYINT
  total_cents     INT
  deposit_cents   INT
  currency        VARCHAR(3)
  status          ENUM('pending','active','completed','cancelled')
  created_at      DATETIME

{$wpdb->prefix}cpm_payments
  id               BIGINT PK
  enrollment_id    BIGINT (FK → cpm_enrollments.id)
  termijn_index    TINYINT  -- 1..3 (0 = aanbetaling)
  is_deposit       TINYINT(1)
  amount_cents     INT
  due_date         DATE
  status           ENUM('open','pending','paid','failed','expired','refunded')
  mollie_payment_id VARCHAR(64)
  paid_at          DATETIME NULL
  created_at       DATETIME
```

## Cron jobs

`class-cron.php` registreert:

- **daily `cpm_opl_check_due_payments`** — voor elke `open` payment met
  `due_date <= vandaag + 5 dagen`: maak Mollie-payment aan + stuur reminder mail.
- **daily `cpm_opl_overdue_cleanup`** — markeer betalingen waarvan de
  due_date verstreken is en niet betaald → status `expired`, notify admin.

WP-cron draait via standaard pageload-trigger. In productie raden we een
externe cron (DirectAdmin task) aan die elke 5 minuten `/wp-cron.php` hit.

## Deploy

Eénregelig naar live:

```bash
bash deploy-cpm-opleidingen.sh
```

Wat het script doet:

1. Zip de mu-plugin lokaal (excl. `tests/`).
2. Upload via DirectAdmin REST API (FTP is geblokkeerd via Cloudflare).
3. Extract op de server in `wp-content/mu-plugins/` (overwrite).
4. Upload de loader-stub.
5. Verwijdert de zip op de server.

Smoke-test daarna:

```bash
JWT=$(jq -r '.mcpServers."wordpress-coconpmu".env.JWT_TOKEN' .cursor/mcp.json)
curl -sk -H "Authorization: Bearer $JWT" \
  https://www.coconpermanentemakeup.nl/wp-json/cpm/v1/admin/diag | jq
```

`plugin_version` moet matchen met `CPM_OPL_VERSION` in de PHP-file. **Bump
deze constante altijd bij CSS/JS-wijzigingen** — hij wordt als
`?ver=0.6.0` aan de assets gehangen voor cache-busting.

## Troubleshooting

| Symptoom | Check |
|---|---|
| Inschrijfpagina toont "Cohort niet gevonden of nog niet gepubliceerd" | Cohort status is geen `publish`, of `_cpm_start_date` / `_cpm_total_price_cents` zijn leeg |
| CSS update niet zichtbaar | `CPM_OPL_VERSION` niet gebumpt — browser/CDN serveert oude versie |
| Mollie webhook draait niet | Controleer dat `webhook_url` in `/cpm/v1/admin/diag` publiek bereikbaar is; check Mollie dashboard → Betalingen → webhook-logs |
| Auto-page niet aangemaakt | Cohort heeft status `draft`, of `save_post_cpm_cohort` is geblokkeerd door een ander hook. Forceer via PUT `/cpm/v1/admin/cohort/{id}` |
| Divi overschrijft styling op inschrijfpagina | Voeg `!important` toe in `checkout.css`. We hebben veel CSS-regels bewust met `!important` om Divi's globale styling te overrulen |
| Cursus verschijnt nog in `/winkel/` | Oude WooCommerce "Aanbetaling Masterclass" producten staan op `catalog_visibility=hidden` sinds v0.5.x — niet verwijderd om bestelhistorie te behouden |

---

**Plugin author:** Cocon Cosmetics · **Maintainer:** Daniel (ALT F AWESOME)
