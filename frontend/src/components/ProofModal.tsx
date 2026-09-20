import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditBlocks, verifyLedgerChain } from '../lib/api';
import type { AuditBlock } from '../lib/api';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBlocks: number;
  isValid: boolean;
  onReverify?: () => void;
  isVerifying?: boolean;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  onClose,
  totalBlocks: initialTotalBlocks,
  isValid: initialIsValid,
}) => {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isValid, setIsValid] = useState(initialIsValid);
  const [totalCount, setTotalCount] = useState(initialTotalBlocks);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuditBlocks(15);
      if (Array.isArray(data) && data.length > 0) {
        setBlocks(data);
        setTotalCount(data[0].index + 1);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyLedgerChain();
      setIsValid(res.is_valid);
      setTotalCount(res.total_blocks);
      await loadBlocks();
    } catch {
      // Keep state
    } finally {
      setTimeout(() => setVerifying(false), 400);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBlocks();
      setIsValid(initialIsValid);
      setTotalCount(initialTotalBlocks);
    }
  }, [isOpen, loadBlocks, initialIsValid, initialTotalBlocks]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] rounded-3xl shadow-2xl p-6 sm:p-8 text-forest-ink dark:text-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Top green/coral bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-coral" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors text-lg cursor-pointer"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-forest-ink dark:text-white">
              Cryptographic Ledger Attestation
            </h3>
            <p className="text-xs text-forest-muted dark:text-slate-400 font-mono">
              Append-Only Tamper-Evident SHA-256 Audit Trail • SQLite WAL
            </p>
          </div>
        </div>

        {/* Proof Status Card */}
        <div className="p-4 rounded-2xl bg-apricot-50 dark:bg-[#090e18] border border-coral/20 dark:border-slate-800 mb-4 space-y-2.5 font-mono text-xs shrink-0">
          <div className="flex justify-between items-center pb-2 border-b border-coral/15 dark:border-slate-800">
            <span className="text-forest-muted dark:text-slate-400">Cryptographic Chain State</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isValid ? 'CHAIN INTEGRITY 100% INTACT' : 'TAMPER DETECTED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div>
              <div className="text-forest-muted dark:text-slate-400 text-[10px]">Total Sealed Height</div>
              <div className="font-bold text-forest-ink dark:text-white text-sm">#{totalCount} Blocks</div>
            </div>
            <div>
              <div className="text-forest-muted dark:text-slate-400 text-[10px]">Hash Algorithm</div>
              <div className="font-bold text-coral dark:text-coral-accent">SHA-256 Merkle</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-forest-muted dark:text-slate-400 text-[10px]">Enclave Status</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">Deterministic WAL</div>
            </div>
          </div>
        </div>

        {/* Scrollable Block List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4 custom-scrollbar">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-forest-muted dark:text-slate-400 px-1">
            <span>Recent Mined Blocks ({blocks.length}):</span>
            <span className="text-[10px] font-normal">Click a block to inspect payload</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-forest-muted dark:text-slate-400 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-coral">refresh</span>
              <span>Loading ledger chain from SQLite WAL...</span>
            </div>
          ) : blocks.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-forest-muted dark:text-slate-400 bg-apricot-50/50 dark:bg-slate-900/50 rounded-xl">
              No blocks retrieved. Verify connection to backend API.
            </div>
          ) : (
            blocks.map((block) => {
              const isExpanded = expandedBlock === block.index;
              const isRejected = (block.payload as any)?.verdict === 'REJECTED';
              return (
                <div
                  key={block.index}
                  className="rounded-xl border border-coral/20 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-3 text-xs font-mono transition-all hover:border-coral/50 cursor-pointer"
                  onClick={() => setExpandedBlock(isExpanded ? null : block.index)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-coral/15 text-coral dark:text-coral-accent font-black text-[11px]">
                        Block #{block.index}
                      </span>
                      <span className="font-bold text-forest-ink dark:text-slate-200">
                        {block.event_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isRejected ? (
                        <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/30">
                          REJECTED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          APPROVED
                        </span>
                      )}
                      <span className="text-[10px] text-forest-muted dark:text-slate-400 hidden sm:inline">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Hash row with copy */}
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-apricot-50 dark:bg-[#070b14] p-1.5 rounded-lg border border-coral/15 dark:border-slate-800/80">
                    <span className="text-forest-muted dark:text-slate-400 truncate max-w-[280px] sm:max-w-[400px]">
                      Hash: <span className="text-coral dark:text-coral-accent font-bold">{block.current_hash}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyHash(block.current_hash);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-forest-ink dark:text-slate-200 hover:text-coral font-bold text-[10px] border border-coral/20 hover:border-coral transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      {copiedHash === block.current_hash ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-coral/15 dark:border-slate-800 text-[11px] space-y-1.5 text-forest-muted dark:text-slate-300">
                      <div><strong className="text-forest-ink dark:text-white">Actor:</strong> {block.actor}</div>
                      <div><strong className="text-forest-ink dark:text-white">Previous Hash:</strong> <span className="break-all text-[10px]">{block.previous_hash}</span></div>
                      <div>
                        <strong className="text-forest-ink dark:text-white">Payload Parameters:</strong>
                        <pre className="mt-1 p-2 rounded bg-apricot-100/60 dark:bg-[#050810] text-[10px] overflow-x-auto text-forest-ink dark:text-emerald-400">
                          {JSON.stringify(block.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-coral/15 dark:border-slate-800 shrink-0">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex-1 py-2.5 px-4 rounded-xl bg-apricot-100/80 dark:bg-[#162035] hover:bg-apricot-200 dark:hover:bg-[#1d2b45] text-forest-ink dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-coral/30 dark:border-slate-700 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm text-coral ${verifying ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{verifying ? 'Verifying Merkle Hash Chain...' : 'Verify Entire Hash Chain'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-coral-vivid to-coral-tangerine hover:from-coral hover:to-coral-hover text-white text-xs font-bold shadow-neon-coral transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
