module.exports = {
  apps: [
    {
      name: 'status-backend',
      script: '/Users/dominiksoczewka/Projects/status/server.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      log_file: '/Users/dominiksoczewka/Projects/status/logs/backend.log',
    },
    {
      name: 'status-tunnel',
      script: 'cloudflared',
      args: 'tunnel --config /Users/dominiksoczewka/.cloudflared/status-dashboard.yml run status-dashboard',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      log_file: '/Users/dominiksoczewka/Projects/status/logs/tunnel.log',
    },
    {
      name: 'status-watchdog',
      script: '/Users/dominiksoczewka/Projects/status/watchdog.js',
      autorestart: true,
      log_file: '/Users/dominiksoczewka/Projects/status/logs/watchdog.log',
    }
  ]
};
