import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const waMonorepo = path.join(dir, '..', 'whatsapp-automations');
const waVendor = path.join(dir, 'vendor', 'whatsapp-automations');
const waRoot = fs.existsSync(waMonorepo) ? waMonorepo : waVendor;

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

const platform = readJson(path.join(waRoot, 'config', 'platform.json'));
const clientId = process.env.CLIENT_ID || 'cocon';
const client = readJson(path.join(waRoot, 'config', 'clients', `${clientId}.json`));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_PLATFORM_NAME:
      process.env.NEXT_PUBLIC_PLATFORM_NAME ||
      platform.appName ||
      'AFA Message Platform',
    NEXT_PUBLIC_CLIENT_ID: clientId,
    NEXT_PUBLIC_CLIENT_NAME:
      process.env.NEXT_PUBLIC_CLIENT_NAME ||
      client.displayName ||
      'Client',
    NEXT_PUBLIC_CLIENT_DISPLAY_PHONE:
      process.env.NEXT_PUBLIC_CLIENT_DISPLAY_PHONE ||
      client.displayPhone ||
      '',
    NEXT_PUBLIC_CLIENT_ONBOARD_CONTACT:
      process.env.NEXT_PUBLIC_CLIENT_ONBOARD_CONTACT ||
      client.onboardContactName ||
      '',
    NEXT_PUBLIC_META_APP_ID:
      process.env.NEXT_PUBLIC_META_APP_ID ||
      platform.appId ||
      '823081517310848',
    NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID:
      process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID ||
      platform.embeddedSignupConfigId ||
      '',
    NEXT_PUBLIC_WHATSAPP_ONBOARD_GATE:
      process.env.NEXT_PUBLIC_WHATSAPP_ONBOARD_GATE ||
      process.env.WHATSAPP_ONBOARD_ACCESS_TOKEN ||
      '',
  },
  transpilePackages: [],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'whatsapp-automations': waRoot,
    };
    return config;
  },
};

export default nextConfig;
