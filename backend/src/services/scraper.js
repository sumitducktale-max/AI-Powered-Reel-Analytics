/**
 * DOM Fallback Scraper Service.
 * Attempts to extract metadata directly from the page DOM using meta tags
 * and JSON-LD schema structures. Used if internal network interception fails.
 * 
 * @param {import('playwright').Page} page - Playwright page context
 * @returns {Promise<Object>} Mapped reel metadata
 */
async function scrapeDomMetadata(page) {
  console.log('[DOM Scraper] Initiating DOM extraction fallback...');

  // Extract meta tags and LD+JSON script tags from the page context
  const domData = await page.evaluate(() => {
    const getMeta = (prop) => {
      const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
      return el ? el.getAttribute('content') : '';
    };

    let ldJsonData = null;
    try {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        const parsed = JSON.parse(script.textContent);
        if (parsed) {
          // Sometimes it is nested or in a graph
          if (Array.isArray(parsed)) {
            ldJsonData = parsed.find(item => item['@type'] === 'VideoObject' || item['@type'] === 'SocialMediaPosting') || parsed[0];
          } else if (parsed['@type'] === 'VideoObject' || parsed['@type'] === 'SocialMediaPosting' || parsed['@graph']) {
            ldJsonData = parsed;
          }
          if (ldJsonData) break;
        }
      }
    } catch (e) {
      // Ignore evaluation parsing issues
    }

    // Direct selectors as backup
    const titleText = document.title || '';
    
    return {
      titleText,
      metaVideo: getMeta('og:video') || getMeta('og:video:secure_url') || getMeta('twitter:player'),
      metaImage: getMeta('og:image') || getMeta('twitter:image'),
      metaDesc: getMeta('og:description') || getMeta('description'),
      metaTitle: getMeta('og:title'),
      ldJson: ldJsonData
    };
  });

  if (!domData.metaDesc && !domData.ldJson && !domData.metaImage) {
    throw new Error('No scrapable content detected in DOM.');
  }

  console.log('[DOM Scraper] Successfully retrieved DOM and Schema structures.');

  let username = 'unknown';
  let caption = domData.metaDesc || '';
  let likes = '0';
  let comments = '0';
  let thumbnail = domData.metaImage || '';
  let videoUrl = domData.metaVideo || '';
  let audioName = 'Original Audio';
  let timestamp = new Date().toISOString();

  // 1. Attempt to parse description metadata (Instagram's standard OG description template:
  // "123 Likes, 45 Comments - Username (@handle) on Instagram: 'caption...'")
  const desc = domData.metaDesc || '';
  const descRegex = /^([\d,kKmM+.\s]+)\s+Likes,\s+([\d,kKmM+.\s]+)\s+Comments\s+-\s+(.+?)\s+\(@([\w._]+)\)\s+on\s+Instagram/i;
  const match = desc.match(descRegex);

  if (match) {
    likes = match[1].trim();
    comments = match[2].trim();
    username = match[4].trim();
    
    // Clean up caption - it starts after "on Instagram: " in description if present
    const colonIndex = desc.indexOf(':');
    if (colonIndex !== -1 && colonIndex < desc.length - 2) {
      caption = desc.substring(colonIndex + 1).trim();
      // Remove trailing quotes if wrapped in single quotes
      if (caption.startsWith("'") && caption.endsWith("'")) {
        caption = caption.substring(1, caption.length - 1);
      }
    }
  } else {
    // Secondary regex formats
    const secondRegex = /(@[\w._]+)\s+posted\s+on\s+their\s+Instagram\s+profile/i;
    const match2 = desc.match(secondRegex);
    if (match2) {
      username = match2[1].replace('@', '').trim();
    } else {
      // Try to parse from title: "Username (@handle) • Instagram reel"
      const titleMatch = domData.titleText.match(/(.+?)\s+\(@([\w._]+)\)\s+•\s+Instagram/i);
      if (titleMatch) {
        username = titleMatch[2].trim();
      }
    }
  }

  // 2. Extract from JSON-LD Schema (if present)
  if (domData.ldJson) {
    const ld = domData.ldJson;
    
    if (ld.author) {
      if (typeof ld.author === 'string') username = ld.author;
      else if (ld.author.name) username = ld.author.name;
      else if (ld.author.alternateName) username = ld.author.alternateName;
    }

    if (ld.caption) caption = ld.caption;
    else if (ld.name && !caption) caption = ld.name;
    else if (ld.description && !caption) caption = ld.description;

    if (ld.thumbnailUrl) thumbnail = ld.thumbnailUrl;
    if (ld.contentUrl) videoUrl = ld.contentUrl;
    else if (ld.embedUrl) videoUrl = ld.embedUrl;

    if (ld.uploadDate || ld.dateCreated) {
      timestamp = ld.uploadDate || ld.dateCreated;
    }

    // Interaction stats (Likes and Comments count)
    if (ld.interactionStatistic) {
      const stats = Array.isArray(ld.interactionStatistic) ? ld.interactionStatistic : [ld.interactionStatistic];
      stats.forEach(stat => {
        const type = stat.interactionType;
        if (type && type.includes('LikeAction')) {
          likes = String(stat.userInteractionCount || likes);
        } else if (type && type.includes('CommentAction')) {
          comments = String(stat.userInteractionCount || comments);
        }
      });
    }
  }

  // 3. Fallback extraction of username from HTML selectors if empty
  if (username === 'unknown' || !username) {
    try {
      // Instagram selectors for profile name (e.g. within reel components)
      username = await page.evaluate(() => {
        const usernameEl = document.querySelector('header a[href*="/"] font, header a[href*="/"], a[class*="x1i10hfl"]');
        return usernameEl ? usernameEl.textContent.trim() : '';
      });
    } catch (e) {}
  }

  return {
    username: username || 'unknown',
    caption: caption || '',
    likes: likes || '0',
    comments: comments || '0',
    thumbnail: thumbnail || '',
    videoUrl: videoUrl || '',
    audioName: audioName || 'Original Audio',
    timestamp: timestamp || new Date().toISOString(),
    platform: 'Instagram',
    fallbackUsed: 'DOM'
  };
}

module.exports = {
  scrapeDomMetadata
};
