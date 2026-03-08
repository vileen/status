const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const CHECK_INTERVAL = 60000;

async function checkHealth(url, useHttps = true) {
  return new Promise((resolve) => {
    const client = useHttps ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

async function check() {
  console.log(`[${new Date().toISOString()}] Checking...`);
  
  const backendOk = await checkHealth('http://localhost:3456/api/health', false);
  if (!backendOk) {
    console.error(`[${new Date().toISOString()}] Backend down, restarting...`);
    try { execSync('pm2 restart status-backend'); } catch(e) {}
  }
  
  const tunnelOk = await checkHealth('https://status-api.vileen.pl/api/health');
  if (!tunnelOk) {
    console.error(`[${new Date().toISOString()}] Tunnel down, restarting...`);
    try { execSync('pm2 restart status-tunnel'); } catch(e) {}
  }
  
  console.log(`[${new Date().toISOString()}] Backend: ${backendOk ? 'OK' : 'RESTARTED'}, Tunnel: ${tunnelOk ? 'OK' : 'RESTARTED'}`);
}

check();
setInterval(check, CHECK_INTERVAL);
console.log(`[${new Date().toISOString()}] Watchdog started`);
