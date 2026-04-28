# Cocon Cosmetics — Opleidingen Checkout (`cpm-opleidingen`)

Mu-plugin die inschrijvingen voor PMU-opleidingen afhandelt met:
- Aanbetaling (optioneel)
- 1, 2 of 3 termijnen, dynamisch beperkt op basis van de startdatum
- **Laatste termijn moet ten laatste 14 dagen vóór startdatum binnen zijn** (configureerbaar via `CPM_OPL_DEADLINE_DAYS`)
- Mollie Payment Links per termijn (geen recurring/SEPA-mandaat nodig)
- Bevestigingsmail + automatische herinnering per e-mail (cron, dagelijks om 06:00)

Werkt **naast** de bestaande WC-shop. Maakt geen WC-orders aan — gebruikt eigen DB-tables.

## Bestanden

```
mu-plugins/
├── cpm-opleidingen-loader.php    # mu-plugin stub (top-level, anders laadt mu nooit)
└── cpm-opleidingen/
    ├── cpm-opleidingen.php       # bootstrap + helpers (Mollie key resolve, test mode)
    ├── includes/
    │   ├── class-db.php              # schema + dbDelta migration
    │   ├── class-cohort-cpt.php      # custom post type cpm_cohort + meta box
    │   ├── class-payment-plan.php    # pure logica: deadline + cent-precieze verdeling
    │   ├── class-mollie-client.php   # tiny REST client (geen SDK dep)
    │   ├── class-checkout-handler.php# REST POST /cpm/v1/checkout
    │   ├── class-webhook.php         # REST POST /cpm/v1/webhook (Mollie callback)
    │   ├── class-cron.php            # daily reminder cron
    │   ├── class-emails.php          # plain wp_mail() HTML mails
    │   ├── class-shortcode.php       # [cpm_opleiding_aanmelden cohort_id="..."]
    │   └── class-admin.php           # submenu Opleidingen → Inschrijvingen
    ├── templates/
    │   └── checkout-form.php         # SSR form
    ├── assets/
    │   ├── checkout.css
    │   └── checkout.js               # progressive enhancement (re-render plan on radio change)
    └── tests/
        └── test-payment-plan.php     # 27 standalone tests, run met `php tests/test-payment-plan.php`
```

## Lokaal draaien (Docker)

De WP container heeft `mu-plugins/` al gemount. Plugin laadt automatisch.

```bash
# 1. WP container draait? (cocon_wordpress / cocon_wp_cli)
docker ps | grep cocon

# 2. Plugin geladen?
docker exec cocon_wp_cli wp eval 'echo defined("CPM_OPL_VERSION") ? "v" . CPM_OPL_VERSION : "NIET";' --allow-root

# 3. Mollie keys (test+live) opslaan in WP options:
LIVE=$(grep MOLLIE_LIVE_API_KEY ../../.env | cut -d= -f2)
TEST=$(grep MOLLIE_TEST_API_KEY ../../.env | cut -d= -f2)
docker exec cocon_wp_cli wp option update cpm_opl_mollie_key_test "$TEST" --allow-root
docker exec cocon_wp_cli wp option update cpm_opl_mollie_key_live "$LIVE" --allow-root

# 4. Run unit tests:
docker exec cocon_wordpress php /var/www/html/wp-content/mu-plugins/cpm-opleidingen/tests/test-payment-plan.php
```

## Deploy naar live

```bash
# Vanaf de project root:
./deploy-cpm-opleidingen.sh
```

Upload via lftp naar `wp-content/mu-plugins/`.

## Configuratie op live (eenmalig)

### 1. Mollie API keys instellen

Twee opties:

**a) Via wp-admin UI** (zodra een settings page bestaat — nu nog niet):
```
wp-admin → Tools → ... (placeholder)
```

**b) Via WP-CLI of direct DB**:
```bash
wp option update cpm_opl_mollie_key_live "live_xxxxxxxxx"
wp option update cpm_opl_mollie_key_test "test_xxxxxxxxx"
```

**c) Via `wp-config.php` (aanbevolen voor live):**
```php
define('CPM_OPL_MOLLIE_LIVE_KEY', 'live_xxxxxxxxx');
define('CPM_OPL_MOLLIE_TEST_KEY', 'test_xxxxxxxxx');
```

### 2. Test-mode aan/uit

Default-gedrag:
- Op localhost / *.local → **test mode** (gebruikt `MOLLIE_TEST_API_KEY`)
- Op productie → **live mode**

Forceren:
```bash
wp option update cpm_opl_test_mode 1   # forceer test
wp option update cpm_opl_test_mode 0   # forceer live
wp option delete cpm_opl_test_mode     # auto-detect
```

### 3. Bedanktpagina

Maak in WP een Pagina met slug `aanmelden-bedankt`. Mollie redirect klanten daar na betaling met `?enr=ID` query param.

Voorbeeld inhoud:
```
Bedankt voor je betaling! Je inschrijving is in behandeling.
We sturen je binnen een paar minuten een bevestiging per e-mail.
```

### 4. Cohort aanmaken

`wp-admin → Opleidingen → Nieuw cohort`

Velden:
| Veld | Voorbeeld |
|---|---|
| Titel | "PMU wenkbrauwen 6-daags — start 4 mei 2026" |
| Startdatum | 2026-05-04 |
| Totale prijs (centen) | 595000 (= € 5.950) |
| Aanbetaling (centen) | 125000 (= € 1.250) |
| Max. termijnen | 3 |
| Max. studenten | 5 |
| Locatie | "Korte Hoogstraat 29A, Vlaardingen" |

### 5. Aanmeldingspagina maken

Maak een Pagina (bv. `/aanmelden-pmu-wenkbrauwen/`) met de shortcode:

```
[cpm_opleiding_aanmelden cohort_id="123"]
```

Vervang `123` door het cohort post-ID (zie URL in admin).

### 6. Cron check

WP Cron loopt op page-load. Voor betrouwbaardere reminders, zet een echte cron op je server:

```cron
*/5 * * * * curl -s https://www.coconpermanentemakeup.nl/wp-cron.php?doing_wp_cron > /dev/null
```

(In `wp-config.php` zet je dan `define('DISABLE_WP_CRON', true);`.)

## REST endpoints

| Methode | Pad | Auth | Doel |
|---|---|---|---|
| POST | `/wp-json/cpm/v1/checkout` | publiek (nonce + honeypot + rate-limit) | Inschrijving aanmaken |
| POST | `/wp-json/cpm/v1/webhook` | publiek (Mollie roept aan) | Status-update na betaling |

## DB-tables

| Tabel | Doel |
|---|---|
| `{prefix}cpm_enrollments` | 1 rij per inschrijving (cohort + student + plan) |
| `{prefix}cpm_payments` | 1 rij per termijn (bedrag + due_date + Mollie link) |

Beide auto-aangemaakt door `DB::maybe_migrate()` op `plugins_loaded`.

## Statussen

**Enrollment:**
- `pending` — net aangemaakt, Mollie nog niet aangeroepen
- `awaiting_first_payment` — payment links aangemaakt, klant moet termijn 1 nog betalen
- `active` — minimaal termijn 1 betaald
- `completed` — alle termijnen betaald
- `mollie_error` / `config_error` — iets fout, check error_log

**Payment (Mollie status):**
- `created` — link bij Mollie aangemaakt, nog niet geopend
- `open` — klant heeft de link bekeken
- `paid` / `authorized` — betaald
- `expired` / `canceled` / `failed`

## Bekende beperkingen (V1)

1. **Geen automatische incasso** — elke termijn vereist actieve klant-actie via betaallink. Voor SEPA Direct Debit moet de Mollie WC plugin SEPA DD activeren + we moeten upgraden naar Mandate-flow.
2. **Geen WC-orders** — bewust, voorkomt dependency op WC REST keys. Klanten zien hun inschrijving niet in "Mijn account" tot we WC-orders introduceren.
3. **Bedanktpagina is placeholder** — toont nu alleen `?enr=ID` in URL, geen content.
4. **Geen admin-mailmeldingen** — alleen klant krijgt mail. Voor admin-notificaties: voeg `Emails::send_admin_notification()` toe en hook in.

## Volgende iteraties

- [ ] WC-order link (zodat reporting in WC werkt)
- [ ] SEPA Direct Debit flow (eerste betaling = mandaat, volgende = auto-incasso)
- [ ] Korte-link / QR voor herinneringsmail
- [ ] Admin metrics dashboard (bezetting per cohort, conversion funnel)
- [ ] Annulerings-flow (refund via Mollie API)
