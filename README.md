# Status Dashboard

Continuous monitoring dashboard for backend services.

## Architecture

- **Backend** (Node.js + Express): Checks services every 60s, stores history, serves API
- **Frontend** (Static HTML): Displays status from backend API, refreshes every 30s

## Services Monitored

- Speech Practice API (speech.vileen.pl)
- Solana Playground API (solana.vileen.pl)

## Quick Start

```bash
# Install dependencies
npm install

# Start backend
node server.js

# Open frontend
open index.html
# or serve with any static server
```

## Backend Features

- ✅ Checks health every 60 seconds
- ✅ Stores last 1000 status checks in memory
- ✅ Saves error logs when services crash
- ✅ API endpoints:
  - `GET /api/status` - current status + history
  - `GET /api/logs/:service` - error logs

## Frontend Features

- ✅ Real-time status display
- ✅ Uptime chart (last 30 checks)
- ✅ Error log viewer (when service is down)
- ✅ Auto-refresh every 30 seconds

## Deployment

### Backend (needs persistent server):
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name status-backend
pm2 save
pm2 startup
```

### Frontend (GitHub Pages):
Frontend is pure HTML/JS - can be hosted on GitHub Pages.
Update `BACKEND_URL` in index.html to point to your backend.

## Logs

Error logs are saved to `./logs/` when services go down:
- `logs/speech-practice.log`
- `logs/solana-playground.log`

## Password Protection

Edit `index.html` line ~10:
```javascript
PASSWORD: 'your-12-char-password'
```
