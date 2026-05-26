/**
 * [embedService]
 * Services for extracting direct video stream CDNs using the public Instagram Embed endpoints
 * without requiring active logins or authenticated browser sessions.
 */

const { randomSleep } = require('../utils/helpers');

/**
 * Extracts a direct Reel video URL from the public Embed endpoint.
 * Try all methods (A, B, C, D) in order to maximize success rates.
 * 
 * @param {import('playwright').Page} page - Active Playwright page context
 * @param {string} reelUrl - The full original/normalized Instagram Reel URL
 * @returns {Promise<{ videoUrl: string, extractionMethod: string } | null>}
 */
async function extractVideoFromEmbed(page, reelUrl) {
  console.log(`[embedService] Initiating public embed extraction layer for URL: ${reelUrl}`);

  // Step 1: Extract Reel ID from URL
  const shortcodeRegex = /\/(reel|reels|p)\/([A-Za-z0-9_-]+)/i;
  const match = reelUrl.match(shortcodeRegex);
  if (!match) {
    console.error(`[embedService] Failed to extract shortcode ID from URL: ${reelUrl}`);
    return null;
  }

  const shortcodeId = match[2];
  
  // Step 2: Build Embed URL
  const embedUrl = `https://www.instagram.com/reel/${shortcodeId}/embed/`;
  console.log(`[embedService] Formulated public embed URL: ${embedUrl}`);

  // Step 3: Listen for network interception (Method D) during embed page load
  let interceptedVideoUrl = null;
  const networkListener = (response) => {
    try {
      const url = response.url();
      if (
        (url.includes('.mp4') || url.includes('fbcdn.net') || url.includes('cdninstagram.com')) &&
        (response.request().resourceType() === 'media' || url.includes('video'))
      ) {
        console.log(`[embedService] Method D matched network response URL: ${url.substring(0, 100)}...`);
        interceptedVideoUrl = url;
      }
    } catch (e) {
      // Ignore reading issues on aborted requests
    }
  };

  // Attach the listener
  page.on('response', networkListener);

  try {
    // Step 4: Navigate to the public Embed Page
    console.log(`[embedService] Navigating browser page to embed URL...`);
    await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    
    // Give it a short sleep to allow resources to load
    await randomSleep(2000, 3500);

    // Method A: Direct video tag
    console.log(`[embedService] Executing Method A: Checking direct video elements...`);
    const methodAVideo = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? (video.src || video.currentSrc) : null;
    });

    if (methodAVideo && methodAVideo.startsWith('http')) {
      console.log('[embedService] Method A Succeeded! Video URL located.');
      page.off('response', networkListener);
      return { videoUrl: methodAVideo, extractionMethod: 'Embed Video Element' };
    }

    // Method B: Video source tag
    console.log(`[embedService] Executing Method B: Checking video source elements...`);
    const methodBVideo = await page.evaluate(() => {
      const source = document.querySelector('video source');
      return source ? source.src : null;
    });

    if (methodBVideo && methodBVideo.startsWith('http')) {
      console.log('[embedService] Method B Succeeded! Source URL located.');
      page.off('response', networkListener);
      return { videoUrl: methodBVideo, extractionMethod: 'Embed Source Element' };
    }

    // Method C: Script tag scanning (often contains raw JSON or manifest streams)
    console.log(`[embedService] Executing Method C: Scanning inline page script structures...`);
    const methodCVideo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const content = script.textContent || '';
        if (content.includes('video_url')) {
          // Regex match "video_url":"..."
          const match = content.match(/"video_url":"([^"]+)"/);
          if (match && match[1]) {
            // Decode unicodes e.g. replacing \\u0026 with &
            let decoded = match[1].replace(/\\u0026/g, '&');
            // Unescape backslashes if present
            decoded = decoded.replace(/\\/g, '');
            return decoded;
          }
        }
      }
      return null;
    });

    if (methodCVideo && methodCVideo.startsWith('http')) {
      console.log('[embedService] Method C Succeeded! Video URL decoded from script tag.');
      page.off('response', networkListener);
      return { videoUrl: methodCVideo, extractionMethod: 'Embed Script Scan' };
    }

    // Method D check: If network interception captured the media URL during load
    if (interceptedVideoUrl) {
      console.log('[embedService] Method D Succeeded! Video URL intercepted in network stream.');
      page.off('response', networkListener);
      return { videoUrl: interceptedVideoUrl, extractionMethod: 'Embed Network Intercept' };
    }

    console.log('[embedService] All embed extraction methods exhausted. Failed to locate public video URL.');
    page.off('response', networkListener);
    return null;
  } catch (error) {
    console.error(`❌ [embedService] Public embed extraction failed with error: ${error.message}`);
    page.off('response', networkListener);
    return null;
  }
}

module.exports = {
  extractVideoFromEmbed
};
