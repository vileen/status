const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3456;

// Get password from environment or use default (should be changed!)
const AUTH_PASSWORD = process.env.STATUS_PASSWORD || 'YOUR-12-CHAR-PASSWORD-HERE';

// Simple session store (in-memory)
const SESSIONS = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Services to monitor
const SERVICES = [
  { name: 'Speech Practice', url: 'https://speech.vileen.pl/api/health', type: 'api' },
  { name: 'Solana Playground', url: 'https://solana.vileen.pl/api/health', type: 'api' }
];

// Store status history
const STATUS_HISTORY = [];
const MAX_HISTORY = 1000;

// Ensure logs directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// CORS for GitHub Pages
app.use(cors({
  origin: ['https://vileen.github.io', 'http://localhost:3456', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Authentication middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  
  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = SESSIONS.get(token);
  if (Date.now() - session.createdAt > SESSION_TIMEOUT) {
    SESSIONS.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  
  req.session = session;
  next();
}

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (password !== AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Generate session token
  const token = crypto.randomUUID();
  SESSIONS.set(token, {
    token,
    createdAt: Date.now()
  });
  
  res.json({ token });
});

// Check auth status
app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({ authenticated: true });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  SESSIONS.delete(token);
  res.json({ message: 'Logged out' });
});

// Get current status (protected)
app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    services: SERVICES,
    history: STATUS_HISTORY.slice(-100),
    lastCheck: STATUS_HISTORY.length > 0 ? STATUS_HISTORY[STATUS_HISTORY.length - 1].timestamp : null
  });
});

// Get latest error logs for a service (protected)
app.get('/api/logs/:service', requireAuth, (req, res) => {
  const serviceName = req.params.service;
  const logFile = `./logs/${serviceName}.log`;
  
  if (!fs.existsSync(logFile)) {
    return res.json({ logs: 'No logs available' });
  }
  
  const logs = fs.readFileSync(logFile, 'utf-8');
  // Return last 50 lines
  const lines = logs.split('\n').filter(line => line.trim());
  res.json({ logs: lines.slice(-50).join('\n') });
});

// Check service health
async function checkService(service) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(service.url, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeout);
    const duration = Date.now() - start;
    
    return {
      status: response.ok ? 'up' : 'down',
      statusCode: response.status,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString()
    };
  }
}

// Check all services
async function checkAllServices() {
  console.log(`[${new Date().toISOString()}] Checking services...`);
  
  for (const service of SERVICES) {
    const result = await checkService(service);
    const entry = {
      service: service.name,
      ...result
    };
    
    STATUS_HISTORY.push(entry);
    
    // Keep only last MAX_HISTORY entries
    if (STATUS_HISTORY.length > MAX_HISTORY) {
      STATUS_HISTORY.shift();
    }
    
    // If service is down, fetch and save logs
    if (result.status === 'down') {
      console.log(`[ALERT] ${service.name} is DOWN: ${result.error}`);
      await fetchAndSaveLogs(service);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Check complete`);
}

// Fetch logs from remote service
async function fetchAndSaveLogs(service) {
  try {
    // Try to fetch logs from the service itself
    const logUrl = service.url.replace('/api/health', '/api/logs/error');
    const response = await fetch(logUrl, { timeout: 5000 }).catch(() => null);
    
    let logs = '';
    if (response && response.ok) {
      const data = await response.json();
      logs = data.logs || 'No logs in response';
    } else {
      logs = `Failed to fetch logs from ${service.name}\nError: ${response?.statusText || 'Connection failed'}`;
    }
    
    const logFile = `./logs/${service.name.replace(/\s+/g, '-').toLowerCase()}.log`;
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] SERVICE DOWN\n${logs}\n---\n`;
    
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
  }
}

// Initial check
checkAllServices();

// Check every 60 seconds
setInterval(checkAllServices, 60000);

// Serve frontend (public)
app.use(express.static('./'));

app.listen(PORT, () => {
  console.log(`Status backend running on port ${PORT}`);
  console.log(`Checking ${SERVICES.length} services every 60 seconds`);
  console.log(`Auth enabled: ${AUTH_PASSWORD !== 'YOUR-12-CHAR-PASSWORD-HERE' ? 'YES' : 'NO (using default!)'}`);
});
