import React from 'react';
import { Eye, Download, Image as ImageIcon, Video, ExternalLink, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoPanel({ videoUrl, thumbnail, aiMode }) {
  const isVideoValid = videoUrl && videoUrl !== 'N/A' && videoUrl.startsWith('http');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-6 md:p-8 flex flex-col items-stretch h-full"
    >
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Video className="text-[hsl(var(--secondary))]" size={20} />
        <span>Scraped Media Assets</span>
      </h3>

      <div className="relative aspect-[9/16] max-h-[460px] w-full mx-auto bg-slate-950 rounded-xl overflow-hidden border border-[hsl(var(--border))] flex items-center justify-center shadow-inner">
        {isVideoValid ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster={thumbnail}
          />
        ) : (
          <div className="w-full h-full relative">
            {thumbnail && thumbnail !== 'N/A' ? (
              <img
                src={thumbnail}
                alt="Reel Cover Thumbnail"
                className="w-full h-full object-cover blur-sm opacity-50"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[hsl(var(--fg-muted))]">
                <ImageIcon size={48} />
              </div>
            )}
            
            <div className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
              <ImageIcon size={32} className="text-[hsl(var(--accent))] mb-3" />
              <h4 className="font-bold text-base mb-1 text-[hsl(var(--fg-main))]">Video CDN Stream Blocked</h4>
              <p className="text-xs text-[hsl(var(--fg-muted))] max-w-[200px] mb-4 leading-relaxed">
                Instagram restricted direct streaming. Thumbnail parsed successfully.
              </p>
              
              {aiMode === 'thumbnail' && (
                <div className="px-3.5 py-1.5 rounded-full bg-[hsl(var(--primary-glow))] text-[hsl(var(--primary))] font-bold text-[10px] border border-[hsl(var(--border))] tracking-wider uppercase mb-4 animate-pulse">
                  AI Analyzed via Thumbnail
                </div>
              )}
              
              {thumbnail && thumbnail !== 'N/A' && (
                <a
                  href={thumbnail}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 transition-all shadow-md"
                >
                  <Eye size={12} />
                  <span>View Thumbnail</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {isVideoValid ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-lg bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-800/40 transition-all"
          >
            <Download size={14} />
            <span>Open Direct Video Stream</span>
            <ExternalLink size={12} />
          </a>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2 text-[10px] text-amber-400 leading-normal">
            <HelpCircle size={16} className="shrink-0 mt-0.5" />
            <p>
              <strong>Session Warning:</strong> If video URL is blocked, verify you have generated `cookies.json` using `npm run auth:setup` in the backend project folder.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
