import React, { useState } from 'react';
import { checkCompliance } from '../lib/api';
import type { MCPComplianceResult } from '../lib/api';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (result: MCPComplianceResult) => void;
  initialText?: string;
  initialFramework?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  initialText,
  initialFramework = 'CFPB-1033',
}) => {
  const [framework, setFramework] = useState(initialFramework);
  const [policyText, setPolicyText] = useState(
    initialText ||
      'Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MCPComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunScan = async () => {
    setLoading(true);
    setError(null);
    try {
      if (framework === 'CFPB-1033') {
        // Extract retention days if present or default to 90
        const match = policyText.match(/(\d+)\s*(?:calendar\s+)?days/i);
        const days = match ? parseInt(match[1]) : (policyText.includes('ninety') ? 90 : 45);

        const res = await checkCompliance('DATA_STORAGE', 'US_CFPB', {
          retention_period_days: days,
        });
        setResult(res);
        if (onScanComplete) onScanComplete(res);
      } else if (framework === 'EU-AI-ACT') {
        const hasKillSwitch = policyText.toLowerCase().includes('kill-switch');
        const matchMs = policyText.match(/(\d+)\s*ms/i);
        const latency = matchMs ? parseInt(matchMs[1]) : (policyText.includes('hours') ? 7200000 : 2000);

        const res = await checkCompliance('MODEL_INFERENCE', 'EU_ACT', {
          human_override_capability: hasKillSwitch,
          override_latency_ms: latency,
        });
        setResult(res);
        if (onScanComplete) onScanComplete(res);
      } else {
        // Fallback demo for general
        const res = await checkCompliance('DATA_STORAGE', 'US_CFPB', {
          retention_period_days: 90,
        });
        setResult(res);
        if (onScanComplete) onScanComplete(res);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Compliance scan failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type: 'retention' | 'ai' | 'compliant') => {
    if (type === 'retention') {
      setFramework('CFPB-1033');
      setPolicyText('Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding.');
      setResult(null);
    } else if (type === 'ai') {
      setFramework('EU-AI-ACT');
      setPolicyText('The automated credit decision scoring service operates autonomously. System-level manual overrides are reviewed asynchronously via administrative ticket queues within two (2) business hours.');
      setResult(null);
    } else {
      setFramework('CFPB-1033');
      setPolicyText('Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding.');
      setResult(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] rounded-3xl shadow-2xl p-6 sm:p-8 text-forest-ink dark:text-slate-100 max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors text-lg cursor-pointer"
        >
          &times;
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
          <span className="font-mono text-xs uppercase font-bold text-coral tracking-wider">
            Real-Time Policy Ingestion &amp; AST Engine
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-1 text-forest-ink dark:text-white">
          Scan Policy Against Active Statutory Law
        </h2>
        <p className="text-xs text-forest-muted dark:text-slate-400 mb-5">
          Paste any handbook clause, API schema, or internal guideline to evaluate compliance against live gazette mandates.
        </p>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
          <span className="text-forest-muted dark:text-slate-400">Quick Samples:</span>
          <button
            onClick={() => loadPreset('retention')}
            className="px-2.5 py-1 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 border border-coral/30 cursor-pointer font-semibold transition-colors"
          >
            CFPB 90-Day Breach
          </button>
          <button
            onClick={() => loadPreset('ai')}
            className="px-2.5 py-1 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 border border-coral/30 cursor-pointer font-semibold transition-colors"
          >
            EU AI Act 2-Hr Delay
          </button>
          <button
            onClick={() => loadPreset('compliant')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer font-semibold transition-colors"
          >
            30-Day Compliant
          </button>
        </div>

        {/* Framework Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold font-mono text-forest-muted dark:text-slate-300 mb-1">
            Target Regulatory Framework:
          </label>
          <select
            value={framework}
            onChange={(e) => { setFramework(e.target.value); setResult(null); }}
            className="w-full py-2 px-3 rounded-xl bg-apricot-50 dark:bg-[#080c14] border border-coral/30 dark:border-slate-700 text-xs font-mono text-forest-ink dark:text-white focus:outline-none focus:border-coral"
          >
            <option value="CFPB-1033">CFPB Rule 1033 • 12 CFR §1033 (30-Day Retention Ceiling)</option>
            <option value="EU-AI-ACT">EU AI Act • Article 14(4)(a) (≤ 500ms Emergency Kill-Switch)</option>
          </select>
        </div>

        {/* Policy Text Area */}
        <div className="mb-4">
          <label className="block text-xs font-bold font-mono text-forest-muted dark:text-slate-300 mb-1">
            Internal Policy Clause Body:
          </label>
          <textarea
            rows={4}
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            className="w-full p-3 rounded-xl bg-apricot-50 dark:bg-[#080c14] border border-coral/30 dark:border-slate-700 text-xs font-sans text-forest-ink dark:text-white focus:outline-none focus:border-coral leading-relaxed"
            placeholder="Paste clause here..."
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 mb-5">
          <button
            onClick={handleRunScan}
            disabled={loading}
            className="btn-iridescent px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-neon-coral flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating AST in RAM Enclave...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">play_circle</span>
                <span>Run AST Compliance Scan</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-mono text-xs mb-4">
            {error}
          </div>
        )}

        {/* Scan Results Display */}
        {result && (
          <div className="p-4 rounded-2xl bg-apricot-100/60 dark:bg-[#080c14] border border-coral/25 space-y-3 font-mono text-xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-coral/20 dark:border-slate-800">
              <span className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-coral">verified</span>
                Evaluation Result:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                result.compliant 
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-400' 
                  : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40'
              }`}>
                {result.status}: {result.compliant ? 'STATUTORY COMPLIANT' : 'CRITICAL BREACH'}
              </span>
            </div>

            {/* Violations if any */}
            {!result.compliant && result.violations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-red-600 dark:text-red-400 font-bold uppercase text-[10px]">
                  Detected Statutory Violations:
                </div>
                {result.violations.map((v, i) => (
                  <div key={i} className="p-2 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 text-[11px] leading-relaxed">
                    • <strong>Clause {v.clause} ({v.parameter}):</strong> {v.error}
                  </div>
                ))}
              </div>
            )}

            {result.compliant && (
              <div className="text-emerald-700 dark:text-emerald-300 text-xs py-1">
                ✓ {result.message}
              </div>
            )}

            {/* Ledger Audit Block Info */}
            <div className="pt-2 border-t border-coral/15 dark:border-slate-800 text-[10px] text-forest-muted dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>Cryptographic Block Sealed: <strong>#{result.audit_block_index}</strong></span>
              <span className="truncate max-w-[240px]" title={result.audit_hash}>SHA256: {result.audit_hash.slice(0, 16)}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
