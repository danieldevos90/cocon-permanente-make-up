import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
import { config } from '../config.js';

/**
 * Touch-up/Perfectiebehandeling reminder emails - sent ~6 weeks after treatment
 */
export const touchupReminderEmails = {
  wenkbrauwen: {
    subject: 'Tijd voor de finishing touch?',
    previewText: 'Plan je gratis perfectiebehandeling in',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Ben jij al helemaal gewend aan je wenkbrauwen? We horen vaak van klanten dat het zo gezichtsbepalend is dat de complimenten binnenstromen.</p>
        
        <p>Uiteraard willen wij dat jouw wenkbrauwen er perfect uitzien. Daarom willen we je graag zien voor een <strong>Perfectiebehandeling</strong>.</p>
        
        <div class="tips-box" style="background-color: #fdf0f8; border-left: 4px solid #a30077; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;">Tijdens deze behandeling frissen we de kleur op en perfectioneren we de vorm, zodat je langdurig van het mooiste resultaat geniet. <strong>Deze behandeling bieden wij gratis aan!</strong></p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.booking}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Wist je dat...</strong> we ook permanente eyeliner en lippen aanbieden? Als je benieuwd bent naar deze behandelingen, neem gerust contact met ons op. We vertellen je er graag meer over!</p>
        </div>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  eyeliner: {
    subject: 'Tijd voor de perfectiebehandeling',
    previewText: 'Maak je eyeliner resultaat compleet',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Nu je eyeliner goed zit, is dit hét moment om het resultaat helemaal af te maken met een <strong>perfectiebehandeling</strong>.</p>
        
        <p>Om het resultaat langdurig mooi te houden, is een perfectiebehandeling een waardevolle vervolgstap. Tijdens deze behandeling werken we de kleur en hapjes bij, zodat je eyeliner nóg beter aansluit bij jouw wensen.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;">Het is ook een goed moment om eventuele kleine oneffenheden weg te werken die tijdens het genezingsproces zijn ontstaan. De meeste klanten ervaren dat hun eyeliner na een touch-up niet alleen langer mooi blijft, maar ook natuurlijker oogt.</p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.booking}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>
        
        <p>Ben je nieuwsgierig naar andere permanente make-up behandelingen, zoals lippen of wenkbrauwen? We vertellen je er graag meer over tijdens je volgende bezoek of neem alvast contact met ons op.</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen: {
    subject: 'Tijd voor de perfectiebehandeling',
    previewText: 'Maak je lipkleur helemaal compleet',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Wil je optimaal blijven genieten van je nieuwe lipkleur? Dan is de touch-up na 6 weken <strong>dé stap</strong> om het resultaat langdurig mooi te houden.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;">Tijdens deze behandeling brengen we extra pigment aan, maken we de kleur voller of frisser, en werken we kleine oneffenheden bij. Zo krijg je het mooiste en meest egale resultaat.</p>
        </div>
        
        <p>Een touch-up is vooral belangrijk bij PMU lippen, omdat de huid vaak iets minder pigment vasthoudt na de eerste behandeling. <strong>Het eindresultaat is na deze tweede sessie echt compleet.</strong></p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.booking}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>
        
        <p>Ben je nieuwsgierig naar onze andere behandelingen, zoals eyeliner of wenkbrauwen? Laat het weten – we adviseren je graag!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default touchupReminderEmails;
