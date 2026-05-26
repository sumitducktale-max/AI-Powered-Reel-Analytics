// import React from 'react';
// import { User, Heart, MessageSquare, Music, Clock, ShieldCheck } from 'lucide-react';
// import { motion } from 'framer-motion';

// export default function ReelCard({ data }) {
//   if (!data) return null;

//   const {
//     username,
//     caption,
//     likes,
//     comments,
//     audioName,
//     timestamp,
//     platform,
//     extractionMethod
//   } = data;

//   const formatDate = (dateStr) => {
//     try {
//       const d = new Date(dateStr);
//       return d.toLocaleDateString(undefined, { 
//         year: 'numeric', 
//         month: 'long', 
//         day: 'numeric', 
//         hour: '2-digit', 
//         minute: '2-digit' 
//       });
//     } catch (e) {
//       return dateStr;
//     }
//   };

//   const renderCaption = (text) => {
//     if (!text) return <em className="text-[hsl(var(--fg-muted))] text-xs">No caption provided.</em>;

//     return text.split(/(\s+)/).map((word, i) => {
//       if (word.startsWith('#')) {
//         return <span key={i} className="text-[hsl(var(--secondary))] font-medium hover:underline cursor-pointer">{word}</span>;
//       }
//       if (word.startsWith('@')) {
//         return <span key={i} className="text-[hsl(var(--accent))] font-medium hover:underline cursor-pointer">{word}</span>;
//       }
//       return word;
//     });
//   };

//   const getSourceStyle = (source) => {
//     if (source?.includes('Intercept')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
//     if (source?.includes('Embed')) return 'bg-purple-950/40 text-purple-400 border-purple-800/40';
//     if (source?.includes('DOM')) return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
//     return 'bg-blue-950/40 text-blue-400 border-blue-800/40';
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0, x: -20 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 0.5, delay: 0.2 }}
//       className="glass-panel p-6 md:p-8 flex flex-col justify-between h-full"
//     >
//       <div>
//         <div className="flex items-center justify-between gap-4 mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] p-[2px] flex items-center justify-center shadow-lg">
//               <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white">
//                 <User size={22} />
//               </div>
//             </div>
//             <div>
//               <h3 className="font-bold text-lg leading-tight">@{username || 'creator'}</h3>
//               <p className="text-xs text-[hsl(var(--fg-muted))]">{platform || 'Instagram'} Creator</p>
//             </div>
//           </div>

//           <div className={`px-3 py-1 text-xs border rounded-full font-semibold flex items-center gap-1.5 ${getSourceStyle(extractionMethod)}`}>
//             <ShieldCheck size={14} />
//             <span>{extractionMethod || 'Playwright Engine'}</span>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-[var(--radius-md)] p-4 flex items-center gap-3">
//             <div className="p-2.5 rounded-lg bg-[hsl(var(--primary-glow))] text-[hsl(var(--primary))]">
//               <Heart size={20} fill="hsla(var(--primary) / 0.15)" />
//             </div>
//             <div>
//               <span className="text-xs text-[hsl(var(--fg-muted))] block leading-none mb-1">Likes</span>
//               <strong className="text-lg font-bold">{likes || 'N/A'}</strong>
//             </div>
//           </div>

//           <div className="bg-slate-950/40 border border-[hsl(var(--border))] rounded-[var(--radius-md)] p-4 flex items-center gap-3">
//             <div className="p-2.5 rounded-lg bg-[hsl(var(--secondary-glow))] text-[hsl(var(--secondary))]">
//               <MessageSquare size={20} fill="hsla(var(--secondary) / 0.15)" />
//             </div>
//             <div>
//               <span className="text-xs text-[hsl(var(--fg-muted))] block leading-none mb-1">Comments</span>
//               <strong className="text-lg font-bold">{comments || 'N/A'}</strong>
//             </div>
//           </div>
//         </div>

//         <div className="mb-6">
//           <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] mb-2">Original Caption</h4>
//           <div className="bg-slate-950/20 border border-[hsl(var(--border))] rounded-lg p-4 text-sm leading-relaxed max-h-[150px] overflow-y-auto">
//             {renderCaption(caption)}
//           </div>
//         </div>
//       </div>

//       <div className="border-t border-[hsl(var(--border))] pt-4 mt-4 flex flex-col gap-2.5 text-xs text-[hsl(var(--fg-muted))]">
//         <div className="flex items-center gap-2">
//           <Music size={14} className="text-[hsl(var(--secondary))]" />
//           <span className="truncate"><strong>Audio track:</strong> {audioName || 'Original Audio'}</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <Clock size={14} className="text-[hsl(var(--accent))]" />
//           <span><strong>Timestamp:</strong> {formatDate(timestamp)}</span>
//         </div>
//       </div>
//     </motion.div>
//   );
// }
import React from 'react';
import { User, Heart, MessageSquare, Music, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReelCard({ data }) {
  if (!data) return null;

  const {
    username,
    caption,
    likes,
    comments,
    audioName,
    timestamp,
    platform,
    extractionMethod
  } = data;

  // Smart metric extractor logic for extracting hidden metrics from text if raw counters fail
  // Smart metric extractor logic for extracting hidden metrics from text if raw counters fail
  const getParsedMetric = (type, fallbackValue) => {
    // If we have a genuine scraped number higher than 0, use it
    if (fallbackValue && fallbackValue !== 0 && fallbackValue !== '0') {
      return fallbackValue;
    }

    if (!caption) return '0';

    try {
      // Clean string spaces and force lowcase to simplify matching
      const cleanCaption = caption.replace(/\s+/g, ' ').trim();

      if (type === 'likes') {
        // Looks for a number sequence followed by optional 'K' or 'M' and the word "likes"
        const match = cleanCaption.match(/([\d.]+[KMB]?)\s*likes/i);
        if (match) return match[1];
      }

      if (type === 'comments') {
        // Looks for a number sequence followed by optional 'K' or 'M' and the word "comments"
        const match = cleanCaption.match(/([\d.]+[KMB]?)\s*comments/i);
        if (match) return match[1];
      }
    } catch (err) {
      console.warn('[Parser] String extraction fallback failed:', err);
    }
    return '0';
  };

  const parsedLikes = getParsedMetric('likes', likes);
  const parsedComments = getParsedMetric('comments', comments);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      // Fallback formatting if the incoming date format is irregular
      if (isNaN(d.getTime())) return dateStr;

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

  const renderCaption = (text) => {
    if (!text) return <em className="text-slate-500 text-xs font-medium">No caption provided.</em>;

    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#')) {
        return <span key={i} className="text-pink-400 font-semibold hover:text-pink-300 transition-colors cursor-pointer">{word}</span>;
      }
      if (word.startsWith('@')) {
        return <span key={i} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors cursor-pointer">{word}</span>;
      }
      return word;
    });
  };

  const getSourceStyle = (source) => {
    if (source?.includes('Intercept')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (source?.includes('Embed')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (source?.includes('DOM')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="border border-slate-800 bg-slate-950/40 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full shadow-xl"
    >
      <div>
        {/* Profile Header Block */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] flex items-center justify-center shadow-md">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-slate-200">
                <User size={20} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 tracking-tight leading-tight">@{username || 'creator'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{platform || 'Instagram'} Creator</p>
            </div>
          </div>

          <div className={`px-3 py-1 text-[11px] border rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${getSourceStyle(extractionMethod)}`}>
            <ShieldCheck size={13} />
            <span>{extractionMethod || 'Playwright Engine'}</span>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 group hover:border-pink-500/20 transition-colors">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
              <Heart size={18} fill="rgba(244, 63, 94, 0.1)" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Likes</span>
              <strong className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">{parsedLikes}</strong>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 group hover:border-purple-500/20 transition-colors">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <MessageSquare size={18} fill="rgba(168, 85, 247, 0.1)" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Comments</span>
              <strong className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">{parsedComments}</strong>
            </div>
          </div>
        </div>

        {/* Raw Extracted Caption Area */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            Original Extracted Caption
          </h4>
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto font-medium shadow-inner scrollbar-thin">
            {renderCaption(caption)}
          </div>
        </div>
      </div>

      {/* Embedded Metadata Footnotes */}
      <div className="border-t border-slate-900 pt-4 mt-2 flex flex-col gap-3 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2 bg-slate-900/20 px-3 py-2 rounded-lg border border-slate-900/40">
          <Music size={14} className="text-pink-400 shrink-0" />
          <span className="truncate text-slate-300"><strong className="text-slate-400 font-semibold">Audio track:</strong> {audioName || 'Original Audio'}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/20 px-3 py-2 rounded-lg border border-slate-900/40">
          <Clock size={14} className="text-purple-400 shrink-0" />
          <span className="text-slate-300"><strong className="text-slate-400 font-semibold">Timestamp:</strong> {formatDate(timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}