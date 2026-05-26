// /**
//  * [aiService]
//  * Services for conducting multi-modal visual and textual analysis using Google's
//  * Gemini 1.5 Flash model and standard metadata properties.
//  */

// const fs = require('fs');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require('dotenv').config();

// // Initialize Gemini SDK if API Key exists
// const apiKey = process.env.GEMINI_API_KEY;
// let genAI = null;
// if (apiKey) {
//   genAI = new GoogleGenerativeAI(apiKey);
// } else {
//   console.warn('⚠️ [aiService] WARNING: GEMINI_API_KEY is not defined in environment configurations. AI analysis calls will fail.');
// }

// /**
//  * Converts a local file to the inline base64 object required by Gemini API.
//  * 
//  * @param {string} filePath - Absolute path to the local frame image
//  * @param {string} mimeType - The mime type of the target asset
//  * @returns {Object} Generative inline data part
//  */
// function fileToGenerativePart(filePath, mimeType) {
//   return {
//     inlineData: {
//       data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
//       mimeType
//     }
//   };
// }

// /**
//  * Downloads a remote image and converts it into base64 generative part.
//  * 
//  * @param {string} url - Remote image/thumbnail link
//  * @returns {Promise<Object>} Generative inline data part
//  */
// async function fetchImageAsBase64(url) {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`Status: ${response.status}`);
//     const buffer = await response.arrayBuffer();
//     return {
//       inlineData: {
//         data: Buffer.from(buffer).toString('base64'),
//         mimeType: 'image/jpeg'
//       }
//     };
//   } catch (error) {
//     console.error(`[aiService] Failed to convert remote thumbnail to base64: ${error.message}`);
//     throw error;
//   }
// }

// /**
//  * Cleans the raw model string response to ensure it parses as valid JSON.
//  * Strips any potential markdown headers (e.g. ```json ... ```).
//  * 
//  * @param {string} text - The raw model text output
//  * @returns {string} Cleaned JSON string
//  */
// function cleanJsonResponse(text) {
//   let cleaned = text.trim();
//   // Strip starting ```json
//   if (cleaned.startsWith('```json')) {
//     cleaned = cleaned.substring(7);
//   } else if (cleaned.startsWith('```')) {
//     cleaned = cleaned.substring(3);
//   }
//   // Strip ending ```
//   if (cleaned.endsWith('```')) {
//     cleaned = cleaned.substring(0, cleaned.length - 3);
//   }
//   return cleaned.trim();
// }

// /**
//  * Common schema description prompt for structured outputs.
//  */
// const JSON_SCHEMA_PROMPT = `
// Return ONLY valid JSON matching this exact schema:
// {
//   "analysisMode": "video" | "thumbnail",
//   "summary": "2-3 line reel summary",
//   "sceneDescription": "detailed visual scene description",
//   "activities": ["activity1", "activity2"],
//   "objects": ["object1", "object2"],
//   "mood": "energetic/calm/urgent/funny/etc",
//   "emotionAnalysis": "emotion description of creator or scene",
//   "category": "news/entertainment/education/tech/fashion/etc",
//   "contentLanguage": "Hindi/English/etc",
//   "audioGuess": "description of music type or speech detected",
//   "keyMoments": [
//     { "timestamp": "0s", "description": "Visual details at beginning" },
//     { "timestamp": "25%", "description": "Visual details at 25% point" },
//     { "timestamp": "50%", "description": "Visual details at 50% point" },
//     { "timestamp": "75%", "description": "Visual details at 75% point" }
//   ],
//   "safetyWarnings": ["warning1", "warning2"],
//   "viralPotential": 75, // Integer 0-100
//   "engagementPrediction": "high/medium/low",
//   "hashtags": ["#tag1", "#tag2"],
//   "detectedElements": {
//     "fire": false,
//     "accident": false,
//     "crowd": false,
//     "vehicle": false,
//     "outdoor": true,
//     "emergency": false
//   }
// }
// Do NOT explain. Do NOT add any notes outside of the JSON block. Ensure all fields are fully populated.
// `;

// /**
//  * Conducts multi-modal analysis on extracted video frames and textual metadata.
//  * (AI Mode 1)
//  * 
//  * @param {string[]} framePaths - Array of absolute paths to frame images
//  * @param {Object} metadata - Scraped Reel textual properties
//  * @returns {Promise<Object|null>} Structured JSON analysis result or null if failed
//  */
// async function analyzeWithVideo(framePaths, metadata) {
//   console.log('[aiService] Running Multi-Modal Video Analysis (Mode 1)...');

//   if (!genAI) {
//     console.error('[aiService] Cannot analyze: Gemini API key is missing.');
//     return null;
//   }

//   try {
//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-1.5-flash',
//       generationConfig: { responseMimeType: 'application/json' }
//     });

//     // 1. Prepare visual frame inputs
//     const imageParts = framePaths.map(path => fileToGenerativePart(path, 'image/jpeg'));

//     // 2. Prepare text prompt context
//     const prompt = `
// You are an expert social media AI analyst. Analyze the following 4 video frames in sequence, representing timestamps (0%, 25%, 50%, 75%) of an Instagram Reel, along with the text metadata.

// --- INSTAGRAM METADATA ---
// Creator Handle: @${metadata.username || 'unknown'}
// Post Caption: ${metadata.caption || '(No caption provided)'}
// Likes Count: ${metadata.likes || '0'}
// Comments Count: ${metadata.comments || '0'}
// Platform: Instagram
// --------------------------

// ${JSON_SCHEMA_PROMPT}
// Set "analysisMode" to "video". For the "keyMoments", populate them based on what you visually identify across the 4 frames.
// `;

//     console.log('[aiService] Submitting payload stream to Gemini 1.5 Flash...');
//     const result = await model.generateContent([prompt, ...imageParts]);
//     const response = await result.response;
//     const responseText = response.text();

//     const cleanedText = cleanJsonResponse(responseText);
//     const parsedData = JSON.parse(cleanedText);

//     console.log('[aiService] Video analysis parsed successfully!');
//     return parsedData;
//   } catch (error) {
//     console.error(`❌ [aiService] Video analysis failed: ${error.message}`);
//     return null; // Fail gracefully, never crash the request
//   }
// }

// /**
//  * Conducts multi-modal analysis on scraped thumbnail image and textual metadata.
//  * (AI Mode 2 - Fallback)
//  * 
//  * @param {string} thumbnailUrl - Remote link to cover image
//  * @param {Object} metadata - Scraped Reel textual properties
//  * @returns {Promise<Object|null>} Structured JSON analysis result or null if failed
//  */
// async function analyzeWithThumbnail(thumbnailUrl, metadata) {
//   console.log('[aiService] Running Multi-Modal Thumbnail Fallback Analysis (Mode 2)...');

//   if (!genAI) {
//     console.error('[aiService] Cannot analyze: Gemini API key is missing.');
//     return null;
//   }

//   if (!thumbnailUrl || thumbnailUrl === 'N/A') {
//     console.warn('[aiService] Cannot analyze: Thumbnail is missing or invalid.');
//     return null;
//   }

//   try {
//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-1.5-flash',
//       generationConfig: { responseMimeType: 'application/json' }
//     });

//     // 1. Prepare base64 thumbnail input
//     console.log(`[aiService] Converting remote thumbnail to base64: ${thumbnailUrl.substring(0, 80)}...`);
//     const thumbnailPart = await fetchImageAsBase64(thumbnailUrl);

//     // 2. Prepare text prompt context
//     const prompt = `
// You are an expert social media AI analyst. Analyze the following cover thumbnail image along with the post metadata. Since video frames are not available, evaluate properties from the single thumbnail and post context.

// --- INSTAGRAM METADATA ---
// Creator Handle: @${metadata.username || 'unknown'}
// Post Caption: ${metadata.caption || '(No caption provided)'}
// Likes Count: ${metadata.likes || '0'}
// Comments Count: ${metadata.comments || '0'}
// Audio Name: ${metadata.audioName || 'Original Audio'}
// Platform: Instagram
// --------------------------

// ${JSON_SCHEMA_PROMPT}
// Set "analysisMode" to "thumbnail". For the "keyMoments" array, set it as an empty array [] since video frames are unavailable.
// `;

//     console.log('[aiService] Submitting payload stream to Gemini 1.5 Flash...');
//     const result = await model.generateContent([prompt, thumbnailPart]);
//     const response = await result.response;
//     const responseText = response.text();

//     const cleanedText = cleanJsonResponse(responseText);
//     const parsedData = JSON.parse(cleanedText);

//     console.log('[aiService] Thumbnail analysis parsed successfully!');
//     return parsedData;
//   } catch (error) {
//     console.error(`❌ [aiService] Thumbnail analysis failed: ${error.message}`);
//     return null; // Fail gracefully, never crash the request
//   }
// }

// module.exports = {
//   analyzeWithVideo,
//   analyzeWithThumbnail
// };
/**
 * [aiService]
 * Services for conducting multi-modal visual and textual analysis using Google's
 * Gemini 1.5 Flash model and standard metadata properties.
 */

/**
 * [aiService]
 * Services for conducting multi-modal visual and textual analysis using Google's
 * Gemini 1.5 Flash model and standard metadata properties.
 */

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini SDK if API Key exists
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  // Explicitly forcing stable API configuration parameters if supported by your SDK version
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('⚠️ [aiService] WARNING: GEMINI_API_KEY is not defined in environment configurations. AI analysis calls will fail.');
}

/**
 * Smart metric extractor logic for backend context enrichment.
 * Extracts metrics from text captions if raw data fields are missing.
 */
function getParsedMetric(type, fallbackValue, caption) {
  if (fallbackValue && fallbackValue !== 0 && fallbackValue !== '0' && fallbackValue !== 'N/A') {
    return fallbackValue;
  }
  if (!caption) return '0';
  try {
    const cleanCaption = caption.replace(/\s+/g, ' ').trim();
    if (type === 'likes') {
      const match = cleanCaption.match(/([\d.]+[KMB]?)\s*likes/i);
      if (match) return match[1];
    }
    if (type === 'comments') {
      const match = cleanCaption.match(/([\d.]+[KMB]?)\s*comments/i);
      if (match) return match[1];
    }
  } catch (err) {
    console.warn('[aiService Parser] Metric extraction fallback failed:', err);
  }
  return '0';
}

/**
 * Converts a local file to the inline base64 object required by Gemini API.
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}

/**
 * Downloads a remote image and converts it into base64 generative part.
 */
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const buffer = await response.arrayBuffer();
    return {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
  } catch (error) {
    console.error(`[aiService] Failed to convert remote thumbnail to base64: ${error.message}`);
    throw error;
  }
}

/**
 * Cleans the raw model string response to ensure it parses as valid JSON.
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  // Strip starting codeblock structures safely
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  // Strip ending codeblock wrappers
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

/**
 * Common schema description prompt for structured outputs.
 */
const JSON_SCHEMA_PROMPT = `
Return ONLY a valid JSON object matching this exact schema specification:
{
  "analysisMode": "video",
  "summary": "2-3 line reel summary string",
  "sceneDescription": "detailed visual scene description string",
  "activities": ["activity1", "activity2"],
  "objects": ["object1", "object2"],
  "mood": "energetic",
  "emotionAnalysis": "emotion description string",
  "category": "entertainment",
  "contentLanguage": "English",
  "audioGuess": "audio description track string",
  "keyMoments": [
    { "timestamp": "0s", "description": "Visual details at beginning" },
    { "timestamp": "25%", "description": "Visual details at 25% point" },
    { "timestamp": "50%", "description": "Visual details at 50% point" },
    { "timestamp": "75%", "description": "Visual details at 75% point" }
  ],
  "safetyWarnings": [],
  "viralPotential": 75, 
  "engagementPrediction": "high",
  "hashtags": ["tag1", "tag2"],
  "detectedElements": {
    "fire": false,
    "accident": false,
    "crowd": false,
    "vehicle": false,
    "outdoor": true,
    "emergency": false
  }
}
Do NOT wrap the output in text notes, warnings, or markdown explanations. Return raw parseable JSON only.
`;

/**
 * Conducts multi-modal analysis on extracted video frames and textual metadata.
 * (AI Mode 1)
 */
async function analyzeWithVideo(framePaths, metadata) {
  console.log('[aiService] Running Multi-Modal Video Analysis (Mode 1)...');

  if (!genAI) {
    console.error('[aiService] Cannot analyze: Gemini API key is missing.');
    return null;
  }

  try {
    // Explicit production model declaration
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imageParts = framePaths.map(path => fileToGenerativePart(path, 'image/jpeg'));

    const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
    const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

    const prompt = `
You are an expert social media AI analyst. Analyze the following 4 video frames in sequence, representing sequential timestamps of an Instagram Reel, along with the text metadata.

--- INSTAGRAM METADATA ---
Creator Handle: @${metadata.username || 'unknown'}
Post Caption: ${metadata.caption || '(No caption provided)'}
Likes Count: ${enrichedLikes}
Comments Count: ${enrichedComments}
Platform: Instagram
--------------------------

${JSON_SCHEMA_PROMPT}
Set "analysisMode" to "video". Ensure all array items are filled with string labels based on visual clues.
`;

    console.log('[aiService] Submitting payload stream to Gemini 1.5 Flash...');

    // Using unified payload request configuration blocks
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const response = await result.response;
    const responseText = response.text();

    const cleanedText = cleanJsonResponse(responseText);
    const parsedData = JSON.parse(cleanedText);

    console.log('[aiService] Video analysis parsed successfully!');
    return parsedData;
  } catch (error) {
    console.error(`❌ [aiService] Video analysis failed: ${error.message}`);
    return null;
  }
}

/**
 * Conducts multi-modal analysis on scraped thumbnail image and textual metadata.
 * (AI Mode 2 - Fallback)
 */
async function analyzeWithThumbnail(thumbnailUrl, metadata) {
  console.log('[aiService] Running Multi-Modal Thumbnail Fallback Analysis (Mode 2)...');

  if (!genAI) {
    console.error('[aiService] Cannot analyze: Gemini API key is missing.');
    return null;
  }

  if (!thumbnailUrl || thumbnailUrl === 'N/A') {
    console.warn('[aiService] Cannot analyze: Thumbnail is missing or invalid.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log(`[aiService] Converting remote thumbnail to base64: ${thumbnailUrl.substring(0, 80)}...`);
    const thumbnailPart = await fetchImageAsBase64(thumbnailUrl);

    const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
    const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

    const prompt = `
You are an expert social media AI analyst. Analyze the following cover thumbnail image along with the post metadata. Evaluate properties from the single thumbnail and post context.

--- INSTAGRAM METADATA ---
Creator Handle: @${metadata.username || 'unknown'}
Post Caption: ${metadata.caption || '(No caption provided)'}
Likes Count: ${enrichedLikes}
Comments Count: ${enrichedComments}
Audio Name: ${metadata.audioName || 'Original Audio'}
Platform: Instagram
--------------------------

${JSON_SCHEMA_PROMPT}
Set "analysisMode" to "thumbnail". For the "keyMoments" array, set it as an empty array [].
`;

    console.log('[aiService] Submitting payload stream to Gemini 1.5 Flash...');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, thumbnailPart] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const response = await result.response;
    const responseText = response.text();

    const cleanedText = cleanJsonResponse(responseText);
    const parsedData = JSON.parse(cleanedText);

    console.log('[aiService] Thumbnail analysis parsed successfully!');
    return parsedData;
  } catch (error) {
    console.error(`❌ [aiService] Thumbnail analysis failed: ${error.message}`);
    return null;
  }
}

module.exports = {
  analyzeWithVideo,
  analyzeWithThumbnail
};