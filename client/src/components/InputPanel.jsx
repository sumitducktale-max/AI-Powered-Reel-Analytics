import React, { useState } from 'react';
import { Link2, Search, Loader2, AlertCircle } from 'lucide-react';

export default function InputPanel({ onAnalyze, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (value) => {
    if (!value.trim()) {
      setError('');
      return false;
    }
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|reels|p)\/([A-Za-z0-9_-]+)/i;
    if (!instagramRegex.test(value.trim())) {
      setError('Please enter a valid Instagram Reel or Post link.');
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
      setError('Instagram Reel URL is required.');
      return;
    }
    if (validateUrl(url)) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8 mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
        <Link2 className="text-[hsl(var(--primary))]" size={24} />
        <span>Analyze Reel URL</span>
      </h2>
      <p className="text-[hsl(var(--fg-muted))] text-sm mb-6">
        Paste any public Instagram Reel or Video Post link below to extract its direct assets, author, metrics, and network metadata.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            className="glass-input pr-12 w-100"
            placeholder="https://www.instagram.com/reel/C7rZ-SjP1F2/"
            value={url}
            onChange={handleInputChange}
            disabled={loading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--fg-muted))]">
            <Search size={20} />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px]"
          disabled={loading || !!error}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Extract Reel</span>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--accent))] bg-red-950/20 border border-red-900/35 p-3 rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[hsl(var(--fg-muted))]">
        <span className="flex items-center gap-1">✅ Multi-Layer Bypass Active</span>
        <span className="flex items-center gap-1">🌐 System Browser Emulation</span>
        <span className="flex items-center gap-1">⚡ Instant Intercept Enable</span>
      </div>
    </div>
  );
}
