import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import type { PageType } from './components/Header';
import { LandingPage } from './components/pages/LandingPage';
import { SignInPage } from './components/pages/SignInPage';
import { UploadPage } from './components/pages/UploadPage';
import { ResultsPage } from './components/pages/ResultsPage';
import { ProofPage } from './components/pages/ProofPage';
import { VaultPage } from './components/pages/VaultPage';
import { SentinelPage } from './components/pages/SentinelPage';
import { VerifyPage } from './components/pages/VerifyPage';
import { GuidedWorkflowBar } from './components/GuidedWorkflowBar';
import { MascotFox } from './components/MascotFox';
import { MascotChatbot } from './components/MascotChatbot';
import { CounselModal } from './components/CounselModal';
import { CICDModal } from './components/CICDModal';
import { ConnectorsModal } from './components/ConnectorsModal';
import { CustomRuleModal } from './components/CustomRuleModal';
import { WordAddinModal } from './components/WordAddinModal';
import { GRCModal } from './components/GRCModal';
import { 
  fetchHealth, 
  verifyLedgerChain,
  savePolicyToVault,
} from './lib/api';

import type { LedgerVerification, MCPComplianceResult, Policy, FullDocumentAuditResponse } from './lib/api';

export function App() {
  // Theme state: DEFAULT TO LIGHT MODE as requested by the user!
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('regdiff_theme');
    if (saved) return saved === 'dark';
    return false; // Default: Light mode
  });

  // Current multi-page screen
  const [currentPage, setCurrentPage] = useState<PageType>('landing');

  // User auth state
  const [user, setUser] = useState<{ name: string; role: string; email: string; organization?: string } | null>(() => {
    const savedUser = localStorage.getItem('regdiff_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Scan Results State
  const [scanData, setScanData] = useState<{
    scanResult: MCPComplianceResult;
    frameworkId: string;
    inputText: string;
    remediatedText: string;
    citation: string;
    organization?: string;
    docTitle?: string;
    sectionLabel?: string;
    fullDocumentReport?: FullDocumentAuditResponse;
  } | null>(null);

  // Guided Workflow Milestones State
  const [milestones, setMilestones] = useState({
    hasIngested: false,
    hasAudited: false,
    hasCommitted: false,
    hasSentinelReviewed: false,
    hasAttested: false,
  });

  // Backend telemetry state
  const [, setBackendConnected] = useState(false);
  const [ledgerVerification, setLedgerVerification] = useState<LedgerVerification>({
    is_valid: true,
    total_blocks: 22,
  });
  const [mascotTip, setMascotTip] = useState<string | undefined>(undefined);
  const [isCounselOpen, setIsCounselOpen] = useState(false);
  const [isCICDOpen, setIsCICDOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [isCustomRulesOpen, setIsCustomRulesOpen] = useState(false);
  const [isWordAddinOpen, setIsWordAddinOpen] = useState(false);
  const [isGRCOpen, setIsGRCOpen] = useState(false);
  const [statutoryAlert, setStatutoryAlert] = useState<{ active: boolean; statute: string; description: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Synchronize theme with <html> class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('regdiff_theme', next ? 'dark' : 'light');
  };

  // Poll backend health and ledger
  const loadData = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendConnected(true);
      const verify = await verifyLedgerChain();
      setLedgerVerification(verify);
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Situational intelligence message generator
  const getSituationalTip = useCallback((page: PageType): string => {
    switch (page) {
      case 'landing':
        return "Scanning document AST against 12 CFR § 1033.351 and EU AI Act Art. 14 statutory ceilings...";
      case 'signin':
        return "Sign in with enterprise credentials or use 1-Click Demo Login (Alex Vance • Lead Counsel).";
      case 'upload':
        return "Policy Ingestion: Parse contract clauses, SLAs, and retention ceilings into deterministic AST constraints.";
      case 'results':
        if (scanData && !scanData.scanResult.compliant) {
          return `Deterministic assertion failed: retention delta exceeds statutory ceiling by 60 days. Civil money penalty exposure detected under ${scanData.citation}.`;
        }
        return "Deterministic verification passed: evaluated clauses satisfy all statutory ceilings under active legal frameworks.";
      case 'proof':
        return `Cryptographic Attestation Sealed: Ledger Block #${ledgerVerification.total_blocks} attested under Federal Rules of Evidence Rule 902(13).`;
      case 'vault':
        return "Continuous Compliance Vault: Repositories monitored against real-time Federal Register rule amendments.";
      case 'sentinel':
        return "Regulatory Sentinel Radar: Monitoring CFPB Rule 1033, EU AI Act Art. 14, and NYDFS 500.";
      case 'verify':
        return "Zero-Knowledge InsurTech Risk Portal: Validating FRE 902(13) Merkle roots and calculating dynamic cyber insurance premium discounts.";
      default:
        return "RegDiff Statutory Intelligence Engine active.";
    }
  }, [scanData, ledgerVerification.total_blocks]);

  // Handle page transitions & update situational notification accordingly
  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMascotTip(getSituationalTip(page));
    if (page === 'sentinel') {
      setMilestones((prev) => ({ ...prev, hasSentinelReviewed: true }));
    } else if (page === 'proof') {
      setMilestones((prev) => ({ ...prev, hasAttested: true }));
    }
  };

  const handleFoxClick = () => {
    setMascotTip(getSituationalTip(currentPage));
    setIsChatOpen((prev) => !prev);
  };

  // Auth handlers
  const handleLoginSuccess = (userData: { name: string; role: string; email: string; organization?: string }) => {
    setUser(userData);
    localStorage.setItem('regdiff_user', JSON.stringify(userData));
    // Fresh user session: reset scan state & milestones so Steps 1-5 start unfulfilled
    setScanData(null);
    setMilestones({
      hasIngested: false,
      hasAudited: false,
      hasCommitted: false,
      hasSentinelReviewed: false,
      hasAttested: false,
    });
    // Direct new user to Step 1: Ingest Policy (Milestone 1)
    navigateTo('upload');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('regdiff_user');
    setScanData(null);
    setMilestones({
      hasIngested: false,
      hasAudited: false,
      hasCommitted: false,
      hasSentinelReviewed: false,
      hasAttested: false,
    });
    navigateTo('landing');
  };

  const handleScanFinished = (data: {
    scanResult: MCPComplianceResult;
    frameworkId: string;
    inputText: string;
    remediatedText: string;
    citation: string;
    organization?: string;
    docTitle?: string;
    sectionLabel?: string;
    fullDocumentReport?: FullDocumentAuditResponse;
  }) => {
    setScanData(data);
    setMilestones((prev) => ({
      ...prev,
      hasIngested: true,
      hasAudited: true,
    }));
    loadData();
    navigateTo('results');
  };

  const handleStartQuickDemo = () => {
    setMilestones((prev) => ({
      ...prev,
      hasIngested: true,
      hasAudited: true,
    }));
    setScanData({
      scanResult: {
        compliant: false,
        status: 'REJECTED',
        jurisdiction: 'US_CFPB',
        framework: 'CFPB Rule 1033',
        version_tag: 'v2026.3.0',
        violations: [{
          clause: '12 CFR § 1033.351(a)(1)',
          parameter: 'max_data_retention_days',
          observed: 90,
          statutory_limit: '30 days',
          error: 'Retention period exceeds statutory cap of 30 days.'
        }],
        audit_block_index: 29,
        audit_hash: '0x8f2a1768c34d1b7a...',
        message: 'Violation detected: max_data_retention_days exceeds statutory cap',
      },
      frameworkId: 'cfpb',
      inputText: `Section 4.2 - Retention and Archival Schedule:
Apex Financial Technologies LLC retains all consumer financial records, transaction histories, and authorized account credential tokens for a period of ninety (90) calendar days following user offboarding. Records are stored in warm object storage for audit verification before scheduled cryptographic erasure.`,
      remediatedText: `Section 4.2 - Retention and Archival Schedule:
Apex Financial Technologies LLC retains all consumer financial records, transaction histories, and authorized account credential tokens for a period of thirty (30) calendar days following user offboarding. Records are stored in warm object storage for audit verification before scheduled cryptographic erasure.`,
      citation: '12 CFR § 1033.351(a)(1) — Personal Financial Data Rights',
      organization: 'Apex Financial Technologies LLC',
      docTitle: 'Apex Master Data Governance & Retention Policy',
      sectionLabel: 'Section 4.2',
    });
    navigateTo('results');
  };

  const handleSaveToVault = async () => {
    if (!scanData) return;
    await savePolicyToVault({
      title: scanData.docTitle || 'Data Governance Policy',
      organization: scanData.organization || 'Apex Financial Technologies LLC',
      filename: 'ingested_policy.pdf',
      file_type: 'PDF',
      category: scanData.frameworkId === 'eu_ai' ? 'AI Governance' : 'Data Governance',
      current_status: scanData.scanResult.compliant ? 'COMPLIANT' : 'CRITICAL_BREAK',
      section_label: scanData.sectionLabel || 'Section 1.1',
      body_text: scanData.remediatedText || scanData.inputText,
    });
    setMilestones((prev) => ({
      ...prev,
      hasCommitted: true,
    }));
    loadData();
    setMascotTip("Policy successfully saved and sealed into your persistent Compliance Vault!");
  };

  const handleViewVaultPolicy = (policy: Policy) => {
    const clause = policy.clauses && policy.clauses.length > 0 ? policy.clauses[0] : null;
    const text = clause ? clause.body_text : '';
    const isCompliant = policy.current_status === 'COMPLIANT';
    
    setScanData({
      scanResult: {
        compliant: isCompliant,
        status: isCompliant ? 'APPROVED' : 'REJECTED',
        jurisdiction: policy.category === 'AI Governance' ? 'EU_ACT' : 'US_CFPB',
        framework: policy.category === 'AI Governance' ? 'EU AI Act' : 'CFPB Rule 1033',
        version_tag: 'v2026.3.0',
        violations: isCompliant ? [] : [{
          clause: '12 CFR § 1033.351(a)(1)',
          parameter: 'max_data_retention_days',
          observed: 90,
          statutory_limit: '30 days',
          error: 'Retention period exceeds statutory cap of 30 days.'
        }],
        audit_block_index: 28,
        audit_hash: '0x531b7208d6df7cb...',
        message: isCompliant ? 'Compliant' : 'Violation detected',
      },
      frameworkId: policy.category === 'AI Governance' ? 'eu_ai' : 'cfpb',
      inputText: text,
      remediatedText: text,
      citation: policy.category === 'AI Governance' ? 'EU Regulation 2024/1689 • Article 14(4)(a)' : '12 CFR § 1033.351(a)(1)',
      organization: policy.organization || 'Apex Financial Technologies LLC',
      docTitle: policy.title,
      sectionLabel: clause?.section_label || 'Section 1.1',
    });
    navigateTo('results');
  };

  return (
    <div className="mesh-gradient-bg text-forest-ink dark:text-slate-100 antialiased font-sans selection:bg-coral selection:text-white min-h-screen relative overflow-x-hidden transition-colors duration-300 flex flex-col">
      
      {/* Architectural Grid Background */}
      <div className="pointer-events-none fixed inset-0 arch-grid -z-10 opacity-70"></div>
      
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-coral-tangerine/15 via-[#ff5722]/10 to-[#10b981]/10 rounded-full blur-2xl opacity-50 -z-10"></div>

      {/* Clean Minimal Header (Logo + Theme + Suite Navigation + User) */}
      <Header
        user={user}
        onNavigate={navigateTo}
        onSignOut={handleSignOut}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        currentPage={currentPage}
        onOpenCICD={() => setIsCICDOpen(true)}
        onOpenConnectors={() => setIsConnectorsOpen(true)}
        onOpenCustomRules={() => setIsCustomRulesOpen(true)}
        onOpenWordAddin={() => setIsWordAddinOpen(true)}
        onOpenGRC={() => setIsGRCOpen(true)}
      />


      {/* Sleek, Unobtrusive Top Notification Banner (Replaces bulky bottom text) */}
      {mascotTip && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-2 animate-fade-in">
          <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-white/95 dark:bg-[#0e1422]/95 border border-coral/30 shadow-xs backdrop-blur-md text-xs font-mono">
            <div className="flex items-center gap-2 text-forest-ink dark:text-slate-200 truncate">
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse flex-shrink-0"></span>
              <span className="text-coral font-bold flex-shrink-0">🦊 Sentinel Inspector:</span>
              <span className="truncate">{mascotTip}</span>
            </div>
            <button 
              onClick={() => setMascotTip(undefined)} 
              className="text-forest-muted dark:text-slate-400 hover:text-coral transition-colors flex-shrink-0 p-0.5 cursor-pointer"
              title="Dismiss alert"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Persistent Statutory Amendment Alert Banner */}
      {statutoryAlert && statutoryAlert.active && currentPage !== 'vault' && (

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-2 animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-red-600 text-white font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg animate-pulse">warning</span>
              <span className="font-bold">Statutory Amendment Detected:</span>
              <span>CFPB Rule 1033 revised. 1 document in your Vault is now non-compliant.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('vault')}
                className="px-3 py-1 rounded-lg bg-white text-red-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                Review Diff &amp; Apply Patch &rarr;
              </button>
              <button
                onClick={() => setStatutoryAlert(null)}
                className="p-1 hover:text-red-200 transition-colors cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided 5-Step Continuous Compliance Workflow Bar */}
      {currentPage !== 'signin' && (
        <GuidedWorkflowBar 
          currentPage={currentPage} 
          onNavigate={navigateTo} 
          onStartQuickDemo={handleStartQuickDemo} 
          milestones={milestones}
        />
      )}

      {/* Multi-Page Step Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 relative">

        
        {currentPage === 'landing' && (
          <LandingPage
            onStart={() => {
              if (user) {
                navigateTo('upload');
              } else {
                navigateTo('signin');
              }
            }}
            onDemoLogin={() => {
              handleLoginSuccess({
                name: 'Alex Vance',
                role: 'LEAD COUNSEL',
                email: 'alex.vance@regdiff.internal',
                organization: 'Apex Financial Technologies LLC',
              });
            }}
          />
        )}

        {currentPage === 'signin' && (
          <SignInPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => navigateTo('landing')}
          />
        )}

        {currentPage === 'vault' && (
          <VaultPage
            onNewScan={() => navigateTo('upload')}
            onViewPolicy={handleViewVaultPolicy}
            onGoToSentinel={() => navigateTo('sentinel')}
            statutoryAlert={statutoryAlert}
            onDismissAlert={() => setStatutoryAlert(null)}
          />
        )}

        {currentPage === 'sentinel' && (
          <SentinelPage
            onGoToVault={() => navigateTo('vault')}
            onRefreshData={loadData}
            onSimulateLawShift={() => {
              setStatutoryAlert({
                active: true,
                statute: 'CFPB Rule 1033',
                description: 'CFPB Rule 1033 amended: allowable retention reduced from 90 days to 30 days. 1 document in your Vault is now non-compliant.'
              });
              setMascotTip("⚠️ Statutory amendment detected: CFPB Rule 1033 revised. Vault policy status flipped to CRITICAL BREACH.");
              loadData();
            }}
          />
        )}


        {currentPage === 'upload' && (
          <UploadPage
            onScanComplete={handleScanFinished}
          />
        )}

        {currentPage === 'results' && scanData && (
          <ResultsPage
            data={scanData}
            onGoToProof={() => navigateTo('proof')}
            onNewScan={() => navigateTo('upload')}
            onDispatchCounsel={() => setIsCounselOpen(true)}
            onSaveToVault={handleSaveToVault}
            onGoToVault={() => navigateTo('vault')}
            onGoToSentinel={() => navigateTo('sentinel')}
          />
        )}

        {currentPage === 'proof' && (
          <ProofPage
            onNewScan={() => navigateTo('upload')}
            onGoHome={() => navigateTo('landing')}
            initialBlockHeight={ledgerVerification.total_blocks}
            organization={scanData?.organization}
            docTitle={scanData?.docTitle}
            citation={scanData?.citation}
          />
        )}

        {currentPage === 'verify' && (
          <VerifyPage
            onGoHome={() => navigateTo('landing')}
            onGoToIngest={() => navigateTo('upload')}
          />
        )}

      </main>

      {/* Footer (Minimal & Clean) */}
      <footer className="py-6 border-t border-coral/15 dark:border-slate-800 text-center text-xs font-mono text-forest-muted dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RegDiff &copy; 2026 • Automated Regulatory Compliance Enclave</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ledger Block #{ledgerVerification.total_blocks} Verified
          </span>
        </div>
      </footer>

      {/* Exact 3D Fox Mascot Companion in bottom-right corner */}
      <MascotFox onFoxClick={handleFoxClick} />

      {/* Rusty AI Interactive Chatbot Drawer */}
      <MascotChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentPage={currentPage}
        docTitle={scanData?.docTitle}
        frameworkId={scanData?.frameworkId}
        activeClause={scanData?.inputText}
      />

      {/* Dispatch to Counsel Modal */}
      <CounselModal
        isOpen={isCounselOpen}
        onClose={() => setIsCounselOpen(false)}
        onDispatch={() => {
          loadData();
          setMascotTip("PR #108 dispatched! Your legal compliance fix was sealed into the ledger.");
        }}
      />

      {/* CI/CD & Git Compliance Gate Modal */}
      <CICDModal
        isOpen={isCICDOpen}
        onClose={() => setIsCICDOpen(false)}
      />

      {/* Enterprise Connectors Hub Modal (Phase 1) */}
      <ConnectorsModal
        isOpen={isConnectorsOpen}
        onClose={() => setIsConnectorsOpen(false)}
        onSyncComplete={loadData}
      />

      {/* Policy-as-Code Custom Rule Compiler Modal (Phase 2) */}
      <CustomRuleModal
        isOpen={isCustomRulesOpen}
        onClose={() => setIsCustomRulesOpen(false)}
        onRuleCompiled={() => {
          loadData();
          setMascotTip("Deterministic enterprise rule compiled and registered to continuous audit engine.");
        }}
      />

      {/* Microsoft Word 365 Sidebar Add-in Modal */}
      <WordAddinModal
        isOpen={isWordAddinOpen}
        onClose={() => setIsWordAddinOpen(false)}
      />

      {/* Vanta / Drata GRC Evidence Sync Modal */}
      <GRCModal
        isOpen={isGRCOpen}
        onClose={() => setIsGRCOpen(false)}
      />

    </div>
  );
}

export default App;

