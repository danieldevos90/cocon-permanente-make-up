# Salonized iCal – alle beschikbare data

Overzicht van alle velden en data die uit de Salonized appointments iCal-feed komen.

**Feed-URL:** `https://app.salonized.com/appointments.ics?auth_token=...`

---

## 1. Calenderniveau (VCALENDAR)

| Veld      | Waarde / betekenis |
|-----------|--------------------|
| VERSION   | `2.0`              |
| PRODID    | `icalendar-ruby`   |
| CALSCALE  | `GREGORIAN`        |
| METHOD    | `PUBLISH`          |

---

## 2. Per afspraak (VEVENT) – alle velden

### UID
- **Type:** string (UUID)
- **Aanwezig:** bij elk event (1129×)
- **Betekenis:** unieke id van de afspraak
- **Voorbeeld:** `533b8696-3127-4aeb-bccc-931f6326d288`
- **Gebruik:** deduplicatie, sync, koppelen met Salonized

---

### DTSTART
- **Type:** datum-tijd
- **Parameters:** `TZID=Europe/Amsterdam`
- **Formaat:** `YYYYMMDDTHHMMSS` of `YYYYMMDDTHHMM` (lokaal, geen Z)
- **Aanwezig:** bij elk event (1129×)
- **Voorbeeld:** `20260217T154500` = 17 feb 2026, 15:45 Amsterdam
- **Gebruik:** starttijd afspraak, sorteren, “laatste afspraak”-datum

---

### DTEND
- **Type:** datum-tijd
- **Parameters:** `TZID=Europe/Amsterdam`
- **Formaat:** idem als DTSTART
- **Aanwezig:** bij elk event (1129×)
- **Voorbeeld:** `20260217T163000`
- **Gebruik:** eindtijd, duur

---

### SUMMARY
- **Type:** string (behandeling/type afspraak)
- **Aanwezig:** bij elk event (1129×)
- **Unieke waarden:** ~166 verschillende
- **Voorbeelden:**
  - `Opfrisbeh WB binnen 1 jaar - 3D`
  - `Nieuwe behandeling wenkbrauwen - aanbetaling`
  - `Perfectiebehandeling wenkbrauwen`
  - `Brow tint + shape`
  - `Laserbehandeling PMU - 3e behandeling`
  - `Opruimen & Afsluiten` / `♡` (interne blokken)
  - `Blok`, `pauze`, `Anwar aanwezig`, etc. (intern)
- **Gebruik:** type behandeling, filteren klant vs intern

---

### DESCRIPTION
- **Type:** vrije tekst (vaak meerdere regels, `\n` escaped)
- **Aanwezig:** bij bijna elk event (1115×)
- **Lengte:** min 8, gem ~25, max 248 tekens
- **Structuur (bij klantafspraaken):**
  - **Eerste regel:** meestal **naam van de klant** (bijv. `Tiny Schriks`, `Linda van der Ploeg`)
  - **Regels daarna:** notities (bijv. `laatste mogelijkheid voor gratis perfectie`, postcode, “na laser”, etc.)
- **Interne events:** bv. `Opruimen & Afsluiten`, `Specialist Sina`, `Cocon Cosmetics`
- **Let op:** geen e-mailadressen in de feed; soms postcode (NL-formaat) in notities
- **Gebruik:** klantnaam (eerste regel), eventueel notities

---

### LAST-MODIFIED
- **Type:** datum-tijd (UTC, eindigt op Z)
- **Formaat:** `YYYYMMDDTHHMMSSZ`
- **Aanwezig:** bij elk event (1129×)
- **Voorbeeld:** `20260217T165720Z`
- **Gebruik:** wijzigingsdatum afspraak, incremental sync

---

### DTSTAMP
- **Type:** datum-tijd (UTC)
- **Formaat:** `YYYYMMDDTHHMMSSZ`
- **Aanwezig:** bij elk event (1129×)
- **Voorbeeld:** `20260224T141558Z`
- **Gebruik:** tijdstip van genereren van de feed / event

---

### RRULE (optioneel)
- **Type:** recurrence rule (terugkeerpatroon)
- **Aanwezig:** bij 60 events (terugkerende blokken/pauzes)
- **Voorbeelden:**
  - `FREQ=WEEKLY;INTERVAL=1;BYDAY=SA`
  - `FREQ=WEEKLY;INTERVAL=2;BYDAY=TU`
- **Gebruik:** herhalende interne afspraken; voor “laatste klantafspraak” meestal niet nodig (vaak geen RRULE bij echte klantafspraken)

---

## 3. Wat er níet in de feed zit

- **Geen e-mailadres** van de klant
- **Geen telefoonnummer**
- **Geen klant-id** (alleen UID van de afspraak)
- **Geen product-/prijsinformatie**
- **Geen medewerker/specialist** als apart veld (soms in DESCRIPTION bij interne events, bv. “Specialist Sina”)

---

## 4. Samenvatting voor sync / Mailchimp

| Doel                         | Beschikbaar in iCal? | Opmerking                                      |
|-----------------------------|----------------------|------------------------------------------------|
| Datum laatste afspraak      | Ja                   | `DTSTART` van laatste event per klantnaam     |
| Klantnaam                   | Ja (afgeleid)        | Eerste regel van `DESCRIPTION`                |
| Type behandeling            | Ja                   | `SUMMARY`                                      |
| Unieke afspraak-id          | Ja                   | `UID`                                         |
| E-mail (voor Mailchimp)     | Nee                  | Moet uit andere bron (Salonized export/API)   |
| Match klant ↔ Mailchimp     | Alleen op naam       | Of via externe mapping naam/klant → e-mail    |

---

## 5. Aantallen (op moment van scrapen)

- **Totaal events:** 1129
- **Events met DESCRIPTION:** 1115
- **Events met RRULE:** 60
- **Unieke SUMMARY-waarden:** ~166
- **Tijdzone:** alle tijden `TZID=Europe/Amsterdam` (behalve DTSTAMP/LAST-MODIFIED in UTC)

Dit document is gegenereerd op basis van de live iCal-feed; aantallen kunnen bij een nieuwe fetch licht afwijken.
