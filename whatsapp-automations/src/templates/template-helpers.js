/**
 * WhatsApp template registry.
 *
 * Belangrijk: Meta vereist dat templates VOORAF goedgekeurd zijn in
 * WhatsApp Manager (https://business.facebook.com/wa/manage/message-templates/).
 *
 * In de code definiëren we alleen de "shape" van elke template:
 *   - de naam (zoals ingevoerd bij Meta)
 *   - de body-tekst (preview, identiek aan Meta-versie)
 *   - de placeholders ({{1}}, {{2}}, ...) en hoe we ze invullen
 *   - bijbehorende treatment + stage
 *
 * Wanneer een template `metaStatus: 'pending'` heeft, mag hij NIET live
 * verstuurd worden. De automation manager filtert deze er automatisch
 * uit (ook wanneer dryRun=false).
 */

/**
 * Build Meta-style "components" array from a template definition + data.
 * Plaatst body-parameters in volgorde {{1}}, {{2}}, ...
 */
export function buildComponents(template, data = {}) {
  const params = (template.bodyParams || []).map(key => ({
    type: 'text',
    text: String(data[key] ?? ''),
  }));
  if (!params.length) return [];
  return [{ type: 'body', parameters: params }];
}

/**
 * Render een human-readable preview van de template body voor logging
 * en het dashboard.
 */
export function renderPreview(template, data = {}) {
  let body = template.body;
  (template.bodyParams || []).forEach((key, idx) => {
    const value = String(data[key] ?? `{{${idx + 1}}}`);
    body = body.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), value);
  });
  return body;
}

export default { buildComponents, renderPreview };
