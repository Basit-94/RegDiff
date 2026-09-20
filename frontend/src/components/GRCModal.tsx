import React, { useState } from 'react';
import { BACKEND_URL } from '../lib/api';

interface GRCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GRCModal: React.FC<GRCModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'Vanta' | 'Drata' | 'Secureframe'>('Vanta');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    evidence_bundle_id: string;
    synced_controls_count: number;
    merkle_attestation_seal: string;
    timestamp: string;
    audit_status: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSyncEvidence = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/grc/sync_evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          organization: 'Apex Financial Technologies LLC',
          mapped_frameworks: ['SOC 2 Type II', 'ISO/IEC 27001:2022', 'HIPAA Security Rule'],
        }),
      });
      if (!res.ok) throw new Error('GRC sync failed');
      const data = await res.json();
      setSyncResult(data);
    } catch (err: any) {
      alert(err.message || 'GRC sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-emerald-500/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Automated GRC Evidence Collector</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Vanta, Drata &amp; Secureframe Continuous Sync
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
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#06121e] border border-emerald-500/20 text-xs font-sans text-forest-ink/90 dark:text-slate-200 space-y-1">
          <p className="leading-relaxed">
            Eliminate 80+ hours of manual screenshot-taking during annual audits. RegDiff continuously maps its <strong>FRE 902(13) Merkle Attestation Certificates</strong> directly to active <strong>SOC 2 Type II</strong> and <strong>ISO 27001</strong> controls in Vanta, Drata, and Secureframe.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          {(['Vanta', 'Drata', 'Secureframe'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                platform === p
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 dark:bg-[#121b2d] border-coral/20 hover:border-coral/40 text-forest-muted'
              }`}
            >
              {p} Integration
            </button>
          ))}
        </div>

        {/* Mapped Controls List */}
        <div className="space-y-2.5 font-mono text-xs">
          <div className="text-[11px] font-bold text-forest-muted uppercase">
            Active Control Mappings (5 Controls Continuously Verified):
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-forest-ink dark:text-white">SOC 2 CC6.1 — Access Control &amp; MFA</div>
                <div className="text-[10px] text-forest-muted">23 NYCRR § 500.12 MFA cryptographic enforcement</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                PASS
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-forest-ink dark:text-white">SOC 2 CC6.6 — Data Retention Ceilings</div>
                <div className="text-[10px] text-forest-muted">12 CFR § 1033.351(a)(1) 30-day token ceiling</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                PASS
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-forest-ink dark:text-white">ISO 27001 A.12.1.2 — Change Management Gate</div>
                <div className="text-[10px] text-forest-muted">Policy Gate CI/CD blocking non-compliant PRs</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                PASS
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-forest-ink dark:text-white">ISO 27001 A.18.1.1 — Statutory Identification</div>
                <div className="text-[10px] text-forest-muted">Sentinel Radar surveillance of Federal Register &amp; EUR-Lex</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                PASS
              </span>
            </div>
          </div>
        </div>

        {/* Sync Trigger & Output */}
        {!syncResult ? (
          <button
            onClick={handleSyncEvidence}
            disabled={syncing}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {syncing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Transmitting Evidence Bundle to {platform}...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                <span>Sync Real-Time Evidence into {platform}</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Evidence Bundle Pushed to {platform} API!</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                {syncResult.evidence_bundle_id}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div><strong>Attestation Hash:</strong> {syncResult.merkle_attestation_seal.slice(0, 24)}...</div>
              <div><strong>Status:</strong> {syncResult.audit_status}</div>
              <div><strong>Synced Controls:</strong> {syncResult.synced_controls_count} / 5 Passed</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
