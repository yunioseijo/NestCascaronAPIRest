#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function loadDotEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch (e) {
    // ignore .env load errors, rely on process.env
  }
}

async function main() {
  loadDotEnv();

  if (process.env.STAGE !== 'dev') {
    console.error('Seed abortado: STAGE no es "dev".');
    process.exit(1);
  }

  const baseFromEnv = process.env.HOST_API;
  const fallbackBase = `http://localhost:${process.env.PORT || 3000}/api`;
  const base = (baseFromEnv || fallbackBase).replace(/\/$/, '');
  const url = new URL(base + '/seed');

  if (!baseFromEnv) {
    console.log(`[seed] HOST_API no definido, usando por defecto: ${fallbackBase}`);
  } else {
    console.log(`[seed] Usando HOST_API: ${baseFromEnv}`);
  }
  console.log(`[seed] URL completa: ${url.toString()}`);
  const secret = process.env.SEED_SECRET || 'dev-seed';

  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    method: 'POST',
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    headers: {
      'x-seed-secret': secret,
      'content-length': '0',
    },
  };

  await new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const status = res.statusCode || 0;
        try {
          const json = JSON.parse(data || '{}');
          if (status >= 200 && status < 300) {
            console.log('Seed ejecutado correctamente:');
            console.log(JSON.stringify(json, null, 2));
            resolve();
          } else {
            console.error(`Seed falló (HTTP ${status}):`);
            console.error(JSON.stringify(json, null, 2));
            reject(new Error(`HTTP ${status}`));
          }
        } catch (e) {
          if (status >= 200 && status < 300) {
            console.log('Seed ejecutado. Respuesta no JSON:');
            console.log(data);
            resolve();
          } else {
            console.error(`Seed falló (HTTP ${status}). Respuesta:`);
            console.error(data);
            reject(new Error(`HTTP ${status}`));
          }
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
