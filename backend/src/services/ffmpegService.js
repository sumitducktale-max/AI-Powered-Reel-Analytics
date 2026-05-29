/**
 * [ffmpegService]
 * Services for downloading video CDN files, extracting keyframe thumbnails,
 * and stripping audio channels for multi-modal analysis using fluent-ffmpeg.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const glob = require('glob');
// Bind self-contained portable FFmpeg and FFprobe installer paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '50', 10);
const TEMP_DIR = process.env.TEMP_DIR || os.tmpdir();

/**
 * Downloads a video CDN stream and saves it into a temporary local file.
 * Implements strict size limit checks and download timeouts.
 * * @param {string} videoUrl - The video stream direct CDN link
 * @returns {Promise<string>} Path to the downloaded local video file
 */
async function downloadVideo(videoUrl) {
  console.log(`[ffmpegService] Starting download stream for video URL: ${videoUrl.substring(0, 100)}...`);

  const timestamp = Date.now();
  const destDir = path.resolve(TEMP_DIR);

  // Ensure the directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const videoPath = path.join(destDir, `reel_${timestamp}.mp4`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second download timeout

  try {
    const response = await fetch(videoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to retrieve video stream from CDN. Status: ${response.status}`);
    }

    // Step 1: Verify video size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeMb = parseInt(contentLength, 10) / (1024 * 1024);
      console.log(`[ffmpegService] Video size detected: ${sizeMb.toFixed(2)} MB`);
      if (sizeMb > MAX_VIDEO_SIZE_MB) {
        throw new Error(`Video file size (${sizeMb.toFixed(2)}MB) exceeds limit of ${MAX_VIDEO_SIZE_MB}MB.`);
      }
    }

    // Step 2: Download chunks and stream to file
    const fileStream = fs.createWriteStream(videoPath);
    const reader = response.body.getReader();
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      // Secondary inline size check in case Content-Length was missing
      const sizeMb = totalBytes / (1024 * 1024);
      if (sizeMb > MAX_VIDEO_SIZE_MB) {
        fileStream.destroy();
        fs.unlinkSync(videoPath);
        throw new Error(`Video stream exceeded max limit of ${MAX_VIDEO_SIZE_MB}MB during download.`);
      }

      fileStream.write(value);
    }

    fileStream.end();
    console.log(`[ffmpegService] Video downloaded successfully and stored at: ${videoPath}`);
    return videoPath;
  } catch (error) {
    clearTimeout(timeoutId);
    if (fs.existsSync(videoPath)) {
      try { fs.unlinkSync(videoPath); } catch (e) { }
    }
    if (error.name === 'AbortError') {
      throw new Error('Video download timed out after 30 seconds.');
    }
    throw error;
  }
}

/**
 * Extracts exactly 4 keyframes (at 0%, 25%, 50%, 75%) from a local video file.
 * Returns an array of paths to the extracted image files.
 * * @param {string} videoPath - The path to the downloaded video file
 * @returns {Promise<string[]>} List of absolute paths to extracted JPEG frame files
 */
async function extractFrames(videoPath) {
  console.log(`[ffmpegService] Extracting frames from video file: ${videoPath}`);

  return new Promise((resolve, reject) => {
    const framePaths = [];
    const timestamp = Date.now();
    const destDir = path.resolve(TEMP_DIR);

    ffmpeg(videoPath)
      .on('filenames', (filenames) => {
        filenames.forEach(file => {
          framePaths.push(path.join(destDir, file));
        });
      })
      .on('end', () => {
        console.log(`[ffmpegService] Frame extraction complete. 4 screenshots written to: ${destDir}`);
        resolve(framePaths);
      })
      .on('error', (err) => {
        console.error(`[ffmpegService] Frame extraction failed: ${err.message}`);
        reject(err);
      })
      .screenshots({
        count: 4,
        folder: destDir,
        filename: `frame_${timestamp}_%i.jpg`
      });
  });
}

/**
 * Extracts raw audio track from a local MP4 video file and saves it as an MP3 file.
 * * @param {string} videoPath - The path to the downloaded video file
 * @returns {Promise<string>} Path to the newly created MP3 audio file
 */
async function extractAudio(videoPath) {
  console.log(`[ffmpegService] Extracting and isolating audio track from video file...`);

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const destDir = path.resolve(TEMP_DIR);
    const audioPath = path.join(destDir, `audio_${timestamp}.mp3`);

    ffmpeg(videoPath)
      .toFormat('mp3')
      .noVideo() // Discard video streams entirely
      .on('end', () => {
        console.log(`[ffmpegService] Audio extraction complete. Written to: ${audioPath}`);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error(`[ffmpegService] Audio extraction failed: ${err.message}`);
        reject(err);
      })
      .save(audioPath);
  });
}

/**
 * Removes temporary download, audio, and frame screenshot assets to prevent local disk bloat.
 * * @param {string[]} filePaths - Absolute file paths to be deleted
 */
function cleanup(filePaths) {
  if (!filePaths || !Array.isArray(filePaths)) return;
  console.log('[ffmpegService] Executing storage cleanup on temporary video and frame elements...');

  filePaths.forEach(filePath => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[ffmpegService] Deleted temporary file: ${filePath}`);
      }
    } catch (err) {
      console.error(`[ffmpegService] Error cleaning up file ${filePath}: ${err.message}`);
    }
  });
}


// for extracting the text from the vedio we are splitting it in 1 frame per second

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCR FRAMES — Scene Detection Primary
// Fixed FPS Fallback
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// async function extractFramesForOCR(videoPath) {
//   console.log('[ffmpegService] Extracting OCR frames via scene detection...');

//   const timestamp = Date.now();
//   const tmpDir = os.tmpdir();

//   // Strategy 1 — Scene change detection
//   // Jab bhi screen pe kuch naya aaye → frame nikalo
//   const sceneFrames = await extractSceneFrames(videoPath, timestamp, tmpDir);

//   if (sceneFrames.length >= 5) {
//     // Scene detection kaam kiya
//     console.log(`[ffmpegService] Total OCR frames (scene): ${sceneFrames.length}`);
//     return sceneFrames;
//   }

//   // Strategy 2 — Fixed FPS fallback
//   // Scene detection ne kam frames diye → fixed fps try karo
//   console.log('[ffmpegService] Scene detection yielded too few frames. Using fixed FPS fallback...');
//   const fixedFrames = await extractFixedFrames(videoPath, timestamp, tmpDir);

//   console.log(`[ffmpegService] Total OCR frames (fixed): ${fixedFrames.length}`);
//   return fixedFrames;
// }

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // Strategy 1 — Scene Change Detection
// // Text overlay aate hi → scene change → frame nikalta hai
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// function extractSceneFrames(videoPath, timestamp, tmpDir) {
//   return new Promise((resolve) => {

//     const outputPattern = path.join(
//       tmpDir,
//       `ocr_scene_${timestamp}_%04d.jpg`
//     );

//     console.log('[ffmpegService] Running scene detection filter...');

//     ffmpeg(videoPath)
//       .outputOptions([
//         // 0.10 = 10% visual change hone pe naya frame
//         // Lower value = zyada frames (sensitive)
//         // Higher value = kam frames (only big changes)
//         '-vf', "select='gt(scene,0.10)',showinfo",
//         '-vsync', 'vfr',  // variable frame rate — sirf matching frames
//         '-q:v', '1',      // best quality
//         '-an'             // no audio stream
//       ])
//       .output(outputPattern)
//       .on('start', (cmd) => {
//         console.log('[ffmpegService] Scene detection command started.');
//       })
//       .on('end', () => {

//         // Windows backslash fix
//         const globPattern = path
//           .join(tmpDir, `ocr_scene_${timestamp}_*.jpg`)
//           .replace(/\\/g, '/');

//         const files = glob.sync(globPattern);
//         console.log(`[ffmpegService] Scene frames extracted: ${files.length}`);
//         resolve(files);
//       })
//       .on('error', (err) => {
//         console.warn(
//           '[ffmpegService] Scene detection failed:',
//           err.message
//         );
//         // Scene detection fail → empty array → caller fixed fps try karega
//         resolve([]);
//       })
//       .run();
//   });
// }

// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // Strategy 2 — Fixed FPS Fallback
// // Scene detection fail ya low frames → yeh chalta hai
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// function extractFixedFrames(videoPath, timestamp, tmpDir) {
//   return new Promise((resolve) => {

//     const outputPattern = path.join(
//       tmpDir,
//       `ocr_fixed_${timestamp}_%04d.jpg`
//     );

//     ffmpeg(videoPath)
//       .outputOptions([
//         '-vf', 'fps=3',   // har second 3 frames
//         '-q:v', '1',
//         '-an'
//       ])
//       .output(outputPattern)
//       .on('end', () => {

//         // Windows backslash fix
//         const globPattern = path
//           .join(tmpDir, `ocr_fixed_${timestamp}_*.jpg`)
//           .replace(/\\/g, '/');

//         const files = glob.sync(globPattern);
//         console.log(`[ffmpegService] Fixed frames extracted: ${files.length}`);
//         resolve(files);
//       })
//       .on('error', (err) => {
//         console.warn(
//           '[ffmpegService] Fixed FPS extraction failed:',
//           err.message
//         );
//         resolve([]);
//       })
//       .run();
//   });
// }
async function extractFramesForOCR(videoPath) {
  console.log('[ffmpegService] Extracting OCR frames via high-frequency interval sampling...');

  const timestamp = Date.now();
  const tmpDir = os.tmpdir();

  // We rely directly on a stable, high-density sample rate (3 frames per second)
  // This captures flashing text, colorful words, and fast subtitles perfectly.
  const allFrames = await extractFixedFrames(videoPath, timestamp, tmpDir);

  console.log(`[ffmpegService] Total OCR frames: ${allFrames.length}`);
  return allFrames;
}

// ── Strategy: Fixed high-density fps ──
// ── Strategy: Fixed high-density fps ──
function extractFixedFrames(videoPath, timestamp, tmpDir) {
  return new Promise((resolve) => {
    const outputPattern = path.join(tmpDir, `ocr_fixed_${timestamp}_%04d.jpg`);

    ffmpeg(videoPath)
      .outputOptions([
        '-vf', 'fps=3',   // Har second 3 frames extract karega
        '-q:v', '2'
      ])
      .output(outputPattern)
      .on('end', () => {
        // Windows backslash fix: glob functions text match ke liye forward slash expect karte hain
        const globPattern = path.join(tmpDir, `ocr_fixed_${timestamp}_*.jpg`).replace(/\\/g, '/');

        const files = glob.sync(globPattern);
        console.log(`[ffmpegService] Fixed frames successfully extracted: ${files.length}`);
        resolve(files);
      })
      .on('error', (err) => {
        console.warn('[ffmpegService] High-frequency frame extraction failed:', err.message);
        resolve([]);
      })
      .run();
  });
}


module.exports = {
  downloadVideo,
  extractFrames,
  extractAudio,
  cleanup,
  extractFramesForOCR
};
// /**
//  * [ffmpegService]
//  * Services for downloading video CDN files and extracting keyframe thumbnails
//  * for multi-modal analysis using fluent-ffmpeg.
//  */

// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const ffmpeg = require('fluent-ffmpeg');
// const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
// const ffprobeInstaller = require('@ffprobe-installer/ffprobe'); // FIXED: Import ffprobe installer

// // Bind self-contained portable FFmpeg and FFprobe installer paths
// ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// ffmpeg.setFfprobePath(ffprobeInstaller.path); // FIXED: Bind portable ffprobe path dynamically

// const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '50', 10);
// const TEMP_DIR = process.env.TEMP_DIR || os.tmpdir();

// /**
//  * Downloads a video CDN stream and saves it into a temporary local file.
//  * Implements strict size limit checks and download timeouts.
//  * * @param {string} videoUrl - The video stream direct CDN link
//  * @returns {Promise<string>} Path to the downloaded local video file
//  */
// async function downloadVideo(videoUrl) {
//   console.log(`[ffmpegService] Starting download stream for video URL: ${videoUrl.substring(0, 100)}...`);

//   const timestamp = Date.now();
//   const destDir = path.resolve(TEMP_DIR);

//   // Ensure the directory exists
//   if (!fs.existsSync(destDir)) {
//     fs.mkdirSync(destDir, { recursive: true });
//   }

//   const videoPath = path.join(destDir, `reel_${timestamp}.mp4`);

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second download timeout

//   try {
//     const response = await fetch(videoUrl, { signal: controller.signal });
//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       throw new Error(`Failed to retrieve video stream from CDN. Status: ${response.status}`);
//     }

//     // Step 1: Verify video size
//     const contentLength = response.headers.get('content-length');
//     if (contentLength) {
//       const sizeMb = parseInt(contentLength, 10) / (1024 * 1024);
//       console.log(`[ffmpegService] Video size detected: ${sizeMb.toFixed(2)} MB`);
//       if (sizeMb > MAX_VIDEO_SIZE_MB) {
//         throw new Error(`Video file size (${sizeMb.toFixed(2)}MB) exceeds limit of ${MAX_VIDEO_SIZE_MB}MB.`);
//       }
//     }

//     // Step 2: Download chunks and stream to file
//     const fileStream = fs.createWriteStream(videoPath);
//     const reader = response.body.getReader();
//     let totalBytes = 0;

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;

//       totalBytes += value.length;
//       // Secondary inline size check in case Content-Length was missing
//       const sizeMb = totalBytes / (1024 * 1024);
//       if (sizeMb > MAX_VIDEO_SIZE_MB) {
//         fileStream.destroy();
//         fs.unlinkSync(videoPath);
//         throw new Error(`Video stream exceeded max limit of ${MAX_VIDEO_SIZE_MB}MB during download.`);
//       }

//       fileStream.write(value);
//     }

//     fileStream.end();
//     console.log(`[ffmpegService] Video downloaded successfully and stored at: ${videoPath}`);
//     return videoPath;
//   } catch (error) {
//     clearTimeout(timeoutId);
//     if (fs.existsSync(videoPath)) {
//       try { fs.unlinkSync(videoPath); } catch (e) { }
//     }
//     if (error.name === 'AbortError') {
//       throw new Error('Video download timed out after 30 seconds.');
//     }
//     throw error;
//   }
// }

// /**
//  * Extracts exactly 4 keyframes (at 0%, 25%, 50%, 75%) from a local video file.
//  * Returns an array of paths to the extracted image files.
//  * * @param {string} videoPath - The path to the downloaded video file
//  * @returns {Promise<string[]>} List of absolute paths to extracted JPEG frame files
//  */
// async function extractFrames(videoPath) {
//   console.log(`[ffmpegService] Extracting frames from video file: ${videoPath}`);

//   return new Promise((resolve, reject) => {
//     const framePaths = [];
//     const timestamp = Date.now();
//     const destDir = path.resolve(TEMP_DIR);

//     ffmpeg(videoPath)
//       .on('filenames', (filenames) => {
//         filenames.forEach(file => {
//           framePaths.push(path.join(destDir, file));
//         });
//       })
//       .on('end', () => {
//         console.log(`[ffmpegService] Frame extraction complete. 4 screenshots written to: ${destDir}`);
//         resolve(framePaths);
//       })
//       .on('error', (err) => {
//         console.error(`[ffmpegService] Frame extraction failed: ${err.message}`);
//         reject(err);
//       })
//       .screenshots({
//         count: 4,
//         folder: destDir,
//         filename: `frame_${timestamp}_%i.jpg`
//       });
//   });
// }

// /**
//  * Removes temporary download and frame screenshot assets to prevent local disk bloat.
//  * * @param {string[]} filePaths - Absolute file paths to be deleted
//  */
// function cleanup(filePaths) {
//   if (!filePaths || !Array.isArray(filePaths)) return;
//   console.log('[ffmpegService] Executing storage cleanup on temporary video and frame elements...');

//   filePaths.forEach(filePath => {
//     try {
//       if (filePath && fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//         console.log(`[ffmpegService] Deleted temporary file: ${filePath}`);
//       }
//     } catch (err) {
//       console.error(`[ffmpegService] Error cleaning up file ${filePath}: ${err.message}`);
//     }
//   });
// }

// module.exports = {
//   downloadVideo,
//   extractFrames,
//   cleanup
// };