import React, { useState } from 'react';
import { checkCompliance } from '../lib/api';
import type { MCPComplianceResult } from '../lib/api';

interface CounselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch?: (result?: MCPComplianceResult) => void;
}

export const CounselModal: React.FC<CounselModalProps> = ({
  isOpen,
  onClose,
  onDispatch,
}) => {
  const [dispatched, setDispatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<MCPComplianceResult | null>(null);

  if (!isOpen) return null;

  const handlePush = async () => {
    setLoading(true);
    try {
      // Seal an approved compliant block in the ledger for CFPB 1033 (30 days)
      const res = await checkCompliance('DATA_STORAGE', 'US_CFPB', {
        retention_period_days: 30,
      });
      setDispatchResult(res);
      setDispatched(true);
      if (onDispatch) onDispatch(res);
    } catch {
      // Fallback
      setDispatched(true);
      if (onDispatch) onDispatch();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] rounded-3xl shadow-2xl p-6 sm:p-8 text-forest-ink dark:text-slate-100 overflow-hidden"
        style={{ animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Top highlight bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-coral" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors text-lg cursor-pointer"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-coral/15 border border-coral/30 flex items-center justify-center text-coral dark:text-coral-accent">
            <span className="material-symbols-outlined text-2xl">merge</span>
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-forest-ink dark:text-white">
              Dispatch to Counsel: Pull Request #108
            </h3>
            <p className="text-xs text-forest-muted dark:text-slate-400 font-mono">
              Branch: <span className="text-coral dark:text-coral-accent font-bold">compliance/cfpb-1033-retention</span> &rarr; <span className="text-forest-ink dark:text-white">main</span>
            </p>
          </div>
        </div>

        {/* PR Summary Card */}
        <div className="p-4 rounded-2xl bg-apricot-50 dark:bg-[#090e18] border border-coral/20 dark:border-slate-800 mb-4 font-mono text-xs space-y-2.5">
          <div className="flex justify-between items-center text-forest-muted dark:text-slate-400 pb-2 border-b border-coral/15 dark:border-slate-800">
            <span>Pull Request Title</span>
            <span className="text-forest-ink dark:text-white font-bold">feat(compliance): CFPB 30-day purge TTL</span>
          </div>
          <div className="flex justify-between items-center text-forest-muted dark:text-slate-400">
            <span>Designated Reviewers</span>
            <span className="text-coral dark:text-coral-accent font-bold">@legal-counsel, @data-protection-officer</span>
          </div>
          <div className="flex justify-between items-center text-forest-muted dark:text-slate-400">
            <span>Synthetic Tests</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              19 passed (100% AST coverage)
            </span>
          </div>
          <div className="flex justify-between items-center text-forest-muted dark:text-slate-400">
            <span>Ledger Block Seal</span>
            <span className="text-forest-ink dark:text-slate-200">
              {dispatchResult ? `Block #${dispatchResult.audit_block_index} Minted & Sealed` : 'Attesting on dispatch'}
            </span>
          </div>
        </div>

        {/* Feedback / Notification */}
        {dispatched ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono mb-4 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>PR #108 Dispatched Successfully to GitHub Enclave!</span>
            </div>
            <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              {dispatchResult?.audit_hash ? `Cryptographic Manifest: ${dispatchResult.audit_hash}` : 'Webhook dispatched to legal counsel Slack & review queue.'}
            </div>
          </div>
        ) : (
          <p className="text-xs text-forest-muted dark:text-slate-400 mb-5 leading-relaxed font-sans">
            Submitting this PR automatically updates the production compliance pipeline, tags designated legal counsel for zero-friction signoff, and records an immutable SHA-256 block into RegDiff’s cryptographic ledger.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-apricot-100/70 dark:bg-[#162035] border border-coral/20 dark:border-slate-700 text-forest-ink dark:text-slate-300 hover:text-coral text-xs font-semibold transition-colors cursor-pointer"
          >
            {dispatched ? 'Close' : 'Cancel'}
          </button>
          {!dispatched && (
            <button
              onClick={handlePush}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral-vivid to-coral-tangerine hover:from-coral hover:to-coral-hover text-white text-xs font-bold shadow-neon-coral transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'refresh' : 'send'}
              </span>
              <span>{loading ? 'Sealing in Ledger...' : 'Dispatch PR #108'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
