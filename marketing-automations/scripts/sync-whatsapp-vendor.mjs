#!/usr/bin/env node
/**
 * Kopieer whatsapp-automations/src naar vendor vóór Vercel build,
 * zodat de volledige module beschikbaar is als sibling-folder niet in de bundle zit.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const waRoot = path.join(root, '..', 'whatsapp-automations');
const vendorRoot = path.join(root, 'vendor', 'whatsapp-automations');

if (!fs.existsSync(waRoot)) {
  console.warn('[sync-whatsapp-vendor] source missing, using existing vendor stub');
  process.exit(0);
}

for (const dir of ['src', 'config']) {
  const source = path.join(waRoot, dir);
  const target = path.join(vendorRoot, dir);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, target, { recursive: true, force: true });
  console.log('[sync-whatsapp-vendor] synced', source, '→', target);
}
