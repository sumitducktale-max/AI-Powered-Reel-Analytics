import React, { useEffect, useState } from 'react';
import {
  Cpu, Film, ShieldAlert, Sparkles, CheckCircle2,
  XCircle, Gauge, Mic, Hash, Music, Type
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AiInsights({ analysis }) {
  if (!analysis) return null;

  const {
    analysisMode,
    summary,
    sceneDescription,
    activities = [],
    objects = [],
    mood,
    emotionAnalysis,
    category,
    contentLanguage,

    // AUDIO
    audioTranscript,
    audioLanguage,
    audioType,
    musicInfo,

    // ✅ OCR TEXT
    reelText,

    // backward compat
    audioGuess,

    keyMoments = [],
    safetyWarnings = [],
    viralPotential = 50,
    engagementPrediction,
    hashtags = [],
    detectedElements = {}
  } = analysis;

  // SUMMARY TYPING
  const [typedSummary, setTypedSummary] = useState('');

  useEffect(() => {
    if (!summary) return;

    setTypedSummary('');

    let idx = 0;

    const interval = setInterval(() => {
      setTypedSummary((prev) => prev + summary.charAt(idx));
      idx++;

      if (idx >= summary.length) {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [summary]);

  // AUDIO TRANSCRIPT TYPING
  const [typedTranscript, setTypedTranscript] = useState('');
  const transcriptText = audioTranscript || audioGuess || '';

  useEffect(() => {
    if (!transcriptText) return;

    setTypedTranscript('');

    let idx = 0;

    const interval = setInterval(() => {
      setTypedTranscript((prev) => prev + transcriptText.charAt(idx));
      idx++;

      if (idx >= transcriptText.length) {
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [transcriptText]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const getAudioTypeBadge = (type) => {
    const map = {
      speech: 'bg-blue-950/40 text-blue-300 border-blue-900/40',
      music: 'bg-purple-950/40 text-purple-300 border-purple-900/40',
      both: 'bg-cyan-950/40 text-cyan-300 border-cyan-900/40',
      silent: 'bg-slate-900/40 text-slate-400 border-slate-800/40',
      unknown: 'bg-slate-900/40 text-slate-400 border-slate-800/40',
    };

    return map[type?.toLowerCase()] || map.unknown;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="glass-panel p-6 md:p-8 col-span-1 md:col-span-2 space-y-8"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="text-[hsl(var(--primary))]" size={22} />
          <span>Multimodal Intelligence Insights</span>
        </h3>

        <div className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded bg-[hsl(var(--primary-glow))] text-[hsl(var(--primary))] uppercase border border-[hsl(var(--border))]">
          Mode: {analysisMode}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* AI SUMMARY */}
          <motion.div variants={itemVariants} className="space-y-2">

            <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1.5">
              <Sparkles
                size={14}
                className="text-[hsl(var(--accent))]"
              />
              <span>AI Executive Summary</span>
            </h4>

            <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-xl p-4 min-h-[70px]">
              <p className="text-sm leading-relaxed text-[hsl(var(--fg-main))] font-medium">

                {typedSummary || (
                  <span className="text-slate-600">
                    Generating summary...
                  </span>
                )}

                <span className="inline-block w-1.5 h-3.5 ml-1 bg-[hsl(var(--primary))] animate-pulse align-middle" />
              </p>
            </div>
          </motion.div>

          {/* ✅ REEL TEXT (OCR) */}
          {reelText && (
            <motion.div variants={itemVariants} className="space-y-2">

              <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1.5">

                <Type
                  size={14}
                  className="text-[hsl(var(--secondary))]"
                />

                <span>Detected Reel Text</span>

              </h4>

              <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-xl p-4">

                <p className="text-sm leading-relaxed text-[hsl(var(--fg-main))] whitespace-pre-line font-medium">
                  {reelText}
                </p>

              </div>
            </motion.div>
          )}

          {/* AUDIO TRANSCRIPT */}
          {transcriptText && (
            <motion.div variants={itemVariants} className="space-y-2">

              <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1.5">

                <Mic
                  size={14}
                  className="text-[hsl(var(--accent))]"
                />

                <span>Audio Transcript</span>

                {audioType && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${getAudioTypeBadge(audioType)}`}
                  >
                    {audioType}
                  </span>
                )}

              </h4>

              <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-xl p-4 min-h-[80px] relative">

                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-ping" />
                </div>

                <p className="text-sm leading-relaxed text-[hsl(var(--fg-main))] font-medium italic pr-4">

                  "
                  {typedTranscript || (
                    <span className="text-slate-600 not-italic">
                      Loading transcript...
                    </span>
                  )}
                  "

                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-[hsl(var(--accent))] animate-pulse align-middle not-italic" />

                </p>
              </div>

              {/* AUDIO META */}
              <div className="flex flex-wrap gap-2 mt-1">

                {audioLanguage && (
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-blue-950/30 text-blue-300 border-blue-900/40 font-semibold">
                    🌐 {audioLanguage}
                  </span>
                )}

                {musicInfo && (
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-purple-950/30 text-purple-300 border-purple-900/40 font-semibold flex items-center gap-1">
                    <Music size={9} />
                    {musicInfo}
                  </span>
                )}

              </div>
            </motion.div>
          )}

          {/* ACTIVITIES + OBJECTS */}
          <motion.div variants={itemVariants} className="space-y-3">

            <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))]">
              Scene Activities & Entities
            </h4>

            <div className="flex flex-wrap gap-2">

              {activities.map((act, i) => (
                <span
                  key={`act-${i}`}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/30 text-purple-300 border border-purple-900/35"
                >
                  🏃‍♂️ {act}
                </span>
              ))}

              {objects.map((obj, i) => (
                <span
                  key={`obj-${i}`}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-950/30 text-cyan-300 border border-cyan-900/35"
                >
                  📦 {obj}
                </span>
              ))}

              {activities.length === 0 && objects.length === 0 && (
                <span className="text-xs text-[hsl(var(--fg-muted))] italic">
                  No activities or objects recognized.
                </span>
              )}

            </div>
          </motion.div>

          {/* MOOD + CATEGORY */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">

            <div className="bg-slate-950/20 border border-[hsl(var(--border))] p-3.5 rounded-lg">

              <span className="text-[10px] uppercase font-bold text-[hsl(var(--fg-muted))] block mb-1">
                Content Mood
              </span>

              <span className="text-sm font-semibold text-[hsl(var(--accent))] capitalize">
                🎭 {mood || 'Neutral'}
              </span>

            </div>

            <div className="bg-slate-950/20 border border-[hsl(var(--border))] p-3.5 rounded-lg">

              <span className="text-[10px] uppercase font-bold text-[hsl(var(--fg-muted))] block mb-1">
                Theme Category
              </span>

              <span className="text-sm font-semibold text-[hsl(var(--secondary))] capitalize">
                📁 {category || 'General'}
              </span>

            </div>
          </motion.div>

          {/* SAFETY WARNINGS */}
          {safetyWarnings.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 space-y-2"
            >

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert size={16} />
                <span>AI Safety Alerts</span>
              </div>

              <ul className="text-xs list-disc list-inside space-y-1 opacity-90">

                {safetyWarnings.map((warning, i) => (
                  <li key={`warn-${i}`}>
                    {warning}
                  </li>
                ))}

              </ul>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* VIRAL SCORE */}
          <motion.div variants={itemVariants} className="space-y-2">

            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))]">

              <span className="flex items-center gap-1">

                <Gauge
                  size={14}
                  className="text-[hsl(var(--secondary))]"
                />

                <span>Viral Score</span>

              </span>

              <span className="text-[hsl(var(--secondary))] font-extrabold">
                {viralPotential}%
              </span>
            </div>

            <div className="w-full h-3.5 rounded-full bg-slate-950/50 border border-[hsl(var(--border))] p-[2px] overflow-hidden">

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${viralPotential}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))]"
              />

            </div>
          </motion.div>

          {/* DETECTED ELEMENTS */}
          <motion.div variants={itemVariants} className="space-y-3">

            <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))]">
              Scene Element Detections
            </h4>

            <div className="grid grid-cols-3 gap-2">

              {Object.entries(detectedElements).map(([key, detected]) => (

                <div
                  key={key}
                  className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all ${detected
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                    : 'bg-slate-950/40 border-[hsl(var(--border))] text-slate-500 opacity-60'
                    }`}
                >

                  {detected
                    ? <CheckCircle2 size={16} />
                    : <XCircle size={16} />
                  }

                  <span className="capitalize leading-none text-[10px]">
                    {key}
                  </span>

                </div>
              ))}

            </div>
          </motion.div>

          {/* KEY MOMENTS */}
          {analysisMode === 'video' && keyMoments.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">

              <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1.5">

                <Film
                  size={14}
                  className="text-[hsl(var(--primary))]"
                />

                <span>Visual Timeline Moments</span>

              </h4>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">

                {keyMoments.map((moment, i) => (

                  <div
                    key={`moment-${i}`}
                    className="flex gap-3 bg-slate-950/30 border border-[hsl(var(--border))] rounded-lg p-3"
                  >

                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-[hsl(var(--border))] text-[hsl(var(--secondary))] h-fit whitespace-nowrap">
                      {moment.timestamp}
                    </span>

                    <p className="text-xs text-[hsl(var(--fg-muted))] leading-relaxed">
                      {moment.description}
                    </p>

                  </div>
                ))}

              </div>
            </motion.div>
          )}

          {/* HASHTAGS */}
          {hashtags.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-2">

              <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1.5">

                <Hash
                  size={14}
                  className="text-[hsl(var(--primary))]"
                />

                <span>Suggested Hashtags</span>

              </h4>

              <div className="flex flex-wrap gap-1.5">

                {hashtags.map((tag, i) => (
                  <span
                    key={`stag-${i}`}
                    className="text-[10px] px-2 py-0.5 rounded border bg-slate-950/40 text-slate-300 border-slate-800/40 font-medium"
                  >
                    {tag}
                  </span>
                ))}

              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
