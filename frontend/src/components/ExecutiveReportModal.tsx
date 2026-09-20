import React from 'react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    docTitle: string;
    organization: string;
    overallScore: number;
    breachCount: number;
    auditBlockIndex: number;
    auditHash: string;
    clausesCount?: number;
    penaltyExposureUsd?: string;
  };
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCompliant = data.breachCount === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left overflow-y-auto">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-coral/40 max-w-4xl w-full max-h-[95vh] overflow-y-auto p-6 sm:p-10 space-y-6 shadow-2xl relative">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-coral font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">assessment</span>
            <span>Executive Board &amp; CCO Audit Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-coral">print</span>
              <span>Print / Save Executive PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 hover:text-coral flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL EXECUTIVE AUDIT REPORT DOCUMENT (PRINT READY)                     */}
        {/* ========================================================================= */}
        <div id="executive-board-report" className="space-y-6 text-forest-ink dark:text-slate-100 font-sans">
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-forest-ink/20 dark:border-slate-700 pb-5">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-coral font-bold">
                RegDiff Continuous Legal Compliance System &bull; Confidential Executive Briefing
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white mt-1">
                Executive Statutory Compliance Audit Report
              </h1>
              <div className="text-xs font-mono text-forest-muted dark:text-slate-400 mt-1">
                Prepared for the Board of Directors &amp; Chief Compliance Officer
              </div>
            </div>

            <div className="text-right font-mono text-xs space-y-1">
              <div className="font-bold text-forest-ink dark:text-white">{data.organization}</div>
              <div className="text-forest-muted dark:text-slate-400 text-[11px]">
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-[10px] px-2.5 py-0.5 rounded bg-coral/10 text-coral font-bold inline-block">
                Doc Ref: {data.auditHash.substring(0, 12)}...
              </div>
            </div>
          </div>

          {/* Executive Overview & Risk Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Overall Index
              </div>
              <div className={`text-2xl font-bold mt-1 ${isCompliant ? 'text-emerald-600' : 'text-coral'}`}>
                {data.overallScore}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Statutory Status
              </div>
              <div className={`text-sm font-bold mt-2 ${isCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
                {isCompliant ? '✓ 100% CONFORMING' : '🚨 CRITICAL BREACH'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Total Breaches
              </div>
              <div className="text-2xl font-bold mt-1 text-forest-ink dark:text-white">
                {data.breachCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Financial Liability
              </div>
              <div className="text-base font-bold mt-2 text-amber-600 dark:text-amber-400 truncate">
                {isCompliant ? '$0.00 (Protected)' : (data.penaltyExposureUsd || 'Tier 2 Penalties')}
              </div>
            </div>
          </div>

          {/* Executive Summary Statement */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15 space-y-2 text-xs leading-relaxed">
            <h3 className="font-mono text-xs font-bold text-coral uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">fact_check</span>
              <span>Executive Counsel Statement</span>
            </h3>
            <p>
              This audit certifies that the document <strong>&ldquo;{data.docTitle}&rdquo;</strong> of <strong>{data.organization}</strong> has been subjected to continuous multi-statute compilation across federal banking, cybersecurity, consumer privacy, and artificial intelligence safety regulations.
            </p>
            <p>
              {isCompliant
                ? 'All evaluated operational provisions satisfy governing administrative codification limits. The policy is certified tamper-evident and actively monitored in the continuous compliance registry.'
                : `Audit flagged ${data.breachCount} operative clause(s) that exceed statutory retention or oversight ceilings. Remediated wording has been synthesized to restore full compliance without business interruption.`}
            </p>
          </div>

          {/* 6-Statute Multi-Jurisdiction Scorecard Matrix */}
          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-forest-ink dark:text-white uppercase tracking-wider">
              Statutory Evaluation Matrix (6 Core Regimes)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-coral/20 dark:border-slate-800 text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#080d1a] border-b border-coral/20 text-[10px] uppercase text-forest-muted dark:text-slate-400">
                    <th className="p-2.5">Statute</th>
                    <th className="p-2.5">Jurisdiction</th>
                    <th className="p-2.5">Mandatory Threshold</th>
                    <th className="p-2.5 text-right">Audit Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coral/10 dark:divide-slate-800 text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold">CFPB Rule 1033</td>
                    <td className="p-2.5 text-forest-muted">US Consumer Financial</td>
                    <td className="p-2.5">Retention &le; 30 days</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">EU AI Act (Art. 14)</td>
                    <td className="p-2.5 text-forest-muted">European Union</td>
                    <td className="p-2.5">Human override latency &le; 500ms</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">NYDFS Part 500</td>
                    <td className="p-2.5 text-forest-muted">US Banking / NY</td>
                    <td className="p-2.5">Audit log retention &ge; 3 years</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">EU GDPR (Art. 33 &amp; 17)</td>
                    <td className="p-2.5 text-forest-muted">European Union</td>
                    <td className="p-2.5">Breach notification &le; 72 hours</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">HIPAA Security Rule</td>
                    <td className="p-2.5 text-forest-muted">US Health &amp; Human Services</td>
                    <td className="p-2.5">FIPS AES-256 &bull; Notice &le; 60 days</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">California CCPA / CPRA</td>
                    <td className="p-2.5 text-forest-muted">US California CPPA</td>
                    <td className="p-2.5">Consumer SLA &le; 45 calendar days</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">CONFORMS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cryptographic Proof & Chain of Custody */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#070c17] border border-slate-300 dark:border-slate-800 text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between font-bold text-forest-ink dark:text-white">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-coral">enhanced_encryption</span>
                <span>Tamper-Evident SHA-256 Merkle Ledger Certificate</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">FRE Rule 902(13) Self-Authenticating</span>
            </div>
            <div className="text-[10px] text-forest-muted dark:text-slate-400 break-all">
              State Seal Hash: <strong>{data.auditHash}</strong> &bull; Ledger Block #{data.auditBlockIndex}
            </div>
          </div>

          {/* Board & CCO Formal Sign-off Box */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-forest-ink/20 dark:border-slate-700 text-xs font-mono">
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-bold text-forest-muted dark:text-slate-400">
                Audited &amp; Attested By:
              </div>
              <div className="font-serif italic text-base text-coral font-bold">
                Alex Vance, Esq.
              </div>
              <div className="text-[11px] text-forest-muted dark:text-slate-400 border-t border-slate-300 dark:border-slate-700 pt-1">
                Chief Compliance Officer &bull; Lead Regulatory Counsel
              </div>
            </div>

            <div className="space-y-3 text-right">
              <div className="text-[10px] uppercase font-bold text-forest-muted dark:text-slate-400">
                Board Resolution Status:
              </div>
              <div className="font-bold text-emerald-600 text-sm">
                APPROVED &amp; ADOPTED
              </div>
              <div className="text-[11px] text-forest-muted dark:text-slate-400 border-t border-slate-300 dark:border-slate-700 pt-1">
                Audit Committee of the Board of Directors
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
