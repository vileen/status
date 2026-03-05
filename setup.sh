#!/bin/bash

# Status Dashboard Setup Script
# This script helps you configure the status dashboard with your secrets

set -e

echo "🚀 Status Dashboard Setup"
echo "========================="
echo ""

# Check if config.js already exists
if [ -f "config.js" ]; then
    echo "⚠️  config.js already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📝 Let's configure your status dashboard..."
echo ""

# Get remote access token
echo "1. Set your remote access token (for GitHub Pages access):"
read -p "   Enter secret token: " REMOTE_TOKEN

if [ -z "$REMOTE_TOKEN" ]; then
    REMOTE_TOKEN=$(openssl rand -hex 16)
    echo "   Generated random token: $REMOTE_TOKEN"
fi

echo ""
echo "2. Configure device tokens (optional):"
echo "   These are friendly names for your devices"
echo "   Examples: dominik-iphone, macbook-pro, mac-mini"
echo ""

DEVICE_TOKENS=""
while true; do
    read -p "   Add a device token (or press Enter to finish): " DEVICE
    if [ -z "$DEVICE" ]; then
        break
    fi
    if [ -z "$DEVICE_TOKENS" ]; then
        DEVICE_TOKENS="\"$DEVICE\""
    else
        DEVICE_TOKENS="$DEVICE_TOKENS, \"$DEVICE\""
    fi
done

if [ -z "$DEVICE_TOKENS" ]; then
    DEVICE_TOKENS="\"dominik-iphone\", \"dominik-macbook\", \"dominik-mac-mini\""
fi

echo ""
echo "3. Configure services to monitor:"
echo "   Default services include:"
echo "   - Speech Practice Backend"
echo "   - Solana Playground Backend"
echo "   - Speech Practice Frontend"
echo "   - Mic Testing"
echo ""
read -p "   Do you want to add more services? (y/N): " -n 1 -r
ADD_MORE=$REPLY
echo

ADDITIONAL_SERVICES=""
if [[ $ADD_MORE =~ ^[Yy]$ ]]; then
    while true; do
        echo ""
        read -p "   Service name: " SVC_NAME
        if [ -z "$SVC_NAME" ]; then
            break
        fi
        read -p "   Service URL (health endpoint): " SVC_URL
        read -p "   Type (api/web): " SVC_TYPE
        
        if [ -z "$ADDITIONAL_SERVICES" ]; then
            ADDITIONAL_SERVICES="{ name: '$SVC_NAME', url: '$SVC_URL', type: '$SVC_TYPE' }"
        else
            ADDITIONAL_SERVICES="$ADDITIONAL_SERVICES, { name: '$SVC_NAME', url: '$SVC_URL', type: '$SVC_TYPE' }"
        fi
    done
fi

# Create config.js
cat > config.js << EOF
// Status Dashboard Configuration
// THIS FILE IS GITIGNORED - do not commit!

const CONFIG = {
  // Device tokens for identification
  DEVICE_TOKENS: [$DEVICE_TOKENS],
  
  // Secret token for remote access (GitHub Pages)
  REMOTE_ACCESS_TOKEN: '$REMOTE_TOKEN',
  
  // Local network IP ranges (no auth needed)
  LOCAL_NETWORK_RANGES: [
    '192.168.',
    '10.',
    '127.',
    '::1'
  ],
  
  // Services to monitor
  SERVICES: [
    {
      name: 'Speech Practice Backend',
      url: 'https://speech.vileen.pl/api/health',
      type: 'api'
    },
    {
      name: 'Solana Playground Backend', 
      url: 'https://solana.vileen.pl/api/health',
      type: 'api'
    },
    {
      name: 'Speech Practice Frontend',
      url: 'https://vileen.github.io/speech-practice',
      type: 'web'
    },
    {
      name: 'Mic Testing',
      url: 'https://mic-testing-dominik.netlify.app',
      type: 'web'
    }${ADDITIONAL_SERVICES:+, $ADDITIONAL_SERVICES}
  ],
  
  // Ping interval in milliseconds (1 minute)
  PING_INTERVAL: 60000,
  
  // GitHub Pages URL
  GITHUB_PAGES_URL: 'https://vileen.github.io/status'
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
EOF

echo ""
echo "✅ Configuration saved to config.js"
echo ""

# Show summary
echo "📋 Configuration Summary:"
echo "   Remote access token: ${REMOTE_TOKEN:0:8}..."
echo "   Device tokens: $DEVICE_TOKENS"
echo "   Services: $(echo "$CONFIG" | grep -c "name:")"
echo ""

echo "🔒 IMPORTANT: config.js is gitignored and won't be committed!"
echo ""

# Create .env file for GitHub Actions
echo "📝 Creating .env file for GitHub Actions..."
cat > .env << EOF
# GitHub Actions Secrets
# Add these to your GitHub repository settings:
# Settings -> Secrets and variables -> Actions -> New repository secret

REMOTE_ACCESS_TOKEN=$REMOTE_TOKEN
DEVICE_TOKENS=[$DEVICE_TOKENS]
EOF

echo ""
echo "📤 Next steps:"
echo "   1. Review config.js to make sure everything looks correct"
echo "   2. Add the secrets to GitHub:"
echo "      - Go to https://github.com/vileen/status/settings/secrets/actions"
echo "      - Add REMOTE_ACCESS_TOKEN with value: $REMOTE_TOKEN"
echo "      - Add DEVICE_TOKENS with value: [$DEVICE_TOKENS]"
echo "   3. Commit and push:"
echo "      git add ."
echo "      git commit -m 'Initial setup'"
echo "      git push"
echo ""
echo "🌐 Your dashboard will be available at:"
echo "   Local: http://localhost:8000 (or just open index.html)"
echo "   Remote: https://vileen.github.io/status"
echo ""
echo "🔑 Remote access token: $REMOTE_TOKEN"
echo "   Save this token - you'll need it to access the dashboard remotely!"
echo ""
