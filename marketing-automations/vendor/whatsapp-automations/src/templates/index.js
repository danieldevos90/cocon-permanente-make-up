/**
 * Template index — verzamelt alle WhatsApp templates en biedt lookup
 * per (stage, treatmentType).
 */

import { aftercareTemplates } from './aftercare-templates.js';
import { refreshTemplates } from './refresh-templates.js';
import { buildComponents, renderPreview } from './template-helpers.js';

export { aftercareTemplates, refreshTemplates, buildComponents, renderPreview };

const STAGE_MAP = {
  aftercare: aftercareTemplates,
  browsRefresh: { wenkbrauwen: refreshTemplates.wenkbrauwen },
  lipsRefresh: { lippen: refreshTemplates.lippen },
};

/**
 * Get template by (stage, treatmentType). Returns null als niet bestaat.
 */
export function getWhatsAppTemplate(stage, treatmentType) {
  const byStage = STAGE_MAP[stage];
  if (!byStage) return null;
  return byStage[treatmentType] || null;
}

/**
 * List alle templates (voor CLI + dashboard).
 */
export function listAllWhatsAppTemplates() {
  const all = [];
  for (const [stage, byTreatment] of Object.entries(STAGE_MAP)) {
    for (const [treatmentType, template] of Object.entries(byTreatment)) {
      if (!template) continue;
      all.push({
        stage,
        treatmentType,
        name: template.name,
        metaStatus: template.metaStatus,
        category: template.category,
        language: template.language,
        bodyParams: template.bodyParams,
        preview: renderPreview(template, { firstName: 'Anna' }),
      });
    }
  }
  return all;
}

export default {
  aftercareTemplates,
  refreshTemplates,
  getWhatsAppTemplate,
  listAllWhatsAppTemplates,
  buildComponents,
  renderPreview,
};
