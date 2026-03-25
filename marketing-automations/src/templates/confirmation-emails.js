import { wrapInBaseTemplate, replacePlaceholders } from './base-template.js';

/**
 * Confirmation emails - sent after booking a treatment
 */
export const confirmationEmails = {
  magicPencil: {
    subject: 'Je Magic Pencil bestelling - onze ultieme favoriet!',
    previewText: 'Ontdek hoe je het meeste uit je Magic Pencil haalt',
    getContent(data = {}) {
      const content = `
        <h2>Beste ${data.firstName || '*|FNAME|*'},</h2>

        <p>Wat leuk dat je een Magic Pencil hebt besteld bij Cocon Cosmetics! Het is niet voor niets ons bestverkochte product én de ultieme favoriet van onze PMU-artiesten.</p>

        <p>✨ Eigenaresse Sina Hashemi over de Magic Pencil:</p>

        <p style="font-style: italic;">“De 3D Magic Brow Pencil is echt mijn favoriete product! Ik gebruik de kleur Dark Brow om mijn wenkbrauwen subtiel op te warmen. Mijn wenkbrauwen zijn van nature vrij donker, en omdat pigment tegenwoordig vaak iets koeler geneest, zorgt deze pencil voor een mooie, warme tint die mijn wenkbrauwen meer karakter geeft.</p>

        <p style="font-style: italic;">Met de platte kop kun je heel precies werken. Als je hem verticaal houdt, maak je gemakkelijk zachte hair strokes. En wanneer je hem horizontaal gebruikt, creëer je een prachtige, natuurlijke schaduw in de wenkbrauw.</p>

        <p style="font-style: italic;">En mijn kleine geheim? Ik gebruik hem ook als eyeliner voor een zachte, subtiele wing. Perfect voor een natuurlijke look!”</p>

        <p>Ben je benieuwd hoe je het meeste uit de Magic Pencil haalt? Bekijk de video hier:<br>
        [link naar video]</p>

        <p>Vriendelijke groet,<br>
        <strong>Het team van Cocon Cosmetics</strong></p>
      `;
      return wrapInBaseTemplate(replacePlaceholders(content, data), { previewText: this.previewText });
    },
  },
};

export default confirmationEmails;
