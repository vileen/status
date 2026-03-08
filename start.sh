#!/bin/bash
echo "🚀 Starting Status Dashboard with PM2..."
mkdir -p logs
pm2 stop all 2>/dev/null
sleep 1
pm2 start ecosystem.config.js
echo ""
echo "✅ Started!"
echo "Commands: pm2 status | pm2 logs | pm2 restart all"
