# Cocon Cosmetics Marketing Automations

Geautomatiseerde email marketing voor PMU behandelingen met Mailchimp.

## Features

- **Behandeling Journey Emails**: Automatische email flow na elke behandeling
  - Direct na behandeling: Nazorg instructies
  - Na 1 week: Follow-up en tips
  - Na 3 weken: Review verzoek
  - Na 6 weken: Perfectiebehandeling herinnering

- **Lead Nurturing**: Educatieve emails voor prospects
  - FAQ email met veelgestelde vragen
  - Social proof met klantreviews

- **3 Behandeltypes**: Wenkbrauwen, Eyeliner, Lippen

## Installatie

```bash
cd marketing-automations
npm install
```

## Configuratie

1. Kopieer `.env.example` naar `.env`:
```bash
cp .env.example .env
```

2. Vul je Mailchimp API key in (staat al in je `.env`):
```env
API_KEY_MAILCHIMP=your-api-key-here
```

3. Vind je Audience/List ID:
```bash
node src/cli.js lists
```

4. Voeg de List ID toe aan `.env`:
```env
MAILCHIMP_LIST_ID=your-list-id
```

5. Setup merge fields in Mailchimp:
```bash
node src/cli.js setup
```

## Gebruik

### Test de connectie
```bash
node src/cli.js test
```

### Bekijk beschikbare templates
```bash
node src/cli.js templates
```

### Preview een email
```bash
# In terminal
node src/cli.js preview -t wenkbrauwen -s aftercare

# Opslaan als HTML bestand
node src/cli.js preview -t wenkbrauwen -s aftercare -o preview.html
```

### Upload templates naar Mailchimp
```bash
# Toon wat er zou gebeuren zonder wijzigingen
node src/cli.js templates-sync --dry-run

# Upload alle templates naar Mailchimp
node src/cli.js templates-sync

# Alleen een specifieke stage of behandeling
node src/cli.js templates-sync --stage aftercare --treatment wenkbrauwen

# Gebruik een eigen naam-prefix of folder ID
node src/cli.js templates-sync --prefix "Cocon PMU - " --folder 123456789
```

Dit commando maakt (of werkt bij) Mailchimp templates op basis van de lokale HTML-bestanden. Handig wanneer je de templates hier aanpast: run `templates-sync` opnieuw om de wijzigingen naar Mailchimp te pushen.

### Registreer een behandeling
```bash
node src/cli.js register \
  -e "client@email.nl" \
  -f "Anna" \
  -t wenkbrauwen \
  -d "2026-02-03"
```

Dit:
- Voegt de klant toe aan Mailchimp (of update bestaande)
- Slaat behandeltype en datum op
- Plant de email journey

### Stuur een email
```bash
# Test email (naar jezelf)
node src/cli.js send \
  -e "client@email.nl" \
  -f "Anna" \
  -t wenkbrauwen \
  -s aftercare \
  --test

# Live campaign sturen
node src/cli.js send \
  -e "client@email.nl" \
  -f "Anna" \
  -t wenkbrauwen \
  -s aftercare
```

### Bekijk subscriber info
```bash
node src/cli.js subscriber -e "client@email.nl"
```

### Bekijk email journey
```bash
node src/cli.js journey -t wenkbrauwen
```

## Email Stages

| Stage | Dag | Beschrijving |
|-------|-----|--------------|
| `aftercare` | 0 | Nazorg instructies direct na behandeling |
| `weekFollowup` | 7 | Follow-up na 1 week |
| `reviewRequest` | 21 | Vraag om een review |
| `touchupReminder` | 42 | Herinnering perfectiebehandeling |

## Programmatisch Gebruik

```javascript
import { 
  registerTreatment, 
  sendJourneyEmail,
  previewEmail 
} from './src/index.js';

// Registreer behandeling
const result = await registerTreatment({
  email: 'client@email.nl',
  firstName: 'Anna',
  treatmentType: 'wenkbrauwen',
  treatmentDate: new Date(),
});

// Stuur email
await sendJourneyEmail({
  email: 'client@email.nl',
  firstName: 'Anna',
  treatmentType: 'wenkbrauwen',
  stage: 'aftercare',
});

// Preview template
const preview = previewEmail('aftercare', 'wenkbrauwen', { firstName: 'Anna' });
console.log(preview.html);
```

## Webhook Integratie (Toekomst)

Voor automatische triggers kun je een webhook endpoint maken:

```javascript
// Example Express endpoint
app.post('/webhook/treatment', async (req, res) => {
  const { email, firstName, treatmentType } = req.body;
  
  await registerTreatment({
    email,
    firstName,
    treatmentType,
    treatmentDate: new Date(),
  });
  
  // Stuur aftercare email direct
  await sendJourneyEmail({
    email,
    firstName,
    treatmentType,
    stage: 'aftercare',
  });
  
  res.json({ success: true });
});
```

## Mappenstructuur

```
marketing-automations/
├── src/
│   ├── cli.js                 # Command-line interface
│   ├── config.js              # Configuratie
│   ├── index.js               # Hoofd exports
│   ├── mailchimp-client.js    # Mailchimp API wrapper
│   ├── automation-manager.js  # Journey management
│   └── templates/
│       ├── index.js           # Template exports
│       ├── base-template.js   # HTML basis template
│       ├── aftercare-emails.js
│       ├── week-followup-emails.js
│       ├── review-request-emails.js
│       ├── touchup-reminder-emails.js
│       └── lead-nurture-emails.js
├── .env                       # Configuratie (niet in git)
├── .env.example               # Voorbeeld configuratie
├── package.json
└── README.md
```

## Aanpassen

### Nieuwe template toevoegen

1. Maak een nieuw bestand in `src/templates/`
2. Importeer en exporteer in `src/templates/index.js`
3. Voeg toe aan `automation-manager.js` indien nodig

### Email timing aanpassen

In `src/config.js`:
```javascript
emailTiming: {
  aftercare: 0,        // Direct
  weekFollowup: 7,     // Na 7 dagen
  reviewRequest: 21,   // Na 21 dagen
  touchupReminder: 42, // Na 42 dagen
},
```

### URLs aanpassen

In `.env`:
```env
REVIEW_URL=https://jouw-site.nl/reviews
BOOKING_URL=https://jouw-site.nl/afspraak
PORTFOLIO_URL=https://jouw-site.nl/portfolio
```

## Support

Bij vragen over de Mailchimp API: [Mailchimp API Docs](https://mailchimp.com/developer/)
