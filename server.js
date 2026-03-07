require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3456;

// Get password from environment (required!)
const AUTH_PASSWORD = process.env.STATUS_PASSWORD;

if (!AUTH_PASSWORD) {
  console.error('❌ ERROR: STATUS_PASSWORD not set!');
  process.exit(1);
}

// Simple session store
const SESSIONS = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Services configuration with log file paths
const SERVICES = [
  { 
    name: 'Speech Practice', 
    url: 'https://speech.vileen.pl/api/health',
    logFile: '/Users/dominiksoczewka/Projects/speech-practice/backend/logs/errors.log'
  },
  { 
    name: 'Solana Playground', 
    url: 'https://solana.vileen.pl/api/health',
    logFile: '/Users/dominiksoczewka/Projects/solana-playground/logs/error.log'
  }
];

// Store status history
const STATUS_HISTORY = [];
const MAX_HISTORY = 1000;

// Ensure logs directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

app.use(cors({
  origin: ['https://vileen.github.io', 'http://localhost:3456'],
  credentials: true
}));

app.use(express.json());

// Auth middleware
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
  
  next();
}

// Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password !== AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const token = crypto.randomUUID();
  SESSIONS.set(token, { token, createdAt: Date.now() });
  res.json({ token });
});

app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({ authenticated: true });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  SESSIONS.delete(token);
  res.json({ message: 'Logged out' });
});

// Get status
app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    services: SERVICES.map(s => ({ name: s.name, url: s.url })),
    history: STATUS_HISTORY.slice(-100),
    lastCheck: STATUS_HISTORY.length > 0 ? STATUS_HISTORY[STATUS_HISTORY.length - 1].timestamp : null
  });
});

// Health endpoint (must be before static files)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'status-dashboard-api' });
});

// Get logs - reads directly from file (works even if service is down!)
app.get('/api/logs/:service', requireAuth, (req, res) => {
  const serviceName = req.params.service;
  const service = SERVICES.find(s => s.name === serviceName);
  
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  try {
    // Try to read from service's log file directly
    if (fs.existsSync(service.logFile)) {
      const logs = fs.readFileSync(service.logFile, 'utf-8');
      const lines = logs.split('\n').filter(Boolean);
      return res.json({ 
        source: 'file',
        logs: lines.slice(-100).join('\n') // Last 100 lines
      });
    }
    
    // Fallback to our cached logs
    const cachedLogFile = `./logs/${serviceName.replace(/\s+/g, '-').toLowerCase()}.log`;
    if (fs.existsSync(cachedLogFile)) {
      const logs = fs.readFileSync(cachedLogFile, 'utf-8');
      const lines = logs.split('\n').filter(Boolean);
      return res.json({ 
        source: 'cached',
        logs: lines.slice(-100).join('\n')
      });
    }
    
    res.json({ logs: 'No logs available' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs', details: error.message });
  }
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
    
    return {
      status: response.ok ? 'up' : 'down',
      statusCode: response.status,
      responseTime: Date.now() - start,
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
    const entry = { service: service.name, ...result };
    
    STATUS_HISTORY.push(entry);
    if (STATUS_HISTORY.length > MAX_HISTORY) STATUS_HISTORY.shift();
    
    if (result.status === 'down') {
      console.log(`[ALERT] ${service.name} is DOWN`);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Check complete`);
}

// Initial check
checkAllServices();
setInterval(checkAllServices, 60000);

// Serve frontend (after API routes)
app.use(express.static('./'));
app.listen(PORT, () => {
  console.log(`Status backend running on port ${PORT}`);
  console.log(`✅ Auth enabled`);
  console.log(`✅ Reading logs from files (survives service crashes)`);
});
