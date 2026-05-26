/**
 * Pauses execution for a specified duration in milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pauses execution for a random range between min and max (inclusive).
 * @param {number} min - Minimum milliseconds
 * @param {number} max - Maximum milliseconds
 * @returns {Promise<void>}
 */
const randomSleep = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(ms);
};

/**
 * Generates a randomized realistic viewport.
 * @returns {Object} { width, height }
 */
const getRandomViewport = () => {
  const commonViewports = [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1280, height: 720 }
  ];
  return commonViewports[Math.floor(Math.random() * commonViewports.length)];
};

/**
 * Generates a random realistic Chrome-like User Agent string.
 * @returns {string} User Agent
 */
const getRandomUserAgent = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

/**
 * Simulates minor human mouse movements (jitters) on the page.
 * @param {import('playwright').Page} page - Playwright page context
 */
const simulateMouseJitter = async (page) => {
  try {
    const width = page.viewportSize()?.width || 1280;
    const height = page.viewportSize()?.height || 800;

    // Standard initial hover point
    let startX = Math.floor(Math.random() * (width / 2)) + 100;
    let startY = Math.floor(Math.random() * (height / 2)) + 100;

    await page.mouse.move(startX, startY);
    
    // Simulate 3-5 small movements
    const moves = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < moves; i++) {
      const offset = 10 + Math.floor(Math.random() * 20);
      startX += (Math.random() > 0.5 ? offset : -offset);
      startY += (Math.random() > 0.5 ? offset : -offset);
      await page.mouse.move(startX, startY, { steps: 5 });
      await sleep(100 + Math.floor(Math.random() * 150));
    }
  } catch (err) {
    // Gracefully ignore error in case viewport or mouse isn't supported yet
  }
};

/**
 * Simulates organic user scrolling on the page.
 * @param {import('playwright').Page} page - Playwright page context
 */
const simulateHumanScroll = async (page) => {
  try {
    // Scroll down in small steps
    const steps = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < steps; i++) {
      const scrollAmt = 150 + Math.floor(Math.random() * 250);
      await page.evaluate((amt) => window.scrollBy(0, amt), scrollAmt);
      await randomSleep(200, 600);
    }
    
    // Slight scroll back up (typical human adjustment)
    if (Math.random() > 0.4) {
      const scrollUpAmt = -(50 + Math.floor(Math.random() * 80));
      await page.evaluate((amt) => window.scrollBy(0, amt), scrollUpAmt);
      await randomSleep(100, 300);
    }
  } catch (err) {
    // Gracefully ignore
  }
};

module.exports = {
  sleep,
  randomSleep,
  getRandomViewport,
  getRandomUserAgent,
  simulateMouseJitter,
  simulateHumanScroll
};
