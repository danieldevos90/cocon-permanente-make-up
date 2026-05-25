import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const waMonorepo = path.join(dir, '..', 'whatsapp-automations');
const waVendor = path.join(dir, 'vendor', 'whatsapp-automations');
const waRoot = fs.existsSync(waMonorepo) ? waMonorepo : waVendor;

/** @type {import('next').NextConfig} */
const nextConfig = {
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
