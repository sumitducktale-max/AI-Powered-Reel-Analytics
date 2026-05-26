import React, { useEffect, useState } from 'react';
import { Loader2, Check, RefreshCw, Layers, ShieldCheck, Terminal, Compass, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const PIPELINE_STEPS = [
  { id: 1, label: 'Launching Evasion Browser', desc: 'Starting headless stealth chromium context...', icon: Compass },
  { id: 2, label: 'Fingerprint & Stealth Evasion', desc: 'navigator.webdriver and canvas headers patched.', icon: ShieldCheck },
  { id: 3, label: 'GraphQL Network Interceptor', desc: 'Monitoring direct response stream buffers...', icon: Terminal },
  { id: 4, label: 'Embed CDN Extraction Layer', desc: 'Extracting video source from public embed frame.', icon: Layers },
  { id: 5, label: 'DOM Schema Fallback Parsing', desc: 'Traversing open-graph & JSON-LD schema data.', icon: Eye },
  { id: 6, label: 'Gemini 1.5 Vision Model', desc: 'Conducting visual scene & text classification...', icon: RefreshCw },
];

export default function Pipeline({ active }) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!active) {
      setCurrentStep(1);
      return;
    }

    // Simulate ticking through the pipeline steps dynamically to keep the user highly engaged
    const timers = [];
    
    PIPELINE_STEPS.forEach((step, index) => {
      if (index === 0) return; // step 1 is active immediately
      
      const timer = setTimeout(() => {
        setCurrentStep(step.id);
      }, index * 2800); // Progress step every 2.8s
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [active]);

  if (!active) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="glass-panel p-8 text-left max-w-2xl mx-auto mb-8 border-[hsl(var(--primary-glow))]"
    >
      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Loader2 className="animate-spin text-[hsl(var(--primary))]" size={20} />
        <span>Scraping & Intelligence Pipeline</span>
      </h3>
      <p className="text-xs text-[hsl(var(--fg-muted))] mb-8">
        Watch in real time as the browser engine evades security layers and feeds metadata to Google Gemini.
      </p>

      <div className="space-y-6">
        {PIPELINE_STEPS.map((step) => {
          const StepIcon = step.icon;
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;
          
          let stateColor = 'text-[hsl(var(--fg-muted))] opacity-40';
          let borderStyle = 'border-slate-800 bg-slate-950/20';

          if (isDone) {
            stateColor = 'text-emerald-400';
            borderStyle = 'border-emerald-500/30 bg-emerald-950/20';
          } else if (isActive) {
            stateColor = 'text-[hsl(var(--primary))]';
            borderStyle = 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-glow))]';
          }

          return (
            <div key={step.id} className="flex gap-4 items-start transition-all duration-300">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${borderStyle} ${stateColor}`}>
                {isDone ? (
                  <Check size={16} strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <StepIcon size={16} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-semibold leading-tight ${isActive ? 'text-[hsl(var(--fg-main))]' : 'text-[hsl(var(--fg-muted))]'} ${isDone ? 'line-through opacity-60' : ''}`}>
                    {step.label}
                  </h4>
                  {isActive && (
                    <span className="text-[10px] font-bold text-[hsl(var(--primary))] animate-pulse">
                      PROCESSING...
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 truncate ${isActive ? 'text-[hsl(var(--fg-muted))]' : 'text-slate-600'}`}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
