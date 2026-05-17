const { execSync } = require('child_process');
const http = require('http');

const CHECK_INTERVAL = 60000;

async function checkHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 10000 }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

async function check() {
  console.log(`[${new Date().toISOString()}] Checking...`);

  const backendOk = await checkHealth('http://localhost:3456/api/health');
  if (!backendOk) {
    console.error(`[${new Date().toISOString()}] Backend down, restarting...`);
    try { execSync('pm2 restart status-backend'); } catch(e) {}
  }

  console.log(`[${new Date().toISOString()}] Backend: ${backendOk ? 'OK' : 'RESTARTED'}`);
}

check();
setInterval(check, CHECK_INTERVAL);
console.log(`[${new Date().toISOString()}] Status backend watchdog started`);
