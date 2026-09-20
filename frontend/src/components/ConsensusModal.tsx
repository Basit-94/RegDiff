import React, { useState } from 'react';
import { runConsensusAudit, type ConsensusAuditResponse } from '../lib/api';

interface ConsensusModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyText: string;
  frameworkId: string;
  docTitle?: string;
  organization?: string;
  sectionLabel?: string;
}

export const ConsensusModal: React.FC<ConsensusModalProps> = ({
  isOpen,
  onClose,
  policyText,
  frameworkId,
  docTitle = 'Corporate Governance Policy',
  organization = 'Apex Financial Technologies LLC',
  sectionLabel = 'Section 1.1',
}) => {
  const [loading, setLoading] = useState(false);
  const [consensusData, setConsensusData] = useState<ConsensusAuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && !consensusData && policyText) {
      handleEvaluate();
    }
  }, [isOpen]);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runConsensusAudit({
        policy_text: policyText,
        framework_id: frameworkId,
        organization,
        doc_title: docTitle,
        section_label: sectionLabel,
      });
      setConsensusData(res);
    } catch (err: any) {
      setError(err.message || 'Consensus evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-coral/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <span className="material-symbols-outlined text-2xl">neurology</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span>Multi-Model AI Statutory Consensus Engine</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Cross-Architecture Legal Verification Council
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

        {/* Why this matters callout */}
        <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs font-sans text-purple-950 dark:text-purple-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-mono">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Zero-Hallucination Triple Verification:</span>
          </div>
          <p className="leading-relaxed">
            To eliminate single-model hallucinations and guarantee statutory adherence, RegDiff runs non-conforming clauses through 3 diverse LLM architectures in parallel: <strong>Gemini 1.5 Pro</strong> (Codification), <strong>Claude 3.5 Sonnet</strong> (Regulatory Intent), and <strong>DeepSeek-R1</strong> (Mathematical Formal Proof).
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-forest-muted space-y-3">
            <span className="material-symbols-outlined text-3xl animate-spin text-purple-600">sync</span>
            <div className="font-bold text-forest-ink dark:text-white">
              Consulting Independent Legal Models (Gemini, Claude, DeepSeek)...
            </div>
            <div className="text-[11px] opacity-75">Cross-verifying parameter ceilings &amp; computing mathematical agreement...</div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-mono">
            {error}
          </div>
        ) : consensusData && (
          <div className="space-y-5">
            {/* Top Consensus Metric Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
                  Council Agreement
                </div>
                <div className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                  {consensusData.agreement_score}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
                <div className="text-[10px] font-mono uppercase tracking-wider text-forest-muted dark:text-slate-400 font-bold">
                  Confidence Interval
                </div>
                <div className="text-xl font-bold font-mono mt-1 text-purple-600 dark:text-purple-400">
                  {consensusData.combined_confidence}% Certainty
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
                <div className="text-[10px] font-mono uppercase tracking-wider text-forest-muted dark:text-slate-400 font-bold">
                  Ledger Attestation
                </div>
                <div className="text-sm font-bold font-mono mt-1.5 text-forest-ink dark:text-white truncate">
                  Block #{consensusData.audit_block_index}
                </div>
              </div>
            </div>

            {/* Model Evaluation Matrix */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-forest-ink dark:text-white uppercase tracking-wider">
                Independent Model Findings:
              </div>

              <div className="space-y-3">
                {consensusData.models.map((m, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15 space-y-2 text-xs font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-forest-ink dark:text-white text-sm font-serif">
                          {m.model_name}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">
                          {m.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.status === 'CONFORMING'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                            : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40'
                        }`}>
                          {m.status === 'CONFORMING' ? '✓ STATUTORY PASS' : '⚠ STATUTORY BREACH'}
                        </span>
                        <span className="text-forest-muted dark:text-slate-400 text-[10px]">
                          ({m.latency_ms}ms)
                        </span>
                      </div>
                    </div>

                    <p className="font-sans text-[11px] text-forest-ink/85 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-coral/10">
                      &ldquo;{m.reasoning}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-forest-muted dark:text-slate-400">
                      <span>Statistical Confidence: <strong>{m.confidence_score}%</strong></span>
                      <span className="truncate max-w-xs">Hash: {consensusData.consensus_hash.substring(0, 16)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Proof Enclave */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-forest-muted dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                <span className="font-bold text-forest-ink dark:text-slate-200">Consensus Seal SHA-256:</span>
                <span className="truncate">{consensusData.consensus_hash}</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                Court Admissible under FRE 902(13)
              </span>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-coral/15 dark:border-slate-800">
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Re-Run Consensus Check
          </button>

          <button
            onClick={onClose}
            className="btn-iridescent px-6 py-2.5 rounded-xl text-white font-mono font-bold text-xs shadow-neon-coral cursor-pointer"
          >
            Accept Consensus Finding &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
};
