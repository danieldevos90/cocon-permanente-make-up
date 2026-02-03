import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';

/**
 * Week follow-up emails - sent 1 week after treatment
 */
export const weekFollowupEmails = {
  wenkbrauwen: {
    subject: 'Je wenkbrauwen verdienen wat extra liefde deze week',
    previewText: 'Hoe gaat het met de genezing? Belangrijke tips voor week 1',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Het is nu een week geleden dat je bent langsgekomen voor een PMU-behandeling. <strong>Hoe gaat het met de genezing?</strong></p>
        
        <p>We weten dat dit een spannende periode kan zijn. Daarom sturen we je graag nog even een korte herinneringsmail met de belangrijkste stappen voor een mooi en langdurig resultaat.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Let op:</strong> Na 6 à 14 dagen laten de korstjes vanzelf los. Soms duurt dit iets langer, dat is volkomen normaal. De echte kleur ontwikkelt zich pas in de weken daarna, dit kan ongeveer 4 weken duren.</p>
        </div>
        
        <h3>Belangrijke tips:</h3>
        <ul>
          <li>Vermijd water, sauna's en intensief sporten zolang de korstjes nog niet losgelaten zijn</li>
          <li>Krab niet aan de korstjes, deze laten vanzelf los</li>
          <li>Soms blijven de korstjes er meer dan 3 weken op zitten. Dan kan je de korstjes voorzichtig losweken tijdens het douchen</li>
          <li>Gebruik de meegegeven Bepanthen zalf voor een paar nachten nadat de korstjes losgelaten zijn</li>
          <li>Vermijd zonlicht en zonnebank, ook in de weken erna, gebruik een SPF50 zodra de huid hersteld is</li>
        </ul>
        
        <div class="tips-box" style="background-color: #fdf0f8; border-left: 4px solid #a30077; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Na 6 tot 9 weken is de perfectiebehandeling.</strong> Die is essentieel om de kleur en vorm bij te werken en het resultaat langdurig mooi te houden.</p>
        </div>
        
        <p>Heb je vragen? Laat het ons weten.</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  eyeliner: {
    subject: 'Je ogen verdienen wat extra liefde deze week',
    previewText: 'Hoe gaat het met je eyeliner? Tips voor de eerste week',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Je hebt een week geleden je permanente eyeliner laten zetten. <strong>Hoe gaat het nu met je ogen?</strong></p>
        
        <p>Zwelling en korstjes zijn normaal in deze fase. We weten dat dit een spannende periode kan zijn. Daarom sturen we je graag nog even een korte herinnering aan de belangrijkste stappen voor een mooi en langdurig resultaat.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;">Je eyeliner kan hier en daar licht lijken. Dit komt doordat de korstjes aan het losraken zijn. Na ruim een week zie je dat ze slanker en lichter zijn geworden.</p>
        </div>
        
        <h3>Een paar belangrijke nazorgtips:</h3>
        <ul>
          <li>Koelen is niet meer nodig</li>
          <li>Vermijd water en intensief sporten wanneer de korstjes nog niet helemaal verdwenen zijn</li>
          <li>Trek niet aan de huid en krab niet aan korstjes</li>
          <li>Vermijd zonlicht en zonnebank, ook in de weken erna, gebruik een SPF50 zodra de huid hersteld is</li>
        </ul>
        
        <p>Gebruik de Bepanthen zalf alleen zoals aangegeven: na het loslaten van de korstjes (meestal na 6 tot 9 dagen) mag je de oogleden enkele nachten dun insmeren. Breng de zalf met een wattenstaafje of een schone vingertop aan en gebruik een klein beetje, een dun laagje is voldoende.</p>
        
        <div class="tips-box" style="background-color: #fdf0f8; border-left: 4px solid #a30077; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Na ongeveer 6 weken</strong> kom je weer langs voor een perfectiebehandeling. Tijdens deze behandeling brengen we waar nodig nog verfijningen aan, zodat je eyeliner nóg mooier tot zijn recht komt.</p>
        </div>
        
        <p>Heb je vragen? Neem dan contact met ons op.</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen: {
    subject: 'Je lippen verdienen wat extra liefde deze week',
    previewText: 'Hoe gaat het met je lippen? Belangrijke tips voor week 1',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Je lipbehandeling is nu een week geleden. <strong>Hoe gaat het tot nu toe?</strong></p>
        
        <p>We weten dat dit een spannende periode kan zijn. Daarom sturen we je graag nog even een korte herinnering aan de belangrijkste stappen voor een mooi en langdurig resultaat.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;">In deze fase is het normaal dat je lippen wat droog of gevoelig aanvoelen, lichte korstjes loslaten en de kleur tijdelijk wat lichter lijkt. De huid heeft nog een paar weken nodig om de pigmentatie volledig op te nemen. Na die periode zie je de definitieve kleur en vorm het best tot zijn recht komen.</p>
        </div>
        
        <h3>Een paar belangrijke nazorgtips:</h3>
        <ul>
          <li>Raak je lippen zo min mogelijk aan zolang er nog korstjes op zitten</li>
          <li>Houd je lippen droog en vermijd sauna's, zwembaden en sporten</li>
          <li>Breng een dun laagje van de meegeleverde Vaseline aan zodra je merkt dat de korstjes bijna beginnen te barsten en loslaten</li>
          <li>Vermijd zonlicht en zonnebank, ook in de weken erna, gebruik een SPF50 zodra de huid hersteld is</li>
        </ul>
        
        <div class="tips-box" style="background-color: #fdf0f8; border-left: 4px solid #a30077; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Na ongeveer 6 weken</strong> kom je langs voor een perfectiebehandeling. Tijdens deze afspraak brengen we extra pigment aan waar nodig, zodat jouw gewenste kleur volledig tot zijn recht komt.</p>
        </div>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default weekFollowupEmails;
