import React, { useState } from 'react';
import { Search, Link2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UrlInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (value) => {
    if (!value.trim()) {
      setError('');
      return false;
    }
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|reels|p)\/([A-Za-z0-9_-]+)/i;
    if (!instagramRegex.test(value.trim())) {
      setError('Invalid URL format. Provide a valid Instagram Reel or Post link.');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    validateUrl(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('An Instagram URL is required to begin extraction.');
      return;
    }
    if (validateUrl(url)) {
      onAnalyze(url.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel p-6 md:p-8 mb-8"
    >
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            className="glass-input pr-12 w-full focus:ring-2 focus:ring-purple-500/20"
            placeholder="Paste Instagram Reel URL (e.g. https://www.instagram.com/reel/C8...)"
            value={url}
            onChange={handleInputChange}
            disabled={loading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-muted))]">
            <Link2 size={18} />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-2 min-w-[160px] relative overflow-hidden"
          disabled={loading || !!error}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Analyzing Pipeline...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Analyze Intelligence</span>
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--accent))] bg-red-950/20 border border-red-900/35 p-3 rounded-lg overflow-hidden"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[hsl(var(--fg-muted))] font-medium">
        <span className="flex items-center gap-1">⚡ Instant Public Embed Extraction (Method A-D)</span>
        <span className="flex items-center gap-1">🤖 Gemini 1.5 Flash Vision Report</span>
        <span className="flex items-center gap-1">✂️ Portably Pre-packaged FFmpeg Engine</span>
      </div>
    </motion.div>
  );
}
