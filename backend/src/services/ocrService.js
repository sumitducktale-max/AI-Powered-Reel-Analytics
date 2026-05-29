const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Gemini init
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRIMARY — Gemini Vision OCR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function extractTextWithGemini(framePaths = []) {
    console.log('[ocrService] Gemini OCR input frames:', framePaths.length);
    if (!genAI || framePaths.length === 0) return null;

    try {
        console.log('[ocrService] Running Gemini Vision OCR...');

        // Using standard production flash model name
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash'
        });

        // Filter valid frames and map to inline data objects
        const imageParts = framePaths
            .filter(fp => fs.existsSync(fp))
            .map(fp => ({
                inlineData: {
                    data: Buffer.from(fs.readFileSync(fp)).toString('base64'),
                    mimeType: 'image/jpeg'
                }
            }));

        console.log('[ocrService] valid imageParts count:', imageParts.length);
        if (imageParts.length === 0) return null;

        const prompt = `
Look at these video frames carefully.

YOUR ONLY JOB:
Find and extract EVERY piece of text that is
physically visible ON the video screen.

This includes:
- Text overlays (any color, any font)
- Gradient or colorful text
- Subtitles burned into video
- Stickers with text
- Location tags shown in video
- Watermarks
- Any words on screen

RULES:
- Copy EXACTLY what you see — character by character
- Preserve original case (CAPS stays CAPS)
- Preserve emojis if any
- Each separate text element on its own line
- Do NOT describe the image
- Do NOT add any explanation
- If no text visible: return empty arrays

Return ONLY this JSON schema matching:
{
  "lines": ["exact text 1", "exact text 2"],
  "fullText": "all lines joined with space"
}
`;

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }, ...imageParts]
            }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.0  // deterministic extraction
            }
        });

        // Direct parsing without stripping code fences (guaranteed by responseMimeType)
        const rawResponse = result.response.text().trim();
        const parsed = JSON.parse(rawResponse);

        if (parsed.lines && parsed.lines.length > 0) {
            console.log('[ocrService] Gemini OCR found text chunks:', parsed.lines.length);
            return parsed;
        }

        return null;

    } catch (err) {
        console.warn('[ocrService] Gemini OCR failed:', err.message);
        return null;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BACKUP — Tesseract OCR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function runOCR(imagePath) {
    try {
        const result = await Tesseract.recognize(imagePath, 'eng', {
            logger: () => { },
            tessedit_pageseg_mode: '11',
            preserve_interword_spaces: '1',
        });

        let extracted = result.data.text || '';
        extracted = extracted
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[|]/g, 'I')
            .replace(/[`~]/g, '')
            .trim();

        return extracted;
    } catch (e) {
        return '';
    }
}

async function processRegion(framePath, region, suffix) {
    const processedPath = path.join(
        path.dirname(framePath),
        `${path.basename(framePath)}_${region.name}_${suffix}.jpg`
    );

    try {
        const extracted = sharp(framePath).extract({
            left: region.left,
            top: region.top,
            width: region.width,
            height: region.height
        });

        if (suffix === 'bw') {
            await extracted
                .grayscale()
                .normalize()
                .resize({ width: 1800, withoutEnlargement: false })
                .sharpen()
                .modulate({ brightness: 1.2, saturation: 0 })
                .linear(1.3, -10)
                .threshold(155)
                .toFile(processedPath);

        } else if (suffix === 'color') {
            await extracted
                .resize({ width: 1800, withoutEnlargement: false })
                .sharpen()
                .modulate({ brightness: 1.4, saturation: 2.0 })
                .normalize()
                .toFile(processedPath);

        } else if (suffix === 'invert') {
            await extracted
                .grayscale()
                .normalize()
                .resize({ width: 1800, withoutEnlargement: false })
                .negate()
                .sharpen()
                .threshold(140)
                .toFile(processedPath);
        }

        const text = await runOCR(processedPath);
        return text;

    } catch (e) {
        return '';
    } finally {
        if (fs.existsSync(processedPath)) {
            try { fs.unlinkSync(processedPath); } catch (e) { }
        }
    }
}

async function extractTextWithTesseract(framePaths = []) {
    const texts = [];

    for (const framePath of framePaths) {
        try {
            const image = sharp(framePath);
            const meta = await image.metadata();
            const { width, height } = meta;

            const regions = [
                { name: 'top', left: 0, top: 0, width, height: Math.floor(height * 0.28) },
                { name: 'upper_mid', left: 0, top: Math.floor(height * 0.18), width, height: Math.floor(height * 0.38) },
                { name: 'center', left: 0, top: Math.floor(height * 0.35), width, height: Math.floor(height * 0.30) },
                { name: 'lower_mid', left: 0, top: Math.floor(height * 0.52), width, height: Math.floor(height * 0.28) },
                { name: 'bottom', left: 0, top: Math.floor(height * 0.70), width, height: Math.floor(height * 0.30) }
            ];

            for (const region of regions) {
                const [bwText, colorText, invertText] = await Promise.all([
                    processRegion(framePath, region, 'bw'),
                    processRegion(framePath, region, 'color'),
                    processRegion(framePath, region, 'invert')
                ]);

                const best = [bwText, colorText, invertText]
                    .filter(t => t && t.length > 4)
                    .sort((a, b) => b.length - a.length)[0];

                if (best && !/^[^a-zA-Z0-9]+$/.test(best)) {
                    texts.push(best);
                }
            }
        } catch (err) {
            console.warn('[ocrService] Frame failed:', err.message);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SMART CHRONOLOGICAL MERGE
    // Preserves subtitle order correctly
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const orderedTexts = [];

    for (const text of texts) {

        const cleaned = text
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleaned || cleaned.length < 3) {
            continue;
        }

        // Skip garbage
        if (/^[^a-zA-Z0-9]+$/.test(cleaned)) {
            continue;
        }

        const previousCombined = orderedTexts.join(' ').toLowerCase();

        // Already fully exists
        if (previousCombined.includes(cleaned.toLowerCase())) {
            continue;
        }

        let newPart = cleaned;

        // Remove overlap from older subtitles
        for (const oldText of orderedTexts) {

            const escaped = oldText.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            const regex = new RegExp(escaped, 'ig');

            newPart = newPart
                .replace(regex, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        // Final validation
        if (
            newPart &&
            newPart.length > 2 &&
            !orderedTexts.includes(newPart)
        ) {
            orderedTexts.push(newPart);
        }
    }

    return {
        lines: orderedTexts,
        fullText: orderedTexts.join(' ')
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN EXPORT — Gemini first, Tesseract backup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function extractTextFromFrames(framePaths = []) {
    console.log('[ocrService] Starting OCR pipeline...');

    //________________________________________Attention __________________________________
    // we need to uncomment this tommorow and check if the data is coming in sequence or not 

    // // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // // SORT FRAMES IN EXACT VIDEO ORDER
    // // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    framePaths = framePaths.sort((a, b) => {

        const getFrameNumber = (filePath) => {

            const match = filePath.match(/_(\d+)\.jpg$/);

            return match
                ? parseInt(match[1], 10)
                : 0;
        };

        return getFrameNumber(a) - getFrameNumber(b);
    });

    console.log(
        '[ocrService] Ordered frames:',
        framePaths.map(f => path.basename(f))
    );
    // Step 1 — Try Gemini Vision (Handles color-changing text perfectly)
    const geminiResult = await extractTextWithGemini(framePaths);

    if (geminiResult && geminiResult.lines.length > 0) {
        console.log('[ocrService] Using Gemini OCR result.');
        return geminiResult.fullText;
    }

    // Step 2 — Tesseract Fallback
    console.log('[ocrService] Gemini empty or failed. Falling back to Tesseract...');
    const tesseractResult = await extractTextWithTesseract(framePaths);

    if (tesseractResult.lines.length > 0) {
        console.log('[ocrService] Using Tesseract result.');
        return tesseractResult.fullText;
    }

    console.log('[ocrService] No text detected by any engine.');
    return '';
}

module.exports = { extractTextFromFrames };



// Little advance only the 20 frames based on the movement.


// const Tesseract = require('tesseract.js');
// const sharp = require('sharp');
// const fs = require('fs');
// const path = require('path');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require('dotenv').config();

// // Gemini init
// const genAI = process.env.GEMINI_API_KEY
//     ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
//     : null;

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // HELPER — Equally spaced frame selection
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// function selectEvenlySpaced(frames, maxCount = 20) {
//     if (frames.length <= maxCount) return frames;

//     const selected = [];
//     const step = (frames.length - 1) / (maxCount - 1);

//     for (let i = 0; i < maxCount; i++) {
//         const index = Math.round(i * step);
//         selected.push(frames[index]);
//     }

//     return selected;
// }

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // PRIMARY — Gemini Vision OCR
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// async function extractTextWithGemini(framePaths = []) {

//     // Max 20 equally spaced frames — poora video cover + rate limit safe
//     const smartFrames = selectEvenlySpaced(framePaths, 20);

//     console.log(
//         '[ocrService] Gemini OCR input frames:',
//         smartFrames.length, '/', framePaths.length
//     );

//     if (!genAI || smartFrames.length === 0) return null;

//     try {
//         console.log('[ocrService] Running Gemini Vision OCR...');

//         const model = genAI.getGenerativeModel({
//             model: 'gemini-3.5-flash'
//         });

//         const validFrames = smartFrames.filter(fp => fs.existsSync(fp));
//         console.log('[ocrService] Valid frames count:', validFrames.length);
//         if (validFrames.length === 0) return null;

//         // Har frame labeled + numbered — chronological order maintain hoga
//         const orderedParts = [];

//         validFrames.forEach((fp, index) => {
//             const label = index === 0
//                 ? 'VIDEO START'
//                 : index === validFrames.length - 1
//                     ? 'VIDEO END'
//                     : `${Math.round((index / (validFrames.length - 1)) * 100)}% THROUGH VIDEO`;

//             // Pehle label
//             orderedParts.push({
//                 text: `=== FRAME ${index + 1} OF ${validFrames.length} (${label}) ===`
//             });

//             // Phir image
//             orderedParts.push({
//                 inlineData: {
//                     data: Buffer.from(fs.readFileSync(fp)).toString('base64'),
//                     mimeType: 'image/jpeg'
//                 }
//             });
//         });

//         // Prompt LAST — frames pehle, prompt baad mein
//         const prompt = `
// I am giving you ${validFrames.length} video frames in
// CHRONOLOGICAL ORDER.
// Frame 1 = earliest moment in video.
// Frame ${validFrames.length} = latest moment in video.

// YOUR ONLY JOB:
// Extract ALL text visible on screen from EACH frame.
// Return in SAME ORDER as frames — earliest first, latest last.

// Text types to extract:
// - Text overlays (any color, any font, any size)
// - Gradient or colorful decorative text
// - Subtitles burned into video
// - Stickers or emoji text
// - Watermarks
// - Location tags

// CRITICAL ORDER RULES:
// 1. Process Frame 1 FIRST, then Frame 2, then Frame 3...
// 2. Text from Frame 1 MUST appear before Frame 2 text in output
// 3. Text from Frame 2 MUST appear before Frame 3 text in output
// 4. Never reorder — chronological only

// EXTRACTION RULES:
// - Copy text EXACTLY — character by character
// - Preserve original CAPS/lowercase
// - Preserve emojis
// - Do NOT describe the image
// - Do NOT add explanation
// - Skip duplicate text (same text in consecutive frames)
// - If frame has no new text: skip it

// Return ONLY this JSON:
// {
//   "lines": [
//     "first text seen in video",
//     "second text seen in video",
//     "third text seen in video"
//   ],
//   "fullText": "first text | second text | third text"
// }
// `;

//         const result = await model.generateContent({
//             contents: [{
//                 role: 'user',
//                 parts: [...orderedParts, { text: prompt }]
//             }],
//             generationConfig: {
//                 responseMimeType: 'application/json',
//                 temperature: 0.0
//             }
//         });

//         const rawResponse = result.response.text().trim();
//         const parsed = JSON.parse(rawResponse);

//         if (parsed.lines && parsed.lines.length > 0) {
//             console.log('[ocrService] Gemini OCR lines found:', parsed.lines.length);
//             console.log('[ocrService] Lines:', parsed.lines);
//             return parsed;
//         }

//         return null;

//     } catch (err) {
//         console.warn('[ocrService] Gemini OCR failed:', err.message);
//         return null;
//     }
// }

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // BACKUP — Tesseract OCR
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// async function runOCR(imagePath) {
//     try {
//         const result = await Tesseract.recognize(imagePath, 'eng', {
//             logger: () => { },
//             tessedit_pageseg_mode: '11',
//             preserve_interword_spaces: '1',
//         });

//         let extracted = result.data.text || '';
//         extracted = extracted
//             .replace(/\n+/g, ' ')
//             .replace(/\s+/g, ' ')
//             .replace(/[|]/g, 'I')
//             .replace(/[`~]/g, '')
//             .trim();

//         return extracted;
//     } catch (e) {
//         return '';
//     }
// }

// async function processRegion(framePath, region, suffix) {

//     // Min size check — "too small" error fix
//     if (region.width < 10 || region.height < 10) {
//         return '';
//     }

//     const processedPath = path.join(
//         path.dirname(framePath),
//         `${path.basename(framePath)}_${region.name}_${suffix}.jpg`
//     );

//     try {
//         const extracted = sharp(framePath).extract({
//             left: region.left,
//             top: region.top,
//             width: region.width,
//             height: region.height
//         });

//         if (suffix === 'bw') {
//             await extracted
//                 .grayscale()
//                 .normalize()
//                 .resize({ width: 1800, withoutEnlargement: false })
//                 .sharpen()
//                 .modulate({ brightness: 1.2, saturation: 0 })
//                 .linear(1.3, -10)
//                 .threshold(155)
//                 .toFile(processedPath);

//         } else if (suffix === 'color') {
//             await extracted
//                 .resize({ width: 1800, withoutEnlargement: false })
//                 .sharpen()
//                 .modulate({ brightness: 1.4, saturation: 2.0 })
//                 .normalize()
//                 .toFile(processedPath);

//         } else if (suffix === 'invert') {
//             await extracted
//                 .grayscale()
//                 .normalize()
//                 .resize({ width: 1800, withoutEnlargement: false })
//                 .negate()
//                 .sharpen()
//                 .threshold(140)
//                 .toFile(processedPath);
//         }

//         return await runOCR(processedPath);

//     } catch (e) {
//         return '';
//     } finally {
//         if (fs.existsSync(processedPath)) {
//             try { fs.unlinkSync(processedPath); } catch (e) { }
//         }
//     }
// }

// async function extractTextWithTesseract(framePaths = []) {

//     // Tesseract ke liye bhi 20 equally spaced frames
//     const smartFrames = selectEvenlySpaced(framePaths, 20);

//     const frameResults = [];

//     for (let frameIdx = 0; frameIdx < smartFrames.length; frameIdx++) {
//         const framePath = smartFrames[frameIdx];
//         const frameTexts = [];

//         try {
//             const meta = await sharp(framePath).metadata();
//             const { width, height } = meta;

//             const regions = [
//                 {
//                     name: 'top',
//                     left: 0, top: 0,
//                     width,
//                     height: Math.max(20, Math.floor(height * 0.28))
//                 },
//                 {
//                     name: 'upper_mid',
//                     left: 0,
//                     top: Math.max(0, Math.floor(height * 0.18)),
//                     width,
//                     height: Math.max(20, Math.floor(height * 0.38))
//                 },
//                 {
//                     name: 'center',
//                     left: 0,
//                     top: Math.max(0, Math.floor(height * 0.35)),
//                     width,
//                     height: Math.max(20, Math.floor(height * 0.30))
//                 },
//                 {
//                     name: 'lower_mid',
//                     left: 0,
//                     top: Math.max(0, Math.floor(height * 0.52)),
//                     width,
//                     height: Math.max(20, Math.floor(height * 0.28))
//                 },
//                 {
//                     name: 'bottom',
//                     left: 0,
//                     top: Math.max(0, Math.floor(height * 0.70)),
//                     width,
//                     height: Math.max(20, Math.floor(height * 0.30))
//                 }
//             ];

//             for (const region of regions) {
//                 const [bwText, colorText, invertText] = await Promise.all([
//                     processRegion(framePath, region, 'bw'),
//                     processRegion(framePath, region, 'color'),
//                     processRegion(framePath, region, 'invert')
//                 ]);

//                 const best = [bwText, colorText, invertText]
//                     .filter(t => t && t.length > 4)
//                     .sort((a, b) => b.length - a.length)[0];

//                 if (best && !/^[^a-zA-Z0-9]+$/.test(best)) {
//                     frameTexts.push(best);
//                 }
//             }

//         } catch (err) {
//             console.warn(`[ocrService] Frame ${frameIdx} failed:`, err.message);
//         }

//         if (frameTexts.length > 0) {
//             const bestForFrame = frameTexts
//                 .sort((a, b) => b.length - a.length)[0];

//             frameResults.push({
//                 frameIdx,
//                 text: bestForFrame
//             });
//         }
//     }

//     // frameIdx order mein sort
//     frameResults.sort((a, b) => a.frameIdx - b.frameIdx);

//     // Chronological deduplication
//     const finalLines = [];
//     const seenTexts = new Set();

//     for (const { text } of frameResults) {
//         const normalised = text.toLowerCase().trim();

//         const alreadySeen = [...seenTexts].some(seen =>
//             seen.includes(normalised) ||
//             normalised.includes(seen)
//         );

//         if (!alreadySeen && text.length > 2) {
//             finalLines.push(text);
//             seenTexts.add(normalised);
//         }
//     }

//     return {
//         lines: finalLines,
//         fullText: finalLines.join(' | ')
//     };
// }

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // MAIN EXPORT — Gemini first, Tesseract backup
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// async function extractTextFromFrames(framePaths = []) {
//     console.log('[ocrService] Starting OCR pipeline...');

//     // Step 1 — Gemini Vision (colored/gradient text best)
//     const geminiResult = await extractTextWithGemini(framePaths);

//     if (geminiResult && geminiResult.lines.length > 0) {
//         console.log('[ocrService] Using Gemini OCR result.');
//         return geminiResult.fullText;
//     }

//     // Step 2 — Tesseract fallback
//     console.log('[ocrService] Gemini empty or failed. Falling back to Tesseract...');
//     const tesseractResult = await extractTextWithTesseract(framePaths);

//     if (tesseractResult.lines.length > 0) {
//         console.log('[ocrService] Using Tesseract result.');
//         return tesseractResult.fullText;
//     }

//     console.log('[ocrService] No text detected by any engine.');
//     return '';
// }

// module.exports = { extractTextFromFrames };