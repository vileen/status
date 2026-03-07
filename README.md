# Status Dashboard

Continuous monitoring dashboard with backend authentication.

## Architecture

- **Backend** (Node.js + Express): 
  - Checks services every 60s
  - Stores history in memory
  - Handles authentication (sessions)
  - Serves API endpoints
- **Frontend** (Static HTML): 
  - Login form → gets token from backend
  - Displays status from backend API
  - No password in frontend code!

## Security

✅ **Password is stored ONLY on backend** (via `STATUS_PASSWORD` env var)
✅ **Frontend gets session token** after successful login
✅ **All API endpoints require authentication**
✅ **Sessions expire after 24 hours**

## Setup

```bash
# Install dependencies
npm install

# Set password (required!)
export STATUS_PASSWORD="your-secure-password-here"

# Start backend
node server.js

# Open http://localhost:3456
```

## Services Monitored

- Speech Practice API (speech.vileen.pl)
- Solana Playground API (solana.vileen.pl)

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/auth/login` | No | Login with password, get token |
| `GET /api/auth/check` | Yes | Check if session is valid |
| `POST /api/auth/logout` | Yes | Logout, invalidate token |
| `GET /api/status` | Yes | Get current status + history |
| `GET /api/logs/:service` | Yes | Get error logs for service |

## Frontend Flow

1. User sees login form
2. Frontend sends password to `POST /api/auth/login`
3. Backend validates, returns session token
4. Frontend stores token in localStorage
5. Frontend uses token for all API requests
6. Token expires after 24h or on logout

## Environment Variables

```bash
STATUS_PASSWORD="your-secure-password"  # Required!
PORT=3456                               # Optional, default 3456
```

## Deployment

### Backend (persistent server):
```bash
# Using systemd or PM2
export STATUS_PASSWORD="your-password"
node server.js
```

### Frontend:
Can be served by the backend (static files) or hosted separately (GitHub Pages).

## Logs

- Backend logs: console output
- Service error logs: `./logs/*.log`
