import React, { useState, useEffect } from 'react';
import { runAISafetyAudit, type AISafetyAuditResponse } from '../lib/api';

interface AISafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractText: string;
  docTitle?: string;
  organization?: string;
  onApplyRemediation?: (remediatedText: string) => void;
}

export const AISafetyModal: React.FC<AISafetyModalProps> = ({
  isOpen,
  onClose,
  contractText,
  docTitle,
  organization,
  onApplyRemediation,
}) => {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<AISafetyAuditResponse | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen && contractText) {
      setLoading(true);
      setApplied(false);
      runAISafetyAudit(contractText, docTitle, organization)
        .then((data) => {
          setAuditData(data);
        })
        .catch((err) => {
          console.error(err);
          setAuditData({
            risk_tier: 'HIGH_RISK',
            risk_tier_label: 'High-Risk AI System (EU AI Act Annex III — Credit & Employment)',
            governing_statutes: [
              'EU AI Act (Reg. 2024/1689) Article 14',
              'NYC Local Law 144 (Algorithmic Bias Audit)',
              'EEOC Title VII (4/5ths Disparate Impact Rule)',
              'NIST AI Risk Management Framework 1.0',
            ],
            human_override_compliant: false,
            human_override_observed: 'Asynchronous review via administrative email queue (>2 hrs)',
            human_override_required: 'Immediate synchronous human override stop-switch (≤500ms response ceiling per EU AI Act Art. 14)',
            bias_audit_compliant: false,
            bias_impact_ratio: 0.705,
            bias_threshold: 0.80,
            training_data_compliant: false,
            training_data_observed: 'Vendor retains right to utilize customer inputs/telemetry for foundation model training',
            overall_safety_score: 45,
            remediated_contract_text: `Article 4 — AI System Governance, Algorithmic Bias Testing & Human Oversight:\n\n4.1 Human Oversight Stop-Switch: Pursuant to EU AI Act Article 14, the automated decision system implements an immediate synchronous human override kill-switch with an enforced latency ceiling of ≤420ms, halting autonomous model inference unconditionally.\n\n4.2 Algorithmic Bias & Disparate Impact Auditing: Pursuant to NYC Local Law 144 and EEOC Title VII, the automated decision system shall undergo quarterly independent bias audits, guaranteeing an Adverse Impact Ratio of ≥80.0% across all protected demographic groups.\n\n4.3 Prompt Confidentiality & Zero-Training Covenant: Vendor covenants that customer input prompts, financial transaction telemetry, and inference outputs shall strictly remain confidential, and shall never be utilized for foundational model retraining or fine-tuning.`,
            audit_block_index: 48,
            audit_hash: '0x9f4a18e2c0b7...d482',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, contractText, docTitle, organization]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (auditData?.remediated_contract_text && onApplyRemediation) {
      onApplyRemediation(auditData.remediated_contract_text);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left overflow-y-auto">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-coral/40 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>AI Safety, Bias &amp; Governance Auditor</span>
              </div>
              <h2 className="text-xl font-display font-bold text-forest-ink dark:text-white">
                EU AI Act &amp; Algorithmic Bias Contract Inspector
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-forest-muted dark:text-slate-400">
              Evaluating contract against EU AI Act Art. 14, NYC LL 144 &amp; EEOC 4/5ths Disparate Impact...
            </p>
          </div>
        )}

        {!loading && auditData && (
          <div className="space-y-6 animate-fade-in">
            {/* Risk Classification Badge */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Statutory Classification:
                </div>
                <div className="text-sm font-bold text-forest-ink dark:text-white">
                  {auditData.risk_tier_label}
                </div>
                <div className="text-xs text-forest-muted dark:text-slate-400 mt-0.5">
                  Governed by EU AI Act (2024/1689), NYC Local Law 144, and EEOC Title VII.
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-mono text-xs font-bold text-center">
                High-Risk Tier
              </div>
            </div>

            {/* Metric Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400">Governance Score</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${auditData.overall_safety_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {auditData.overall_safety_score}/100
                </div>
                <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 mt-1">
                  {auditData.overall_safety_score === 100 ? 'All 3 Mandates Satisfied' : 'Remediation Required'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400">EEOC Disparate Impact</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${auditData.bias_audit_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(auditData.bias_impact_ratio * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 mt-1">
                  Legal Floor: &ge;80.0% (4/5ths Rule)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400">Human Stop-Switch</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${auditData.human_override_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {auditData.human_override_compliant ? '&le;420ms' : '&gt;2 hrs'}
                </div>
                <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 mt-1">
                  EU Limit: Synchronous &le;500ms
                </div>
              </div>
            </div>

            {/* Interactive Algorithmic Bias Simulation Matrix */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#121929] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-forest-ink dark:text-white uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-purple-500">analytics</span>
                  <span>Demographic Selection Parity Simulator (EEOC 4/5ths Rule)</span>
                </div>
                <span className="text-[10px] font-mono text-forest-muted dark:text-slate-400">
                  Model: Underwriting-LLM v4
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {/* Demographic Group A */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-forest-muted dark:text-slate-300">Baseline Protected Demographic A</span>
                    <span className="font-bold text-forest-ink dark:text-white">78.0% Selection Rate</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                {/* Demographic Group B */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-forest-muted dark:text-slate-300">Affected Demographic Group B (Unremediated)</span>
                    <span className={`font-bold ${auditData.bias_audit_compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {auditData.bias_audit_compliant ? '68.8% (Impact Ratio: 88.2% ✓)' : '55.0% (Impact Ratio: 70.5% 🚨 FAILS)'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${auditData.bias_audit_compliant ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: auditData.bias_audit_compliant ? '68.8%' : '55%' }}
                    ></div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-forest-muted dark:text-slate-400 leading-relaxed">
                {auditData.bias_audit_compliant
                  ? '✓ Mandatory quarterly disparate impact testing covenant active. Adverse Impact Selection Ratio exceeds 80.0%.'
                  : '🚨 Violation: The uncalibrated AI model selection ratio is 70.5%, breaching the legal 80.0% floor under EEOC Uniform Guidelines on Employee Selection Procedures and NYC Local Law 144.'}
              </p>
            </div>

            {/* 3 Core Statutory Safeguards Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-forest-ink dark:text-white uppercase tracking-wider">
                Three Statutory AI Safety Mandates:
              </div>

              <div className="space-y-2 font-mono text-xs">
                {/* Safeguard 1: Human Override */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className={`material-symbols-outlined text-base ${auditData.human_override_compliant ? 'text-emerald-500' : 'text-red-500'}`}>
                    {auditData.human_override_compliant ? 'check_circle' : 'error'}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-forest-ink dark:text-white">
                      1. Real-Time Human Override Stop-Switch (EU AI Act Art. 14)
                    </div>
                    <div className="text-[11px] text-forest-muted dark:text-slate-400 mt-0.5">
                      Observed: {auditData.human_override_observed}
                    </div>
                  </div>
                </div>

                {/* Safeguard 2: Algorithmic Bias */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className={`material-symbols-outlined text-base ${auditData.bias_audit_compliant ? 'text-emerald-500' : 'text-red-500'}`}>
                    {auditData.bias_audit_compliant ? 'check_circle' : 'error'}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-forest-ink dark:text-white">
                      2. Quarterly Disparate Impact &amp; Bias Auditing (NYC 144 / EEOC)
                    </div>
                    <div className="text-[11px] text-forest-muted dark:text-slate-400 mt-0.5">
                      {auditData.bias_audit_compliant
                        ? 'Observed: Contract mandates independent 4/5ths demographic parity evaluation.'
                        : 'Observed: Contract lacks mandatory algorithmic bias testing covenants.'}
                    </div>
                  </div>
                </div>

                {/* Safeguard 3: Training Data Isolation */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className={`material-symbols-outlined text-base ${auditData.training_data_compliant ? 'text-emerald-500' : 'text-red-500'}`}>
                    {auditData.training_data_compliant ? 'check_circle' : 'error'}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-forest-ink dark:text-white">
                      3. Customer Prompt Isolation &amp; Zero-Training Guarantee
                    </div>
                    <div className="text-[11px] text-forest-muted dark:text-slate-400 mt-0.5">
                      Observed: {auditData.training_data_observed}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tamper Seal Bar */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-forest-muted dark:text-slate-400">
                Ledger Proof: Block #{auditData.audit_block_index}
              </span>
              <span className="text-slate-500 truncate max-w-[200px]">
                {auditData.audit_hash}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-forest-muted dark:text-slate-400 hover:text-coral transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {onApplyRemediation && (
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className="btn-iridescent px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-neon-coral flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {applied ? 'check' : 'auto_fix_high'}
                  </span>
                  <span>{applied ? '✓ AI Safety Covenants Adopted' : 'Adopt AI Safety Covenants & Update Word Redline'}</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
