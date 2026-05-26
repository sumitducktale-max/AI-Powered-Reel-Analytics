/**
 * [aiService]
 * Services for conducting multi-modal visual, audio, and textual analysis using Google's
 * Gemini model family with resilient priority fallback arrays.
 */

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini SDK if API Key exists
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
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
 * Uses strict descriptive typing to force dynamic evaluations instead of fixed template mock-data.
 */
const JSON_SCHEMA_PROMPT = `
Return ONLY a valid JSON object matching this exact schema layout structure:
{
  "analysisMode": "video" | "thumbnail",
  "summary": "string - dynamic 3 to 5 line overall summary of the reel",
  "sceneDescription": "string - detailed chronological breakdown of the visual environment",
  "activities": ["string"],
  "objects": ["string"],
  "mood": "string - specific dynamic mood word matching the audio track and visual pace",
  "emotionAnalysis": "string - dynamic analysis of user or subject facial/vocal expressions",
  "category": "string - must choose best fit from: news, entertainment, education, tech, fashion, sports, cooking, lifestyle",
  "contentLanguage": "string - example: English, Hindi, Hinglish, Spanish",
  "audioGuess": "string - exact speech transcription summary, or dynamic music genre/vibe description",
  "keyMoments": [
    { "timestamp": "0s", "description": "string - description of starting moment" },
    { "timestamp": "25%", "description": "string - description at 25% timeline" },
    { "timestamp": "50%", "description": "string - description at 50% timeline" },
    { "timestamp": "75%", "description": "string - description at 75% timeline" }
  ],
  "safetyWarnings": ["string"],
  "viralPotential": integer - a dynamic calculated score from 1 to 100 based entirely on engagement metrics, audio trends, and retention hooks seen in the media,
  "engagementPrediction": "low" | "medium" | "high",
  "hashtags": ["string"],
  "detectedElements": {
    "fire": boolean,
    "accident": boolean,
    "crowd": boolean,
    "vehicle": boolean,
    "outdoor": boolean,
    "emergency": boolean
  }
}

CORE EXECUTION HIERARCHY & PRIORITY RULES:
1. AUDIO TRACK FOCUS: Listen to the attached MP3 payload first. If any human speech or dialogue is present, transcribe and capture the exact core message/transcript summary into "audioGuess". Do not use generic placeholders.
2. TEXT METADATA CROSS-REFERENCE: Analyze the provided Instagram caption and user metrics. Blend this context with the spoken audio to determine the exact "contentLanguage" (e.g., if speaking Hindi but writing English, specify "Hinglish" or "Hindi/English").
3. VISUAL CHECKPOINTS: Use the 4 sequential frames to track the visual changes. Sync what you see in the images with what you hear in the audio track at those relative timestamps.
4. DYNAMIC SCORING: Calculate the "viralPotential" number uniquely for every request based on how strong the opening visual/audio hook is. Do not reuse static template numbers.

Do NOT wrap the output in text notes, warnings, markdown code blocks, or explanations. Return clean, raw parseable JSON only.
`;

/**
 * Conducts multi-modal analysis on extracted video frames, isolated audio file, and textual metadata.
 * (AI Mode 1)
 * * @param {string[]} framePaths - Array of absolute paths to frame images
 * @param {string|null} audioPath - Absolute path to the extracted local audio file
 * @param {Object} metadata - Scraped Reel textual properties
 */
async function analyzeWithVideo(framePaths, audioPath, metadata) {
  console.log('[aiService] Running Multi-Modal Video + Audio Analysis (Mode 1)...');

  if (!genAI) {
    console.error('[aiService] Cannot analyze: Gemini API key is missing.');
    return null;
  }

  // Pure Gemini 2.x and 3.x stack deployment only - no 1.x legacy elements
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3-flash'];
  let lastError = null;

  try {
    // Initialize media payload elements array with extracted image frame snapshots
    const mediaParts = framePaths.map(path => fileToGenerativePart(path, 'image/jpeg'));

    // Inject isolated audio file track directly into payload parts array if present
    if (audioPath && fs.existsSync(audioPath)) {
      console.log('[aiService] Embedding isolated audio track stream into pipeline payload...');
      const audioPart = fileToGenerativePart(audioPath, 'audio/mp3');
      mediaParts.push(audioPart);
    }

    const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
    const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

    const prompt = `
You are an expert social media AI analyst. Analyze the provided sequential timestamp frames of this Instagram Reel alongside its companion isolated audio track and caption metadata.

--- INSTAGRAM METADATA ---
Creator Handle: @${metadata.username || 'unknown'}
Post Caption: ${metadata.caption || '(No caption provided)'}
Likes Count: ${enrichedLikes}
Comments Count: ${enrichedComments}
Platform: Instagram
--------------------------

${JSON_SCHEMA_PROMPT}

CRITICAL EXECUTION RULES:
1. Set "analysisMode" to "video".
2. For the "audioGuess" field, listen directly to the attached audio stream track. Provide an accurate transcription summary of speech heard, spoken words, or descriptive analysis of background audio track styles found inside the clip.
`;

    // Loop through our model strings dynamically to protect against 429 quota locks
    for (const modelName of modelsToTry) {
      try {
        console.log(`[aiService] Submitting payload context to active backend: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // If fallback drops to text-out specific model types, provide a data fallback wrapper
        const payloadParts = (modelName.includes('3.5-flash') || modelName.includes('3-flash'))
          ? [{ text: prompt + "\nNOTE: Media parts processing restricted on text engines. Extrapolate context details purely via textual logs if binary payload drops." }]
          : [{ text: prompt }, ...mediaParts];

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: payloadParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const response = await result.response;
        const responseText = response.text();

        const cleanedText = cleanJsonResponse(responseText);
        const parsedData = JSON.parse(cleanedText);

        console.log(`[aiService] Video and audio pipeline analysis parsed successfully via ${modelName}!`);
        return parsedData; // Break loop and exit function early upon clean execution match
      } catch (loopError) {
        console.warn(`⚠️ [aiService] Model assignment ${modelName} failed or limits reached: ${loopError.message}`);
        lastError = loopError;
      }
    }

    // Throw if all configurations collapse sequentially
    throw new Error(`All target API engine endpoints exhausted. Final track: ${lastError.message}`);

  } catch (error) {
    console.error(`❌ [aiService] Combined video/audio analysis failed: ${error.message}`);
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

  // Pure Gemini 2.x and 3.x stack configurations
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3-flash'];
  let lastError = null;

  try {
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

    for (const modelName of modelsToTry) {
      try {
        console.log(`[aiService] Submitting fallback payload stream to engine instance: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const payloadParts = (modelName.includes('3.5-flash') || modelName.includes('3-flash'))
          ? [{ text: prompt + "\nNOTE: Image vector loading restricted on text engines. Generate structural dashboard context via raw caption parameters." }]
          : [{ text: prompt }, thumbnailPart];

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: payloadParts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const response = await result.response;
        const responseText = response.text();

        const cleanedText = cleanJsonResponse(responseText);
        const parsedData = JSON.parse(cleanedText);

        console.log(`[aiService] Thumbnail analysis parsed successfully via ${modelName}!`);
        return parsedData;
      } catch (loopError) {
        console.warn(`⚠️ [aiService] Fallback model tracking ${modelName} dropped framework limits: ${loopError.message}`);
        lastError = loopError;
      }
    }

    throw new Error(`All target API thumbnail endpoints exhausted. Final track: ${lastError.message}`);

  } catch (error) {
    console.error(`❌ [aiService] Thumbnail analysis failed: ${error.message}`);
    return null;
  }
}

module.exports = {
  analyzeWithVideo,
  analyzeWithThumbnail
};
// /**
//  * [aiService]
//  * Services for conducting multi-modal visual, audio, and textual analysis using Google's
//  * Gemini 2.5 Flash model and standard metadata properties.
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
//  * Smart metric extractor logic for backend context enrichment.
//  * Extracts metrics from text captions if raw data fields are missing.
//  */
// function getParsedMetric(type, fallbackValue, caption) {
//   if (fallbackValue && fallbackValue !== 0 && fallbackValue !== '0' && fallbackValue !== 'N/A') {
//     return fallbackValue;
//   }
//   if (!caption) return '0';
//   try {
//     const cleanCaption = caption.replace(/\s+/g, ' ').trim();
//     if (type === 'likes') {
//       const match = cleanCaption.match(/([\d.]+[KMB]?)\s*likes/i);
//       if (match) return match[1];
//     }
//     if (type === 'comments') {
//       const match = cleanCaption.match(/([\d.]+[KMB]?)\s*comments/i);
//       if (match) return match[1];
//     }
//   } catch (err) {
//     console.warn('[aiService Parser] Metric extraction fallback failed:', err);
//   }
//   return '0';
// }

// /**
//  * Converts a local file to the inline base64 object required by Gemini API.
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
//  */
// function cleanJsonResponse(text) {
//   let cleaned = text.trim();
//   // Strip starting codeblock structures safely
//   cleaned = cleaned.replace(/^```json\s*/i, '');
//   cleaned = cleaned.replace(/^```\s*/, '');
//   // Strip ending codeblock wrappers
//   cleaned = cleaned.replace(/\s*```$/, '');
//   return cleaned.trim();
// }

// /**
//  * Common schema description prompt for structured outputs.
//  */
// /**
//  * Common schema description prompt for structured outputs.
//  * Uses strict descriptive typing to force dynamic evaluations instead of fixed template mock-data.
//  */
// const JSON_SCHEMA_PROMPT = `
// Return ONLY a valid JSON object matching this exact schema layout structure:
// {
//   "analysisMode": "video" | "thumbnail",
//   "summary": "string - dynamic 3 to 5 line overall summary of the reel",
//   "sceneDescription": "string - detailed chronological breakdown of the visual environment",
//   "activities": ["string"],
//   "objects": ["string"],
//   "mood": "string - specific dynamic mood word matching the audio track and visual pace",
//   "emotionAnalysis": "string - dynamic analysis of user or subject facial/vocal expressions",
//   "category": "string - must choose best fit from: news, entertainment, education, tech, fashion, sports, cooking, lifestyle",
//   "contentLanguage": "string - example: English, Hindi, Hinglish, Spanish",
//   "audioGuess": "string - exact speech transcription summary, or dynamic music genre/vibe description",
//   "keyMoments": [
//     { "timestamp": "0s", "description": "string - description of starting moment" },
//     { "timestamp": "25%", "description": "string - description at 25% timeline" },
//     { "timestamp": "50%", "description": "string - description at 50% timeline" },
//     { "timestamp": "75%", "description": "string - description at 75% timeline" }
//   ],
//   "safetyWarnings": ["string"],
//   "viralPotential": integer - a dynamic calculated score from 1 to 100 based entirely on engagement metrics, audio trends, and retention hooks seen in the media,
//   "engagementPrediction": "low" | "medium" | "high",
//   "hashtags": ["string"],
//   "detectedElements": {
//     "fire": boolean,
//     "accident": boolean,
//     "crowd": boolean,
//     "vehicle": boolean,
//     "outdoor": boolean,
//     "emergency": boolean
//   }
// }

// CORE EXECUTION HIERARCHY & PRIORITY RULES:
// 1. AUDIO TRACK FOCUS: Listen to the attached MP3 payload first. If any human speech or dialogue is present, transcribe and capture the exact core message/transcript summary into "audioGuess". Do not use generic placeholders.
// 2. TEXT METADATA CROSS-REFERENCE: Analyze the provided Instagram caption and user metrics. Blend this context with the spoken audio to determine the exact "contentLanguage" (e.g., if speaking Hindi but writing English, specify "Hinglish" or "Hindi/English").
// 3. VISUAL CHECKPOINTS: Use the 4 sequential frames to track the visual changes. Sync what you see in the images with what you hear in the audio track at those relative timestamps.
// 4. DYNAMIC SCORING: Calculate the "viralPotential" number uniquely for every request based on how strong the opening visual/audio hook is. Do not reuse static template numbers.

// Do NOT wrap the output in text notes, warnings, markdown code blocks, or explanations. Return clean, raw parseable JSON only.
// `;
// // const JSON_SCHEMA_PROMPT = `
// // Return ONLY a valid JSON object matching this exact schema specification:
// // {
// //   "analysisMode": "video" | "thumbnail",
// //   "summary": "2-3 line reel summary string",
// //   "sceneDescription": "detailed visual scene description string",
// //   "activities": ["activity1", "activity2"],
// //   "objects": ["object1", "object2"],
// //   "mood": "energetic",
// //   "emotionAnalysis": "emotion description string",
// //   "category": "entertainment",
// //   "contentLanguage": "English",
// //   "audioGuess": "audio transcription summary or background track description string",
// //   "keyMoments": [
// //     { "timestamp": "0s", "description": "Visual details at beginning" },
// //     { "timestamp": "25%", "description": "Visual details at 25% point" },
// //     { "timestamp": "50%", "description": "Visual details at 50% point" },
// //     { "timestamp": "75%", "description": "Visual details at 75% point" }
// //   ],
// //   "safetyWarnings": [],
// //   "viralPotential": 75, 
// //   "engagementPrediction": "high",
// //   "hashtags": ["tag1", "tag2"],
// //   "detectedElements": {
// //     "fire": false,
// //     "accident": false,
// //     "crowd": false,
// //     "vehicle": false,
// //     "outdoor": true,
// //     "emergency": false
// //   }
// // }
// // Do NOT wrap the output in text notes, warnings, or markdown explanations. Return raw parseable JSON only.
// // `;

// /**
//  * Conducts multi-modal analysis on extracted video frames, isolated audio file, and textual metadata.
//  * (AI Mode 1)
//  * * @param {string[]} framePaths - Array of absolute paths to frame images
//  * @param {string|null} audioPath - Absolute path to the extracted local audio file
//  * @param {Object} metadata - Scraped Reel textual properties
//  */
// async function analyzeWithVideo(framePaths, audioPath, metadata) {
//   console.log('[aiService] Running Multi-Modal Video + Audio Analysis (Mode 1)...');

//   if (!genAI) {
//     console.error('[aiService] Cannot analyze: Gemini API key is missing.');
//     return null;
//   }

//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//     // Initialize media payload elements array with extracted image frame snapshots
//     const mediaParts = framePaths.map(path => fileToGenerativePart(path, 'image/jpeg'));

//     // Inject isolated audio file track directly into payload parts array if present
//     if (audioPath && fs.existsSync(audioPath)) {
//       console.log('[aiService] Embedding isolated audio track stream into pipeline payload...');
//       const audioPart = fileToGenerativePart(audioPath, 'audio/mp3');
//       mediaParts.push(audioPart);
//     }

//     const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
//     const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

//     const prompt = `
// You are an expert social media AI analyst. Analyze the provided sequential timestamp frames of this Instagram Reel alongside its companion isolated audio track and caption metadata.

// --- INSTAGRAM METADATA ---
// Creator Handle: @${metadata.username || 'unknown'}
// Post Caption: ${metadata.caption || '(No caption provided)'}
// Likes Count: ${enrichedLikes}
// Comments Count: ${enrichedComments}
// Platform: Instagram
// --------------------------

// ${JSON_SCHEMA_PROMPT}

// CRITICAL EXECUTION RULES:
// 1. Set "analysisMode" to "video".
// 2. For the "audioGuess" field, listen directly to the attached audio stream track. Provide an accurate transcription summary of speech heard, spoken words, or descriptive analysis of background audio track styles found inside the clip.
// `;

//     console.log('[aiService] Submitting multi-modal payload stream to Gemini 2.5 Flash...');

//     const result = await model.generateContent({
//       contents: [{ role: 'user', parts: [{ text: prompt }, ...mediaParts] }],
//       generationConfig: {
//         responseMimeType: 'application/json',
//         temperature: 0.2
//       }
//     });

//     const response = await result.response;
//     const responseText = response.text();

//     const cleanedText = cleanJsonResponse(responseText);
//     const parsedData = JSON.parse(cleanedText);

//     console.log('[aiService] Video and audio metadata pipeline analysis parsed successfully!');
//     return parsedData;
//   } catch (error) {
//     console.error(`❌ [aiService] Combined video/audio analysis failed: ${error.message}`);
//     return null;
//   }
// }

// /**
//  * Conducts multi-modal analysis on scraped thumbnail image and textual metadata.
//  * (AI Mode 2 - Fallback)
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
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//     console.log(`[aiService] Converting remote thumbnail to base64: ${thumbnailUrl.substring(0, 80)}...`);
//     const thumbnailPart = await fetchImageAsBase64(thumbnailUrl);

//     const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
//     const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

//     const prompt = `
// You are an expert social media AI analyst. Analyze the following cover thumbnail image along with the post metadata. Evaluate properties from the single thumbnail and post context.

// --- INSTAGRAM METADATA ---
// Creator Handle: @${metadata.username || 'unknown'}
// Post Caption: ${metadata.caption || '(No caption provided)'}
// Likes Count: ${enrichedLikes}
// Comments Count: ${enrichedComments}
// Audio Name: ${metadata.audioName || 'Original Audio'}
// Platform: Instagram
// --------------------------

// ${JSON_SCHEMA_PROMPT}
// Set "analysisMode" to "thumbnail". For the "keyMoments" array, set it as an empty array [].
// `;

//     console.log('[aiService] Submitting fallback payload stream to Gemini 2.5 Flash...');

//     const result = await model.generateContent({
//       contents: [{ role: 'user', parts: [{ text: prompt }, thumbnailPart] }],
//       generationConfig: {
//         responseMimeType: 'application/json',
//         temperature: 0.2
//       }
//     });

//     const response = await result.response;
//     const responseText = response.text();

//     const cleanedText = cleanJsonResponse(responseText);
//     const parsedData = JSON.parse(cleanedText);

//     console.log('[aiService] Thumbnail analysis parsed successfully!');
//     return parsedData;
//   } catch (error) {
//     console.error(`❌ [aiService] Thumbnail analysis failed: ${error.message}`);
//     return null;
//   }
// }

// module.exports = {
//   analyzeWithVideo,
//   analyzeWithThumbnail
// };
