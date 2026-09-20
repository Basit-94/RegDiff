import React from 'react';

interface BenchmarkSectionProps {
  onOpenAuth: () => void;
  onOpenManifesto: () => void;
}

export const BenchmarkSection: React.FC<BenchmarkSectionProps> = ({
  onOpenAuth,
  onOpenManifesto,
}) => {
  return (
    <section 
      className="rounded-clay-2xl bg-gradient-to-r from-apricot-100 via-white to-apricot-100 dark:from-[#121929] dark:via-[#101726] dark:to-[#1a111a] border border-coral/35 dark:border-coral/40 p-8 sm:p-12 shadow-clay-lg dark:shadow-dark-clay flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5 my-12" 
      id="benchmarks"
    >
      <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-coral/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="space-y-3 text-left max-w-xl relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/15 dark:bg-coral/20 text-coral dark:text-coral-accent text-xs font-black font-mono uppercase border border-coral/30 dark:border-coral/40">
          <span className="material-symbols-outlined text-sm">bolt</span>
          <span>Zero onboarding lead time</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-forest-ink dark:text-white">
          Ready to turn compliance into your product team's secret superpower?
        </h2>
        <p className="text-sm text-forest-muted dark:text-slate-300">
          Connect your GitHub, Notion, or internal doc repo. Receive your initial redline audit digest in under 10 minutes.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
        <button 
          className="w-full sm:w-auto px-8 py-4 rounded-full btn-iridescent text-white font-bold text-sm shadow-neon-coral transition-all text-center transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer" 
          onClick={onOpenAuth}
        >
          Schedule Studio Demo
        </button>
        <button 
          className="w-full sm:w-auto px-6 py-4 rounded-full bg-white dark:bg-slate-900 hover:bg-apricot-50 dark:hover:bg-slate-800 text-forest-ink dark:text-slate-200 border border-coral/30 dark:border-slate-700 hover:border-coral dark:hover:border-coral/40 font-bold text-sm transition-all text-center shadow-sm cursor-pointer" 
          onClick={onOpenManifesto}
        >
          Read Design Notes
        </button>
      </div>
    </section>
  );
};
