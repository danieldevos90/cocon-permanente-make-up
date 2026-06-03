/**
 * Template index — PMU (Cocon) en marketing (demo-store-gym).
 */

import { aftercareTemplates } from './aftercare-templates.js';
import { refreshTemplates } from './refresh-templates.js';
import { marketingTemplates } from './marketing-templates.js';
import { buildComponents, renderPreview } from './template-helpers.js';

export { aftercareTemplates, refreshTemplates, marketingTemplates, buildComponents, renderPreview };

const PMU_STAGE_MAP = {
  aftercare: aftercareTemplates,
  browsRefresh: { wenkbrauwen: refreshTemplates.wenkbrauwen },
  lipsRefresh: { lippen: refreshTemplates.lippen },
};

function isMarketingProfile(options = {}) {
  return options.profile === 'marketing';
}

function stageMapFor(options = {}) {
  return isMarketingProfile(options) ? marketingTemplates : PMU_STAGE_MAP;
}

/**
 * Get template by (stage, treatmentType / segment).
 */
export function getWhatsAppTemplate(stage, treatmentType, options = {}) {
  const byStage = stageMapFor(options)[stage];
  if (!byStage) return null;
  return byStage[treatmentType] || null;
}

function listFromStageMap(stageMap) {
  const all = [];
  for (const [stage, bySegment] of Object.entries(stageMap)) {
    for (const [treatmentType, template] of Object.entries(bySegment)) {
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

/**
 * List alle templates (voor CLI + dashboard).
 */
export function listAllWhatsAppTemplates(options = {}) {
  return listFromStageMap(stageMapFor(options));
}

export default {
  aftercareTemplates,
  refreshTemplates,
  marketingTemplates,
  getWhatsAppTemplate,
  listAllWhatsAppTemplates,
  buildComponents,
  renderPreview,
};
