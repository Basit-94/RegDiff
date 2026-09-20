import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-coral/20 dark:border-slate-800/80 bg-white/90 dark:bg-[#070a12]/90 py-10 px-6 backdrop-blur-md mt-16">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-forest-muted dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-coral text-white flex items-center justify-center font-display italic font-bold text-xs shadow-neon-coral">
            §
          </div>
          <span className="font-display font-bold text-forest-ink dark:text-white text-sm">
            RegDiff Studio
          </span>
          <span className="text-forest-muted dark:text-slate-400">
            — Direction 3: Obsidian Radiant Coral &amp; Kinetic Studio
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-semibold">
          <span className="text-forest-muted dark:text-slate-300">
            Strict Zero-Retention RAM Enclaves
          </span>
          <a className="hover:text-coral dark:hover:text-coral-accent transition-colors" href="#tracked-laws">
            Gazette Index
          </a>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            SOC2 Type II &amp; SHA-256 Verified
          </span>
          <span className="text-forest-muted/80 dark:text-slate-500">
            © 2026 RegDiff Systems. Made with warmth &amp; precision.
          </span>
        </div>
      </div>
    </footer>
  );
};
