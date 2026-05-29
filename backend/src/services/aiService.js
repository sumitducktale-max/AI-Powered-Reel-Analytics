const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('⚠️ [aiService] GEMINI_API_KEY missing.');
}

function getParsedMetric(type, fallbackValue, caption) {
  if (
    fallbackValue &&
    fallbackValue !== 0 &&
    fallbackValue !== '0' &&
    fallbackValue !== 'N/A'
  ) {
    return fallbackValue;
  }

  if (!caption) return '0';

  try {
    const clean = caption.replace(/\s+/g, ' ').trim();

    if (type === 'likes') {
      const match = clean.match(/([\d.]+[KMB]?)\s*likes/i);
      if (match) return match[1];
    }

    if (type === 'comments') {
      const match = clean.match(/([\d.]+[KMB]?)\s*comments/i);
      if (match) return match[1];
    }
  } catch (err) {
    console.warn('[aiService] Metric parse failed:', err);
  }

  return '0';
}

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}

async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
  } catch (error) {
    console.error(`[aiService] Thumbnail base64 failed: ${error.message}`);
    throw error;
  }
}

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JSON SCHEMA PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const JSON_SCHEMA_PROMPT = `
Return ONLY a valid raw JSON object. No markdown. 
No explanation. No code blocks. Just JSON.

{
  "analysisMode": "video" | "thumbnail",
  "audioTranscript": "VERBATIM word-for-word of every spoken word in the audio. Write EXACTLY what is said. No summarizing. No paraphrasing. If Hindi: write in Roman Hindi or Devanagari. If music only: write genre + instruments + mood.",
  "audioLanguage": "exact language spoken",
  "audioType": "speech" | "music" | "both" | "silent",
  "musicInfo": "song name or genre if identifiable",
  "captionFull": "EXACT Instagram caption text",
  "reelText": "EXACT text visible inside the reel video only",
  "captionHashtags": ["every #hashtag from caption"],
  "captionMentions": ["every @mention from caption"],
  "summary": "3 to 5 line overall reel summary",
  "sceneDescription": "detailed visual breakdown",
  "activities": ["activity1", "activity2"],
  "objects": ["object1", "object2"],
  "mood": "one specific mood word",
  "emotionAnalysis": "facial and vocal emotion analysis",
  "category": "news | entertainment | education | tech | fashion | sports | cooking | lifestyle",
  "contentLanguage": "Hindi | English | Hinglish | etc",
  "keyMoments": [
    { "timestamp": "0s", "description": "exact scene" },
    { "timestamp": "25%", "description": "exact scene" },
    { "timestamp": "50%", "description": "exact scene" },
    { "timestamp": "75%", "description": "exact scene" }
  ],
  "safetyWarnings": [],
  "viralPotential": 0,
  "engagementPrediction": "low" | "medium" | "high",
  "hashtags": ["#suggested1"],
  "detectedElements": {
    "fire": false,
    "accident": false,
    "crowd": false,
    "vehicle": false,
    "outdoor": false,
    "emergency": false
  }
}

STRICT EXECUTION RULES:
1. audioTranscript = VERBATIM ONLY
2. captionFull = EXACT COPY
3. reelText = EXACT ON-SCREEN TEXT
4. Return RAW JSON only
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODE 1 — VIDEO + AUDIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function analyzeWithVideo(framePaths, audioPath, metadata) {
  console.log('[aiService] Mode 1: Video + Audio Analysis...');

  if (!genAI) {
    console.error('[aiService] Gemini API key missing.');
    return null;
  }

  // NECESSARY CHANGE: Read the OCR text from metadata directly
  const extractedOcrText = metadata.onScreenText || '';

  // Kept your exact model names array completely untouched
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3-flash'
  ];

  let lastError = null;

  try {
    const mediaParts = framePaths.map(path => fileToGenerativePart(path, 'image/jpeg'));

    if (audioPath && fs.existsSync(audioPath)) {
      console.log('[aiService] Audio track injected into payload.');
      mediaParts.push(fileToGenerativePart(audioPath, 'audio/mp3'));
    }

    const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
    const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

    const prompt = `
You are a professional social media transcription and intelligence analyst.

Your PRIMARY job is:
1. Transcribe audio VERBATIM
2. Copy Instagram caption EXACTLY
3. Use OCR reel text EXACTLY
4. Analyze visuals from frames

--- INSTAGRAM POST DATA ---
Creator: @${metadata.username || 'unknown'}

Caption:
${metadata.caption || '(none)'}

OCR Reel Text:
${extractedOcrText || '(none)'}

Likes: ${enrichedLikes}
Comments: ${enrichedComments}
Platform: Instagram
---------------------------

AUDIO TRANSCRIPTION INSTRUCTIONS:
- Listen carefully and write every spoken word verbatim.

OCR TEXT INSTRUCTIONS:
- reelText contains actual text visible inside the reel. Use OCR text exactly.

${JSON_SCHEMA_PROMPT}

Set "analysisMode" to "video".
`;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[aiService] Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              ...mediaParts
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const responseText = result.response.text();
        const parsed = JSON.parse(cleanJsonResponse(responseText));

        console.log(`[aiService] Mode 1 success via ${modelName}`);
        return parsed;

      } catch (loopError) {
        console.warn(`⚠️ [aiService] ${modelName} failed: ${loopError.message}`);
        lastError = loopError;
      }
    }

    throw new Error(`All models failed. Last: ${lastError.message}`);

  } catch (error) {
    console.error(`❌ [aiService] Mode 1 failed: ${error.message}`);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODE 2 — THUMBNAIL FALLBACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function analyzeWithThumbnail(thumbnailUrl, metadata) {
  console.log('[aiService] Mode 2: Thumbnail Fallback Analysis...');

  if (!genAI) {
    console.error('[aiService] Gemini API key missing.');
    return null;
  }

  if (!thumbnailUrl || thumbnailUrl === 'N/A') {
    console.warn('[aiService] No thumbnail available.');
    return null;
  }

  // Kept your exact model names array completely untouched
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3-flash'
  ];

  let lastError = null;

  try {
    console.log('[aiService] Fetching thumbnail as base64...');
    const thumbnailPart = await fetchImageAsBase64(thumbnailUrl);

    const enrichedLikes = getParsedMetric('likes', metadata.likes, metadata.caption);
    const enrichedComments = getParsedMetric('comments', metadata.comments, metadata.caption);

    const prompt = `
You are a professional social media transcription and intelligence analyst.
No video available.

--- INSTAGRAM POST DATA ---
Creator: @${metadata.username || 'unknown'}

Caption:
${metadata.caption || '(none)'}

Likes: ${enrichedLikes}
Comments: ${enrichedComments}
Audio: ${metadata.audioName || 'Original Audio'}
Platform: Instagram
---------------------------

${JSON_SCHEMA_PROMPT}

Set "analysisMode" to "thumbnail".
Set "keyMoments" to empty array [].
`;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[aiService] Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              thumbnailPart
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const responseText = result.response.text();
        const parsed = JSON.parse(cleanJsonResponse(responseText));

        console.log(`[aiService] Mode 2 success via ${modelName}`);
        return parsed;

      } catch (loopError) {
        console.warn(`⚠️ [aiService] ${modelName} failed: ${loopError.message}`);
        lastError = loopError;
      }
    }

    throw new Error(`All models failed. Last: ${lastError.message}`);

  } catch (error) {
    console.error(`❌ [aiService] Mode 2 failed: ${error.message}`);
    return null;
  }
}

module.exports = {
  analyzeWithVideo,
  analyzeWithThumbnail
};
