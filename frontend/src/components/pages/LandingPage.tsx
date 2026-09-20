import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDemoLogin }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-24 text-center space-y-12">
      {/* Category Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-[#0e1526]/90 border border-coral/30 shadow-xs text-xs font-medium text-forest-muted dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-coral animate-ping"></span>
        <span className="font-bold text-coral dark:text-coral-accent">Automated Regulatory Compliance</span>
      </div>

      {/* Main Headline */}
      <div className="space-y-5">
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-forest-ink dark:text-white leading-[1.08] tracking-tight font-medium">
          When the laws shift, your policies{' '}
          <span className="text-dance-shimmer italic font-normal underline decoration-coral/50 decoration-wavy decoration-2">
            stay compliant.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-forest-muted dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
          Upload your company handbook or software rules. We automatically catch legal violations and give you ready-to-merge fixes in milliseconds.
        </p>
      </div>

      {/* Clear Primary CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          onClick={onStart}
          className="btn-iridescent px-8 py-4 rounded-full text-white text-base font-bold shadow-neon-coral hover:shadow-glow-coral transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 cursor-pointer"
        >
          <span>Start Free Scan</span>
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>

        <button
          onClick={onDemoLogin}
          className="px-7 py-4 rounded-full bg-white dark:bg-[#101728] hover:bg-apricot-50 dark:hover:bg-[#162038] text-forest-ink dark:text-slate-100 border border-coral/30 hover:border-coral font-bold text-sm transition-all shadow-xs flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
          title="Try immediately as Lead Counsel Alex Vance"
        >
          <span className="material-symbols-outlined text-coral dark:text-coral-accent">bolt</span>
          <span>1-Click Demo (Alex Vance)</span>
        </button>
      </div>

      {/* 3 Clear Steps Card */}
      <div className="pt-10 grid sm:grid-cols-3 gap-5 text-left">
        <div className="p-6 rounded-2xl bg-white/85 dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-coral/15 text-coral flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-display font-bold text-lg text-forest-ink dark:text-white">
            Upload Policy
          </h3>
          <p className="text-xs text-forest-muted dark:text-slate-300 leading-relaxed">
            Drop your employee handbook, terms of service, or API retention policy.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/85 dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-display font-bold text-lg text-forest-ink dark:text-white">
            Detect Violations
          </h3>
          <p className="text-xs text-forest-muted dark:text-slate-300 leading-relaxed">
            Our engine checks newly updated federal laws and flags illegal clauses instantly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/85 dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-display font-bold text-lg text-forest-ink dark:text-white">
            Merge Lawyer Fix
          </h3>
          <p className="text-xs text-forest-muted dark:text-slate-300 leading-relaxed">
            Get the exact ready-to-merge wording and a tamper-proof audit receipt.
          </p>
        </div>
      </div>
    </div>
  );
};
