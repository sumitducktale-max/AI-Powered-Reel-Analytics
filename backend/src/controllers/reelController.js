const {
  launchStealthBrowser,
  createStealthPage,
  runHumanSimulation,
} = require("../services/browser");

const { setupNetworkInterceptor } = require("../services/interceptor");
const { scrapeDomMetadata } = require("../services/scraper");
const { fetchOembedMetadata } = require("../services/oembed");
const { extractVideoFromEmbed } = require("../services/embedService");
const ffmpegService = require("../services/ffmpegService");
const aiService = require("../services/aiService");
const { extractTextFromFrames } = require("../services/ocrService");

/**
 * Controller to handle Reel scraping & AI Analysis requests.
 * Orchestrates the full 4-Phase Intelligence Pipeline.
 */
async function analyzeReel(req, res) {
  const { normalizedUrl } = req.instagram;

  console.log(
    `\n--- [reelController] Starting Full-Stack AI Analysis for: ${normalizedUrl} ---`,
  );

  let browser = null;
  let pageInstance = null;
  let metadata = null;
  let aiResult = null;
  let errorLog = [];
  let videoExtractionMethod = null;

  // NEW
  let reelText = "";

  try {
    // =========================================================================
    // PHASE 1: Existing Scraping Logic
    // =========================================================================
    console.log(
      "[reelController] PHASE 1: Executing core browser automation...",
    );

    browser = await launchStealthBrowser();
    const { context, page } = await createStealthPage(browser);
    pageInstance = page;

    // Setup network response interceptor
    const { metadataPromise, getCapturedData } = setupNetworkInterceptor(page);

    console.log(`[reelController] Navigating to target Reel link...`);

    const navigationPromise = page
      .goto(normalizedUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      })
      .catch((err) => {
        console.warn(
          "[reelController] Page navigation hit error or timeout:",
          err.message,
        );
        errorLog.push(`Navigation error: ${err.message}`);
        return null;
      });

    // Race network interceptor against timeout
    console.log("[reelController] Awaiting Network Interceptor (Layer 4)...");

    metadata = await Promise.race([
      metadataPromise,
      navigationPromise.then(() => page.waitForTimeout(10000).then(() => null)),
      page.waitForTimeout(15000).then(() => null),
    ]);

    if (metadata) {
      console.log(
        "[reelController] Metadata extracted successfully via Layer 4: Interceptor.",
      );
    } else {
      metadata = getCapturedData();
      if (metadata) {
        console.log(
          "[reelController] Metadata extracted successfully via Layer 4: Captured response polling.",
        );
      }
    }

    // DOM fallback
    if (!metadata) {
      console.log(
        "[reelController] Network yields empty. Running Human Simulation...",
      );

      await runHumanSimulation(page);
      metadata = getCapturedData();

      if (!metadata) {
        console.log(
          "[reelController] Running DOM selector & JSON-LD parser fallback...",
        );

        try {
          metadata = await scrapeDomMetadata(page);
          console.log(
            "[reelController] Metadata extracted successfully via Layer 4: DOM parser.",
          );
        } catch (domErr) {
          console.error(
            "❌ [reelController] DOM Fallback parsing failed:",
            domErr.message,
          );
          errorLog.push(`DOM parsing error: ${domErr.message}`);
        }
      } else {
        console.log(
          "[reelController] Metadata extracted successfully via post-scroll Network Interception.",
        );
      }
    }

    // =========================================================================
    // PHASE 2: Public Embed video extraction
    // =========================================================================
    if (
      pageInstance &&
      (!metadata || !metadata.videoUrl || metadata.videoUrl === "N/A")
    ) {
      console.log(
        "[reelController] PHASE 2: Video stream is missing. Initiating public Embed extraction...",
      );

      try {
        const embedResult = await extractVideoFromEmbed(
          pageInstance,
          normalizedUrl,
        );

        if (embedResult && embedResult.videoUrl) {
          if (!metadata) {
            metadata = {
              username: "unknown",
              caption: "",
              likes: "0",
              comments: "0",
              thumbnail: "",
              videoUrl: embedResult.videoUrl,
              audioName: "Original Audio",
              timestamp: new Date().toISOString(),
              platform: "Instagram",
            };
          } else {
            metadata.videoUrl = embedResult.videoUrl;
          }

          videoExtractionMethod = embedResult.extractionMethod;

          console.log(
            `[reelController] Successfully matched embed video stream via: ${embedResult.extractionMethod}`,
          );
        }
      } catch (embedError) {
        console.error(
          "❌ [reelController] Embed video extraction failed:",
          embedError.message,
        );
        errorLog.push(`Embed Extraction Error: ${embedError.message}`);
      }
    }

    // Close browser
    await browser.close();
    browser = null;
    pageInstance = null;
  } catch (automationError) {
    console.error(
      "❌ [reelController] Critical Browser automation failure:",
      automationError.message,
    );
    errorLog.push(`Browser Error: ${automationError.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }

  // =========================================================================
  // oEmbed Fallback
  // =========================================================================
  if (!metadata) {
    console.log(
      "[reelController] Browser extraction yielded nothing. Running final oEmbed fallback...",
    );

    try {
      metadata = await fetchOembedMetadata(normalizedUrl);
      console.log(
        "[reelController] Metadata extracted successfully via Layer 6: oEmbed.",
      );
    } catch (oembedError) {
      console.error(
        "❌ [reelController] oEmbed fallback failed:",
        oembedError.message,
      );
      errorLog.push(`oEmbed Error: ${oembedError.message}`);
    }
  }

  // =========================================================================
  // PHASE 3: AI Analysis + OCR
  // =========================================================================
  if (metadata) {
    console.log(
      "[reelController] PHASE 3: Initiating Multimodal AI Analysis Layer...",
    );

    const isVideoValid =
      metadata.videoUrl &&
      metadata.videoUrl !== "N/A" &&
      metadata.videoUrl.startsWith("http");

    if (isVideoValid) {
      let downloadedVideoPath = null;
      let extractedFramePaths = [];
      let ocrFramePaths = [];
      let downloadedAudioPath = null;

      try {
        // Step 1: Download video
        downloadedVideoPath = await ffmpegService.downloadVideo(
          metadata.videoUrl,
        );

        // Step 2: AI frames (existing)
        extractedFramePaths =
          await ffmpegService.extractFrames(downloadedVideoPath);

        // Step 3: OCR frames
        console.log("[reelController] Starting OCR frame extraction...");
        ocrFramePaths =
          await ffmpegService.extractFramesForOCR(downloadedVideoPath);

        // Step 4: OCR TEXT EXTRACTION
        console.log("[reelController] Starting OCR text extraction...");
        reelText = await extractTextFromFrames(ocrFramePaths);

        console.log("[reelController] OCR TEXT RESULT:");
        console.log(reelText);

        // Step 5: Audio extraction
        try {
          downloadedAudioPath =
            await ffmpegService.extractAudio(downloadedVideoPath);
        } catch (audioErr) {
          console.warn(
            "[reelController] Audio isolation layer failed. Continuing on visual frames only:",
            audioErr.message,
          );
        }

        // Step 6: Gemini AI Analysis (UPDATED TO SAFELY WRAP OCR TEXT IN THE METADATA OBJECT)
        aiResult = await aiService.analyzeWithVideo(
          extractedFramePaths,
          downloadedAudioPath,
          {
            ...metadata,
            onScreenText: reelText,
          },
        );
        if (aiResult) {
          aiResult.reelText = reelText || aiResult.reelText || "";
        }
      } catch (aiVideoError) {
        console.error(
          "❌ [reelController] Combined video AI analysis pipeline collapsed:",
          aiVideoError.message,
        );
        errorLog.push(`AI Video Error: ${aiVideoError.message}`);

        // Thumbnail fallback
        console.log(
          "[reelController] Attempting fallback to Single Thumbnail AI Analysis...",
        );

        try {
          aiResult = await aiService.analyzeWithThumbnail(
            metadata.thumbnail,
            metadata,
          );
        } catch (thErr) {
          console.error(
            "❌ [reelController] Thumbnail AI analysis fallback failed:",
            thErr.message,
          );
          errorLog.push(`AI Thumbnail Error: ${thErr.message}`);
        }
      } finally {
        // Cleanup
        const filesToCleanup = [];
        if (downloadedVideoPath) filesToCleanup.push(downloadedVideoPath);
        if (downloadedAudioPath) filesToCleanup.push(downloadedAudioPath);

        if (extractedFramePaths && extractedFramePaths.length > 0) {
          filesToCleanup.push(...extractedFramePaths);
        }
        if (ocrFramePaths && ocrFramePaths.length > 0) {
          filesToCleanup.push(...ocrFramePaths);
        }

        ffmpegService.cleanup(filesToCleanup);
      }
    } else {
      // Thumbnail-only mode
      console.log(
        "[reelController] Video URL not available. Conducting Single Thumbnail AI Analysis...",
      );

      try {
        aiResult = await aiService.analyzeWithThumbnail(
          metadata.thumbnail,
          metadata,
        );
      } catch (aiThumbError) {
        console.error(
          "❌ [reelController] Thumbnail AI analysis failed:",
          aiThumbError.message,
        );
        errorLog.push(`AI Thumbnail Error: ${aiThumbError.message}`);
      }
    }
  }

  // =========================================================================
  // PHASE 4: Final Response
  // =========================================================================
  if (metadata) {
    const finalMethod =
      videoExtractionMethod ||
      metadata.metadata_source ||
      metadata.fallbackUsed ||
      "Playwright";

    console.log(
      `[reelController] Completed analysis pipeline. Output delivered via: ${finalMethod}`,
    );

    return res.status(200).json({
      success: true,
      data: {
        username: metadata.username,
        caption: metadata.caption,
        reelText: reelText, // Returns the newly extracted clean text property
        likes: metadata.likes,
        comments: metadata.comments,
        thumbnail: metadata.thumbnail,
        videoUrl:
          metadata.videoUrl && metadata.videoUrl !== "N/A"
            ? metadata.videoUrl
            : null,
        audioName: metadata.audioName,
        timestamp: metadata.timestamp,
        platform: metadata.platform,
        extractionMethod: finalMethod,
        aiAnalysis: aiResult || null,
      },
    });
  } else {
    console.error("[reelController] Pipeline execution completely failed.");
    return res.status(502).json({
      success: false,
      error:
        "Failed to extract Reel metadata or conduct AI analysis across all layers.",
      details: errorLog,
    });
  }
}

module.exports = {
  analyzeReel,
};
// const {
//   launchStealthBrowser,
//   createStealthPage,
//   runHumanSimulation
// } = require('../services/browser');

// const { setupNetworkInterceptor } = require('../services/interceptor');

// const { scrapeDomMetadata } = require('../services/scraper');

// const { fetchOembedMetadata } = require('../services/oembed');

// const { extractVideoFromEmbed } = require('../services/embedService');

// const ffmpegService = require('../services/ffmpegService');

// const aiService = require('../services/aiService');

// const { extractTextFromFrames } = require('../services/ocrService');

// /**
//  * Controller to handle Reel scraping & AI Analysis requests.
//  * Orchestrates the full 4-Phase Intelligence Pipeline.
//  */

// async function analyzeReel(req, res) {

//   const { normalizedUrl } = req.instagram;

//   console.log(
//     `\n--- [reelController] Starting Full-Stack AI Analysis for: ${normalizedUrl} ---`
//   );

//   let browser = null;
//   let pageInstance = null;

//   let metadata = null;
//   let aiResult = null;

//   let errorLog = [];
//   let videoExtractionMethod = null;

//   // NEW
//   let reelText = '';

//   try {

//     // =========================================================================
//     // PHASE 1: Existing Scraping Logic
//     // =========================================================================

//     console.log(
//       '[reelController] PHASE 1: Executing core browser automation...'
//     );

//     browser = await launchStealthBrowser();

//     const { context, page } =
//       await createStealthPage(browser);

//     pageInstance = page;

//     // Setup network response interceptor
//     const {
//       metadataPromise,
//       getCapturedData
//     } = setupNetworkInterceptor(page);

//     console.log(
//       `[reelController] Navigating to target Reel link...`
//     );

//     const navigationPromise = page.goto(normalizedUrl, {
//       waitUntil: 'domcontentloaded',
//       timeout: 25000
//     }).catch(err => {

//       console.warn(
//         '[reelController] Page navigation hit error or timeout:',
//         err.message
//       );

//       errorLog.push(
//         `Navigation error: ${err.message}`
//       );

//       return null;
//     });

//     // Race network interceptor against timeout
//     console.log(
//       '[reelController] Awaiting Network Interceptor (Layer 4)...'
//     );

//     metadata = await Promise.race([
//       metadataPromise,
//       navigationPromise.then(() =>
//         page.waitForTimeout(10000).then(() => null)
//       ),
//       page.waitForTimeout(15000).then(() => null)
//     ]);

//     if (metadata) {

//       console.log(
//         '[reelController] Metadata extracted successfully via Layer 4: Interceptor.'
//       );

//     } else {

//       metadata = getCapturedData();

//       if (metadata) {

//         console.log(
//           '[reelController] Metadata extracted successfully via Layer 4: Captured response polling.'
//         );

//       }
//     }

//     // DOM fallback
//     if (!metadata) {

//       console.log(
//         '[reelController] Network yields empty. Running Human Simulation...'
//       );

//       await runHumanSimulation(page);

//       metadata = getCapturedData();

//       if (!metadata) {

//         console.log(
//           '[reelController] Running DOM selector & JSON-LD parser fallback...'
//         );

//         try {

//           metadata = await scrapeDomMetadata(page);

//           console.log(
//             '[reelController] Metadata extracted successfully via Layer 4: DOM parser.'
//           );

//         } catch (domErr) {

//           console.error(
//             '❌ [reelController] DOM Fallback parsing failed:',
//             domErr.message
//           );

//           errorLog.push(
//             `DOM parsing error: ${domErr.message}`
//           );
//         }

//       } else {

//         console.log(
//           '[reelController] Metadata extracted successfully via post-scroll Network Interception.'
//         );
//       }
//     }

//     // =========================================================================
//     // PHASE 2: Public Embed video extraction
//     // =========================================================================

//     if (
//       pageInstance &&
//       (
//         !metadata ||
//         !metadata.videoUrl ||
//         metadata.videoUrl === 'N/A'
//       )
//     ) {

//       console.log(
//         '[reelController] PHASE 2: Video stream is missing. Initiating public Embed extraction...'
//       );

//       try {

//         const embedResult =
//           await extractVideoFromEmbed(
//             pageInstance,
//             normalizedUrl
//           );

//         if (
//           embedResult &&
//           embedResult.videoUrl
//         ) {

//           if (!metadata) {

//             metadata = {
//               username: 'unknown',
//               caption: '',
//               likes: '0',
//               comments: '0',
//               thumbnail: '',
//               videoUrl: embedResult.videoUrl,
//               audioName: 'Original Audio',
//               timestamp: new Date().toISOString(),
//               platform: 'Instagram'
//             };

//           } else {

//             metadata.videoUrl =
//               embedResult.videoUrl;
//           }

//           videoExtractionMethod =
//             embedResult.extractionMethod;

//           console.log(
//             `[reelController] Successfully matched embed video stream via: ${embedResult.extractionMethod}`
//           );
//         }

//       } catch (embedError) {

//         console.error(
//           '❌ [reelController] Embed video extraction failed:',
//           embedError.message
//         );

//         errorLog.push(
//           `Embed Extraction Error: ${embedError.message}`
//         );
//       }
//     }

//     // Close browser
//     await browser.close();

//     browser = null;
//     pageInstance = null;

//   } catch (automationError) {

//     console.error(
//       '❌ [reelController] Critical Browser automation failure:',
//       automationError.message
//     );

//     errorLog.push(
//       `Browser Error: ${automationError.message}`
//     );

//   } finally {

//     if (browser) {

//       try {
//         await browser.close();
//       } catch (e) { }
//     }
//   }

//   // =========================================================================
//   // oEmbed Fallback
//   // =========================================================================

//   if (!metadata) {

//     console.log(
//       '[reelController] Browser extraction yielded nothing. Running final oEmbed fallback...'
//     );

//     try {

//       metadata =
//         await fetchOembedMetadata(normalizedUrl);

//       console.log(
//         '[reelController] Metadata extracted successfully via Layer 6: oEmbed.'
//       );

//     } catch (oembedError) {

//       console.error(
//         '❌ [reelController] oEmbed fallback failed:',
//         oembedError.message
//       );

//       errorLog.push(
//         `oEmbed Error: ${oembedError.message}`
//       );
//     }
//   }

//   // =========================================================================
//   // PHASE 3: AI Analysis + OCR
//   // =========================================================================

//   if (metadata) {

//     console.log(
//       '[reelController] PHASE 3: Initiating Multimodal AI Analysis Layer...'
//     );

//     const isVideoValid =
//       metadata.videoUrl &&
//       metadata.videoUrl !== 'N/A' &&
//       metadata.videoUrl.startsWith('http');

//     if (isVideoValid) {

//       let downloadedVideoPath = null;

//       let extractedFramePaths = [];

//       let ocrFramePaths = [];

//       let downloadedAudioPath = null;

//       try {

//         // ============================================================
//         // STEP 1: Download video
//         // ============================================================

//         downloadedVideoPath =
//           await ffmpegService.downloadVideo(
//             metadata.videoUrl
//           );

//         // ============================================================
//         // STEP 2: AI frames (existing)
//         // ============================================================

//         extractedFramePaths =
//           await ffmpegService.extractFrames(
//             downloadedVideoPath
//           );

//         // ============================================================
//         // STEP 3: OCR frames (NEW)
//         // ============================================================

//         console.log(
//           '[reelController] Starting OCR frame extraction...'
//         );

//         ocrFramePaths =
//           await ffmpegService.extractFramesForOCR(
//             downloadedVideoPath
//           );

//         // ============================================================
//         // STEP 4: OCR TEXT EXTRACTION
//         // ============================================================

//         console.log(
//           '[reelController] Starting OCR text extraction...'
//         );

//         reelText =
//           await extractTextFromFrames(
//             ocrFramePaths
//           );

//         console.log(
//           '[reelController] OCR TEXT RESULT:'
//         );

//         console.log(reelText);

//         // ============================================================
//         // STEP 5: Audio extraction
//         // ============================================================

//         try {

//           downloadedAudioPath =
//             await ffmpegService.extractAudio(
//               downloadedVideoPath
//             );

//         } catch (audioErr) {

//           console.warn(
//             '[reelController] Audio isolation layer failed. Continuing on visual frames only:',
//             audioErr.message
//           );
//         }

//         // ============================================================
//         // STEP 6: Gemini AI Analysis
//         // ============================================================

//         aiResult =
//           await aiService.analyzeWithVideo(
//             extractedFramePaths,
//             downloadedAudioPath,
//             metadata,
//             reelText // NEW
//           );

//       } catch (aiVideoError) {

//         console.error(
//           '❌ [reelController] Combined video AI analysis pipeline collapsed:',
//           aiVideoError.message
//         );

//         errorLog.push(
//           `AI Video Error: ${aiVideoError.message}`
//         );

//         // Thumbnail fallback
//         console.log(
//           '[reelController] Attempting fallback to Single Thumbnail AI Analysis...'
//         );

//         try {

//           aiResult =
//             await aiService.analyzeWithThumbnail(
//               metadata.thumbnail,
//               metadata
//             );

//         } catch (thErr) {

//           console.error(
//             '❌ [reelController] Thumbnail AI analysis fallback failed:',
//             thErr.message
//           );

//           errorLog.push(
//             `AI Thumbnail Error: ${thErr.message}`
//           );
//         }

//       } finally {

//         // ============================================================
//         // CLEANUP
//         // ============================================================

//         const filesToCleanup = [];

//         if (downloadedVideoPath) {
//           filesToCleanup.push(downloadedVideoPath);
//         }

//         if (downloadedAudioPath) {
//           filesToCleanup.push(downloadedAudioPath);
//         }

//         if (
//           extractedFramePaths &&
//           extractedFramePaths.length > 0
//         ) {
//           filesToCleanup.push(
//             ...extractedFramePaths
//           );
//         }

//         if (
//           ocrFramePaths &&
//           ocrFramePaths.length > 0
//         ) {
//           filesToCleanup.push(
//             ...ocrFramePaths
//           );
//         }

//         ffmpegService.cleanup(filesToCleanup);
//       }

//     } else {

//       // Thumbnail-only mode

//       console.log(
//         '[reelController] Video URL not available. Conducting Single Thumbnail AI Analysis...'
//       );

//       try {

//         aiResult =
//           await aiService.analyzeWithThumbnail(
//             metadata.thumbnail,
//             metadata
//           );

//       } catch (aiThumbError) {

//         console.error(
//           '❌ [reelController] Thumbnail AI analysis failed:',
//           aiThumbError.message
//         );

//         errorLog.push(
//           `AI Thumbnail Error: ${aiThumbError.message}`
//         );
//       }
//     }
//   }

//   // =========================================================================
//   // PHASE 4: Final Response
//   // =========================================================================

//   if (metadata) {

//     const finalMethod =
//       videoExtractionMethod ||
//       metadata.metadata_source ||
//       metadata.fallbackUsed ||
//       'Playwright';

//     console.log(
//       `[reelController] Completed analysis pipeline. Output delivered via: ${finalMethod}`
//     );

//     return res.status(200).json({

//       success: true,

//       data: {

//         username: metadata.username,

//         // OLD caption still preserved internally
//         caption: metadata.caption,

//         // NEW OCR TEXT
//         reelText: reelText,

//         likes: metadata.likes,

//         comments: metadata.comments,

//         thumbnail: metadata.thumbnail,

//         videoUrl:
//           metadata.videoUrl &&
//             metadata.videoUrl !== 'N/A'
//             ? metadata.videoUrl
//             : null,

//         audioName: metadata.audioName,

//         timestamp: metadata.timestamp,

//         platform: metadata.platform,

//         extractionMethod: finalMethod,

//         aiAnalysis: aiResult || null
//       }
//     });

//   } else {

//     console.error(
//       '[reelController] Pipeline execution completely failed.'
//     );

//     return res.status(502).json({

//       success: false,

//       error:
//         'Failed to extract Reel metadata or conduct AI analysis across all layers.',

//       details: errorLog
//     });
//   }
// }

// module.exports = {
//   analyzeReel
// };
