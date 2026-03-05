# Status Dashboard Configuration
# Copy this file to config.js and fill in your values
# config.js is gitignored and won't be committed

const CONFIG = {
  // Device whitelist - use any unique identifier (hostname, custom token, etc.)
  // MAC addresses CANNOT be used for web apps (browsers don't expose them)
  // Instead use: device tokens, IP ranges, or fingerprinting
  
  // Option 1: Device tokens (user manually enters on first visit)
  DEVICE_TOKENS: [
    'dominik-iphone',
    'dominik-macbook-pro',
    'dominik-mac-mini',
    // Add more devices here
  ],
  
  // Option 2: Secret token for remote access
  REMOTE_ACCESS_TOKEN: 'your-secret-token-here', // Change this!
  
  // Option 3: Local network IP ranges (no auth needed for these)
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
    }
  ],
  
  // Ping interval in milliseconds
  PING_INTERVAL: 60000, // 1 minute
  
  // GitHub Pages URL for redirects
  GITHUB_PAGES_URL: 'https://vileen.github.io/status'
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
