/**
 * Network Interception Service (Layer 4).
 * Intercepts internal GraphQL and REST responses to extract rich JSON metadata
 * without relying on DOM elements which are highly prone to classname changes.
 */

/**
 * Parses raw JSON responses from Instagram's internal queries.
 * Handles both GraphQL schemas (xdt_shortcode_media / shortcode_media) and REST items.
 * 
 * @param {Object} json - The parsed response JSON body
 * @returns {Object|null} Extracted normalized metadata or null if not matched
 */
function parseInstagramJson(json) {
  if (!json) return null;

  // 1. Try GraphQL structure
  let media = null;
  if (json.data) {
    if (json.data.shortcode_media) {
      media = json.data.shortcode_media;
    } else if (json.data.xdt_shortcode_media) {
      media = json.data.xdt_shortcode_media;
    }
  }

  if (media) {
    try {
      const username = media.owner?.username || 'unknown';
      const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || '';
      const likes = media.edge_media_preview_like?.count || media.edge_liked_by?.count || '0';
      const comments = media.edge_media_to_parent_comment?.count || media.edge_media_to_comment?.count || '0';
      const thumbnail = media.display_url || media.thumbnail_src || '';
      const videoUrl = media.video_url || '';
      
      let audioName = 'Original Audio';
      if (media.clips_music_attribution_info?.title) {
        audioName = media.clips_music_attribution_info.title;
      } else if (media.clips_metadata?.music_info?.music_asset_info?.title) {
        audioName = media.clips_metadata.music_info.music_asset_info.title;
      }

      const timestamp = media.taken_at_timestamp 
        ? new Date(media.taken_at_timestamp * 1000).toISOString() 
        : new Date().toISOString();

      return {
        username,
        caption,
        likes: String(likes),
        comments: String(comments),
        thumbnail,
        videoUrl,
        audioName,
        timestamp,
        platform: 'Instagram',
        extractionMethod: 'Network Interception (GraphQL)'
      };
    } catch (e) {
      console.error('[Interceptor] GraphQL parsing error:', e.message);
    }
  }

  // 2. Try REST API structure (items[0])
  if (json.items && Array.isArray(json.items) && json.items.length > 0) {
    try {
      const item = json.items[0];
      const username = item.user?.username || 'unknown';
      const caption = item.caption?.text || '';
      const likes = item.like_count || '0';
      const comments = item.comment_count || '0';
      
      let thumbnail = '';
      if (item.image_versions2?.candidates?.length > 0) {
        thumbnail = item.image_versions2.candidates[0].url;
      }

      let videoUrl = '';
      if (item.video_versions?.length > 0) {
        videoUrl = item.video_versions[0].url;
      }

      let audioName = 'Original Audio';
      if (item.music_metadata?.music_info?.music_asset_info?.title) {
        audioName = item.music_metadata.music_info.music_asset_info.title;
      } else if (item.clips_metadata?.music_info?.music_asset_info?.title) {
        audioName = item.clips_metadata.music_info.music_asset_info.title;
      }

      const timestamp = item.taken_at 
        ? new Date(item.taken_at * 1000).toISOString() 
        : new Date().toISOString();

      return {
        username,
        caption,
        likes: String(likes),
        comments: String(comments),
        thumbnail,
        videoUrl,
        audioName,
        timestamp,
        platform: 'Instagram',
        extractionMethod: 'Network Interception (REST)'
      };
    } catch (e) {
      console.error('[Interceptor] REST parsing error:', e.message);
    }
  }

  return null;
}

/**
 * Sets up a listener on the page to intercept responses from Instagram endpoints.
 * Returns a controller object that exposes a promise which resolves early upon match.
 * 
 * @param {import('playwright').Page} page - Active Playwright page
 * @returns {Object} { metadataPromise, getCapturedData }
 */
function setupNetworkInterceptor(page) {
  let resolveMetadata;
  const metadataPromise = new Promise((resolve) => {
    resolveMetadata = resolve;
  });

  let capturedData = null;

  page.on('response', async (response) => {
    try {
      const url = response.url();
      
      // Filter target endpoints
      if (!url.includes('/graphql/query') && !url.includes('api/v1/media')) {
        return;
      }

      // Check header types to ensure we only read JSON-ready payloads
      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
        return;
      }

      const bodyText = await response.text();
      if (!bodyText || bodyText.trim() === '') return;

      const json = JSON.parse(bodyText);
      const extracted = parseInstagramJson(json);
      
      if (extracted) {
        capturedData = extracted;
        console.log(`[Interceptor] Match found on: ${url.substring(0, 80)}...`);
        resolveMetadata(extracted);
      }
    } catch (err) {
      // In headless environments, reading certain abortive payloads can throw; ignore
    }
  });

  return {
    metadataPromise,
    getCapturedData: () => capturedData
  };
}

module.exports = {
  setupNetworkInterceptor,
  parseInstagramJson
};
