import React from 'react';

interface CommitVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  saving: boolean;
  data: {
    docTitle?: string;
    organization?: string;
    sectionLabel?: string;
    citation: string;
    originalText: string;
    remediatedText: string;
    isCompliant: boolean;
    auditHash?: string;
  };
}

export const CommitVaultModal: React.FC<CommitVaultModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  saving,
  data,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border border-coral/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold">
                Continuous Governance Registry
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Commit Policy to Compliance Vault
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 hover:text-coral flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Guidance Prompt */}
        <div className="p-3.5 rounded-2xl bg-apricot-50/80 dark:bg-[#070b14] border border-coral/20 text-xs text-forest-ink dark:text-slate-200 font-sans space-y-1">
          <div className="font-bold font-mono text-coral flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Why commit to the Vault?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-forest-muted dark:text-slate-300">
            Once committed, this policy becomes part of your organization&apos;s active compliance baseline. If regulatory agencies (CFPB, FTC, EU) publish statutory amendments, RegDiff&apos;s Sentinel Radar will automatically detect retroactive breaches and notify your team.
          </p>
        </div>

        {/* Policy Metadata Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#090e1a] border border-coral/15 text-xs font-mono">
          <div>
            <span className="text-[10px] text-forest-muted dark:text-slate-400 uppercase">Document &amp; Clause</span>
            <div className="font-bold text-forest-ink dark:text-white truncate">
              {data.docTitle || 'Corporate Policy'} ({data.sectionLabel || 'Section 1.1'})
            </div>
          </div>
          <div>
            <span className="text-[10px] text-forest-muted dark:text-slate-400 uppercase">Organization Registry</span>
            <div className="font-bold text-forest-ink dark:text-white truncate">
              {data.organization || 'Apex Financial Technologies LLC'}
            </div>
          </div>
          <div className="sm:col-span-2 pt-1 border-t border-coral/10 dark:border-slate-800">
            <span className="text-[10px] text-forest-muted dark:text-slate-400 uppercase">Governing Statute Citation</span>
            <div className="font-bold text-coral dark:text-coral-accent">
              {data.citation}
            </div>
          </div>
        </div>

        {/* Before vs After Redline Snapshot */}
        <div className="space-y-2 text-xs font-mono">
          <div className="font-bold text-forest-ink dark:text-white text-[11px] uppercase tracking-wider">
            Clause Amendment Summary:
          </div>

          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-900 dark:text-red-200 space-y-1">
            <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">cancel</span>
              <span>Prior Text (Flagged Breach)</span>
            </div>
            <p className="font-serif italic text-xs leading-relaxed text-forest-ink/80 dark:text-slate-300">
              &ldquo;{data.originalText.slice(0, 200)}...&rdquo;
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>Committed Compliant Provision</span>
            </div>
            <p className="font-serif text-xs leading-relaxed text-forest-ink dark:text-slate-100 font-semibold">
              &ldquo;{data.remediatedText.slice(0, 200)}...&rdquo;
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-coral/15 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-bold text-forest-ink dark:text-slate-300 cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={saving}
            className="btn-iridescent px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-neon-coral flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-sm ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'refresh' : 'verified_user'}
            </span>
            <span>{saving ? 'Sealing into Vault...' : 'Confirm & Seal into Compliance Vault'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
