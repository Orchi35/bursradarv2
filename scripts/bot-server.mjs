#!/usr/bin/env node
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const port = Number(process.env.BOT_SERVER_PORT || 8787);
const host = process.env.BOT_SERVER_HOST || '127.0.0.1';
const BOT_TOKEN = process.env.BOT_SERVER_TOKEN;
let isRunning = false;

const CORS_ORIGIN = process.env.BOT_CORS_ORIGIN || `http://${host}:${port}`;

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
}

function parseSummary(output) {
  const pick = (label) => {
    const match = output.match(new RegExp(`${label}\\s*:\\s*(\\d+)`, 'i'));
    return match ? Number(match[1]) : 0;
  };

  return {
    scanned: pick('Taranan okul'),
    found: pick('Bulunan duyuru'),
    saved: pick('Yeni eklenen'),
  };
}

function runBot(res) {
  if (isRunning) {
    sendJson(res, 409, { ok: false, error: 'Bot zaten çalışıyor.' });
    return;
  }

  isRunning = true;
  const child = spawn(process.execPath, [join(root, 'scripts', 'bot.mjs')], {
    cwd: root,
    env: process.env,
    windowsHide: true,
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  child.on('close', (code) => {
    isRunning = false;
    if (code !== 0) {
      sendJson(res, 500, { ok: false, error: output.trim() || `Bot ${code} koduyla kapandı.` });
      return;
    }

    const summary = parseSummary(output);
    sendJson(res, 200, { ok: true, ...summary, errors: 0 });
  });
}

createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, isRunning });
    return;
  }

  if (req.method === 'POST' && req.url === '/run-bot') {
    if (BOT_TOKEN) {
      const auth = req.headers['authorization'] || '';
      if (auth !== `Bearer ${BOT_TOKEN}`) {
        sendJson(res, 401, { ok: false, error: 'Yetkisiz.' });
        return;
      }
    }
    runBot(res);
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Bulunamadı.' });
}).listen(port, host, () => {
  console.log(`BursRadar bot server http://${host}:${port}`);
});
