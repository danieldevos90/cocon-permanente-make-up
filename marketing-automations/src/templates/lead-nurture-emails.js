import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
import { config } from '../config.js';

/**
 * Lead nurturing emails - for prospects in the awareness/consideration phase
 */
export const leadNurtureEmails = {
  education: {
    subject: 'Nieuwsgierig naar permanente make-up? Dit moet je weten',
    previewText: 'Antwoord op de meestgestelde vragen over PMU',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Droom je van vollere wenkbrauwen, een subtiele eyeliner of mooi gekleurde lippen zonder gedoe? Of ben je gewoon nieuwsgierig naar wat permanente make-up voor jou kan betekenen? Dan ben je hier aan het juiste adres.</p>
        
        <p>We snappen dat je misschien nog vragen hebt, helemaal logisch. Daarom hebben we de meestgestelde vragen hieronder voor je verzameld. Mét duidelijke antwoorden, zodat jij precies weet waar je aan toe bent.</p>
        
        <hr style="border: none; border-top: 1px solid #e8e4de; margin: 30px 0;">
        
        <h3>Veelgestelde vragen over permanente make-up (PMU)</h3>
        
        <div style="margin-bottom: 25px;">
          <h4 style="color: #a30077; margin-bottom: 10px;">💉 Doet het pijn?</h4>
          <p style="margin: 0;">Dat verschilt per persoon, maar het valt meestal reuze mee. We gebruiken een verdovende crème, en de meeste klanten zeggen: "het voelt een beetje prikkelend, maar zeker niet heftig".</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h4 style="color: #a30077; margin-bottom: 10px;">⏳ Hoelang blijft het resultaat mooi?</h4>
          <p style="margin: 0;">Wenkbrauwen blijven gemiddeld 1 tot 2 jaar mooi, eyeliner kan zelfs tot 4 jaar blijven zitten en lippen behouden het pigment meestal 2 tot 3 jaar. Wat wél voor iedereen geldt: met een jaarlijkse opfrisbehandeling blijft je PMU er fris, vol en verzorgd uitzien. We sturen je op tijd een herinnering om een touch-up in te plannen, zo blijft je PMU net zo fris en verzorgd als op dag één.</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h4 style="color: #a30077; margin-bottom: 10px;">🩹 Is er hersteltijd nodig?</h4>
          <p style="margin: 0;">Ja, en dat kan soms even spannend aanvoelen. In de eerste week lijkt de kleur vaak donkerder dan je had verwacht, en kunnen de korstjes wat langer blijven zitten dan gehoopt. Veel klanten bellen of mailen ons hierover, maar geen zorgen, dit hoort echt bij het genezingsproces. Rond dag 6 tot 9 laat de huid de korstjes vanzelf los. Daarna heeft het pigment een aantal weken nodig om zich mooi te ontwikkelen. Wees dus niet ongerust, maar bij twijfel kun je altijd contact met ons opnemen.</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h4 style="color: #a30077; margin-bottom: 10px;">✨ En hoe zit het met de nazorg?</h4>
          <p style="margin: 0;">Nazorg is key. Je mag de behandelde huid een tijdje niet nat maken, er niet aan krabben en geen make-up gebruiken tot alles goed genezen is. Na de behandeling krijg je van ons precies uitgelegd wat je moet doen. Mét verzorgingsproducten, zodat je zeker weet dat je het goed aanpakt.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e8e4de; margin: 30px 0;">
        
        <h3>Waarom kiezen voor Cocon Cosmetics?</h3>
        
        <p>Omdat we als één van de meest ervaren PMU-specialisten in Nederland staan voor kwaliteit, precisie en resultaat. Geen standaardbehandeling, maar écht maatwerk – van kleur tot vorm en techniek.</p>
        
        <p>Met jarenlange ervaring, oog voor detail en technieken die passen bij jouw gezicht en stijl. Of je nu kiest voor hairstrokes, ombre, powder brows of een zachte lipkleur: wij zorgen ervoor dat jij stralend en zelfverzekerd de deur uitgaat.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.booking}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 5px;">
            📅 Plan een vrijblijvend consult
          </a>
          <br><br>
          <a href="${config.urls.portfolio}" class="button" style="display: inline-block; background: transparent; border: 2px solid #a89664; color: #a89664; padding: 12px 28px; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 5px;">
            📸 Bekijk ons portfolio
          </a>
        </p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  socialProof: {
    subject: 'Wat andere klanten zeggen over Cocon Cosmetics',
    previewText: 'Lees ervaringen van tevreden klanten',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>
        
        <p>Twijfel je nog over permanente make-up? Of ben je benieuwd hoe andere klanten hun behandeling bij Cocon Cosmetics hebben ervaren? We delen graag een paar reviews. Wie weet zit er iets tussen dat jou net dat extra zetje geeft.</p>
        
        <hr style="border: none; border-top: 1px solid #e8e4de; margin: 30px 0;">
        
        <div style="background-color: #faf8f5; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-style: italic; margin: 0 0 10px 0;">"Wat een mooie salon, professioneel en netjes. Ze weten goed wat ze doen en geven duidelijk uitleg. Superblij met mijn permanente wenkbrauwen!"</p>
          <p style="color: #a30077; margin: 0; font-weight: 600;">– Jennifer ⭐⭐⭐⭐⭐</p>
        </div>
        
        <div style="background-color: #faf8f5; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-style: italic; margin: 0 0 10px 0;">"Ik ben al meerdere keren geweest voor PMU eyeliner en ben elke keer blij met het resultaat. Ze nemen de tijd, werken secuur en het ziet er heel natuurlijk uit."</p>
          <p style="color: #a30077; margin: 0; font-weight: 600;">– Rachel ⭐⭐⭐⭐⭐</p>
        </div>
        
        <div style="background-color: #faf8f5; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-style: italic; margin: 0 0 10px 0;">"Ik heb mijn lippen laten pigmenteren en ben zó tevreden! Geen fletse lippen meer, maar een mooie, frisse kleur. Zelfs zonder make-up zie ik er verzorgd uit."</p>
          <p style="color: #a30077; margin: 0; font-weight: 600;">– Ilse ⭐⭐⭐⭐⭐</p>
        </div>
        
        <div style="background-color: #faf8f5; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-style: italic; margin: 0 0 10px 0;">"Ik kom al jaren bij Cocon en zou nooit meer anders willen. Echte vakvrouwen met oog voor detail!"</p>
          <p style="color: #a30077; margin: 0; font-weight: 600;">– Femke ⭐⭐⭐⭐⭐</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e8e4de; margin: 30px 0;">
        
        <p>We begrijpen dat het best spannend kan zijn om een eerste stap te zetten. Daarom nemen we altijd uitgebreid de tijd voor advies, kleurkeuze en het voortekenen van de vorm. Geen standaard look, maar maatwerk dat past bij jouw gezicht.</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${config.urls.booking}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 5px;">
            📅 Plan je vrijblijvende consult
          </a>
          <br><br>
          <a href="${config.urls.portfolio}" class="button" style="display: inline-block; background: transparent; border: 2px solid #a89664; color: #a89664; padding: 12px 28px; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 5px;">
            📸 Bekijk onze behandelfoto's
          </a>
        </p>
        
        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default leadNurtureEmails;
