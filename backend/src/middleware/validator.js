/**
 * Express middleware to validate and normalize Instagram Reel or Post URLs.
 * Supports:
 * - https://www.instagram.com/reel/C8...
 * - https://instagram.com/reels/C8...
 * - https://instagram.com/p/C8...
 * - Supports query parameters and mobile/share redirects (e.g. ?igsh=...)
 */
function validateInstagramUrl(req, res, next) {
  let rawUrl = '';

  if (req.method === 'POST') {
    rawUrl = req.body && req.body.url;
  } else if (req.method === 'GET') {
    rawUrl = req.query && req.query.url;
  }

  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Instagram URL is required. Provide it in req.body.url (POST) or req.query.url (GET).'
    });
  }

  const urlStr = rawUrl.trim();

  // Regex to match instagram.com/reel/, instagram.com/reels/, or instagram.com/p/
  const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|reels|p)\/([A-Za-z0-9_-]+)/i;
  
  const match = urlStr.match(instagramRegex);
  if (!match) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Instagram URL. Only Instagram Reel or Post URLs are supported (e.g., https://www.instagram.com/reel/Code).'
    });
  }

  // Normalize URL to a standard format: https://www.instagram.com/reel/CODE/
  const mediaType = match[3] === 'reels' ? 'reel' : match[3]; // Convert reels to reel
  const shortcode = match[4];
  const normalizedUrl = `https://www.instagram.com/${mediaType}/${shortcode}/`;

  // Attach normalized details to req for controllers to consume
  req.instagram = {
    originalUrl: urlStr,
    normalizedUrl,
    mediaType,
    shortcode
  };

  next();
}

module.exports = {
  validateInstagramUrl
};
