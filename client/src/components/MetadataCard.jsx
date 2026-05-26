import React from 'react';
import { User, Heart, MessageSquare, Music, Clock, Activity, ShieldCheck } from 'lucide-react';

export default function MetadataCard({ data }) {
  if (!data) return null;

  const {
    username,
    caption,
    likes,
    comments,
    audioName,
    timestamp,
    platform,
    metadata_source
  } = data;

  // Format date nicely
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to format captions by auto-highlighting hashtags & mentions
  const renderCaption = (text) => {
    if (!text) return <em className="text-[hsl(var(--fg-muted))]">No caption provided.</em>;
    
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#')) {
        return <span key={i} className="text-[hsl(var(--secondary))] hover:underline cursor-pointer">{word}</span>;
      }
      if (word.startsWith('@')) {
        return <span key={i} className="text-[hsl(var(--accent))] hover:underline cursor-pointer">{word}</span>;
      }
      return word;
    });
  };

  // Badge mapping for extraction sources
  const getSourceStyle = (source) => {
    if (source?.includes('Interception')) {
      return 'bg-emerald-950/45 text-emerald-400 border-emerald-800/40';
    }
    if (source?.includes('DOM')) {
      return 'bg-amber-950/45 text-amber-400 border-amber-800/40';
    }
    return 'bg-blue-950/45 text-blue-400 border-blue-800/40';
  };

  return (
    <div className="glass-panel p-6 md:p-8 flex flex-col justify-between h-full">
      <div>
        {/* Header Profile Info */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-[2px] flex items-center justify-center shadow-lg">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white">
                <User size={22} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">@{username}</h3>
              <p className="text-xs text-[hsl(var(--fg-muted))]">{platform} Creator</p>
            </div>
          </div>

          <div className={`px-3 py-1 text-xs border rounded-full font-semibold flex items-center gap-1.5 ${getSourceStyle(metadata_source)}`}>
            <ShieldCheck size={14} />
            <span>{metadata_source || 'Playwright Engine'}</span>
          </div>
        </div>

        {/* Stats Metrics Dashboard Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-[var(--radius-md)] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[hsl(var(--primary-glow))] text-[hsl(var(--primary))]">
              <Heart size={20} fill="hsla(var(--primary) / 0.15)" />
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--fg-muted))] block leading-none mb-1">Likes</span>
              <strong className="text-lg font-bold">{likes}</strong>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-[var(--radius-md)] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[hsl(var(--secondary-glow))] text-[hsl(var(--secondary))]">
              <MessageSquare size={20} fill="hsla(var(--secondary) / 0.15)" />
            </div>
            <div>
              <span className="text-xs text-[hsl(var(--fg-muted))] block leading-none mb-1">Comments</span>
              <strong className="text-lg font-bold">{comments}</strong>
            </div>
          </div>
        </div>

        {/* Caption Area */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] mb-2">Caption</h4>
          <div className="bg-slate-950/20 border border-[hsl(var(--border))] rounded-lg p-4 text-sm leading-relaxed max-h-[150px] overflow-y-auto">
            {renderCaption(caption)}
          </div>
        </div>
      </div>

      {/* Footer Info Metadata details */}
      <div className="border-t border-[hsl(var(--border))] pt-4 mt-4 flex flex-col gap-2.5 text-xs text-[hsl(var(--fg-muted))]">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-[hsl(var(--secondary))]" />
          <span className="truncate"><strong>Audio:</strong> {audioName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[hsl(var(--accent))]" />
          <span><strong>Published:</strong> {formatDate(timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
