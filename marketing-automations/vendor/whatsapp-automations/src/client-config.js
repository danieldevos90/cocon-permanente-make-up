import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveConfigRoot() {
  const candidates = [
    path.join(__dirname, '..', 'config'),
    path.join(process.cwd(), 'vendor', 'whatsapp-automations', 'config'),
    path.join(process.cwd(), '..', 'whatsapp-automations', 'config'),
  ];
  for (const root of candidates) {
    if (existsSync(path.join(root, 'platform.json'))) return root;
  }
  return candidates[0];
}

const configRoot = resolveConfigRoot();

function readJson(relativePath) {
  const fullPath = path.join(configRoot, relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

const platform = readJson('platform.json') || {};
const defaultClientId = process.env.CLIENT_ID || 'cocon';
const clientRaw = readJson(`clients/${defaultClientId}.json`) || {
  id: defaultClientId,
  displayName: defaultClientId,
};

/** Tenant config; Meta business portfolio always falls back to platform (Alt F Awesome). */
const client = {
  ...clientRaw,
  businessPortfolioId:
    clientRaw.businessPortfolioId || platform.businessPortfolioId || '',
  wabaId: clientRaw.wabaId || '',
};

export { platform, client, configRoot };
export const clientId = defaultClientId;

export function getPlatformMeta() {
  return platform;
}

export function getActiveClient() {
  return client;
}

export function listClientIds() {
  try {
    return readdirSync(path.join(configRoot, 'clients'))
      .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
      .map((f) => f.replace('.json', ''))
      .sort();
  } catch {
    return [defaultClientId];
  }
}

export function getClientById(id) {
  const raw = readJson(`clients/${id}.json`) || { id, displayName: id };
  return {
    ...raw,
    businessPortfolioId:
      raw.businessPortfolioId || platform.businessPortfolioId || '',
    wabaId: raw.wabaId || '',
  };
}

export default {
  platform,
  client,
  clientId,
  configRoot,
  getPlatformMeta,
  getActiveClient,
  listClientIds,
  getClientById,
};
