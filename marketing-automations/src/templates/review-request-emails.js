import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
import { config } from '../config.js';

/**
 * Review request emails - sent after healing (~3 weeks)
 */
export const reviewRequestEmails = {
  wenkbrauwen: {
    subject: 'Blij met je wenkbrauwen? Laat het ons weten!',
    previewText: 'Deel je ervaring en help anderen bij hun keuze',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>We hopen dat je blij bent met het resultaat van je permanente wenkbrauwen.</p>
        
        <p>We waarderen het als je je ervaring met ons deelt. Dit helpt niet alleen ons, maar ook anderen die een behandeling overwegen.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.review}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Laat je review achter
          </a>
        </p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Wist je dat...</strong> je bij ons ook terecht kunt voor permanente lippen of eyeliner? We geven je graag persoonlijk advies over wat bij jou past.</p>
        </div>
        
        <p>Dank je wel alvast!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Vertel het ook gerust aan je familie en vrienden.
        </p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  eyeliner: {
    subject: 'Blij met je eyeliner? Laat het ons weten!',
    previewText: 'Deel je ervaring en help anderen bij hun keuze',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>We hopen dat je blij bent met het resultaat van je permanente eyeliner.</p>
        
        <p>We waarderen het als je je ervaring met ons deelt. Dit helpt niet alleen ons, maar ook anderen die een behandeling overwegen.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.review}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Laat je review achter
          </a>
        </p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Wist je dat...</strong> je bij ons ook terecht kunt voor permanente lippen of wenkbrauwen? We geven je graag persoonlijk advies over wat bij jou past.</p>
        </div>
        
        <p>Dank je wel alvast!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Vertel het ook gerust aan je familie en vrienden.
        </p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen: {
    subject: 'Blij met je lippen? Laat het ons weten!',
    previewText: 'Deel je ervaring en help anderen bij hun keuze',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>We hopen dat je blij bent met het resultaat van je permanente make-up lippen.</p>
        
        <p>We waarderen het als je je ervaring met ons deelt. Dit helpt niet alleen ons, maar ook anderen die een behandeling overwegen.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.review}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Laat je review achter
          </a>
        </p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Wist je dat...</strong> je bij ons ook terecht kunt voor permanente eyeliner of wenkbrauwen? We geven je graag persoonlijk advies over wat bij jou past.</p>
        </div>
        
        <p>Dank je wel alvast!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Vertel het ook gerust aan je familie en vrienden.
        </p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default reviewRequestEmails;
