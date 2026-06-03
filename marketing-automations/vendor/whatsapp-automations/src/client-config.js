import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function configRoots() {
  return [
    path.join(__dirname, '..', 'config'),
    path.join(process.cwd(), 'vendor/whatsapp-automations/config'),
    path.join(process.cwd(), '../whatsapp-automations/config'),
  ];
}

function readJson(relativePath) {
  for (const root of configRoots()) {
    const fullPath = path.join(root, relativePath);
    if (!existsSync(fullPath)) continue;
    try {
      return JSON.parse(readFileSync(fullPath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

function clientsDir() {
  for (const root of configRoots()) {
    const dir = path.join(root, 'clients');
    if (existsSync(dir)) return dir;
  }
  return null;
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

export { platform, client };
export const clientId = defaultClientId;

export function getPlatformMeta() {
  return platform;
}

export function getActiveClient() {
  return client;
}

export function listClientIds() {
  try {
    const dir = clientsDir();
    if (!dir) return [defaultClientId];
    return readdirSync(dir)
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
