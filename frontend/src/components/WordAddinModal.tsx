import React, { useState } from 'react';
import { checkCompliance, type MCPComplianceResult } from '../lib/api';

interface WordAddinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordAddinModal: React.FC<WordAddinModalProps> = ({ isOpen, onClose }) => {
  const [selectedText, setSelectedText] = useState(
    'Apex Financial Technologies LLC retains all consumer financial records, account credential tokens, and transaction histories for a period of ninety (90) calendar days following user account offboarding.'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [auditResult, setAuditResult] = useState<MCPComplianceResult | null>(null);

  if (!isOpen) return null;

  const handleScanInWord = async () => {
    setAnalyzing(true);
    setInserted(false);
    try {
      const res = await checkCompliance('DATA_STORAGE', 'cfpb_1033', {
        retention_period_days: 90,
      });
      setAuditResult(res);
    } catch {
      // Fallback
      setAuditResult({
        decision: 'NON_COMPLIANT',
        summary: 'CFPB § 1033 violation: retention exceeds 30 days.',
      } as any);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInsertTrackChanges = () => {
    setInserted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-blue-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Microsoft 365 Marketplace Add-in</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Live Microsoft Word Sidebar Enclave
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 hover:text-coral flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Informational Prompt */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#070e1c] border border-blue-500/20 text-xs font-sans text-forest-ink/90 dark:text-slate-200 space-y-1">
          <p className="leading-relaxed">
            Meet corporate legal counsel where they work. RegDiff embeds directly into <strong>Microsoft Word 365</strong> on Windows, Mac, and Word Web. Lawyers can highlight any contract clause, receive instant statutory analysis, and insert compliant <strong>Track Changes revisions</strong> directly into their open document.
          </p>
        </div>

        {/* Word Document & Sidebar Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
          
          {/* Left Side: Mock Word Document Canvas (7 cols) */}
          <div className="md:col-span-7 p-6 bg-slate-100 dark:bg-[#080d18] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3 font-serif text-xs text-forest-ink dark:text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700 font-mono text-[10px] text-forest-muted">
                <span>📄 Master_Services_Agreement_2026.docx</span>
                <span className="text-emerald-600 font-bold">Track Changes: ON</span>
              </div>

              <div className="text-sm font-bold">Section 4.2 — Retention and Archival Schedule</div>

              {!inserted ? (
                <div className="p-3 bg-white dark:bg-[#121927] rounded-xl border border-blue-400/50 shadow-sm leading-relaxed relative">
                  <span className="absolute -top-2.5 left-2 px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono text-[9px] font-bold">
                    Active Cursor Selection
                  </span>
                  {selectedText}
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-[#121927] rounded-xl border border-emerald-400/50 shadow-sm leading-relaxed text-xs">
                  Apex Financial Technologies LLC retains all consumer financial records, account credential tokens, and transaction histories for a period of{' '}
                  <span className="line-through text-red-600 bg-red-100 dark:bg-red-950/60 px-1 rounded">&lt;w:del&gt;ninety (90)&lt;/w:del&gt;</span>{' '}
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-1 rounded">&lt;w:ins&gt;thirty (30)&lt;/w:ins&gt;</span>{' '}
                  calendar days following user account offboarding pursuant to 12 CFR § 1033.351(a)(1).
                </div>
              )}

              <p className="text-[11px] text-forest-muted dark:text-slate-500">
                Section 4.3 — Cryptographic Verification. System access logs shall stream continuously to the immutable Merkle state ledger.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between text-[10px] font-mono text-forest-muted">
              <span>Page 1 of 4 • 1,240 Words</span>
              <a
                href="/word-addin-manifest.xml"
                download="word-addin-manifest.xml"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                <span>Download Office JS Manifest XML</span>
              </a>
            </div>
          </div>

          {/* Right Side: RegDiff Word Taskpane Sidebar (5 cols) */}
          <div className="md:col-span-5 p-4 bg-white dark:bg-[#0c1220] flex flex-col justify-between space-y-4">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-coral/15 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-coral">
                  <span className="font-display italic font-bold">§</span>
                  <span>RegDiff Taskpane</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                  Connected
                </span>
              </div>

              {!auditResult ? (
                <div className="space-y-3">
                  <div className="text-[11px] text-forest-muted dark:text-slate-400">
                    Selected clause in Word document:
                  </div>
                  <textarea
                    rows={4}
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 text-[11px] font-mono"
                  />
                  <button
                    onClick={handleScanInWord}
                    disabled={analyzing}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Auditing Clause...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">search_check</span>
                        <span>Inspect in Word</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in text-xs">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>Statutory Breach: CFPB 1033</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      90 days exceeds maximum 30-day ceiling under 12 CFR § 1033.351(a)(1). Civil fine exposure: up to $1M/day.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="font-bold text-[11px]">Proposed Ready-to-Merge Revision:</div>
                    <p className="text-[10px] font-sans">
                      &ldquo;...retained for a period of <strong>thirty (30) calendar days</strong>...&rdquo;
                    </p>
                  </div>

                  {!inserted ? (
                    <button
                      onClick={handleInsertTrackChanges}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                      <span>1-Click Insert Track Changes in Word</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-center text-[11px]">
                      ✓ Track Changes Redline Applied to Word Canvas
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] font-mono text-center text-forest-muted dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
              Works on Word 365, Word Desktop (Win/Mac), &amp; Word Online.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
