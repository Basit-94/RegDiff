import React from 'react';
import type { PageType } from './Header';

interface GuidedWorkflowBarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onStartQuickDemo?: () => void;
  milestones?: {
    hasIngested: boolean;
    hasAudited: boolean;
    hasCommitted: boolean;
    hasSentinelReviewed: boolean;
    hasAttested: boolean;
  };
}

const WORKFLOW_STEPS: Array<{
  id: PageType;
  stepNumber: number;
  label: string;
  icon: string;
  description: string;
  nextStepText: string;
  nextPage: PageType;
}> = [
  {
    id: 'upload',
    stepNumber: 1,
    label: 'Ingest Policy',
    icon: 'upload_file',
    description: 'Select a regulatory standard or load a sample non-compliant clause, then click "Audit Compliance".',
    nextStepText: 'Proceed to Audit & Redline →',
    nextPage: 'results',
  },
  {
    id: 'results',
    stepNumber: 2,
    label: 'Audit & Redline',
    icon: 'rule',
    description: 'Inspect the 3-Column Statutory Table. Adopt the compliant patch, export a Word (.docx) redline, or commit to Vault.',
    nextStepText: 'View Policy in Vault →',
    nextPage: 'vault',
  },
  {
    id: 'vault',
    stepNumber: 3,
    label: 'Policy Vault',
    icon: 'folder_open',
    description: 'Your continuous compliance repository. All stored policies are monitored against live statutory amendments.',
    nextStepText: 'Test Law Shifts in Sentinel →',
    nextPage: 'sentinel',
  },
  {
    id: 'sentinel',
    stepNumber: 4,
    label: 'Regulatory Sentinel',
    icon: 'radar',
    description: 'Live radar connected to official government feeds. Click "Simulate Legislative Shift" to test auto-detection of breaches.',
    nextStepText: 'Inspect Cryptographic Proof →',
    nextPage: 'proof',
  },
  {
    id: 'proof',
    stepNumber: 5,
    label: 'Audit Proof & Certificate',
    icon: 'verified',
    description: 'Court-admissible SHA-256 Merkle certificate verifying statutory compliance under Federal Rules of Evidence Rule 902(13).',
    nextStepText: 'Start New Policy Ingestion →',
    nextPage: 'upload',
  },
];

export const GuidedWorkflowBar: React.FC<GuidedWorkflowBarProps> = ({
  currentPage,
  onNavigate,
  onStartQuickDemo,
  milestones,
}) => {
  if (currentPage === 'landing' || currentPage === 'signin') {
    return null;
  }

  const currentStepInfo = WORKFLOW_STEPS.find((s) => s.id === currentPage) || WORKFLOW_STEPS[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-2 print:hidden animate-fade-in">
      <div className="rounded-2xl bg-white/95 dark:bg-[#0d1322]/95 border border-coral/25 dark:border-[#1f2a3f] p-3 sm:p-4 shadow-clay dark:shadow-dark-clay backdrop-blur-md space-y-3">
        
        {/* Top Header: Step Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coral/15 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-forest-ink dark:text-slate-200">
              Guided Compliance Journey (Step {currentStepInfo.stepNumber} of 5)
            </span>
          </div>

          {onStartQuickDemo && (
            <button
              onClick={onStartQuickDemo}
              className="text-[11px] font-mono font-bold text-coral hover:text-coral-accent dark:text-coral-accent flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-xs">play_circle</span>
              <span>1-Click Benchmark Demo Flow</span>
            </button>
          )}
        </div>

        {/* 5-Step Horizontal Sequence Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = step.id === currentPage;
            const isCompleted = milestones
              ? (step.id === 'upload' ? milestones.hasIngested :
                 step.id === 'results' ? milestones.hasAudited :
                 step.id === 'vault' ? milestones.hasCommitted :
                 step.id === 'sentinel' ? milestones.hasSentinelReviewed :
                 step.id === 'proof' ? milestones.hasAttested : false)
              : false;

            return (
              <button
                key={step.id}
                onClick={() => onNavigate(step.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-coral text-white border-coral shadow-xs font-bold'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-medium'
                    : 'bg-apricot-50/50 dark:bg-[#101828] text-forest-muted dark:text-slate-400 border-coral/15 hover:border-coral/40'
                }`}
                title={`Jump to Step ${step.stepNumber}: ${step.label}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-white text-coral'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-coral/20 text-forest-ink dark:text-slate-200'
                  }`}
                >
                  {isCompleted ? '✓' : step.stepNumber}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step Guidance & Directed Flow Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-start sm:items-center gap-2 text-forest-ink dark:text-slate-200">
            <span className="material-symbols-outlined text-base text-coral flex-shrink-0">
              lightbulb
            </span>
            <p className="font-sans text-[12px] leading-snug">
              <strong className="font-mono text-coral font-bold">Current Milestone:</strong>{' '}
              {currentPage === 'upload' && !milestones?.hasIngested
                ? 'Upload a document or load a regulatory sample clause below, then click "Audit vs [Framework]" or "Omni-Scan" to complete Milestone 1.'
                : currentPage === 'results' && !milestones?.hasCommitted
                ? 'Review the 3-Column Statutory Table. Click "Adopt Compliant Patch" and "Commit & Monitor in Vault" to complete Milestone 2.'
                : currentStepInfo.description}
            </p>
          </div>

          <div>
            {currentPage === 'upload' && !milestones?.hasIngested ? (
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Awaiting Policy Ingestion Below ↓</span>
              </span>
            ) : currentPage === 'results' && !milestones?.hasCommitted ? (
              <span className="px-3.5 py-1.5 rounded-full bg-coral/15 border border-coral/30 text-coral font-mono font-bold text-[11px] flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-ping"></span>
                <span>Adopt Patch &amp; Commit Below ↓</span>
              </span>
            ) : (
              <button
                onClick={() => onNavigate(currentStepInfo.nextPage)}
                className="px-4 py-1.5 rounded-full bg-forest-ink text-white dark:bg-slate-800 dark:text-white hover:bg-coral dark:hover:bg-coral font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-auto"
              >
                <span>{currentStepInfo.nextStepText}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
