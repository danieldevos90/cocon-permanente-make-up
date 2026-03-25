import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { listAllTemplates } from './templates/index.js';
import { previewEmail } from './automation-manager.js';

function sanitizeFileName(value) {
  return String(value || 'default')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildFileName(template) {
  const stage = sanitizeFileName(template.stage);
  const treatment = sanitizeFileName(template.treatmentType || 'default');
  return `${stage}-${treatment}.html`;
}

function getPreviewData(template) {
  if (template.treatmentType === 'magicPencil') {
    return { firstName: 'Lisa', customerName: 'Lisa' };
  }
  return { firstName: 'Lisa' };
}

export function exportAllTemplates({
  outputDir = 'email-templates',
} = {}) {
  const resolvedDir = path.resolve(process.cwd(), outputDir);
  ensureDir(resolvedDir);

  const templates = listAllTemplates();
  const exported = [];
  const skipped = [];
  const expectedFiles = new Set();

  for (const template of templates) {
    const preview = previewEmail(template.stage, template.treatmentType, getPreviewData(template));
    if (!preview?.html) {
      skipped.push({
        id: template.id,
        stage: template.stage,
        treatmentType: template.treatmentType,
      });
      continue;
    }

    const fileName = buildFileName(template);
    const filePath = path.join(resolvedDir, fileName);
    fs.writeFileSync(filePath, preview.html, 'utf8');
    expectedFiles.add(fileName);
    exported.push({
      id: template.id,
      stage: template.stage,
      treatmentType: template.treatmentType,
      file: fileName,
      subject: preview.subject,
      previewText: preview.previewText,
    });
  }

  const manifestPath = path.join(resolvedDir, 'manifest.json');
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({ exported, skipped }, null, 2)}\n`,
    'utf8',
  );

  // Remove stale HTML files from earlier exports.
  const existingFiles = fs.readdirSync(resolvedDir).filter(file => file.endsWith('.html'));
  for (const file of existingFiles) {
    if (!expectedFiles.has(file)) {
      fs.unlinkSync(path.join(resolvedDir, file));
    }
  }

  return {
    outputDir: resolvedDir,
    exportedCount: exported.length,
    skippedCount: skipped.length,
    manifestPath,
  };
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  const outputArg = process.argv[2] || 'email-templates';
  const result = exportAllTemplates({ outputDir: outputArg });
  console.log(`Exported ${result.exportedCount} templates to ${result.outputDir}`);
  console.log(`Manifest: ${result.manifestPath}`);
  if (result.skippedCount) {
    console.log(`Skipped: ${result.skippedCount}`);
  }
}

