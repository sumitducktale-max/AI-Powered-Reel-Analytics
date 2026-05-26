import React from 'react';
import { Sparkles, Cpu, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-8 relative"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold mb-4 text-[hsl(var(--fg-muted))] select-none">
        <Sparkles className="text-[hsl(var(--accent))] animate-pulse" size={12} />
        <span>REEL INTELLIGENCE PLATFORM v2.0</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
        <span className="text-emerald-400 font-medium tracking-wide">SYSTEM ONLINE</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3">
        <span className="text-gradient">AI-Powered </span>
        <span className="text-gradient-purple">Reel Analytics</span>
      </h1>
      
      <p className="text-[hsl(var(--fg-muted))] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
        Conduct high-precision multi-stage scraping, embed asset extraction, and advanced Gemini-driven multimodal visual intelligence reports.
      </p>
    </motion.header>
  );
}
