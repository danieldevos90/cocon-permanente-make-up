# AFA Message Platform — multi-tenant

Eén Meta-app (**AFA - Message Platform**), meerdere klanten (tenants).

## URLs (production)

| URL | Doel |
|-----|------|
| `/login` | Dashboard-wachtwoord |
| `/platform` | Tenant-kiezer |
| `/t/cocon/dashboard` | Cocon dashboard + Mailchimp sync |
| `/t/marketing-test/dashboard` | Algemene WhatsApp marketing automation test |
| `/whatsapp/onboard?client=cocon&token=…` | Embedded Signup per tenant |
| `/api/whatsapp-webhook` | Eén webhook; routing via `phone_number_id` |

## Nieuwe tenant

1. Voeg `whatsapp-automations/config/clients/mijn-klant.json` toe.
2. Deploy.
3. Open onboard-link vanaf `/platform` of:
   `https://marketing-automations-kohl.vercel.app/whatsapp/onboard?client=mijn-klant&token=WHATSAPP_ONBOARD_ACCESS_TOKEN`
4. Na signup: WABA + phone + token worden opgeslagen in Redis (`wa:tenant:mijn-klant`).

## API (JWT)

```http
POST /api/v1/whatsapp/messages
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "client": "cocon",
  "phone": "31614509296",
  "stage": "aftercare",
  "treatmentType": "wenkbrauwen"
}
```

```http
GET /api/v1/whatsapp/connection?client=cocon
Authorization: Bearer <jwt>
```

Header alternatief: `X-AFA-Client: cocon`

## Redis-sleutels

- `wa:tenant:{clientId}` — Meta credentials
- `wa:phone:{phoneNumberId}` → clientId
- `wa:{clientId}:log:*` — outbound log
- `wa:{clientId}:inbox:*` — inbound webhook
- `wa:{clientId}:schedule` — geplande sends

## Testtenant (`marketing-test`)

Algemene WhatsApp marketing automation test — geen Mailchimp/Salonized. Gebruik voor onboard, dry-run, webhook en JWT API (`client=marketing-test`). Oude URL `/t/demo-salon/*` redirect naar `/t/marketing-test/*`.

## Cocon-specifiek (Mailchimp + Salonized)

- **Mailchimp** en **Salonized** draaien op **globale** Vercel-env (`API_KEY_MAILCHIMP`, `MAILCHIMP_LIST_ID`, Salonized-credentials in `marketing-automations`).
- Alleen tenants met `integrations.mailchimp: true` in `config/clients/{id}.json` tonen Mailchimp/cron/e-mail op het dashboard (standaard: alleen `cocon`).
- Cron (`/api/cron/...`) en Mailchimp-sync zijn **niet** per tenant gesplitst; nieuwe klanten gebruiken voorlopig alleen WhatsApp via JWT + onboard.
- Later: per-tenant Mailchimp API-key/list-id in Redis of env-prefix (`COCON_MAILCHIMP_*`).

```json
// config/clients/cocon.json
"integrations": { "mailchimp": true, "salonized": true }
```

```json
// config/clients/marketing-test.json — WhatsApp-only testtenant
"integrations": { "mailchimp": false, "salonized": false }
```
