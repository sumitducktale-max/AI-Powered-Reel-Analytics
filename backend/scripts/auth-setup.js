const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const COOKIES_PATH = path.join(__dirname, '..', 'cookies.json');

async function run() {
  console.log('=====================================================');
  console.log('Instagram Scraper - Session Authentication Setup');
  console.log('=====================================================');
  console.log('This script will launch a HEADED browser window.');
  console.log('Please log in manually to your Instagram account.');
  console.log('Once logged in and viewing your feed/home page, either:');
  console.log('1. Close the browser window.');
  console.log('2. Come back here and press [ENTER] to save and exit.');
  console.log('=====================================================\n');

  // Check proxy settings in case they are needed for login
  const proxyUrl = process.env.PROXY_URL;
  let launchOptions = {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (proxyUrl) {
    try {
      const parsedProxy = new URL(proxyUrl);
      launchOptions.proxy = {
        server: `${parsedProxy.protocol}//${parsedProxy.host}`
      };
      if (parsedProxy.username && parsedProxy.password) {
        launchOptions.proxy.username = decodeURIComponent(parsedProxy.username);
        launchOptions.proxy.password = decodeURIComponent(parsedProxy.password);
      }
      console.log(`Using Proxy for setup: ${launchOptions.proxy.server}`);
    } catch (err) {
      console.error('Invalid PROXY_URL configured, continuing without proxy:', err.message);
    }
  }

  console.log('Launching browser...');
  const browser = await chromium.launch(launchOptions);
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  
  console.log('Navigating to Instagram...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });

  let isSaved = false;

  const saveCookiesAndClose = async () => {
    if (isSaved) return;
    isSaved = true;
    try {
      console.log('\nExtracting session cookies...');
      const cookies = await context.cookies();
      
      // Basic validation: Check if we have standard session cookies (like sessionid, ds_user_id)
      const hasSession = cookies.some(c => c.name === 'sessionid' || c.name === 'ds_user_id');
      if (!hasSession) {
        console.warn('⚠️ WARNING: Could not find Instagram "sessionid" or "ds_user_id" cookies. You might not be logged in.');
      }

      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      console.log(`✅ Session cookies successfully saved to: ${COOKIES_PATH}`);
      console.log('You can now run the backend application, and it will load these cookies automatically.');
    } catch (error) {
      console.error('❌ Error saving cookies:', error.message);
    } finally {
      try {
        await browser.close();
      } catch (e) {}
      process.exit(0);
    }
  };

  // Listen for browser/page close
  page.on('close', async () => {
    console.log('Browser window closed by user.');
    await saveCookiesAndClose();
  });

  // Setup CLI interface for pressing Enter
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Press [ENTER] to save cookies and exit once you have logged in:\n', async () => {
    rl.close();
    await saveCookiesAndClose();
  });
}

run().catch(err => {
  console.error('❌ Critical error during auth setup:', err);
  process.exit(1);
});
