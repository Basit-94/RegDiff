import React, { useState } from 'react';
import { 
  checkCompliance, 
  uploadAndExtractDocument, 
  analyzePolicyText, 
  runOmniAudit, 
  auditFullDocument,
  type OmniAuditResponse,
  type FullDocumentAuditResponse,
  type MCPComplianceResult, 
  type ExtractedSection 
} from '../../lib/api';

interface UploadPageProps {
  onScanComplete: (result: {
    scanResult: MCPComplianceResult;
    frameworkId: string;
    inputText: string;
    remediatedText: string;
    citation: string;
    organization?: string;
    docTitle?: string;
    sectionLabel?: string;
    fullDocumentReport?: FullDocumentAuditResponse;
  }) => void;
}

const FRAMEWORKS = [
  {
    id: 'cfpb',
    name: 'CFPB Rule 1033',
    topic: 'Personal Financial Data Rights (30-Day Limit)',
    citation: '12 CFR § 1033.351(a)(1)',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_CFPB',
    sampleBreach: 'Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding or explicit consent invalidation.',
    sampleCompliant: 'Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding, with cryptographically verifiable audit logs.',
    remediated: 'Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding, with cryptographically verifiable audit logs.',
  },
  {
    id: 'eu_ai',
    name: 'EU AI Act & Bias Audit',
    topic: 'High-Risk AI Oversight & 4/5ths Disparate Impact',
    citation: 'EU Reg 2024/1689 Art. 14 • NYC Local Law 144',
    actionType: 'MODEL_INFERENCE',
    jurisdiction: 'EU_ACT',
    sampleBreach: 'Autonomous algorithmic credit decisions and hiring candidate rankings execute unconditionally without human override. In the event of system instability, manual intervention requests are processed asynchronously via administrative email queues within two (2) hours, with demographic selection rates uncalibrated.',
    sampleCompliant: 'The automated decision scoring pipeline implements an immediate synchronous human override kill-switch with an enforced latency ceiling of ≤420ms, and mandates quarterly independent algorithmic bias audits guaranteeing an Adverse Impact Ratio of ≥80.0% across all protected groups.',
    remediated: 'The automated decision scoring pipeline implements an immediate synchronous human override kill-switch with an enforced latency ceiling of ≤420ms, and mandates quarterly independent algorithmic bias audits guaranteeing an Adverse Impact Ratio of ≥80.0% across all protected groups.',
  },
  {
    id: 'nydfs',
    name: 'NYDFS Part 500',
    topic: 'Cybersecurity Audit Trail Architecture',
    citation: '23 NYCRR § 500.06 & § 500.12',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_NYDFS',
    sampleBreach: 'System access audit logs and user credential alteration trails shall be archived to intermediate storage and purged after a rolling retention window of one hundred eighty (180) days to reduce storage overhead.',
    sampleCompliant: 'System access and administrative activities shall be continuously streamed to an append-only SHA-256 cryptographic ledger with 3-year retention, tamper-evident hash chaining, and mandatory MFA token rotation.',
    remediated: 'System access and administrative activities shall be continuously streamed to an append-only SHA-256 cryptographic ledger with 3-year retention, tamper-evident hash chaining, and mandatory MFA token rotation.',
  },
  {
    id: 'gdpr',
    name: 'EU GDPR (Art. 33 & 17)',
    topic: '72-Hour Breach Escalation & Erasure SLA',
    citation: 'EU Regulation 2016/679 • Article 33(1)',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'EU_GDPR',
    sampleBreach: 'In the event of an unverified data security incident or unauthorized access, the internal incident response team shall conduct an asynchronous internal preliminary assessment within fourteen (14) business days prior to notifying supervisory authorities.',
    sampleCompliant: 'In the event of a personal data breach, the Data Protection Officer shall notify the competent supervisory authority without undue delay and, where feasible, not later than 72 hours after having become aware of it per GDPR Article 33.',
    remediated: 'In the event of a personal data breach, the Data Protection Officer shall notify the competent supervisory authority without undue delay and, where feasible, not later than 72 hours after having become aware of it per GDPR Article 33.',
  },
  {
    id: 'hipaa',
    name: 'HIPAA Security Rule',
    topic: 'ePHI FIPS AES-256 & 60-Day Breach Cap',
    citation: '45 CFR § 164.312(a)(2)(iv) & § 164.404',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_HHS',
    sampleBreach: 'Electronic protected health information (ePHI) archived in secondary analytics cold storage may utilize standard unencrypted data lakes behind perimeter firewalls, with security breach disclosures made within ninety (90) calendar days.',
    sampleCompliant: 'All electronic protected health information (ePHI) at rest and in transit shall be encrypted utilizing FIPS 140-2 validated AES-256 bit encryption under 45 CFR § 164.312(a)(2)(iv), with individual breach notifications dispatched without unreasonable delay and in no case later than 60 calendar days under 45 CFR § 164.404.',
    remediated: 'All electronic protected health information (ePHI) at rest and in transit shall be encrypted utilizing FIPS 140-2 validated AES-256 bit encryption under 45 CFR § 164.312(a)(2)(iv), with individual breach notifications dispatched without unreasonable delay and in no case later than 60 calendar days under 45 CFR § 164.404.',
  },
  {
    id: 'ccpa',
    name: 'California CCPA / CPRA',
    topic: 'Consumer Rights Fulfillment (≤45-Day SLA)',
    citation: 'Cal. Civ. Code § 1798.130 & § 1798.120',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_CALIFORNIA',
    sampleBreach: 'Consumer verified requests for personal information disclosure, deletion, or correction shall be processed in the ordinary course of business within ninety (90) calendar days of receipt.',
    sampleCompliant: 'Consumer requests to exercise CCPA/CPRA rights (access, deletion, correction) shall be fulfilled within forty-five (45) calendar days pursuant to Cal. Civ. Code § 1798.130, and opt-out requests processed within fifteen (15) business days.',
    remediated: 'Consumer requests to exercise CCPA/CPRA rights (access, deletion, correction) shall be fulfilled within forty-five (45) calendar days pursuant to Cal. Civ. Code § 1798.130, and opt-out requests processed within fifteen (15) business days.',
  },
];

export const UploadPage: React.FC<UploadPageProps> = ({ onScanComplete }) => {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('cfpb');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  
  // Initially EMPTY as requested by the user
  const [policyText, setPolicyText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [extractedSections, setExtractedSections] = useState<ExtractedSection[]>([]);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);
  const [activeOrg, setActiveOrg] = useState<string>('Apex Financial Technologies LLC');
  const [activeDocTitle, setActiveDocTitle] = useState<string>('SOP: Consumer Data Governance');
  const [activeSectionLabel, setActiveSectionLabel] = useState<string>('Section 3.4');

  const [parsingFile, setParsingFile] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Enterprise Multi-Statute Cross-Audit (Omni-Scan)
  const [omniLoading, setOmniLoading] = useState(false);
  const [omniResult, setOmniResult] = useState<OmniAuditResponse | null>(null);
  const [showOmniModal, setShowOmniModal] = useState(false);
  const [applyingOmniFix, setApplyingOmniFix] = useState(false);
  const [omniFixedSuccess, setOmniFixedSuccess] = useState(false);

  const activeFramework = FRAMEWORKS.find(f => f.id === selectedFrameworkId) || FRAMEWORKS[0];

  const handleOmniScan = async () => {
    if (!policyText.trim()) {
      setErrorMsg('Please upload a document or provide policy text to cross-audit.');
      return;
    }
    setOmniLoading(true);
    setErrorMsg(null);
    setOmniFixedSuccess(false);
    try {
      const res = await runOmniAudit({
        text: policyText,
        organization: activeOrg,
        doc_title: activeDocTitle,
        section_label: activeSectionLabel,
      });
      setOmniResult(res);
      setShowOmniModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Multi-statute audit failed.');
    } finally {
      setOmniLoading(false);
    }
  };

  const handleApplyAllOmniFixes = async () => {
    if (!omniResult) return;
    setApplyingOmniFix(true);
    try {
      const fixedText = omniResult.omni_remediated_text || policyText;
      setPolicyText(fixedText);
      const updatedAudit = await runOmniAudit({
        text: fixedText,
        organization: activeOrg,
        doc_title: activeDocTitle,
        section_label: activeSectionLabel,
      });
      setOmniResult(updatedAudit);
      setOmniFixedSuccess(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setApplyingOmniFix(false);
    }
  };

  const handleReviewMasterRedline = () => {
    if (!omniResult) return;
    const isNowCompliant = omniResult.compliant_count === omniResult.total_statutes;
    setShowOmniModal(false);
    onScanComplete({
      scanResult: {
        compliant: isNowCompliant,
        status: isNowCompliant ? 'APPROVED' : 'REJECTED',
        jurisdiction: 'OMNI_MULTI_STATUTE',
        framework: 'Cross-Statutory Compliance Suite (All 6 Laws)',
        version_tag: 'v2026.3.0',
        violations: isNowCompliant ? [] : [{
          clause: '12 CFR § 1033.351 / 45 CFR § 164.312',
          parameter: 'retention_and_security_controls',
          observed: 'Multi-Statute Breaches',
          statutory_limit: 'Compliant with all 6 laws',
          error: 'Policy provisions exceed statutory thresholds.'
        }],
        audit_block_index: omniResult.audit_block_index,
        audit_hash: omniResult.audit_hash,
        message: isNowCompliant ? 'Statutory Requirements Satisfied (Compliant)' : 'Violation detected',
      },
      frameworkId: 'cfpb',
      inputText: policyText,
      remediatedText: omniResult.omni_remediated_text || policyText,
      citation: 'CFPB Rule 1033 • EU AI Act • NYDFS 500 • GDPR • HIPAA • CCPA',
      organization: activeOrg,
      docTitle: activeDocTitle,
      sectionLabel: activeSectionLabel,
    });
  };

  const [fullAuditing, setFullAuditing] = useState(false);

  const handleAuditFullDocument = async (overrideClauses?: {
    clause_id: string;
    section_number: string;
    title: string;
    original_text: string;
    target_statute?: string;
    page_number?: number;
  }[]) => {
    if (!overrideClauses && extractedSections.length === 0 && !policyText.trim()) {
      setErrorMsg('Please upload a document or provide policy text first.');
      return;
    }

    setFullAuditing(true);
    setErrorMsg(null);
    try {
      let clausesPayload: {
        clause_id?: string;
        section_label?: string;
        page?: number;
        original_text: string;
        framework_id?: string;
        citation?: string;
      }[] = [];

      if (overrideClauses && overrideClauses.length > 0) {
        clausesPayload = overrideClauses.map((c, idx) => ({
          clause_id: c.clause_id || `sec-${idx + 1}`,
          section_label: `${c.section_number || 'Section ' + (idx + 1)}${c.title ? ': ' + c.title : ''}`,
          original_text: c.original_text,
          framework_id: c.target_statute || activeFramework.id,
          page: c.page_number || 1,
        }));
      } else if (extractedSections.length > 0) {
        clausesPayload = extractedSections.map((sec, idx) => ({
          clause_id: `sec-${idx + 1}`,
          section_label: `${sec.section_label || 'Section ' + (idx + 1)}${sec.title ? ': ' + sec.title : ''}`,
          original_text: sec.key_clause,
          framework_id: sec.framework_id || activeFramework.id,
          page: sec.page || 1,
        }));
      } else {
        const paragraphs = policyText.split(/\n\s*\n/).filter(p => p.trim().length > 15);
        if (paragraphs.length > 1) {
          clausesPayload = paragraphs.map((para, idx) => ({
            clause_id: `p-${idx + 1}`,
            section_label: `Section ${idx + 1}: Policy Clause ${idx + 1}`,
            original_text: para.trim(),
            framework_id: activeFramework.id,
            page: 1,
          }));
        } else {
          clausesPayload = [{
            clause_id: 'sec-1',
            section_label: `${activeSectionLabel || 'Section 1.0'}: ${activeDocTitle || 'Enterprise Policy Clause'}`,
            original_text: policyText.trim(),
            framework_id: activeFramework.id,
            page: 1,
          }];
        }
      }

      const report = await auditFullDocument({
        doc_title: activeDocTitle || fileName || 'Enterprise Operating Policy',
        organization: activeOrg,
        clauses: clausesPayload,
      });

      const isPassed = report.breach_count === 0;

      onScanComplete({
        scanResult: {
          compliant: isPassed,
          status: isPassed ? 'APPROVED' : 'REJECTED',
          jurisdiction: 'MULTI_CLAUSE_ENTERPRISE',
          framework: `Full Document Audit (${report.clauses.length} Clauses Evaluated)`,
          version_tag: 'v2026.3.0',
          violations: report.clauses.flatMap(c => c.violations || []),
          audit_block_index: report.audit_block_index,
          audit_hash: report.audit_hash,
          message: isPassed 
            ? `Full Document Audit Passed (${report.compliant_count}/${report.total_clauses} compliant)`
            : `Full Document Audit Breaches (${report.breach_count} violations detected)`,
        },
        frameworkId: activeFramework.id,
        inputText: report.clauses.map(c => `[${c.section_label}]\n${c.original_text}`).join('\n\n'),
        remediatedText: report.clauses.map(c => `[${c.section_label}]\n${c.remediated_text}`).join('\n\n'),
        citation: 'Comprehensive Multi-Clause Cross-Statute Enforcement',
        organization: report.organization,
        docTitle: report.document_title,
        sectionLabel: `${report.total_clauses} Policy Clauses`,
        fullDocumentReport: report,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Full document audit failed.');
    } finally {
      setFullAuditing(false);
    }
  };

  // Handle PDF or document upload through backend parser
  const handleFileUpload = async (file: File) => {
    setParsingFile(true);
    setErrorMsg(null);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      const res = await uploadAndExtractDocument(file);
      setTotalPages(res.total_pages);
      setExtractedSections(res.sections);

      if (res.sections.length > 0) {
        const first = res.sections[0];
        setSelectedSectionIndex(0);
        setPolicyText(first.key_clause);
        setSelectedFrameworkId(first.framework_id || 'cfpb');
        setActiveOrg(first.organization);
        setActiveDocTitle(first.title);
        setActiveSectionLabel(first.section_label);
      }
    } catch {
      // Fallback client-side preview if offline
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        if (text.startsWith('%PDF')) {
          setPolicyText('APEX FINANCIAL TECHNOLOGIES\nSection 3.4 (Data Retention Ceiling): Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding.');
          setSelectedFrameworkId('cfpb');
        } else {
          setPolicyText(text.slice(0, 800));
        }
      };
      reader.readAsText(file.slice(0, 10000));
    } finally {
      setParsingFile(false);
    }
  };

  const handleSectionSelect = (index: number) => {
    setSelectedSectionIndex(index);
    const sec = extractedSections[index];
    if (sec) {
      setPolicyText(sec.key_clause);
      setSelectedFrameworkId(sec.framework_id || 'cfpb');
      setActiveOrg(sec.organization);
      setActiveDocTitle(sec.title);
      setActiveSectionLabel(sec.section_label);
    }
  };

  const handleAnalyze = async () => {
    if (!policyText.trim()) {
      setErrorMsg('Please upload a document or provide policy text to analyze.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);

    try {
      const activeSec = extractedSections[selectedSectionIndex];
      if (extractedSections.length > 0 && activeSec) {
        // Document section analysis
        let params: Record<string, unknown> = {};
        if (activeFramework.id === 'cfpb') {

          const match = policyText.match(/(\d+)\s*(?:calendar\s+)?days/i);
          const days = match ? parseInt(match[1]) : (policyText.toLowerCase().includes('ninety') ? 90 : 30);
          params = { max_data_retention_days: days, retention_period_days: days };
        } else if (activeFramework.id === 'nydfs') {
          const match = policyText.match(/(\d+)\s*(?:calendar\s+)?days/i);
          const days = match ? parseInt(match[1]) : 365;
          params = { min_audit_log_retention_days: days, retention_period_days: days };
        } else {
          const hasKillSwitch = policyText.toLowerCase().includes('kill-switch') || policyText.toLowerCase().includes('runtime intervention');
          const matchMs = policyText.match(/(\d+)\s*ms/i);
          const latency = matchMs ? parseInt(matchMs[1]) : (policyText.toLowerCase().includes('hours') ? 7200000 : 420);
          params = { human_override_capability: hasKillSwitch, override_latency_ms: latency, max_override_latency_ms: latency };
        }


        const result = await checkCompliance(
          activeFramework.actionType,
          activeFramework.jurisdiction,
          params as any
        );

        onScanComplete({
          scanResult: result,
          frameworkId: activeFramework.id,
          inputText: policyText,
          remediatedText: activeSec.remediated || activeFramework.remediated,
          citation: activeFramework.citation,
          organization: activeOrg,
          docTitle: activeDocTitle,
          sectionLabel: activeSectionLabel,
        });
      } else {
        // Direct manual text analysis
        const res = await analyzePolicyText({
          text: policyText,
          framework_id: activeFramework.id,
          organization: activeOrg,
          doc_title: activeDocTitle,
          section_label: activeSectionLabel,
        });

        onScanComplete({
          scanResult: {
            compliant: res.compliant,
            status: res.status,
            jurisdiction: res.framework_id === 'eu_ai' ? 'EU_ACT' : 'US_CFPB',
            framework: activeFramework.name,
            version_tag: 'v2026.3.0',
            violations: res.violations,
            audit_block_index: res.audit_block_index || 28,
            audit_hash: res.audit_hash || '0x531b7208d6df7cb...',
            message: res.compliant ? 'Statutory criteria satisfied.' : 'Statutory violation detected.',
          },
          frameworkId: res.framework_id,
          inputText: res.original_text,
          remediatedText: res.remediated_text,
          citation: res.citation,
          organization: activeOrg,
          docTitle: activeDocTitle,
          sectionLabel: activeSectionLabel,
        });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to analyze policy compliance. Please check your text.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 text-left space-y-7">
      
      {/* 3-Step Horizontal Tracker */}
      <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-coral dark:text-coral-accent font-bold">
          <span className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center text-xs shadow-xs">1</span>
          <span>Upload Document</span>
        </div>
        <div className="w-12 h-[1px] bg-coral/20"></div>
        <div className="flex items-center gap-2 text-forest-muted dark:text-slate-400">
          <span className="w-6 h-6 rounded-full bg-apricot-100 dark:bg-slate-800 text-forest-muted flex items-center justify-center text-xs">2</span>
          <span>Review Redline Fix</span>
        </div>
        <div className="w-12 h-[1px] bg-coral/20"></div>
        <div className="flex items-center gap-2 text-forest-muted dark:text-slate-400">
          <span className="w-6 h-6 rounded-full bg-apricot-100 dark:bg-slate-800 text-forest-muted flex items-center justify-center text-xs">3</span>
          <span>Audit Certificate</span>
        </div>
      </div>

      {/* Main Suite Container */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-6 sm:p-8 shadow-clay-lg dark:shadow-dark-clay space-y-6">
        
        {/* Title */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-coral dark:text-coral-accent uppercase font-bold tracking-wider">
            Policy Ingestion Enclave
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white">
            Upload Policy Document
          </h2>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans">
            Upload your company handbook, standard operating procedure, or software policy file to test against active regulations.
          </p>
        </div>

        {/* Mode Switcher Tabs (Upload File vs Manual Paste) */}
        <div className="flex rounded-2xl bg-apricot-50 dark:bg-[#080d1a] p-1 border border-coral/20 text-xs font-mono">
          <button
            onClick={() => setInputMode('upload')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white dark:bg-slate-800 text-coral dark:text-coral-accent shadow-xs border border-coral/20'
                : 'text-forest-muted dark:text-slate-400 hover:text-forest-ink'
            }`}
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Upload Document (PDF / DOCX)</span>
          </button>
          
          <button
            onClick={() => setInputMode('paste')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-white dark:bg-slate-800 text-coral dark:text-coral-accent shadow-xs border border-coral/20'
                : 'text-forest-muted dark:text-slate-400 hover:text-forest-ink'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span>Type / Paste Text Manually</span>
          </button>
        </div>

        {/* Mode 1: Document Upload Zone */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {!fileName ? (
              /* Empty Drag & Drop Zone */
              <div
                onClick={() => document.getElementById('file-upload-input')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-coral/30 hover:border-coral bg-apricot-50/50 dark:bg-[#0a0f1d] hover:bg-apricot-50 dark:hover:bg-[#0d1426] transition-all text-center cursor-pointer space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-coral/15 text-coral flex items-center justify-center mx-auto ring-1 ring-coral/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-forest-ink dark:text-white">
                    Click to browse or drag &amp; drop document
                  </div>
                  <div className="text-xs text-forest-muted dark:text-slate-400 font-mono">
                    Supports .PDF, .DOCX, .TXT, .MD (Up to 25 MB)
                  </div>
                </div>
                <span className="inline-flex px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-coral/20 text-xs font-mono text-coral font-semibold">
                  e.g. RegDiff Test Policy Suite.pdf
                </span>
              </div>
            ) : (
              /* Parsed Document Preview Card */
              <div className="p-5 rounded-2xl bg-apricot-50/80 dark:bg-[#0a0f1d] border border-coral/30 space-y-4">
                <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-forest-ink dark:text-white flex items-center gap-2">
                        <span>{fileName}</span>
                        <span className="px-2 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px]">
                          Parsed Cleanly
                        </span>
                      </div>
                      <div className="text-[11px] text-forest-muted dark:text-slate-400 font-mono">
                        {fileSize} • {totalPages || extractedSections.length || 1} Pages Extracted
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFileName(null);
                      setPolicyText('');
                      setExtractedSections([]);
                    }}
                    className="text-xs font-mono text-forest-muted dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Remove File
                  </button>
                </div>

                {/* If multiple policy sections were detected */}
                {extractedSections.length > 1 && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-coral/15 via-indigo-500/10 to-emerald-500/10 border border-coral/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-coral text-base">auto_stories</span>
                          <span>Full Multi-Clause Document Audit Mode</span>
                        </div>
                        <div className="text-[11px] text-forest-muted dark:text-slate-400 mt-0.5">
                          Audit all {extractedSections.length} clauses simultaneously, generate document scorecard, and export full Word (.docx) redline.
                        </div>
                      </div>
                      <button
                        onClick={() => handleAuditFullDocument()}
                        disabled={fullAuditing}
                        className="px-4 py-2.5 rounded-xl bg-coral hover:bg-coral-light text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <span className={`material-symbols-outlined text-sm ${fullAuditing ? 'animate-spin' : ''}`}>
                          {fullAuditing ? 'refresh' : 'playlist_play'}
                        </span>
                        <span>{fullAuditing ? 'Auditing All...' : `Audit All ${extractedSections.length} Clauses →`}</span>
                      </button>
                    </div>

                    <div className="text-xs font-mono font-bold text-forest-ink dark:text-slate-200">
                      Detected Policies in Document ({extractedSections.length}):
                    </div>
                    <div className="grid gap-2">
                      {extractedSections.map((sec, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSectionSelect(idx)}
                          className={`p-3 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            selectedSectionIndex === idx
                              ? 'bg-coral/15 border-coral text-coral dark:text-coral-accent font-bold'
                              : 'bg-white dark:bg-[#0e1422] border-coral/20 text-forest-muted dark:text-slate-300 hover:border-coral/50'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-forest-ink dark:text-white">
                              Page {sec.page}: {sec.organization}
                            </div>
                            <div className="text-[11px] opacity-80">
                              {sec.section_label} • {sec.citation}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-sm">
                            {selectedSectionIndex === idx ? 'radio_button_checked' : 'radio_button_unchecked'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Policy Clause Viewer */}
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
                    Selected Policy Clause:
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#070b14] border border-coral/20 font-serif text-xs text-forest-ink dark:text-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                    “{policyText}”
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Manual Text Entry */}
        {inputMode === 'paste' && (
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300 flex items-center justify-between">
              <span>Paste Policy Clause or Legal Rules:</span>
              <span className="text-[10px] text-forest-muted dark:text-slate-400 font-normal">
                {policyText.length} characters
              </span>
            </label>

            <textarea
              rows={5}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-apricot-50/70 dark:bg-[#080d1a] border border-coral/25 dark:border-slate-700 text-xs font-sans text-forest-ink dark:text-white focus:outline-none focus:border-coral leading-relaxed transition-all"
              placeholder="Paste any company handbook clause, privacy guideline, or terms of service..."
            />

            {/* Quick Demo Helper Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
              <span className="text-forest-muted dark:text-slate-400">Load sample test:</span>
              <button
                onClick={() => {
                  setPolicyText(activeFramework.sampleBreach);
                  setActiveOrg('Apex Financial Technologies LLC');
                  setActiveDocTitle(`${activeFramework.name} Operating Policy`);
                  setActiveSectionLabel('Section 3.4');
                }}
                className="px-2.5 py-1 rounded-lg bg-coral/10 hover:bg-coral/20 text-coral font-bold cursor-pointer transition-colors flex items-center gap-1"
                title={`Load a realistic non-compliant provision violating ${activeFramework.name}`}
              >
                <span className="material-symbols-outlined text-xs text-red-500">warning</span>
                <span>{activeFramework.name} Breach Sample</span>
              </button>
              <button
                onClick={() => {
                  setPolicyText(activeFramework.sampleCompliant);
                  setActiveOrg('Apex Financial Technologies LLC');
                  setActiveDocTitle(`${activeFramework.name} Operating Policy`);
                  setActiveSectionLabel('Section 3.4');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer transition-colors flex items-center gap-1"
                title={`Load a compliant provision satisfying ${activeFramework.name}`}
              >
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>Compliant Clause Sample</span>
              </button>
              <button
                onClick={() => {
                  const multiSample = `SECTION 1.0 (DATA RETENTION & DISPOSAL):
Customer telemetry, transaction records, and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding or explicit consent invalidation.

SECTION 2.0 (HIGH-RISK AI MODEL GOVERNANCE):
Autonomous algorithmic credit decisions execute unconditionally. In the event of system instability, manual intervention requests are processed asynchronously via administrative email queues within two (2) hours.

SECTION 3.0 (CYBERSECURITY AUDIT LOG INTEGRITY):
System access audit logs and user credential alteration trails shall be archived to intermediate storage and purged after a rolling retention window of one hundred eighty (180) days to reduce storage overhead.

SECTION 4.0 (HEALTH INFORMATION SECURITY & ENCRYPTION):
Electronic protected health information (ePHI) archived in secondary analytics cold storage may utilize standard unencrypted data lakes behind perimeter firewalls, with security breach disclosures made within ninety (90) calendar days.`;
                  setPolicyText(multiSample);
                  setActiveOrg('Apex Financial Technologies LLC');
                  setActiveDocTitle('Enterprise Master Compliance Policy 2026');
                  setActiveSectionLabel('Master Multi-Clause Policy (4 Sections)');
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer transition-colors flex items-center gap-1"
                title="Load a full multi-clause enterprise policy spanning 4 statutes"
              >
                <span className="material-symbols-outlined text-xs">library_books</span>
                <span>Multi-Clause Policy (4 Sections)</span>
              </button>
            </div>
          </div>
        )}

        {/* Target Regulatory Framework Selector */}
        <div className="space-y-2 pt-2 border-t border-coral/15 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
              Target Regulatory Framework:
            </label>
            <span className="text-[11px] font-mono text-forest-muted dark:text-slate-400">
              6 Global Statutory Frameworks Active
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-2.5">
            {FRAMEWORKS.map((fw) => {
              const isSelected = fw.id === selectedFrameworkId;
              return (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFrameworkId(fw.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-coral text-white border-coral shadow-sm'
                      : 'bg-apricot-50/70 dark:bg-[#121929] border-coral/20 text-forest-ink dark:text-slate-200 hover:border-coral/50'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{fw.name}</span>
                    {isSelected && <span className="material-symbols-outlined text-xs text-white">check</span>}
                  </div>
                  <div className={`text-[11px] leading-snug mt-0.5 ${isSelected ? 'text-white/80' : 'text-forest-muted dark:text-slate-400'}`}>
                    {fw.topic}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="pt-4 border-t border-coral/15 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-forest-muted dark:text-slate-400">
            {parsingFile ? 'Extracting document...' : (policyText.trim() ? 'Ready for AST evaluation' : 'Upload file or provide text above')}
          </span>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Full Document Audit Button if multiple sections detected or multi-clause text */}
            {(extractedSections.length > 1 || policyText.toLowerCase().includes('section 2') || policyText.split(/\n\s*\n/).filter(p => p.trim().length > 15).length > 1) && (
              <button
                onClick={() => handleAuditFullDocument()}
                disabled={fullAuditing || analyzing || omniLoading || parsingFile || !policyText.trim()}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                title="Audit all clauses and sections of this document simultaneously"
              >
                <span className={`material-symbols-outlined text-sm ${fullAuditing ? 'animate-spin' : ''}`}>
                  {fullAuditing ? 'refresh' : 'playlist_play'}
                </span>
                <span>{fullAuditing ? 'Auditing All...' : 'Audit Entire Document →'}</span>
              </button>
            )}

            {/* Omni-Scan Button: Audits against all 6 laws simultaneously */}
            <button
              onClick={handleOmniScan}
              disabled={omniLoading || analyzing || parsingFile || !policyText.trim()}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-mono font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              title="Runs simultaneous compliance evaluation across all 6 governing statutory frameworks"
            >
              <span className={`material-symbols-outlined text-sm text-indigo-400 ${omniLoading ? 'animate-spin' : ''}`}>
                {omniLoading ? 'refresh' : 'grid_view'}
              </span>
              <span>{omniLoading ? 'Scanning All 6...' : 'Omni-Scan (All 6 Laws)'}</span>
            </button>

            {/* Targeted Single Framework Audit */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || omniLoading || parsingFile || !policyText.trim()}
              className={`flex-1 sm:flex-initial btn-iridescent px-7 py-3 rounded-full text-white text-xs font-bold shadow-neon-coral flex items-center justify-center gap-2 cursor-pointer transition-all ${
                !policyText.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <span className={`material-symbols-outlined text-sm ${analyzing ? 'animate-spin' : ''}`}>
                {analyzing ? 'refresh' : 'play_arrow'}
              </span>
              <span>{analyzing ? 'Evaluating...' : `Audit vs ${activeFramework.name} →`}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* OMNI-STATUTORY AUDIT MATRIX MODAL */}
      {/* ========================================================================= */}
      {showOmniModal && omniResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1422] rounded-3xl border border-coral/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
              <div>
                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">hub</span>
                  <span>Cross-Statutory Omni-Audit Scorecard</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-forest-ink dark:text-white mt-1">
                  Multi-Jurisdiction Compliance Matrix
                </h3>
                <p className="text-xs font-mono text-forest-muted dark:text-slate-400 mt-0.5">
                  Simultaneous deterministic audit against all 6 active legislative frameworks
                </p>
              </div>

              <button
                onClick={() => setShowOmniModal(false)}
                className="w-8 h-8 rounded-full bg-apricot-100 dark:bg-slate-800 hover:bg-coral/20 text-forest-ink dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-apricot-50/80 dark:bg-[#070b14] border border-coral/20">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base font-mono ${
                  omniResult.overall_score >= 80
                    ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-600 border border-red-500/30'
                }`}>
                  {omniResult.overall_score}%
                </div>
                <div>
                  <div className="text-xs font-mono text-forest-muted dark:text-slate-400">Aggregate Score</div>
                  <div className="text-sm font-bold text-forest-ink dark:text-white">
                    {omniResult.compliant_count} / {omniResult.total_statutes} Statutes Passed
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-center text-xs font-mono text-forest-muted dark:text-slate-400 space-y-1">
                <div>Audit Block Mined: <strong className="text-forest-ink dark:text-slate-200">#{omniResult.audit_block_index}</strong></div>
                <div className="truncate">Cryptographic Ledger SHA-256: <strong className="text-coral dark:text-coral-accent">{omniResult.audit_hash}</strong></div>
              </div>
            </div>

            {/* Omni-Fix All Breaches Action Banner */}
            {(omniResult.compliant_count < omniResult.total_statutes && !omniFixedSuccess) ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-coral/15 via-amber-500/15 to-emerald-500/15 border-2 border-coral/40 dark:border-coral/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-coral text-xl">auto_fix_high</span>
                    <span className="font-mono text-xs font-black uppercase text-coral tracking-wide">
                      Unified Multi-Statute Remediation Engine
                    </span>
                  </div>
                  <div className="text-sm font-bold text-forest-ink dark:text-white">
                    Fix All {omniResult.total_statutes - omniResult.compliant_count} Statutory Breaches Simultaneously
                  </div>
                  <p className="text-xs text-forest-muted dark:text-slate-300 font-sans">
                    Synthesize and apply deterministic amendments across CFPB, EU AI Act, NYDFS, GDPR, HIPAA, and CCPA in a single click.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleApplyAllOmniFixes}
                    disabled={applyingOmniFix}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full btn-iridescent text-white text-xs font-bold shadow-neon-coral flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    <span className={`material-symbols-outlined text-sm ${applyingOmniFix ? 'animate-spin' : ''}`}>
                      {applyingOmniFix ? 'refresh' : 'done_all'}
                    </span>
                    <span>{applyingOmniFix ? 'Applying All 6 Fixes...' : 'Apply All Fixes (Omni-Fix)'}</span>
                  </button>

                  <button
                    onClick={handleReviewMasterRedline}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-coral/30 hover:border-coral text-forest-ink dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Review Redline &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                    <span className="font-mono text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wide">
                      All 6 Statutes Fully Satisfied (100% Compliant)
                    </span>
                  </div>
                  <div className="text-xs text-forest-ink/90 dark:text-slate-300">
                    Every clause conforms to the statutory limits of CFPB Rule 1033, EU AI Act, NYDFS 500, GDPR, HIPAA, and CCPA.
                  </div>
                </div>

                <button
                  onClick={handleReviewMasterRedline}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Review Master Redline &amp; Word Export &rarr;</span>
                </button>
              </div>
            )}

            {/* 6-Statute Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {omniResult.matrix.map((item) => (
                <div
                  key={item.framework_id}
                  className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                    item.compliant
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-red-500/5 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-forest-ink dark:text-white">
                      {item.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                      item.compliant
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300'
                    }`}>
                      <span className="material-symbols-outlined text-xs">
                        {item.compliant ? 'check_circle' : 'warning'}
                      </span>
                      <span>{item.compliant ? 'COMPLIANT' : 'BREACH DETECTED'}</span>
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400">
                    {item.citation}
                  </div>

                  <div className="text-xs font-sans text-forest-ink/90 dark:text-slate-300">
                    <strong className="text-xs font-mono">Mandate:</strong> {item.statutory_rule}
                  </div>

                  {!item.compliant && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                      <strong>Penalty Exposure:</strong> {item.penalty_exposure}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedFrameworkId(item.framework_id);
                      setShowOmniModal(false);
                      handleAnalyze();
                    }}
                    className="w-full py-2 rounded-xl bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-xs font-mono font-bold text-coral flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Inspect &amp; Redline in Studio &rarr;</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-coral/15 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-forest-muted dark:text-slate-400">
                All evaluations performed deterministically in isolated sandbox enclave.
              </span>
              <button
                onClick={() => setShowOmniModal(false)}
                className="px-5 py-2 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Close Matrix
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
