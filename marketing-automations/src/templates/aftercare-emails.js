import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';

/**
 * Aftercare emails - sent immediately after treatment
 */
export const aftercareEmails = {
  wenkbrauwen: {
    subject: 'Je behandeling zit erop, zo zorg je goed voor je huid',
    previewText: 'Belangrijke nazorginstructies voor je permanente wenkbrauwen',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Vandaag heb je je permanente wenkbrauwen laten zetten. Om een zo mooi mogelijk resultaat te krijgen, is het belangrijk dat je de nazorginstructies goed opvolgt. De komende dagen is het belangrijk om goed voor je huid te zorgen. Zo behaal je het mooiste resultaat.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>⚠️ Let op:</strong> Je wenkbrauwen zullen de eerste dagen donkerder lijken dan de bedoeling is. Ook kan de huid wat rood zijn of gevoelig aanvoelen. Soms gaat de genezing gepaard met jeuk. Dit hoort allemaal bij het herstelproces.</p>
          <p style="margin-bottom: 0;">Na 6 à 14 dagen laten de korstjes vanzelf los. Soms duurt dit iets langer, dat is volkomen normaal. De echte kleur ontwikkelt zich pas in de weken daarna, dit kan ongeveer 4 weken duren.</p>
        </div>
        
        <h3>Tips voor de eerste dagen:</h3>
        <ul>
          <li>Veeg de wenkbrauwen elk uur af met de meegegeven wattenschijfjes (eerste dag)</li>
          <li>Raak je wenkbrauwen tijdens de genezing zo min mogelijk aan</li>
          <li>Houd de huid droog (dus geen sauna, sporten of zwemmen - let op condens tijdens het douchen)</li>
          <li>Krab niet aan de behandelde huid, de korstjes vallen er vanzelf af</li>
          <li>Gebruik geen make-up of gezichtscrème op de behandelde huid</li>
          <li>Gebruik pas na het loslaten van alle korstjes een paar nachten een dun laagje Bepanthen, dit mag met schone vingers</li>
        </ul>
        
        <p><strong>Vragen of onzeker over hoe het eruitziet?</strong> Neem gerust contact op. Paniek is meestal niet nodig. Je huid is gewoon aan het herstellen!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  eyeliner: {
    subject: 'Je behandeling zit erop, zo zorg je goed voor je huid',
    previewText: 'Belangrijke nazorginstructies voor je permanente eyeliner',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Vandaag heb je je permanente eyeliner laten zetten. Om een zo mooi mogelijk resultaat te krijgen, is het belangrijk dat je de nazorginstructies goed opvolgt.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin-top: 0;">Je ogen kunnen wat gezwollen zijn en ook hier en daar een kleine bloeduitstorting vertonen. Ook kan je eyeliner de eerste dagen intens lijken. <strong>Geen zorgen: dat is volkomen normaal.</strong></p>
          <p style="margin-bottom: 0;">De huid rondom je ogen heeft tijd nodig om te herstellen. Korstjes zullen meestal na 6 tot 14 dagen loslaten. Daarna is de pigmentatie nog niet op zijn best, de kleur ontwikkelt zich geleidelijk in de weken daarna.</p>
        </div>
        
        <h3>Nazorgtips:</h3>
        <ul>
          <li>Koel je ogen de eerste dag intens met het meegegeven coldcompres (in schoon boterhamzakje + tissue). Indien nodig kan je ook de dagen erna koelen. <em>Tip: kijk sterk naar beneden terwijl je koelt, zo koel je de oogleden op de juiste manier</em></li>
          <li>Houd de huid droog en vermijd condens tijdens het douchen</li>
          <li>Krab en trek niet aan de behandelde huid, de korstjes vallen er vanzelf af</li>
          <li>Breng geen make-up of andere crèmes aan op de behandelde huid</li>
        </ul>
        
        <p>Na het loslaten van de korstjes kun je 's avonds een dun laagje Bepanthen aanbrengen. Gebruik hiervoor een wattenstaafje of een schone vingertop.</p>
        
        <p><strong>Vragen of onzeker over hoe het eruitziet?</strong> Neem gerust contact op. Paniek is meestal niet nodig, je huid is gewoon aan het herstellen!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen: {
    subject: 'Je behandeling zit erop, zo zorg je goed voor je huid',
    previewText: 'Belangrijke nazorginstructies voor je permanente lippen',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Wat fijn dat je vandaag bij ons bent geweest voor de PMU-lipbehandeling. Om straks optimaal te kunnen genieten van je nieuwe lipkleur, is de juiste nazorg de komende dagen ontzettend belangrijk.</p>
        
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin-top: 0;">Direct na de behandeling kunnen je lippen wat gezwollen en gevoelig zijn. Er kan wat wondvocht ontstaan en de kleur lijkt in het begin vaak intenser. Laat je daardoor niet verrassen: <strong>dit hoort bij het herstelproces.</strong></p>
          <p style="margin-bottom: 0;">Na 6 tot 9 dagen laten de korstjes vanzelf los, en pas na een aantal weken zie je het uiteindelijke resultaat.</p>
        </div>
        
        <h3>Belangrijke verzorging:</h3>
        <ul>
          <li>Neem wondvocht elk uur weg met de meegegeven wattenschijfjes (eerste dag)</li>
          <li>Houd je lippen droog en raak ze zo min mogelijk aan. Drink met een rietje, probeer tijdens het tandenpoetsen je lippen niet nat te maken</li>
          <li>Geen make-up of andere producten gebruiken op je lippen</li>
          <li>Breng een dun laagje van de meegeleverde Vaseline aan zodra je merkt dat de korstjes bijna beginnen te barsten</li>
        </ul>
        
        <p><strong>Vragen of onzeker over hoe het eruitziet?</strong> Neem gerust contact op. Paniek is meestal niet nodig, je huid is gewoon aan het herstellen!</p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default aftercareEmails;
