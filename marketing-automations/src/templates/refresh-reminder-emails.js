import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';
import { config } from '../config.js';

const bookingUrl = config.urls.booking;

/**
 * Refresh reminder emails (Template2 + Template5)
 * Wenkbrauwen: 6m + 10m | Eyeliner: 6m + 2y | Lippen: 6m + 1.5y
 */
export const refreshReminderEmails = {
  wenkbrauwen6m: {
    subject: 'Zo blijft je PMU mooi, nu en straks',
    previewText: 'Een klein momentje voor jezelf en je uitstraling',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Enige tijd geleden heb jij een behandeling bij ons gehad voor je permanente make-up. Grote kans dat je er nog elke dag van geniet. En dat is precies de bedoeling.</p>

        <p>Wat je misschien nog niet merkt, maar wat wél gebeurt: vanaf dit punt begint het pigment zich heel langzaam terug te trekken in de huid. Dat is een natuurlijk proces en verschilt per persoon. Je PMU is nu vaak nog mooi in balans, maar dit is het moment waarop goed onderhoud straks het verschil maakt.</p>

        <p>Veel klanten gebruiken dit moment ook om even verder te kijken.</p>

        <p>Misschien heb je ooit gedacht aan een zachte eyeliner voor extra expressie, of aan PMU lippen voor meer frisheid zonder make-up. Behandelingen die elkaar versterken en samen zorgen voor een nog completer resultaat.</p>

        <p>Wanneer je straks een opfrisbehandeling voor je wenkbrauwen boekt en deze combineert met een nieuwe PMU-behandeling, <strong>ontvang je 10% korting op die extra behandeling.</strong> Een mooie kans om iets toe te voegen, op een moment dat je huid daar perfect voor is.</p>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-style: italic;">"Ik ben al meerdere keren geweest voor PMU eyeliner en ben elke keer blij met het resultaat. Ze nemen de tijd, werken secuur en het ziet er heel natuurlijk uit."</p>
          <p style="margin: 0; color: #a30077; font-weight: 600;">- Rachel (eyeliner)</p>
        </div>

        <p>Wil je alvast vooruit plannen of rustig kijken wat bij je past?<br>
        Je kunt eenvoudig een afspraak maken via ons boekingssysteem.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Heb je je opfrisbehandeling inmiddels al ingepland? Dan mag je deze mail natuurlijk als overbodig beschouwen.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
  wenkbrauwen10m: {
    subject: 'Tijd om je PMU weer op te frissen',
    previewText: 'Voor een resultaat dat net zo mooi blijft als toen',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Waarschijnlijk herken je het inmiddels: je PMU is nog steeds aanwezig, maar iets zachter geworden dan in het begin. Dat is precies het moment waarop een opfrisbehandeling het verschil maakt.</p>

        <p>Na ongeveer 10 tot 11 maanden heeft het pigment zijn natuurlijke vervagingspunt bereikt. Tijdens een opfrisbehandeling brengen we de kleur weer terug in balans, werken we waar nodig kleine details bij en zorgen we ervoor dat alles weer fris en verzorgd oogt, zonder dat het te intens wordt.</p>

        <p>Veel klanten kiezen er op dit moment voor om hun wenkbrauwen te combineren met een extra behandeling, zoals PMU eyeliner of lippen. Niet alleen omdat het mooi samengaat, maar ook omdat het resultaat elkaar versterkt.</p>

        <p>Boek je je wenkbrauw opfrisbehandeling in combinatie met een nieuwe PMU-behandeling, dan <strong>ontvang je 10% korting op die extra behandeling.</strong></p>

        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #a89664;">Review</p>
        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-style: italic;">"Ik heb mijn lippen laten pigmenteren en ben zo tevreden! Geen fletse lippen meer, maar een mooie, frisse kleur. Zelfs zonder make-up zie ik er verzorgd uit."</p>
          <p style="margin: 0; color: #a30077; font-weight: 600;">- Ilse (lippen)</p>
        </div>

        <p>Plan hier eenvoudig je afspraak online. Heb je nog vragen? Neem gerust contact met ons op – we helpen je graag verder.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>

        <p>We zien je graag weer terug.</p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Heb je recent al een opfrisbehandeling ingepland of zelfs gehad? Dan kun je deze mail als niet meer van toepassing beschouwen.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  // Eyeliner: 6 maanden (cross-sell) + 2 jaar (opfris) – Template5
  eyeliner6m: {
    subject: 'Hoe gaat het met je permanente eyeliner?',
    previewText: 'Een momentje voor jezelf en je uitstraling',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Enige tijd geleden heb jij een behandeling bij ons gehad voor je permanente eyeliner. Grote kans dat je 'm inmiddels niet meer kunt wegdenken. We horen vaak dat klanten nog blijer zijn dan ze vooraf verwachtten. Pas als je het eenmaal hebt, merk je hoeveel verschil het maakt.</p>

        <p>En juist omdat de basis nu zo mooi staat, merken we dat veel klanten op een gegeven moment denken: als dit al zoveel rust geeft, wat zou PMU voor mijn wenkbrauwen of lippen dan doen?</p>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Misschien is PMU wenkbrauwen iets voor jou?</p>
          <p style="margin: 0 0 12px 0;">Wenkbrauwen geven vaak net wat meer balans in je gezicht waardoor je minder hoeft bij te tekenen en je look vanzelf klopt.</p>
          <a href="${bookingUrl}" style="color: #a30077;">Meer weten over PMU wenkbrauwen</a>
        </div>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Misschien is PMU lippen iets voor jou?</p>
          <p style="margin: 0 0 12px 0;">Lippen geven vaak extra frisheid en definitie waardoor je er wakkerder uitziet zelfs zonder lipstick.</p>
          <a href="${bookingUrl}" style="color: #a30077;">Lees meer over PMU lippen</a>
        </div>

        <p>Nieuwsgierig geworden? Plan je afspraak. We bespreken vooraf uitgebreid wat je wil en wat bij je gezicht past en pas daarna starten we met de behandeling.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Vind je het fijn om eerst kennis te maken? Dan kun je ook een info consult boeken.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
  eyeliner30m: {
    subject: 'Tijd voor een opfris van je PMU eyeliner?',
    previewText: 'Voor een resultaat dat net zo mooi blijft als toen',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Het is inmiddels ongeveer 2 jaar geleden dat je bij ons bent geweest voor je permanente make-up eyeliner. Grote kans dat je er nog steeds veel plezier van hebt, maar dit is wél het moment waarop we vaak zien dat de eyeliner langzaam kan gaan veranderen.</p>

        <p>Hoe dat komt? Pigment ligt in de huid en wordt door je lichaam heel geleidelijk afgebroken en afgevoerd. Daardoor kan de eyeliner in de loop van de tijd iets zachter worden, minder strak ogen of op sommige plekjes wat lichter lijken. Hoe snel dat gaat verschilt per persoon en hangt onder andere af van je huidtype, je levensstijl en bijvoorbeeld zonblootstelling en huidverzorging.</p>

        <p>Veel klanten hebben ergens tussen de 2 en de 4 jaar een keer een opfrisbehandeling nodig om de intensiteit en strakke vorm weer mooi op te halen.</p>

        <p>Merk je dat je eyeliner minder aanwezig is dan voorheen of wil je 'm gewoon weer helemaal fris hebben? Dan kun je nu een opfrisafspraak inplannen.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je opfrisafspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Twijfel je of het al nodig is? App ons gerust met een foto van je eyeliner. Dan geven we je graag eerlijk en persoonlijk advies.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen6m: {
    subject: 'Hoe gaat het met je permanente lippen?',
    previewText: 'Een momentje voor jezelf en je uitstraling',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Enige tijd geleden heb jij een behandeling bij ons gehad voor je permanente make-up lippen. Grote kans dat je er inmiddels elke dag plezier van hebt. Je gezicht oogt frisser zonder lipstick en je lippen hebben net wat meer definitie waardoor je look vanzelf klopt. We horen vaak van klanten dat ze achteraf denken: had ik dit maar eerder gedaan.</p>

        <p>En juist omdat je basis nu zo mooi staat, merken we dat veel klanten op een gegeven moment denken: als dit al zoveel rust geeft, wat zou PMU voor mijn wenkbrauwen of eyeliner dan doen?</p>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Misschien is PMU wenkbrauwen iets voor jou?</p>
          <p style="margin: 0 0 12px 0;">Wenkbrauwen geven vaak net wat meer balans in je gezicht waardoor je minder hoeft bij te tekenen en je look vanzelf klopt.</p>
          <a href="${bookingUrl}" style="color: #a30077;">Meer weten over PMU wenkbrauwen</a>
        </div>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Misschien is PMU eyeliner iets voor jou?</p>
          <p style="margin: 0 0 12px 0;">Eyeliner geeft je blik meer expressie en laat je ogen spreken zonder dat je elke ochtend hoeft te tekenen.</p>
          <a href="${bookingUrl}" style="color: #a30077;">Meer weten over PMU eyeliner</a>
        </div>

        <p>Nieuwsgierig geworden? Plan je afspraak. We bespreken vooraf uitgebreid wat je wil en wat bij je gezicht past en pas daarna starten we met de behandeling.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je afspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Vind je het fijn om eerst kennis te maken? Dan kun je ook een info consult boeken.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
  lippen10m: {
    subject: '10 maanden geleden: dit is hét moment voor je lip-opfris (met korting)',
    previewText: 'Profiteer van een lager tarief als je binnen 1 jaar opfrist',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Het is nu ongeveer 10 maanden geleden dat je bij ons bent geweest voor je permanente make-up voor je lippen. Bij veel mensen is dit het punt waarop de kleur wat zachter kan worden of iets minder gelijkmatig kan ogen. Dat is normaal. Pigment wordt namelijk heel geleidelijk door je huid afgebroken en afgevoerd en hoe snel dat gaat verschilt per persoon.</p>

        <p>Daarom tippen we je nu alvast. Laat je je lippen binnen 1 jaar opfrissen dan profiteer je van een lager tarief dan na 1 jaar.</p>

        <div class="tips-box" style="background-color: #faf8f5; border-left: 4px solid #a89664; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">Opfrissen lippen</p>
          <table role="presentation" border="0" cellpadding="4" cellspacing="0" style="font-size: 15px; width: 100%;">
            <tr><td>Lipline</td><td>binnen 1 jaar <strong>&euro;200</strong></td><td>na 1 jaar &euro;260</td></tr>
            <tr><td>Ombr&eacute;</td><td>binnen 1 jaar <strong>&euro;215</strong></td><td>na 1 jaar &euro;330</td></tr>
            <tr><td>Lip blush</td><td>binnen 1 jaar <strong>&euro;230</strong></td><td>na 1 jaar &euro;350</td></tr>
            <tr><td>Full lips</td><td>binnen 1 jaar <strong>&euro;260</strong></td><td>na 1 jaar &euro;390</td></tr>
          </table>
        </div>

        <p>Wil je je lipkleur weer net zo fris als in het begin? Dan is dit een slim moment om je opfrisafspraak te plannen zodat je binnen het jaar valt.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je opfrisafspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },

  lippen18m: {
    subject: 'Is het tijd voor een opfris van je lippen?',
    previewText: 'Voor een resultaat dat net zo mooi blijft als toen',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Het is inmiddels ongeveer 1,5 jaar geleden dat je bij ons bent geweest voor je permanente make-up lippen. Voor veel klanten is dit het moment waarop een opfrisbehandeling het resultaat weer helemaal fris kan maken.</p>

        <p>Waarom verschilt dat zo per persoon? Pigment wordt in de loop van de tijd heel geleidelijk door je huid afgebroken en afgevoerd. Daardoor kan de kleur zachter worden, iets minder gelijkmatig ogen of wat sneller vervagen aan de randen. Hoe snel dat gebeurt hangt onder andere af van je huidtype, je levensstijl en bijvoorbeeld zonblootstelling en huidverzorging.</p>

        <p>Bij de één blijft PMU lippen moeiteloos twee tot tweeënhalf jaar prachtig. Bij de ander is een opfris rond 1,5 jaar al precies wat nodig is om de kleur en definitie weer mooi op te halen.</p>

        <p>Merk je dat je lippen minder kleur hebben dan in het begin of wil je het resultaat gewoon weer net zo fris als toen? Dan kun je nu een opfrisafspraak plannen.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button" style="display: inline-block; background-color: #a30077; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 500;">
            Plan je opfrisafspraak
          </a>
        </p>

        <p>Warme groet,<br>
        Het team van Cocon Cosmetics</p>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">P.S. Twijfel je of het al nodig is? App ons gerust met een foto van je lippen. Dan geven we je graag eerlijk en persoonlijk advies.</p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default refreshReminderEmails;

