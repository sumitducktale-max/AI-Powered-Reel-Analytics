// import React, { useState } from 'react';
// import axios from 'axios';
// import { AnimatePresence, motion } from 'framer-motion';
// import Header from './components/Header';
// import UrlInput from './components/UrlInput';
// import Pipeline from './components/Pipeline';
// import ReelCard from './components/ReelCard';
// import VideoPanel from './components/VideoPanel';
// import AiInsights from './components/AiInsights';
// import StatsCard from './components/StatsCard';
// import { Terminal, RefreshCw, Cpu, Layers, HelpCircle, Activity } from 'lucide-react';

// export default function App() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [lastUrl, setLastUrl] = useState('');

//   const handleAnalyze = async (url) => {
//     setLoading(true);
//     setError(null);
//     setData(null);
//     setLastUrl(url);

//     try {
//       console.log(`[Dashboard] Initiating scraping request: ${url}`);
//       // Vite proxy forwards '/api/reel/analyze' directly to backend running on port 3000
//       const response = await axios.post('/api/reel/analyze', { url });

//       if (response.data && response.data.success) {
//         setData(response.data.data);
//       } else {
//         throw new Error(response.data?.error || 'Extraction completed with an unknown issue.');
//       }
//     } catch (err) {
//       console.error('[Dashboard] Pipeline error:', err);
//       const errMsg = err.response?.data?.error || err.message || 'Scraper server failed to respond.';
//       setError(errMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen px-4 py-8 md:py-16 max-w-6xl mx-auto flex flex-col justify-between select-none">
      
//       {/* Header Branding Panel */}
//       <Header />

//       <main className="flex-1 max-w-5xl w-full mx-auto">
//         {/* URL Input Bar */}
//         <UrlInput onAnalyze={handleAnalyze} loading={loading} />

//         {/* Pipeline visualizer */}
//         <AnimatePresence>
//           {loading && <Pipeline active={loading} />}
//         </AnimatePresence>

//         {/* Error alert box */}
//         <AnimatePresence>
//           {error && (
//             <motion.div 
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.95 }}
//               className="glass-panel p-8 border-red-900/35 bg-red-950/10 text-center min-h-[260px] flex flex-col justify-center items-center mb-8"
//             >
//               <div className="p-3 bg-red-950/40 rounded-full text-[hsl(var(--accent))] mb-4 border border-red-900/30">
//                 <Terminal size={32} />
//               </div>
//               <h3 className="font-bold text-lg text-[hsl(var(--accent))] mb-2">Extraction Pipeline Blocked</h3>
//               <p className="text-xs text-[hsl(var(--fg-muted))] max-w-md leading-relaxed mb-6">
//                 The scraping pipeline returned an error: <code className="text-red-300 font-bold">{error}</code>. Verify your URL and confirm your Gemini API key is configured.
//               </p>
//               <button
//                 onClick={() => handleAnalyze(lastUrl)}
//                 className="px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-white font-semibold text-xs border border-red-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
//               >
//                 <RefreshCw size={12} className="animate-spin-hover" />
//                 <span>Retry Extraction Pipeline</span>
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Results Panels Grid */}
//         <AnimatePresence>
//           {data && !loading && !error && (
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ duration: 0.5 }}
//               className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
//             >
//               <ReelCard data={data} />
//               <VideoPanel 
//                 videoUrl={data.videoUrl} 
//                 thumbnail={data.thumbnail} 
//                 aiMode={data.aiAnalysis?.analysisMode} 
//               />
              
//               {/* Premium AI Insights Section */}
//               {data.aiAnalysis && <AiInsights analysis={data.aiAnalysis} />}

//               {/* Suggested Hashtags & Engagement stats */}
//               <StatsCard data={data} analysis={data.aiAnalysis} />
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>

//       {/* Global Footer */}
//       <footer className="border-t border-[hsl(var(--border))] pt-6 mt-12 text-center text-xs text-[hsl(var(--fg-muted))]">
//         <div className="flex justify-center items-center gap-6 flex-wrap mb-3 font-semibold">
//           <div className="flex items-center gap-1.5">
//             <Cpu size={14} className="text-[hsl(var(--primary))]" />
//             <span>Platform Backend (PORT 3000)</span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <Layers size={14} className="text-[hsl(var(--secondary))]" />
//             <span>Vite Dev Proxy Configured</span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <Activity size={14} className="text-[hsl(var(--accent))]" />
//             <span>Platform Status: Operational</span>
//           </div>
//         </div>
//         <p className="opacity-70">&copy; {new Date().getFullYear()} Instagram Reel Intelligence Platform. Portably Packaged Full-Stack Engine.</p>
//       </footer>
//     </div>
//   );
// }
import React, { useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import Pipeline from './components/Pipeline';
import ReelCard from './components/ReelCard';
import VideoPanel from './components/VideoPanel';
import AiInsights from './components/AiInsights';
import StatsCard from './components/StatsCard';
import { Terminal, RefreshCw, Cpu, Layers, Activity, Sparkles } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUrl, setLastUrl] = useState('');

  const handleAnalyze = async (url) => {
    setLoading(true);
    setError(null);
    setData(null);
    setLastUrl(url);

    try {
      console.log(`[Dashboard] Initiating scraping request: ${url}`);
      const response = await axios.post('/api/reel/analyze', { url });

      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.error || 'Extraction completed with an unknown issue.');
      }
    } catch (err) {
      console.error('[Dashboard] Pipeline error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Scraper server failed to respond.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 px-4 py-6 md:py-12 max-w-7xl mx-auto flex flex-col justify-between antialiased selection:bg-pink-500/30 selection:text-pink-200">
      
      {/* Header Branding Panel */}
      <Header />

      <main className="flex-1 w-full mx-auto mt-6">
        {/* URL Input Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <UrlInput onAnalyze={handleAnalyze} loading={loading} />
        </div>

        {/* Pipeline visualizer */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto my-12"
            >
              <Pipeline active={loading} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error alert box */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto glass-panel p-8 border border-red-500/20 bg-gradient-to-b from-red-950/20 to-red-950/5 text-center rounded-2xl shadow-xl shadow-red-950/10 flex flex-col justify-center items-center mb-12"
            >
              <div className="p-3.5 bg-red-500/10 rounded-xl text-red-400 mb-4 border border-red-500/20 shadow-inner">
                <Terminal size={28} />
              </div>
              <h3 className="font-bold text-xl text-red-200 mb-2 tracking-tight">Extraction Pipeline Blocked</h3>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
                The scraping pipeline returned an error: <code className="text-red-300 font-mono font-semibold bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/30">{error}</code>. Verify your URL and confirm your Gemini API key is configured.
              </p>
              <button
                onClick={() => handleAnalyze(lastUrl)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-900/60 hover:to-red-800/60 text-red-200 font-medium text-xs border border-red-700/30 shadow-md hover:shadow-red-900/20 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Retry Extraction Pipeline</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modernized Results Workspace Layout */}
        <AnimatePresence>
          {data && !loading && !error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* LEFT SIDE COLUMN: Media & Source Data (Takes 5 out of 12 columns) */}
              <div className="lg:col-span-5 space-y-6 flex flex-col">
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-1 shadow-2xl">
                  <VideoPanel 
                    videoUrl={data.videoUrl} 
                    thumbnail={data.thumbnail} 
                    aiMode={data.aiAnalysis?.analysisMode} 
                  />
                </div>
                <ReelCard data={data} />
              </div>

              {/* RIGHT SIDE COLUMN: Intelligence & Metrics (Takes 7 out of 12 columns) */}
              <div className="lg:col-span-7 space-y-6">
                {data.aiAnalysis && (
                  <div className="relative rounded-2xl border border-purple-500/10 bg-gradient-to-b from-purple-950/5 to-transparent shadow-xl">
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <Sparkles size={10} />
                      Gemini Vision Active
                    </div>
                    <AiInsights analysis={data.aiAnalysis} />
                  </div>
                )}
                
                <StatsCard data={data} analysis={data.aiAnalysis} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Status Footer */}
      <footer className="border-t border-slate-900/60 pt-6 mt-16 text-center text-[11px] text-slate-500 tracking-wide font-medium">
        <div className="flex justify-center items-center gap-8 flex-wrap mb-4">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
            <Cpu size={13} className="text-blue-400" />
            <span>Backend <span className="text-slate-400 font-mono">PORT 3000</span></span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
            <Layers size={13} className="text-pink-400" />
            <span>Vite Dev Proxy Active</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
            <Activity size={13} className="text-emerald-400 animate-pulse" />
            <span className="text-slate-300">System Operational</span>
          </div>
        </div>
        <p className="opacity-60">&copy; {new Date().getFullYear()} Instagram Reel Intelligence Platform. Portably Packaged Full-Stack Engine.</p>
      </footer>
    </div>
  );
}