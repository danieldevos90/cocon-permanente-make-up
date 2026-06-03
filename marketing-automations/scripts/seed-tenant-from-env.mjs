#!/usr/bin/env node
/** Seed wa:tenant:{clientId} in Redis from whatsapp-automations/.env */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../whatsapp-automations/.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const clientId = process.argv[2] || 'cocon';
const { seedTenantFromEnv, getTenant } = await import(
  resolve(__dirname, '../vendor/whatsapp-automations/src/tenant-store.js')
);

const record = await seedTenantFromEnv(clientId);
console.log('Seeded', clientId, record || (await getTenant(clientId)));
