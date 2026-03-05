# Status Dashboard

Real-time monitoring dashboard for all your applications.

## Features

- 🔍 Automatic service health checks every 60 seconds
- 📊 Network latency monitoring
- 🔒 Secure remote access with token-based authentication
- 🏠 Local network auto-detection (no auth needed)
- 📱 Mobile-friendly responsive design
- 📡 GitHub Pages hosted

## Security Model

**IMPORTANT: MAC address whitelist is NOT possible for web applications**

Browsers (Chrome, Safari, Firefox) do not expose device MAC addresses to websites for security and privacy reasons. This is a fundamental web security limitation.

### Alternative security approach:

1. **Local Network** (192.168.x.x, 10.x.x.x): Full access, no authentication
2. **Remote Access**: Token-based authentication via localStorage
3. **Device Registration**: Manual token entry on first visit

## Setup

1. Copy config template:
```bash
cp config.example.js config.js
```

2. Edit `config.js` and set your `REMOTE_ACCESS_TOKEN`

3. Deploy to GitHub Pages:
```bash
git add .
git commit -m "Initial setup"
git push
```

## Usage

### Local Network
Just open the page - full dashboard appears automatically.

### Remote Access
1. Open the GitHub Pages URL
2. Enter your secret token when prompted
3. Dashboard loads with full access

## Services Monitored

- Speech Practice Backend (speech.vileen.pl)
- Solana Playground Backend (solana.vileen.pl)
- Speech Practice Frontend (GitHub Pages)
- Mic Testing (Netlify)

## Adding New Services

Edit `config.js` and add to `SERVICES` array:
```javascript
{
  name: 'My Service',
  url: 'https://my-service.com/health',
  type: 'api' // or 'web'
}
```
