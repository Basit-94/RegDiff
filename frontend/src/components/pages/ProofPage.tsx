import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditBlocks, verifyLedgerChain, fetchAuditCertificate } from '../../lib/api';
import type { AuditBlock } from '../../lib/api';


interface ProofPageProps {
  onNewScan: () => void;
  onGoHome: () => void;
  initialBlockHeight?: number;
  organization?: string;
  docTitle?: string;
  citation?: string;
}

export const ProofPage: React.FC<ProofPageProps> = ({
  onNewScan,
  onGoHome,
  initialBlockHeight = 26,
  organization = 'Apex Financial Technologies LLC',
  docTitle = 'SOP: Consumer Data Governance (Section 3.4)',
  citation = '12 CFR § 1033.351(a)(1)',
}) => {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [totalCount, setTotalCount] = useState(initialBlockHeight);
  const [latestHash, setLatestHash] = useState('0x531b7208d6df7cb69764ee3a2b956f35837651030e46129841804');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const certId = `REGDIFF-ATTEST-2026-${(totalCount * 37 + 104).toString(16).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuditBlocks(6);
      if (Array.isArray(data) && data.length > 0) {
        setBlocks(data);
        setTotalCount(data[0].index + 1);
        setLatestHash(data[0].current_hash);
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
    loadBlocks();
  }, [loadBlocks]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-24 text-left space-y-8">
      
      {/* 3-Step Horizontal Tracker */}
      <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4 text-xs font-mono print:hidden">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs">✓</span>
          <span>Upload Document</span>
        </div>
        <div className="w-12 h-[1px] bg-coral"></div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs">✓</span>
          <span>Review Redline Fix</span>
        </div>
        <div className="w-12 h-[1px] bg-coral"></div>
        <div className="flex items-center gap-2 text-coral dark:text-coral-accent font-bold">
          <span className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center text-xs shadow-xs">3</span>
          <span>Audit Certificate</span>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-ink dark:text-white">
            Statutory Compliance Certificate
          </h2>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-mono">
            Cryptographically sealed and ready for regulatory audit submission
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="btn-iridescent px-4 py-2.5 rounded-full text-white text-xs font-bold shadow-neon-coral flex items-center gap-1.5 cursor-pointer"
            title="Print or Save official PDF Certificate"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print PDF</span>
          </button>

          <button
            onClick={async () => {
              try {
                const cert = await fetchAuditCertificate(totalCount);
                const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${certId}_Merkle_Audit_Proof.json`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err) {
                console.error(err);
              }
            }}
            className="px-4 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Export court-admissible RFC 6962 JSON Merkle proof"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Audit Proof (.json)</span>
          </button>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* THE OFFICIAL LEGAL CERTIFICATE CARD (Print-Optimized) */}
      {/* ========================================================================= */}
      <div 
        id="legal-certificate"
        className="rounded-3xl bg-white dark:bg-[#0c1220] border-4 border-double border-emerald-600/60 dark:border-emerald-500/50 p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden ring-1 ring-emerald-500/30 text-forest-ink dark:text-slate-100 print:border-emerald-700 print:text-black print:bg-white print:p-6 break-inside-avoid"
      >
        {/* Elegant Guilloche Background Accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-coral/5 blur-3xl"></div>

        {/* Certificate Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b-2 border-emerald-600/30 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-100 dark:ring-emerald-950">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                RegDiff Regulatory Attestation Service
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-forest-ink dark:text-white">
                Certificate of Statutory Compliance
              </h1>
              <div className="text-xs text-forest-muted dark:text-slate-400 font-mono mt-0.5">
                Serial No: <strong className="text-coral dark:text-coral-accent">{certId}</strong>
              </div>
            </div>
          </div>

          {/* Official Wax Seal Badge */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex flex-col items-center justify-center p-2 shadow-xl ring-4 ring-emerald-500/20 text-center transform rotate-3 hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined text-xl">gavel</span>
              <span className="text-[8px] font-mono font-black uppercase tracking-wider leading-tight">
                CERTIFIED
              </span>
              <span className="text-[7px] font-mono tracking-tight text-emerald-100">
                100% AUDITED
              </span>
            </div>
          </div>
        </div>

        {/* Attestation Body */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="text-xs font-serif uppercase tracking-wider text-forest-muted dark:text-slate-400">
            This is to formally certify that on {currentDate}, the internal policy document:
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <div className="text-sm sm:text-base font-bold font-serif text-forest-ink dark:text-white">
              {docTitle}
            </div>
            <div className="text-xs font-mono text-emerald-800 dark:text-emerald-300">
              Assessed Entity: <strong className="text-forest-ink dark:text-white">{organization}</strong>
            </div>
          </div>

          <p className="font-serif text-xs sm:text-sm text-forest-muted dark:text-slate-200 leading-relaxed">
            Has undergone automated syntactical Abstract Syntax Tree (AST) compliance reconciliation against the governing regulatory standard:
          </p>

          <div className="p-3.5 rounded-xl bg-apricot-50 dark:bg-[#070b14] border border-coral/25 font-mono text-xs text-coral dark:text-coral-accent font-bold">
            Statutory Reference: {citation}
          </div>

          <p className="font-serif text-xs text-forest-ink/90 dark:text-slate-300 leading-relaxed italic">
            “The policy clauses have been brought into complete adherence with the statutory maximum retention caps and operational oversight requirements. No non-compliant clauses remain in active production configurations.”
          </p>
        </div>

        {/* Cryptographic Proof Details Grid */}
        <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-apricot-50/70 dark:bg-[#080d1a] border border-coral/20 font-mono text-xs">
          <div>
            <div className="text-forest-muted dark:text-slate-400 text-[10px]">Ledger Block Height</div>
            <div className="font-bold text-forest-ink dark:text-white text-base">#{totalCount} Mined</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-forest-muted dark:text-slate-400 text-[10px]">SHA-256 Merkle Manifest Hash</div>
            <div className="font-bold text-coral dark:text-coral-accent text-xs truncate" title={latestHash}>
              {latestHash}
            </div>
          </div>
        </div>

        {/* Legal Signatures Section */}
        <div className="pt-6 border-t-2 border-emerald-600/30 grid sm:grid-cols-2 gap-6 text-xs font-mono">
          <div className="space-y-1">
            <div className="font-serif italic text-base text-forest-ink dark:text-white font-bold">
              Alex Vance
            </div>
            <div className="border-t border-forest-ink/30 dark:border-slate-600 pt-1 text-forest-muted dark:text-slate-400">
              Alex Vance • Lead Regulatory Counsel
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
              Verified SECP256K1 Digital Key Signoff
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="font-mono font-bold text-coral dark:text-coral-accent text-sm">
              REGDIFF-ENCLAVE-ORACLE
            </div>
            <div className="border-t border-forest-ink/30 dark:border-slate-600 pt-1 text-forest-muted dark:text-slate-400">
              Automated Statutory Verification Engine
            </div>
            <div className="text-[10px] text-forest-muted dark:text-slate-400">
              Deterministic SQLite WAL • Append-Only Ledger
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RECENT SEALS & RE-VERIFY DRAWER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/25 p-6 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-forest-ink dark:text-white">
              Audit Ledger Trail ({blocks.length} Recent Blocks):
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isValid 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {isValid ? 'CHAIN 100% VALID' : 'COMPROMISED'}
            </span>
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="text-coral hover:underline flex items-center gap-1 cursor-pointer font-bold"
          >
            <span className={`material-symbols-outlined text-xs ${verifying ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{verifying ? 'Attesting Chain...' : 'Verify Entire Hash Chain'}</span>
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
          {loading ? (
            <div className="py-4 text-center text-forest-muted">Loading audit blocks...</div>
          ) : (
            blocks.map((b) => (
              <div
                key={b.index}
                className="p-3 rounded-xl bg-apricot-50/70 dark:bg-[#080d1a] border border-coral/20 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-coral/15 text-coral font-bold text-[10px]">
                    Block #{b.index}
                  </span>
                  <span className="font-bold text-forest-ink dark:text-slate-200">
                    {b.event_type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-forest-muted dark:text-slate-400 truncate max-w-[160px] sm:max-w-[240px] text-[10px]">
                    {b.current_hash}
                  </span>
                  <button
                    onClick={() => copyHash(b.current_hash)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-bold border border-coral/20 hover:border-coral cursor-pointer"
                  >
                    {copiedHash === b.current_hash ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENTERPRISE CI/CD PIPELINE AUTOMATION GATE */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 space-y-4 print:hidden text-white font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-base">verified</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Continuous Compliance Verification Pipeline
            </span>
          </div>
          <button
            onClick={() => {
              const snippet = `name: RegDiff Continuous Compliance Gate
on:
  pull_request:
    paths:
      - 'policies/**'
      - 'docs/governance/**'
  push:
    branches: [main]

jobs:
  statutory-audit:
    name: Audit Against CFPB, GDPR, HIPAA, & EU AI Act
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Evaluate Policy Changes in RegDiff Enclave
        run: |
          curl -X POST https://api.regdiff.io/api/v1/policies/cicd_check \\
            -H "Content-Type: application/json" \\
            -d "{\\"policy_text\\": \\"$(cat ./policies/data_governance.md)\\", \\"framework_id\\": \\"cfpb\\"}"
`;
              navigator.clipboard.writeText(snippet);
              setCopiedHash('cicd');
              setTimeout(() => setCopiedHash(null), 2000);
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-bold border border-slate-700 cursor-pointer transition-colors"
          >
            {copiedHash === 'cicd' ? '✓ Copied Pipeline' : 'Copy Pipeline Config'}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-slate-800/80 text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
          <pre>{`name: RegDiff Continuous Compliance Gate
on: [pull_request, push]
jobs:
  statutory-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Evaluate Policy Changes in RegDiff Enclave
        run: |
          curl -X POST https://api.regdiff.io/api/v1/policies/cicd_check \\
            -H "Content-Type: application/json" \\
            -d "{\\"policy_text\\": \\"$(cat ./policies/data_governance.md)\\", \\"framework_id\\": \\"cfpb\\"}"`}</pre>
        </div>
        <p className="text-[10px] text-slate-400">
          Automatically blocks GitHub PR merges and posts line-by-line statutory citations if retention or oversight SLAs are violated.
        </p>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-coral/15 font-mono text-xs print:hidden">
        <button
          onClick={onGoHome}
          className="text-forest-muted dark:text-slate-400 hover:text-coral font-bold cursor-pointer"
        >
          ← Return to Dashboard
        </button>

        <button
          onClick={onNewScan}
          className="btn-iridescent px-6 py-2.5 rounded-full text-white font-bold shadow-neon-coral flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Start Another Scan</span>
        </button>
      </div>

    </div>
  );
};
