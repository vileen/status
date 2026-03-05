# Status Dashboard

Simple status page for backend services.

## Features

- ✅ Simple password protection (12 chars)
- 🔍 Automatic health checks every 60 seconds
- 📱 Mobile-friendly design
- 📡 GitHub Pages hosted

## Password

Default password: `status2024dash`

**To change password:** Edit `index.html` line 14:
```javascript
PASSWORD: 'your-new-password'
```

## Services Monitored

- Speech Practice API (speech.vileen.pl)
- Solana Playground API (solana.vileen.pl)

## Adding Services

Edit `index.html` and add to `CONFIG.SERVICES`:
```javascript
{
    name: 'My API',
    url: 'https://my-api.com/health',
    type: 'api'
}
```

## Deploy

```bash
git add .
git commit -m "Update"
git push
```

GitHub Actions will auto-deploy to Pages.
