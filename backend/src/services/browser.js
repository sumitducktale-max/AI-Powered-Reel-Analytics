const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs');
const path = require('path');
const { getProxyConfig } = require('../config/proxy');
const { 
  getRandomViewport, 
  getRandomUserAgent, 
  simulateMouseJitter, 
  simulateHumanScroll,
  randomSleep
} = require('../utils/helpers');  

// Use the stealth plugin
chromium.use(stealth);

const COOKIES_PATH = path.join(__dirname, '..', '..', 'cookies.json');

/**
 * Launches the Playwright Extra browser with stealth plugins and proxy rotation.
 * (Layer 1 & Layer 5)
 * 
 * @returns {Promise<import('playwright').Browser>} Playwright Browser instance
 */
async function launchStealthBrowser() {
  console.log('[Browser Service] Launching Playwright Stealth Browser...');
  
  const proxyConfig = getProxyConfig();
  const launchOptions = {
    headless: true, // Use headless by default for production REST API speed
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--blink-settings=imagesEnabled=true' // Enable images to render layout correctly
    ]
  };

  if (proxyConfig) {
    launchOptions.proxy = proxyConfig;
    console.log(`[Browser Service] Proxy configured: ${proxyConfig.server}`);
  } else {
    console.log('[Browser Service] No proxy configuration found. Running direct connection.');
  }

  // Attempt 1: Launch default Playwright-provided Chromium binary
  try {
    const browser = await chromium.launch(launchOptions);
    return browser;
  } catch (error) {
    console.warn(`⚠️ [Browser Service] Failed to launch default Chromium binary (${error.message}). Attempting system Chrome fallback...`);
    
    // Attempt 2: Launch system-installed Google Chrome
    try {
      const chromeOptions = { ...launchOptions, channel: 'chrome' };
      const browser = await chromium.launch(chromeOptions);
      console.log('[Browser Service] Successfully launched system Google Chrome.');
      return browser;
    } catch (chromeError) {
      console.warn(`⚠️ [Browser Service] Failed to launch system Google Chrome (${chromeError.message}). Attempting system Microsoft Edge fallback...`);
      
      // Attempt 3: Launch system-installed Microsoft Edge
      try {
        const edgeOptions = { ...launchOptions, channel: 'msedge' };
        const browser = await chromium.launch(edgeOptions);
        console.log('[Browser Service] Successfully launched system Microsoft Edge.');
        return browser;
      } catch (edgeError) {
        console.error('❌ [Browser Service] All local browser launch channels failed.');
        throw new Error(`Browser launch failed: Playwright Chromium (${error.message}) -> System Chrome (${chromeError.message}) -> System Edge (${edgeError.message})`);
      }
    }
  }
}

/**
 * Creates an isolated browser context, injects authenticated session cookies,
 * and launches a new page with modern anti-fingerprint defaults.
 * (Layer 2 & Layer 3)
 * 
 * @param {import('playwright').Browser} browser - Active Browser instance
 * @returns {Promise<{context: import('playwright').BrowserContext, page: import('playwright').Page}>}
 */
async function createStealthPage(browser) {
  const viewport = getRandomViewport();
  const userAgent = getRandomUserAgent();

  console.log(`[Browser Service] Initializing context with viewport: ${viewport.width}x${viewport.height}`);
  console.log(`[Browser Service] Setting User-Agent: ${userAgent}`);

  const contextOptions = {
    viewport,
    userAgent,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    deviceScaleFactor: 1,
    hasTouch: false,
    permissions: ['geolocation'],
  };

  const context = await browser.newContext(contextOptions);

  // Layer 2: Load and inject session cookies if present
  if (fs.existsSync(COOKIES_PATH)) {
    try {
      console.log('[Browser Service] Found cookies.json. Injecting session cookies...');
      const rawCookies = fs.readFileSync(COOKIES_PATH, 'utf8');
      const cookies = JSON.parse(rawCookies);
      
      if (Array.isArray(cookies) && cookies.length > 0) {
        await context.addCookies(cookies);
        console.log(`[Browser Service] Successfully injected ${cookies.length} cookies.`);
      } else {
        console.warn('[Browser Service] cookies.json is empty or invalid format.');
      }
    } catch (cookieError) {
      console.error('❌ [Browser Service] Error loading cookies.json:', cookieError.message);
    }
  } else {
    console.log('⚠️ [Browser Service] No cookies.json found. Running as unauthenticated public session.');
  }

  const page = await context.newPage();

  // Set standard headers and extra properties to avoid detection
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  });

  return { context, page };
}

/**
 * Orchestrates organic human actions on the page to evade anti-bot detection.
 * (Layer 3)
 * 
 * @param {import('playwright').Page} page - Active Page context
 */
async function runHumanSimulation(page) {
  console.log('[Human Simulation] Simulating user activity...');
  
  // Random short delay before actions (1.5s - 3s)
  await randomSleep(1500, 3000);
  
  // Execute minor mouse movements
  await simulateMouseJitter(page);

  // Execute organic scrolling
  await simulateHumanScroll(page);
  
  // Final random delay after actions
  await randomSleep(1000, 2000);
}

module.exports = {
  launchStealthBrowser,
  createStealthPage,
  runHumanSimulation
};
