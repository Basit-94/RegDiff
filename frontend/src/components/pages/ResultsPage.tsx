import React, { useState, useEffect } from 'react';
import { 
  downloadRedlineDocx, 
  downloadFullDocumentDocx, 
  type MCPComplianceResult, 
  type FullDocumentAuditResponse, 
  type FullDocumentClause 
} from '../../lib/api';
import { CommitVaultModal } from '../CommitVaultModal';
import { WebhookModal } from '../WebhookModal';
import { GitHubPRModal } from '../GitHubPRModal';
import { ConsensusModal } from '../ConsensusModal';
import { ExecutiveReportModal } from '../ExecutiveReportModal';
import { AISafetyModal } from '../AISafetyModal';
import { CounterpartyModal } from '../CounterpartyModal';

interface ResultsPageProps {
  data: {
    scanResult: MCPComplianceResult;
    frameworkId: string;
    inputText: string;
    remediatedText: string;
    citation: string;
    organization?: string;
    docTitle?: string;
    sectionLabel?: string;
    fullDocumentReport?: FullDocumentAuditResponse;
  };
  onGoToProof: () => void;
  onNewScan: () => void;
  onDispatchCounsel?: () => void;
  onSaveToVault?: () => Promise<void> | void;
  onGoToVault?: () => void;
  onGoToSentinel?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  data,
  onGoToProof,
  onNewScan,
  onSaveToVault,
  onGoToVault,
  onGoToSentinel,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedToVault, setSavedToVault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [patchAdopted, setPatchAdopted] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isGitHubPRModalOpen, setIsGitHubPRModalOpen] = useState(false);
  const [isConsensusModalOpen, setIsConsensusModalOpen] = useState(false);
  const [isExecutiveReportModalOpen, setIsExecutiveReportModalOpen] = useState(false);
  const [isAISafetyModalOpen, setIsAISafetyModalOpen] = useState(false);
  const [isCounterpartyModalOpen, setIsCounterpartyModalOpen] = useState(false);
  const [customRemediatedText, setCustomRemediatedText] = useState<string | null>(null);

  const isAIContract = data.frameworkId === 'eu_ai' || 
    data.inputText.toLowerCase().includes('algorithm') || 
    data.inputText.toLowerCase().includes('inference') ||
    (data.docTitle?.toLowerCase().includes('ai') ?? false);

  // Multi-Clause Full Document State
  const hasFullDoc = !!data.fullDocumentReport && (data.fullDocumentReport.clauses?.length ?? 0) > 0;
  const [fullClauses, setFullClauses] = useState<FullDocumentClause[]>(() => {
    return data.fullDocumentReport?.clauses || [];
  });

  useEffect(() => {
    if (data.fullDocumentReport?.clauses) {
      setFullClauses(data.fullDocumentReport.clauses);
    }
  }, [data.fullDocumentReport]);

  const handleToggleClausePatch = (index: number) => {
    setFullClauses((prev) =>
      prev.map((c, idx) => {
        if (idx !== index) return c;
        const willBeAdopted = !c.is_modified;
        return {
          ...c,
          is_modified: willBeAdopted,
          compliant: willBeAdopted ? true : (data.fullDocumentReport?.clauses[idx]?.compliant ?? false),
        };
      })
    );
  };

  const handleAdoptAllClauses = () => {
    setFullClauses((prev) =>
      prev.map((c) => ({
        ...c,
        is_modified: true,
        compliant: true,
      }))
    );
    setPatchAdopted(true);
  };

  const isCompliant = data.scanResult.compliant;
  const violation = data.scanResult.violations[0];

  // Calculations for Full Document mode
  const allFullClausesCompliant = hasFullDoc 
    ? fullClauses.every((c) => c.compliant || c.is_modified)
    : (isCompliant || patchAdopted);

  const effectiveScore = hasFullDoc
    ? Math.round((fullClauses.filter(c => c.compliant || c.is_modified).length / (fullClauses.length || 1)) * 100)
    : (allFullClausesCompliant ? 100 : (isCompliant ? 100 : 35));

  const effectiveBreachCount = hasFullDoc
    ? fullClauses.filter(c => !c.compliant && !c.is_modified).length
    : (allFullClausesCompliant ? 0 : 1);

  // Resolve framework details
  const fw = data.frameworkId || 'cfpb';
  let statuteCitation = data.citation;
  let ruleThreshold = 'max_data_retention_days <= 30 calendar days';
  let discrepancyText = 'Exceeds federal statutory cap by 60 calendar days.';
  let penaltyExposure = 'CFPB Civil Money Penalties under 12 U.S.C. § 5565 (Tier 1: up to $5,000/day; Tier 2 reckless: up to $25,000/day).';
  let illegalPhraseRegex = /(ninety\s*\(90\)\s*(?:calendar\s+)?days|90\s*(?:calendar\s+)?days|90\s*days)/i;

  if (fw === 'eu_ai' || data.citation.includes('1689') || data.inputText.toLowerCase().includes('override')) {
    statuteCitation = 'EU Regulation 2024/1689 • Article 14(4)(a)';
    ruleThreshold = 'max_override_latency_ms <= 500ms (deterministic kill-switch)';
    discrepancyText = 'Observed override latency: 2 business hours (7,200,000ms). Manual review queue fails real-time intervention mandate.';
    penaltyExposure = 'EU AI Act Article 71 administrative fines up to €35,000,000 or 7% of total worldwide annual turnover.';
    illegalPhraseRegex = /(within\s+two\s*\(2\)\s*business\s+hours|two\s*\(2\)\s*business\s+hours|asynchronously)/i;
  } else if (fw === 'nydfs' || data.citation.includes('500') || data.inputText.toLowerCase().includes('audit')) {
    statuteCitation = '23 NYCRR § 500.06 & § 500.12';
    ruleThreshold = 'min_audit_log_retention_days >= 1,095 days (3 years)';
    discrepancyText = 'Observed retention: 365 days. 730 days below mandatory 3-year statutory audit floor.';
    penaltyExposure = 'NYDFS Banking Law § 44 penalties up to $1,000/day per violation and formal regulatory consent decrees.';
    illegalPhraseRegex = /(three\s*hundred\s*sixty-five\s*\(365\)\s*days|365\s*days|one\s*hundred\s*eighty\s*\(180\)\s*days|180\s*days)/i;
  } else if (fw === 'gdpr' || data.citation.includes('2016') || data.inputText.toLowerCase().includes('gdpr') || data.inputText.toLowerCase().includes('supervisory')) {
    statuteCitation = 'EU Regulation 2016/679 • Article 33(1) & Article 17';
    ruleThreshold = 'max_breach_notice_hours <= 72 hours (without undue delay)';
    discrepancyText = 'Observed breach notification window: 14 business days (336 hours). Exceeds statutory 72-hour ceiling by 264 hours.';
    penaltyExposure = 'GDPR Article 83(5) administrative fines up to €20,000,000 or 4% of total worldwide annual turnover, whichever is higher.';
    illegalPhraseRegex = /(fourteen\s*\(14\)\s*business\s*days|14\s*business\s*days|14\s*days)/i;
  } else if (fw === 'hipaa' || data.citation.includes('164') || data.inputText.toLowerCase().includes('ephi') || data.inputText.toLowerCase().includes('health')) {
    statuteCitation = '45 CFR § 164.312(a)(2)(iv) & 45 CFR § 164.404';
    ruleThreshold = 'ephi_encryption_standard == AES-256 & max_breach_notice_days <= 60 days';
    discrepancyText = 'ePHI stored unencrypted in secondary storage; breach window (90 days) violates 60-day statutory limit.';
    penaltyExposure = 'HHS OCR Civil Monetary Penalties under 42 U.S.C. § 1320d-5 (Tier 4 Willful Neglect: $50,000/violation, $2,067,813 annual cap).';
    illegalPhraseRegex = /(standard\s+unencrypted|unencrypted|ninety\s*\(90\)\s*calendar\s*days|90\s*calendar\s*days)/i;
  } else if (fw === 'ccpa' || data.citation.includes('1798') || data.inputText.toLowerCase().includes('ccpa') || data.inputText.toLowerCase().includes('opt-out')) {
    statuteCitation = 'Cal. Civ. Code § 1798.130 & § 1798.120';
    ruleThreshold = 'max_consumer_request_days <= 45 calendar days';
    discrepancyText = 'Observed fulfillment SLA: 90 calendar days. Exceeds California statutory 45-day ceiling.';
    penaltyExposure = 'California Privacy Protection Agency (CPPA) fines up to $7,500 per intentional violation under Cal. Civ. Code § 1798.155.';
    illegalPhraseRegex = /(ninety\s*\(90\)\s*calendar\s*days|90\s*calendar\s*days|90\s*days)/i;
  }

  const handleCopy = () => {
    let textToCopy = '';
    if (hasFullDoc) {
      textToCopy = fullClauses
        .map((c) => `## ${c.section_label}\n${c.is_modified ? c.remediated_text : c.original_text}`)
        .join('\n\n');
    } else {
      textToCopy = patchAdopted ? data.remediatedText : data.inputText;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDocx = async () => {
    setExportingDocx(true);
    try {
      if (hasFullDoc && fullClauses.length > 0) {
        await downloadFullDocumentDocx({
          title: data.docTitle || 'Master Corporate Policy',
          organization: data.organization || 'Apex Financial Technologies LLC',
          clauses: fullClauses.map((c) => ({
            section_label: c.section_label,
            original_text: c.original_text,
            remediated_text: c.remediated_text,
            is_modified: c.is_modified ?? false,
            compliant: c.compliant,
            citation: c.citation,
            violations: c.violations,
          })),
          audit_block_index: data.scanResult.audit_block_index || 45,
          audit_hash: data.scanResult.audit_hash || '0x531b7208d6df7cb...',
          overall_score: effectiveScore,
        });
      } else {
        await downloadRedlineDocx({
          title: data.docTitle || 'Corporate Governance Policy',
          original_text: data.inputText,
          remediated_text: data.remediatedText,
          citation: statuteCitation,
          organization: data.organization || 'Apex Financial Technologies LLC',
          section_label: data.sectionLabel || 'Section 1.1',
          audit_block_index: data.scanResult.audit_block_index || 42,
          audit_hash: data.scanResult.audit_hash || '0x531b7208d6df7cb...',
          plain_english_reason: violation?.error || discrepancyText,
          is_compliant: isCompliant || patchAdopted,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExportingDocx(false);
    }
  };

  const handleSave = async () => {
    if (onSaveToVault) {
      setSaving(true);
      try {
        await onSaveToVault();
        setSavedToVault(true);
        setIsCommitModalOpen(false);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }
  };

  // Highlight non-compliant substring for single-clause mode
  const renderHighlightedClause = (text: string) => {
    if (patchAdopted) {
      return (
        <span className="font-serif text-emerald-800 dark:text-emerald-300 leading-relaxed">
          &ldquo;{data.remediatedText}&rdquo;
        </span>
      );
    }

    if (isCompliant) {
      return (
        <span className="font-serif text-forest-ink dark:text-slate-200 leading-relaxed">
          &ldquo;{text}&rdquo;
        </span>
      );
    }

    const parts = text.split(illegalPhraseRegex);
    return (
      <span className="font-serif text-forest-ink dark:text-slate-200 leading-relaxed">
        &ldquo;
        {parts.map((part, i) => {
          if (illegalPhraseRegex.test(part)) {
            return (
              <span
                key={i}
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-red-500/15 text-red-700 dark:text-red-400 font-bold border border-red-500/30 inline-flex items-center gap-1 not-italic font-sans"
              >
                <span>{part}</span>
                <span className="material-symbols-outlined text-xs">warning</span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
        &rdquo;
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 text-left space-y-6">
      
      {/* 3-Step Legal Progress Tracker */}
      <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs">✓</span>
          <span>1. Ingest Policy</span>
        </div>
        <div className="w-12 h-[1px] bg-coral"></div>
        <div className="flex items-center gap-2 text-coral dark:text-coral-accent font-bold">
          <span className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center text-xs">2</span>
          <span>2. Statutory Audit &amp; Redline</span>
        </div>
        <div className="w-12 h-[1px] bg-coral/20"></div>
        <div className="flex items-center gap-2 text-forest-muted dark:text-slate-400">
          <span className="w-6 h-6 rounded-full bg-apricot-100 dark:bg-slate-800 text-forest-muted flex items-center justify-center text-xs">3</span>
          <span>3. Cryptographic Attestation</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-6 sm:p-8 shadow-clay-lg dark:shadow-dark-clay space-y-6">
        
        {/* Header Bar with Entity & Risk Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-coral/15 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-forest-muted dark:text-slate-400">
              {data.organization && (
                <span className="px-2.5 py-0.5 rounded-md bg-coral/10 text-coral font-bold border border-coral/20">
                  {data.organization}
                </span>
              )}
              {data.docTitle && (
                <span className="text-forest-ink/80 dark:text-slate-300 font-bold">
                  {data.docTitle} {data.sectionLabel && `(${data.sectionLabel})`}
                </span>
              )}
              {hasFullDoc && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                  Multi-Clause Full Audit ({fullClauses.length} Sections)
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-ink dark:text-white mt-1">
              Deterministic Statutory Audit Studio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border flex items-center gap-1.5 ${
              allFullClausesCompliant
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${allFullClausesCompliant ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
              <span>{allFullClausesCompliant ? 'STATUTORY COMPLIANT' : 'CRITICAL BREACH DETECTED'}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FULL DOCUMENT METRICS & HEALTH BAR (WHEN MULTI-CLAUSE REPORT PRESENT)    */}
        {/* ========================================================================= */}
        {hasFullDoc && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Document Health Score
              </div>
              <div className="text-2xl font-bold font-mono mt-1 flex items-baseline gap-2">
                <span className={effectiveScore === 100 ? 'text-emerald-600' : 'text-coral'}>
                  {effectiveScore}%
                </span>
                <span className="text-xs text-forest-muted dark:text-slate-400 font-normal">
                  ({fullClauses.filter(c => c.compliant || c.is_modified).length}/{fullClauses.length} conforming)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Breaches Detected
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-red-600 dark:text-red-400">
                {effectiveBreachCount}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Statutory Liability Risk
              </div>
              <div className="text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400 truncate">
                {effectiveBreachCount === 0 ? '$0.00' : (data.fullDocumentReport?.total_penalty_exposure_usd || '$0.00')}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-coral/15">
              <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 uppercase tracking-wider">
                Tamper-Evident Ledger Block
              </div>
              <div className="text-sm font-bold font-mono mt-1.5 text-forest-ink dark:text-slate-200 truncate">
                #{data.fullDocumentReport?.audit_block_index || 45} • {data.fullDocumentReport?.audit_hash?.substring(0, 10)}...
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AI SAFETY, BIAS DETECTION & MODEL GOVERNANCE (TRACK 2 + TRACK 3)          */}
        {/* ========================================================================= */}
        {isAIContract && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
                  <span>AI Safety &amp; Algorithmic Bias Audit Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900/60 text-[10px] text-purple-800 dark:text-purple-200">
                    EU AI Act Art. 14 • NYC 144
                  </span>
                </div>
                <div className="text-forest-muted dark:text-slate-400 font-sans text-xs mt-0.5">
                  Audits contract for &le;500ms human stop-switch, EEOC 4/5ths disparate impact testing, and zero-training prompt privacy.
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAISafetyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs whitespace-nowrap shadow-xs self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              <span>Inspect Bias &amp; Stop-Switch &rarr;</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DIRECTED ACTION GUIDANCE BOX (CLEAR STEP-BY-STEP INSTRUCTIONS)           */}
        {/* ========================================================================= */}
        {!allFullClausesCompliant && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl flex-shrink-0 animate-pulse">tips_and_updates</span>
              <div>
                <strong className="text-amber-700 dark:text-amber-300 uppercase tracking-wide">Action Step 1:</strong>
                <span className="ml-1.5 font-sans">
                  {hasFullDoc
                    ? `Detected ${effectiveBreachCount} non-conforming clauses. Click "Adopt All Patches" or remediate individual sections below.`
                    : 'Statutory violation detected. Click "Adopt Compliant Patch" below to replace the violating clause with legally compliant wording.'}
                </span>
              </div>
            </div>
            <button
              onClick={hasFullDoc ? handleAdoptAllClauses : () => setPatchAdopted(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              <span>1. {hasFullDoc ? 'Adopt All Compliant Patches' : 'Adopt Compliant Patch'} &rarr;</span>
            </button>
          </div>
        )}

        {allFullClausesCompliant && !savedToVault && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl flex-shrink-0">verified</span>
              <div>
                <strong className="text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Action Step: Policy Verified Compliant!</strong>
                <span className="ml-1.5 font-sans">
                  All evaluated clauses satisfy statutory limits. Click <strong className="underline font-bold text-coral">&quot;Commit &amp; Monitor in Vault&quot;</strong> to seal this policy and activate continuous sentinel monitoring.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCommitModalOpen(true)}
              className="btn-iridescent px-5 py-2 rounded-xl text-white font-bold flex-shrink-0 cursor-pointer shadow-neon-coral transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Commit &amp; Monitor in Vault &rarr;</span>
            </button>
          </div>
        )}

        {savedToVault && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-xl flex-shrink-0">verified</span>
              <div>
                <strong className="text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">All Steps Completed!</strong>
                <span className="ml-1.5 font-sans">
                  Policy has been sealed into your persistent Compliance Vault and is continuously monitored against regulatory amendments.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onGoToVault && (
                <button
                  onClick={onGoToVault}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
                >
                  Step 3: View in Vault &rarr;
                </button>
              )}
              {onGoToProof && (
                <button
                  onClick={onGoToProof}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors"
                >
                  Step 5: View Certificate &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MULTI-CLAUSE FULL DOCUMENT TABLE (OR SINGLE-CLAUSE 3-COLUMN TABLE)       */}
        {/* ========================================================================= */}
        {hasFullDoc ? (
          <div className="overflow-x-auto rounded-2xl border border-coral/20 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-apricot-50/80 dark:bg-[#080d1a] border-b border-coral/20 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-forest-ink dark:text-slate-300">
                  <th className="p-4 w-[25%]">Section &amp; Governing Statute</th>
                  <th className="p-4 w-[42%]">Extracted Policy Clause</th>
                  <th className="p-4 w-[33%]">Finding, Liability &amp; Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coral/10 dark:divide-slate-800 text-xs font-mono">
                {fullClauses.map((clause, idx) => {
                  const isClauseCompliant = clause.compliant || clause.is_modified;
                  return (
                    <tr key={clause.clause_id || idx} className="align-top hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      {/* Column 1: Section & Statute */}
                      <td className="p-4 space-y-2">
                        <div className="font-bold text-sm text-forest-ink dark:text-white font-serif">
                          {clause.section_label}
                        </div>
                        <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-coral/10 text-coral border border-coral/20">
                          {clause.citation || 'Governing Regulatory Statute'}
                        </div>
                        <div className="text-[10px] text-forest-muted dark:text-slate-400 font-mono">
                          Clause ID: {clause.clause_id} • Page {clause.page || 1}
                        </div>
                      </td>

                      {/* Column 2: Text */}
                      <td className="p-4 space-y-2 font-sans">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/15 text-xs leading-relaxed font-serif">
                          {clause.is_modified ? (
                            <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                              &ldquo;{clause.remediated_text}&rdquo;
                            </span>
                          ) : (
                            <span className="text-forest-ink dark:text-slate-200">
                              &ldquo;{clause.original_text}&rdquo;
                            </span>
                          )}
                        </div>
                        {clause.is_modified && (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            <span>Compliant statutory patch adopted</span>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Finding & Toggle */}
                      <td className="p-4 space-y-2.5">
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isClauseCompliant
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                        }`}>
                          <div className="font-bold flex items-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-sm">
                              {isClauseCompliant ? 'verified' : 'cancel'}
                            </span>
                            <span>{isClauseCompliant ? 'Statutory Conforming' : 'Statutory Breach'}</span>
                          </div>
                          <button
                            onClick={() => handleToggleClausePatch(idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              clause.is_modified
                                ? 'bg-slate-200 dark:bg-slate-800 text-forest-ink dark:text-slate-200 hover:bg-slate-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            }`}
                          >
                            {clause.is_modified ? 'Revert Patch' : 'Adopt Patch'}
                          </button>
                        </div>

                        {!isClauseCompliant && clause.violations && clause.violations.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-900 dark:text-amber-200 space-y-1">
                            <div className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">gavel</span>
                              <span>Statutory Exposure</span>
                            </div>
                            <p className="font-sans leading-relaxed">
                              {clause.penalty_exposure || clause.violations[0]?.error}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-coral/20 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-apricot-50/80 dark:bg-[#080d1a] border-b border-coral/20 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-forest-ink dark:text-slate-300">
                  <th className="p-4 w-[28%]">1. Governing Statute &amp; Citation</th>
                  <th className="p-4 w-[38%]">2. Extracted Document Clause</th>
                  <th className="p-4 w-[34%]">3. Deterministic Finding &amp; Liability Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coral/10 dark:divide-slate-800 text-xs font-mono">
                <tr className="align-top hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  
                  {/* Column 1: Governing Statute & Threshold */}
                  <td className="p-4 space-y-2">
                    <div className="font-bold text-sm text-forest-ink dark:text-white font-serif">
                      {statuteCitation}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-coral/10 text-coral border border-coral/20">
                      Jurisdiction: {fw === 'eu_ai' ? 'European Union' : 'United States (Federal)'}
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5">
                      <div className="text-[9px] uppercase font-bold text-forest-muted dark:text-slate-400">
                        Compiled Deterministic Rule:
                      </div>
                      <code className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {ruleThreshold}
                      </code>
                    </div>
                  </td>

                  {/* Column 2: Extracted Clause with Highlight */}
                  <td className="p-4 space-y-2 font-sans">
                    <div className="text-[10px] font-mono text-coral font-bold flex items-center justify-between">
                      <span>{data.sectionLabel || 'Section 1.1'}</span>
                      {patchAdopted && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          <span>Remediated Patch Active</span>
                        </span>
                      )}
                    </div>
                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                      patchAdopted 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 font-sans' 
                        : 'bg-slate-50 dark:bg-[#070b14] border-coral/15'
                    }`}>
                      {patchAdopted ? (customRemediatedText || data.remediatedText) : renderHighlightedClause(data.inputText)}
                    </div>
                    {!isCompliant && !patchAdopted && (
                      <div className="text-[11px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        <span>Flagged text violates codification ceiling.</span>
                      </div>
                    )}
                  </td>

                  {/* Column 3: Deterministic Finding & Regulatory Exposure */}
                  <td className="p-4 space-y-2.5">
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      isCompliant || patchAdopted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-sm">
                          {isCompliant || patchAdopted ? 'verified' : 'cancel'}
                        </span>
                        <span>{isCompliant || patchAdopted ? 'Statutory Requirements Satisfied (Compliant)' : discrepancyText}</span>
                      </div>
                    </div>

                    {!isCompliant && !patchAdopted && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          <span className="material-symbols-outlined text-xs">gavel</span>
                          <span>Statutory Exposure &amp; Penalties</span>
                        </div>
                        <p className="font-sans leading-relaxed text-[11px]">
                          {penaltyExposure}
                        </p>
                      </div>
                    )}

                    <div className="text-[10px] text-forest-muted dark:text-slate-400">
                      Audit Verification Block: #{data.scanResult.audit_block_index || 42}
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Directed Flow Helper when saved to Vault */}
        {savedToVault && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
              <div>
                <strong>Policy Saved &amp; Continuously Monitored in Vault!</strong>
                <div className="text-[11px] opacity-85">Document indexed with immutable SHA-256 state hash.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onGoToVault && (
                <button
                  onClick={onGoToVault}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
                >
                  Step 3: View in Vault &rarr;
                </button>
              )}
              {onGoToSentinel && (
                <button
                  onClick={onGoToSentinel}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors"
                >
                  Step 4: Test in Sentinel &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ACTIONABLE NEXT STEPS BAR */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-coral/15 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Button 1: Adopt Compliant Patch / Adopt All */}
            {!allFullClausesCompliant && (
              <button
                onClick={hasFullDoc ? handleAdoptAllClauses : () => setPatchAdopted(!patchAdopted)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-neon-coral ring-2 ring-emerald-400"
                title="In-place replace non-compliant clauses with verified statutory wording"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                <span>{hasFullDoc ? 'Adopt All Patches' : 'Adopt Compliant Patch'}</span>
              </button>
            )}

            {/* Core Legal Deliverable 1: Word Track Changes Redline */}
            <button
              onClick={handleDownloadDocx}
              disabled={exportingDocx}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              title="Download Microsoft Word .docx with native Track Changes revisions"
            >
              <span className="material-symbols-outlined text-sm text-blue-400">description</span>
              <span>{exportingDocx ? 'Generating...' : (hasFullDoc ? 'Word (.docx) Full' : 'Word (.docx)')}</span>
            </button>

            {/* Core Legal Deliverable 2: Commit & Monitor in Vault */}
            {onSaveToVault && (
              <button
                onClick={() => setIsCommitModalOpen(true)}
                disabled={savedToVault || saving}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${
                  allFullClausesCompliant && !savedToVault
                    ? 'btn-iridescent text-white shadow-neon-coral ring-2 ring-coral'
                    : 'bg-white dark:bg-[#0c1220] hover:bg-apricot-50 dark:hover:bg-slate-800 border-2 border-coral/40 hover:border-coral text-coral'
                }`}
                title="Persists document into Vault with SHA-256 state hash for continuous monitoring"
              >
                <span className="material-symbols-outlined text-sm">
                  {savedToVault ? 'task_alt' : (saving ? 'sync' : 'lock')}
                </span>
                <span>{savedToVault ? '✓ In Vault' : (saving ? 'Committing...' : 'Commit to Vault')}</span>
              </button>
            )}

            {/* Core Legal Deliverable 3: Executive Board PDF Audit Report */}
            <button
              onClick={() => setIsExecutiveReportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-amber-200/80 dark:border-amber-800/60"
              title="Generate Formal Executive Board & CCO Statutory Audit Report with Financial Exposure Matrix"
            >
              <span className="material-symbols-outlined text-sm text-amber-500">picture_as_pdf</span>
              <span>Executive Report</span>
            </button>

            {/* Phase 3: Counterparty Word Track Changes Pack Exchanger */}
            <button
              onClick={() => setIsCounterpartyModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-coral/10 hover:bg-coral/20 text-coral dark:text-coral-accent text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-coral/30"
              title="Dispatch Counterparty Word Track Changes Pack: Formal Notice Letter + .docx Redline + FRE 902(13) Certificate"
            >
              <span className="material-symbols-outlined text-sm">forward_to_inbox</span>
              <span>Counterparty Redline</span>
            </button>
          </div>

          {/* Right Group: Specialized Audit Tools & Dispatches */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AI Safety & Bias Auditor Button */}
            <button
              onClick={() => setIsAISafetyModalOpen(true)}
              className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                isAIContract
                  ? 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="EU AI Act & Algorithmic Bias Audit: Disparate Impact & Human Stop-Switch"
            >
              <span className="material-symbols-outlined text-sm text-purple-500">smart_toy</span>
              <span>AI Safety</span>
            </button>

            {/* Multi-Model AI Consensus Button */}
            <button
              onClick={() => setIsConsensusModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-indigo-200/80 dark:border-indigo-800/60"
              title="Triple-Model AI Statutory Consensus: Gemini 1.5 Pro + Claude 3.5 Sonnet + DeepSeek-R1"
            >
              <span className="material-symbols-outlined text-sm text-indigo-500">verified</span>
              <span>Consensus (3/3)</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
              title="Copy to Clipboard"
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Navigation Row: Ingest Another vs. Court Attestation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={onNewScan}
            className="text-xs font-mono font-bold text-forest-muted dark:text-slate-400 hover:text-coral transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>&larr;</span>
            <span>Ingest Another Document</span>
          </button>

          <button
            onClick={onGoToProof}
            className="btn-iridescent px-5 py-2.5 rounded-xl text-white text-xs font-mono font-bold shadow-neon-coral flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Court Attestation</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

      </div>

      {/* Commitment to Compliance Vault Confirmation Modal */}
      <CommitVaultModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onConfirm={handleSave}
        saving={saving}
        data={{
          docTitle: data.docTitle,
          organization: data.organization,
          sectionLabel: data.sectionLabel,
          citation: statuteCitation,
          originalText: data.inputText,
          remediatedText: hasFullDoc 
            ? fullClauses.map(c => `[${c.section_label}]\n${c.is_modified ? c.remediated_text : c.original_text}`).join('\n\n')
            : (patchAdopted ? data.remediatedText : data.remediatedText),
          isCompliant: allFullClausesCompliant,
          auditHash: data.scanResult.audit_hash,
        }}
      />

      {/* Real-time Enterprise Webhook Modal */}
      <WebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        docTitle={data.docTitle || 'Corporate Governance Policy'}
        organization={data.organization || 'Apex Financial Technologies LLC'}
        overallScore={effectiveScore}
        breachCount={effectiveBreachCount}
        auditHash={data.scanResult.audit_hash || '0x8f4d92a1c09e3...'}
      />

      {/* Authentic GitHub Pull Request Modal */}
      <GitHubPRModal
        isOpen={isGitHubPRModalOpen}
        onClose={() => setIsGitHubPRModalOpen(false)}
        docTitle={data.docTitle || 'Corporate Governance Policy'}
        remediatedContent={
          hasFullDoc
            ? fullClauses.map(c => `## ${c.section_label}\n${c.is_modified ? c.remediated_text : c.original_text}`).join('\n\n')
            : (patchAdopted ? data.remediatedText : data.remediatedText)
        }
      />

      {/* Multi-Model Statutory Consensus Engine Modal */}
      <ConsensusModal
        isOpen={isConsensusModalOpen}
        onClose={() => setIsConsensusModalOpen(false)}
        policyText={hasFullDoc ? fullClauses.map(c => `[${c.section_label}]\n${c.is_modified ? c.remediated_text : c.original_text}`).join('\n\n') : (data.remediatedText || data.inputText)}
        frameworkId={data.frameworkId}
        docTitle={data.docTitle}
      />

      {/* Executive Board & CCO Formal Audit Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportModalOpen}
        onClose={() => setIsExecutiveReportModalOpen(false)}
        data={{
          docTitle: data.docTitle || 'Corporate Governance Policy',
          organization: data.organization || 'Apex Financial Technologies LLC',
          overallScore: effectiveScore,
          breachCount: effectiveBreachCount,
          auditBlockIndex: data.scanResult.audit_block_index || 28,
          auditHash: data.scanResult.audit_hash || '0x8f4d92a1c09e3...',
          clausesCount: hasFullDoc ? fullClauses.length : 1,
          penaltyExposureUsd: effectiveBreachCount > 0 ? '$1,000,000 / day' : '$0',
        }}
      />

      {/* AI Safety, Bias Detection & Model Governance Modal */}
      <AISafetyModal
        isOpen={isAISafetyModalOpen}
        onClose={() => setIsAISafetyModalOpen(false)}
        contractText={data.inputText}
        docTitle={data.docTitle}
        organization={data.organization}
        onApplyRemediation={(remediatedText) => {
          setCustomRemediatedText(remediatedText);
          setPatchAdopted(true);
        }}
      />

      {/* Phase 3: Counterparty Word Track Changes Pack Modal */}
      <CounterpartyModal
        isOpen={isCounterpartyModalOpen}
        onClose={() => setIsCounterpartyModalOpen(false)}
        policyTitle={data.docTitle || 'Corporate Governance Policy'}
        citation={statuteCitation}
        originalText={data.inputText}
        remediatedText={customRemediatedText || data.remediatedText}
        organization={data.organization || 'Apex Financial Technologies LLC'}
      />

    </div>
  );
};
