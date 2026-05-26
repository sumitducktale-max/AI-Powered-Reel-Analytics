// import React from 'react';
// import { AreaChart, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
// import { motion } from 'framer-motion';

// export default function StatsCard({ data, analysis }) {
//   if (!data) return null;

//   const hashtags = analysis?.hashtags || [];
//   const prediction = analysis?.engagementPrediction || 'medium';

//   const getPredictionStyle = (level) => {
//     switch (level?.toLowerCase()) {
//       case 'high':
//         return 'bg-emerald-950/45 text-emerald-400 border-emerald-800/40';
//       case 'medium':
//         return 'bg-amber-950/45 text-amber-400 border-amber-800/40';
//       default:
//         return 'bg-slate-900/40 text-slate-400 border-slate-800/30';
//     }
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5, delay: 0.3 }}
//       className="glass-panel p-6 md:p-8 flex flex-col justify-between h-full"
//     >
//       <div className="space-y-6">
//         <h3 className="text-lg font-bold flex items-center gap-2">
//           <AreaChart className="text-[hsl(var(--accent))]" size={20} />
//           <span>Engagement Intelligence</span>
//         </h3>

//         {/* Engagement Prediction */}
//         <div className="bg-slate-950/30 border border-[hsl(var(--border))] rounded-xl p-4 space-y-3">
//           <div className="flex items-center justify-between">
//             <span className="text-xs text-[hsl(var(--fg-muted))] font-bold uppercase tracking-wider">
//               Engagement Forecast
//             </span>
//             <div className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getPredictionStyle(prediction)}`}>
//               {prediction}
//             </div>
//           </div>
//           <p className="text-xs text-[hsl(var(--fg-muted))] leading-relaxed">
//             Based on the detected scene elements, audio, caption, and initial creators statistics, Gemini predicts a <strong>{prediction}</strong> engagement curve.
//           </p>
//         </div>

//         {/* Suggested Hashtags */}
//         <div className="space-y-2">
//           <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--fg-muted))] flex items-center gap-1">
//             <Sparkles size={14} className="text-[hsl(var(--accent))]" />
//             <span>AI Suggested Tags</span>
//           </h4>
          
//           <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
//             {hashtags.map((tag, i) => (
//               <span 
//                 key={`tag-${i}`} 
//                 className="px-2.5 py-1 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 text-[hsl(var(--secondary))] border border-white/5 hover:border-[hsl(var(--secondary-glow))] cursor-pointer transition-all shadow-sm"
//               >
//                 {tag.startsWith('#') ? tag : `#${tag}`}
//               </span>
//             ))}
//             {hashtags.length === 0 && (
//               <span className="text-xs text-[hsl(var(--fg-muted))] italic">No suggested tags available. Try pasting a caption to generate tags.</span>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="mt-6 pt-4 border-t border-[hsl(var(--border))] flex items-center gap-2 text-[10px] text-[hsl(var(--fg-muted))]">
//         <TrendingUp size={14} className="text-[hsl(var(--secondary))]" />
//         <span>Tag generation reflects current platform trend models.</span>
//       </div>
//     </motion.div>
//   );
// }
import React from 'react';
import { AreaChart, Sparkles, TrendingUp, HelpCircle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsCard({ data, analysis }) {
  if (!data) return null;

  const hashtags = analysis?.hashtags || [];
  const prediction = analysis?.engagementPrediction || 'medium';

  const getPredictionStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-950/20',
          panel: 'from-emerald-950/10 to-transparent border-emerald-900/20'
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-950/20',
          panel: 'from-amber-950/10 to-transparent border-amber-900/20'
        };
      default:
        return {
          badge: 'bg-slate-900 text-slate-400 border-slate-800',
          panel: 'from-slate-900/20 to-transparent border-slate-900'
        };
    }
  };

  const currentStyle = getPredictionStyle(prediction);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="border border-slate-800 bg-slate-950/40 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full shadow-xl"
    >
      <div className="space-y-6">
        <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/10 text-purple-400">
            <AreaChart size={16} />
          </div>
          <span>Engagement Intelligence</span>
        </h3>

        {/* Predictive Engagement Card */}
        <div className={`bg-gradient-to-b ${currentStyle.panel} border rounded-xl p-5 space-y-3 shadow-md`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Engagement Forecast
            </span>
            <div className={`px-2.5 py-0.5 text-[10px] font-extrabold border rounded-full uppercase tracking-wider shadow-sm ${currentStyle.badge}`}>
              {prediction}
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Based on the detected scene elements, audio tracks, caption analysis, and historical creator performance, Gemini predicts a <span className="text-slate-100 font-bold underline decoration-purple-500/40 decoration-2 underline-offset-2">{prediction}</span> engagement curve.
          </p>
        </div>

        {/* AI Suggested Hashtags Area */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-pink-400" />
            <span>AI Suggested Tags</span>
          </h4>
          
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
            {hashtags.map((tag, i) => (
              <motion.span 
                key={`tag-${i}`} 
                whileHover={{ y: -2, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/60 hover:bg-purple-950/30 text-purple-300 border border-slate-800 hover:border-purple-500/30 cursor-pointer transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="text-purple-500/70 font-bold">#</span>
                <span>{tag.startsWith('#') ? tag.slice(1) : tag}</span>
              </motion.span>
            ))}

            {/* Smart Empty State Block */}
            {hashtags.length === 0 && (
              <div className="w-full border border-dashed border-slate-800/80 rounded-xl p-5 text-center flex flex-col items-center justify-center bg-slate-900/5 mt-1">
                <Tag size={20} className="text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs text-slate-500 font-medium max-w-xs leading-normal">
                  No suggested tags available. Try pasting an explicit caption or running a multi-stage visual scrape to generate tags.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Insight Notification */}
      <div className="mt-8 pt-4 border-t border-slate-900/60 flex items-center gap-2 text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
        <TrendingUp size={13} className="text-pink-400 shrink-0" />
        <span>Tag parameters reflect continuous platform trend indexing.</span>
      </div>
    </motion.div>
  );
}