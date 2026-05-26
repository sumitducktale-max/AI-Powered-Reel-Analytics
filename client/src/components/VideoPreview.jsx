import React from 'react';
import { Eye, Download, Image as ImageIcon, Video, ExternalLink, HelpCircle } from 'lucide-react';

export default function VideoPreview({ videoUrl, thumbnail }) {
  const isVideoValid = videoUrl && videoUrl !== 'N/A' && !videoUrl.includes('Fallback');

  return (
    <div className="glass-panel p-6 md:p-8 flex flex-col items-stretch h-full">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Video className="text-[hsl(var(--secondary))]" size={22} />
        <span>Media Preview</span>
      </h3>

      <div className="relative aspect-[9/16] max-h-[480px] w-full mx-auto bg-slate-950 rounded-xl overflow-hidden border border-[hsl(var(--border))] flex items-center justify-center">
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
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="Reel Cover Thumbnail"
                className="w-full h-full object-cover blur-sm opacity-55"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[hsl(var(--fg-muted))]">
                <ImageIcon size={48} />
              </div>
            )}
            
            <div className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
              <ImageIcon size={36} className="text-[hsl(var(--accent))] mb-3" />
              <h4 className="font-bold text-base mb-1.5">Direct Video Blocked</h4>
              <p className="text-xs text-[hsl(var(--fg-muted))] max-w-[200px] mb-4 leading-relaxed">
                Instagram restricted direct video streaming. Full cover thumbnail extracted successfully.
              </p>
              
              {thumbnail && (
                <a
                  href={thumbnail}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 border border-white/10 transition-all"
                >
                  <Eye size={14} />
                  <span>View Full Cover</span>
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
            className="w-full py-2.5 rounded-lg bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 border border-emerald-800/40 transition-all"
          >
            <Download size={16} />
            <span>Open Direct Video Link</span>
            <ExternalLink size={14} />
          </a>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2.5 text-xs text-amber-400">
            <HelpCircle size={18} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Scraper Fallback Note:</strong> Video tags are hidden on unauthenticated sessions. Log in using `npm run auth:setup` to bypass and retrieve direct video urls.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
