const dotenv = require('dotenv');
dotenv.config();

/**
 * Fetches Instagram Reel metadata using the official Meta or public oEmbed endpoint.
 * Acts as the final Layer 6 fallback if browser automation fails.
 * 
 * @param {string} url - Normalized Instagram Reel/Post URL
 * @returns {Promise<Object>} Mapped reel metadata
 */
async function fetchOembedMetadata(url) {
  console.log(`[oEmbed Fallback] Attempting metadata extraction for URL: ${url}`);
  
  const accessToken = process.env.OEMBED_ACCESS_TOKEN;
  let targetUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
  
  if (accessToken && accessToken.trim() !== '') {
    targetUrl = `https://graph.facebook.com/v16.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`oEmbed request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[oEmbed Fallback] Successfully fetched metadata from Instagram oEmbed API.');

    return {
      username: data.author_name || 'unknown',
      caption: data.title || '',
      likes: 'N/A (oEmbed Fallback)',
      comments: 'N/A (oEmbed Fallback)',
      thumbnail: data.thumbnail_url || '',
      videoUrl: 'N/A (oEmbed Fallback)',
      audioName: 'N/A (oEmbed Fallback)',
      timestamp: new Date().toISOString(),
      platform: 'Instagram',
      fallbackUsed: 'oEmbed'
    };
  } catch (error) {
    console.error('❌ [oEmbed Fallback] Failed:', error.message);
    throw new Error(`oEmbed extraction failed: ${error.message}`);
  }
}

module.exports = {
  fetchOembedMetadata
};
