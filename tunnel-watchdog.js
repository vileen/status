#!/usr/bin/env node
/**
 * Unified Cloudflare Tunnel Watchdog
 * Monitors all tunnels and auto-restarts them when they go zombie.
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const CHECK_INTERVAL = 60000; // 60 seconds
const RESTART_COOLDOWN = 300000; // 5 minutes between restarts for same tunnel

// Tunnel definitions - keep in sync with your setup
const TUNNELS = [
  {
    name: 'speech-practice',
    url: 'https://speech.vileen.pl/api/health',
    type: 'launchagent',
    plist: 'com.cloudflared.speech-practice',
    localFallback: 'http://localhost:3001/api/health'
  },
  {
    name: 'bank-to-ynab',
    url: 'https://ynab.vileen.pl/health',
    type: 'pm2',
    pm2Name: 'bank-to-ynab-tunnel',
    localFallback: 'http://localhost:3003/health'
  },
  {
    name: 'pdf-ocr',
    url: 'https://pdf.vileen.pl/api/health',
    type: 'pm2',
    pm2Name: 'pdf-ocr-tunnel',
    localFallback: 'http://localhost:3010/api/health'
  },
  {
    name: 'status-dashboard',
    url: 'https://status-api.vileen.pl/api/health',
    type: 'launchagent',
    plist: 'com.cloudflared.status-dashboard',
    localFallback: 'http://localhost:3456/api/health'
  },
  {
    name: 'solana-playground',
    url: 'https://solana.vileen.pl/api/health',
    type: 'launchagent',
    plist: 'com.cloudflared.solana-playground',
    localFallback: 'http://localhost:3002/api/health'
  }
];

const lastRestart = {};

function log(level, message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] ${message}`;
  console.log(line);
}

async function checkUrl(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      resolve({ ok: res.statusCode < 500, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ ok: false, status: 0, error: err.code });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'TIMEOUT' });
    });
  });
}

function restartPm2(name) {
  log('info', `Restarting PM2 tunnel: ${name}`);
  try {
    execSync(`pm2 restart ${name}`, { stdio: 'pipe' });
    log('info', `PM2 restart succeeded: ${name}`);
    return true;
  } catch (e) {
    log('error', `PM2 restart failed: ${name} - ${e.message}`);
    return false;
  }
}

function restartLaunchAgent(plistName) {
  log('info', `Restarting LaunchAgent tunnel: ${plistName}`);
  try {
    const plistPath = `${process.env.HOME}/Library/LaunchAgents/${plistName}.plist`;
    execSync(`launchctl unload ${plistPath} 2>/dev/null; sleep 2; launchctl load ${plistPath}`, { stdio: 'pipe' });
    log('info', `LaunchAgent restart succeeded: ${plistName}`);
    return true;
  } catch (e) {
    log('error', `LaunchAgent restart failed: ${plistName} - ${e.message}`);
    return false;
  }
}

function canRestart(tunnelName) {
  const last = lastRestart[tunnelName] || 0;
  const now = Date.now();
  if (now - last < RESTART_COOLDOWN) {
    const remaining = Math.ceil((RESTART_COOLDOWN - (now - last)) / 1000);
    log('warn', `Restart cooldown active for ${tunnelName}, ${remaining}s remaining`);
    return false;
  }
  return true;
}

async function checkTunnel(tunnel) {
  const external = await checkUrl(tunnel.url);

  if (external.ok) {
    return { name: tunnel.name, status: 'OK', code: external.status };
  }

  // External failed - check if local backend is alive
  const local = await checkUrl(tunnel.localFallback, 5000);

  if (!local.ok) {
    log('error', `${tunnel.name}: LOCAL backend also down (status: ${local.status || local.error}). Tunnel may be fine, backend is dead.`);
    return { name: tunnel.name, status: 'LOCAL_DOWN', code: external.status, error: external.error };
  }

  // Local is fine, external is dead = zombie tunnel
  log('error', `${tunnel.name}: ZOMBIE DETECTED - local OK, external FAIL (code: ${external.status || external.error})`);

  if (!canRestart(tunnel.name)) {
    return { name: tunnel.name, status: 'ZOMBIE_COOLDOWN', code: external.status, error: external.error };
  }

  // Restart based on type
  let restarted = false;
  if (tunnel.type === 'pm2') {
    restarted = restartPm2(tunnel.pm2Name);
  } else if (tunnel.type === 'launchagent') {
    restarted = restartLaunchAgent(tunnel.plist);
  }

  if (restarted) {
    lastRestart[tunnel.name] = Date.now();
  }

  return {
    name: tunnel.name,
    status: restarted ? 'RESTARTED' : 'RESTART_FAILED',
    code: external.status,
    error: external.error
  };
}

async function checkAll() {
  log('info', '--- Health check cycle ---');
  const results = await Promise.all(TUNNELS.map(checkTunnel));

  const ok = results.filter(r => r.status === 'OK');
  const zombie = results.filter(r => r.status === 'RESTARTED' || r.status === 'ZOMBIE_COOLDOWN');
  const localDown = results.filter(r => r.status === 'LOCAL_DOWN');

  log('info', `Results: ${ok.length} OK, ${zombie.length} zombie, ${localDown.length} local-down`);

  for (const r of results) {
    if (r.status !== 'OK') {
      log('warn', `  ${r.name}: ${r.status} (code: ${r.code || r.error})`);
    }
  }
}

// Initial check
checkAll();
setInterval(checkAll, CHECK_INTERVAL);

log('info', `Tunnel watchdog started - monitoring ${TUNNELS.length} tunnels every ${CHECK_INTERVAL/1000}s`);
