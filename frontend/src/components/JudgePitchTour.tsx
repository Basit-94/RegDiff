import React from 'react';
import type { PageType } from './Header';

export interface TourStep {
  step: number;
  title: string;
  page: PageType;
  speakerNote: string;
  actionText: string;
  onExecute: () => void;
}

interface JudgePitchTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onJumpToStep: (step: number) => void;
}

export const TOUR_STEPS: Array<{
  step: number;
  title: string;
  badge: string;
  page: PageType;
  pitchNote: string;
  actionLabel: string;
}> = [
  {
    step: 1,
    title: '1. Ingestion: Structural Legal AST Parsing',
    badge: 'Step 1 of 5',
    page: 'upload',
    pitchNote: 'Enterprise legal documents are ingested (PDF/DOCX/Text). RegDiff uses deterministic AST parameter parsing to extract operative retention and oversight thresholds.',
    actionLabel: 'Audit Against CFPB Rule 1033 →',
  },
  {
    step: 2,
    title: '2. Audit Studio: Multi-Model AI Consensus & Word Redline',
    badge: 'Step 2 of 5',
    page: 'results',
    pitchNote: 'The 3-column table pinpoints exact statutory violations, checks 3/3 AI Model Consensus (Gemini + Claude + DeepSeek), and drafts a native Microsoft Word (.docx) redline with Track Changes.',
    actionLabel: 'Adopt Patch & Commit to Vault →',
  },
  {
    step: 3,
    title: '3. Policy Vault: Continuous Compliance Repository',
    badge: 'Step 3 of 5',
    page: 'vault',
    pitchNote: 'Policies are persistently indexed with SHA-256 state hashes. Built-in search, department scoping ("What applies to me?"), and connectors keep corporate SOPs monitored continuously.',
    actionLabel: 'Simulate Law Change in Sentinel →',
  },
  {
    step: 4,
    title: '4. Sentinel Radar: Live Regulatory Surveillance',
    badge: 'Step 4 of 5',
    page: 'sentinel',
    pitchNote: 'Connected directly to FederalRegister.gov. Watch how a sudden statutory amendment (allowable retention cut to 30 days) instantly flags existing Vault documents as CRITICAL BREACH.',
    actionLabel: 'Inspect Attestation Certificate →',
  },
  {
    step: 5,
    title: '5. Attestation & CI/CD: Court-Admissible Proof',
    badge: 'Step 5 of 5',
    page: 'proof',
    pitchNote: 'Mines an immutable block into an RFC 6962 SHA-256 Merkle chain. Generates a court-admissible certificate under FRE 902(13) and blocks non-compliant code merges in GitHub Actions.',
    actionLabel: 'Finish Pitch Demo 🎉',
  },
];

export const JudgePitchTour: React.FC<JudgePitchTourProps> = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onPrevStep,
  onJumpToStep,
}) => {
  if (!isOpen) return null;

  const stepInfo = TOUR_STEPS[currentStep - 1] || TOUR_STEPS[0];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-bounce-subtle text-left">
      <div className="rounded-3xl bg-[#090f1e]/95 text-white border-2 border-coral shadow-2xl p-5 backdrop-blur-md space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping"></span>
            <span className="text-coral font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              <span>LexHack 3-Minute Judge Evaluation Tour</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">
              {stepInfo.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Pills */}
            <div className="hidden sm:flex items-center gap-1">
              {TOUR_STEPS.map((s) => (
                <button
                  key={s.step}
                  onClick={() => onJumpToStep(s.step)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center ${
                    s.step === currentStep
                      ? 'bg-coral text-white ring-2 ring-coral/50 scale-110'
                      : s.step < currentStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  title={s.title}
                >
                  {s.step < currentStep ? '✓' : s.step}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-white/60 hover:text-white cursor-pointer text-sm font-bold"
              title="Exit Tour"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <span>{stepInfo.title}</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {stepInfo.pitchNote}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            {currentStep > 1 && (
              <button
                onClick={onPrevStep}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                &larr; Prev
              </button>
            )}

            <button
              onClick={onNextStep}
              className="btn-iridescent px-5 py-2 rounded-xl text-white font-mono font-bold text-xs shadow-neon-coral cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{stepInfo.actionLabel}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
