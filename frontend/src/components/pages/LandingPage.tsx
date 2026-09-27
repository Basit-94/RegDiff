import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onDemoLogin: () => void;
  user?: { name: string; role: string; email: string; organization?: string } | null;
  onNavigate?: (page: 'landing' | 'signin' | 'upload' | 'results' | 'proof' | 'vault' | 'sentinel' | 'verify') => void;
  onOpenAISafety?: () => void;
  onOpenConsensus?: () => void;
  onOpenConnectors?: () => void;
  onOpenCustomRules?: () => void;
  onOpenWordAddin?: () => void;
  onOpenGRC?: () => void;
  onOpenCICD?: () => void;
  onDirectScan?: (data: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onDemoLogin,
  user,
  onOpenAISafety,
  onOpenConsensus,
}) => {
  const isLoggedIn = Boolean(user);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-28 text-center space-y-16 animate-fade-in">
      
      {/* Top Banner: Real-time Sentinel Live Status & Merkle Block Height */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#0e1526]/90 border border-coral/30 shadow-xs text-forest-ink dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-coral">Sentinel Radar:</span>
          <span>FederalRegister.gov Live Surveillance Active</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#0e1526]/90 border border-coral/30 shadow-xs text-forest-ink dark:text-slate-200">
          <span className="material-symbols-outlined text-coral text-sm">verified</span>
          <span className="font-bold">FRE 902(13)</span>
          <span className="text-forest-muted dark:text-slate-400">• Merkle Ledger Certified</span>
        </div>
      </div>

      {/* Main Headline & Subtitle */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-coral/10 text-coral font-mono text-xs font-bold uppercase tracking-wider">
          <span>Continuous Regulatory Intelligence &amp; Regression Testing Enclave</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-forest-ink dark:text-white leading-[1.08] tracking-tight font-medium">
          When the laws shift, your policies{' '}
          <span className="text-dance-shimmer italic font-normal underline decoration-coral/50 decoration-wavy decoration-2">
            stay compliant.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-forest-muted dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-sans">
          RegDiff is an automated regulatory compliance engine that scans enterprise policies, flags newly amended federal statutory breaches, and generates native <strong>Microsoft Word (.docx) Track Changes</strong> and <strong>Git CI/CD Policy Gates</strong> with court-admissible Merkle proof.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={onStart}
            className="btn-iridescent px-8 py-4 rounded-full text-white text-sm sm:text-base font-bold shadow-neon-coral hover:shadow-glow-coral transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 cursor-pointer"
          >
            <span>Launch Policy Ingestion Studio</span>
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>

          {!isLoggedIn ? (
            <button
              onClick={onDemoLogin}
              className="px-6 py-4 rounded-full bg-white dark:bg-[#101728] hover:bg-apricot-50 dark:hover:bg-[#162038] text-forest-ink dark:text-slate-100 border border-coral/30 hover:border-coral font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              title="1-Click Instant Demo Login as Alex Vance (Lead Counsel)"
            >
              <span className="material-symbols-outlined text-coral">bolt</span>
              <span>1-Click Demo (Alex Vance)</span>
            </button>
          ) : (
            <>
              {onOpenAISafety && (
                <button
                  onClick={onOpenAISafety}
                  className="px-5 py-4 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                  <span>AI Safety Auditor</span>
                </button>
              )}

              {onOpenConsensus && (
                <button
                  onClick={onOpenConsensus}
                  className="px-5 py-4 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">groups</span>
                  <span>Consensus Engine</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ARCHITECTURAL COMPARISON: LEGACY VS REGDIFF */}
      <div className="pt-4 space-y-6 text-left">
        <div className="border-b border-coral/20 pb-3">
          <div className="text-xs font-mono font-bold uppercase text-coral tracking-wider">
            Transforming Legal Operations
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white">
            Legacy Manual Reviews vs. RegDiff Continuous Enclave
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
          
          {/* Legacy Manual Approach */}
          <div className="p-6 rounded-3xl bg-white/70 dark:bg-[#0c1220] border border-red-500/20 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono font-bold text-sm">
              <span className="material-symbols-outlined">cancel</span>
              <span>Legacy Manual Legal Review</span>
            </div>

            <ul className="space-y-2.5 text-xs text-forest-muted dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>3–6 Week Turnaround:</strong> Contract reviews bottleneck product launches and engineering sprints.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>$650–$1,200 / Hour:</strong> External legal counsel retainers quickly drain early-stage capital.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Silent Regulatory Drift:</strong> When CFPB or EU AI rules change overnight, existing policies breach unnoticed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span><strong>Zero CI/CD Integration:</strong> Engineers push non-compliant code to production without legal safeguards.</span>
              </li>
            </ul>
          </div>

          {/* RegDiff Continuous Enclave */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#0e1526] border border-emerald-500/30 shadow-clay dark:shadow-dark-clay space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
              <span className="material-symbols-outlined">check_circle</span>
              <span>RegDiff Continuous Compliance Enclave</span>
            </div>

            <ul className="space-y-2.5 text-xs text-forest-ink dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>&lt;20 Millisecond Verification:</strong> Deterministic AST constraints evaluate entire handbooks instantly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Native Word (.docx) Track Changes:</strong> Counsel reviews and accepts changes inside familiar Microsoft Word.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Sentinel Overnight Radar:</strong> Reverse-audits all policies whenever FederalRegister.gov publishes new rules.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>FRE 902(13) Merkle Proof:</strong> Self-authenticating cryptographic digital certificates ready for court admissibility.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* FINAL BOTTOM CALL-TO-ACTION */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-coral/15 via-coral/10 to-amber-500/10 border-2 border-coral/40 shadow-clay-lg dark:shadow-dark-clay space-y-4 text-center max-w-3xl mx-auto">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white">
          Ready to automate your regulatory compliance?
        </h3>
        <p className="text-xs sm:text-sm text-forest-muted dark:text-slate-300 max-w-lg mx-auto">
          Start ingesting your policies or experience the complete continuous compliance suite with 1-Click Demo access.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onStart}
            className="btn-iridescent px-8 py-3.5 rounded-full text-white font-bold text-sm shadow-neon-coral hover:shadow-glow-coral transition-all cursor-pointer"
          >
            Start Free Ingestion &rarr;
          </button>

          {!isLoggedIn && (
            <button
              onClick={onDemoLogin}
              className="px-6 py-3.5 rounded-full bg-white dark:bg-slate-800 text-forest-ink dark:text-white border border-coral/30 hover:border-coral font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-coral text-sm">bolt</span>
              <span>1-Click Demo Login</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
