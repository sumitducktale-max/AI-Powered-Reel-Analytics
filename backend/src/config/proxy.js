const dotenv = require('dotenv');
dotenv.config();

/**
 * Parses the PROXY_URL environment variable and returns a Playwright-compatible proxy object.
 * Supports standard URLs, e.g., http://host:port or http://username:password@host:port.
 * 
 * @returns {Object|null} Playwright launch proxy options or null if not configured
 */
function getProxyConfig() {
  const proxyUrl = process.env.PROXY_URL;
  if (!proxyUrl || proxyUrl.trim() === '') {
    return null;
  }

  try {
    const parsed = new URL(proxyUrl);
    
    // Playwright needs protocol + host
    const config = {
      server: `${parsed.protocol}//${parsed.host}`
    };

    // If there is basic auth
    if (parsed.username) {
      config.username = decodeURIComponent(parsed.username);
    }
    if (parsed.password) {
      config.password = decodeURIComponent(parsed.password);
    }

    return config;
  } catch (error) {
    console.error('Invalid PROXY_URL format configured:', error.message);
    return null;
  }
}

module.exports = {
  getProxyConfig
};
