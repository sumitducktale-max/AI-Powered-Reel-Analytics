const express = require('express');
const router = express.Router();
const { validateInstagramUrl } = require('../middleware/validator');
const { analyzeReel } = require('../controllers/reelController');

/**
 * REST API Endpoints for Instagram Reel Analysis.
 * 
 * Supports:
 * 1. POST /api/reel/analyze (Body: { "url": "..." })
 * 2. GET /api/scrape?url=... (Query: url=...)
 */
router.post('/reel/analyze', validateInstagramUrl, analyzeReel);
router.get('/scrape', validateInstagramUrl, analyzeReel);

module.exports = router;
