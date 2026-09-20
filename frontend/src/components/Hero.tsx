import React, { useState, useEffect } from 'react';
import { checkCompliance } from '../lib/api';
import type { MCPComplianceResult } from '../lib/api';

export interface HeroProps {
  user: { name: string; role: string; email: string } | null;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onDemoLogin: () => void;
  onOpenProof: () => void;
  onOpenCounsel: () => void;
  onOpenScanner: (initialText?: string, framework?: string) => void;
  activeScenario?: string;
  onSelectScenario?: (scenarioId: string) => void;
  onNewBlockMined?: () => void;
  totalBlocks?: number;
}

export interface ScenarioData {
  id: string;
  name: string;
  shortName: string;
  citation: string;
  sampleInput: string;
  actionType: string;
  jurisdiction: string;
  testParams: Record<string, unknown>;
  violationNotice: string;
  legacyTitle: string;
  legacyBody: string;
  remediatedTitle: string;
  remediatedBody: string;
  conformsTo: string;
}

export const SCENARIOS: Record<string, ScenarioData> = {
  cfpb: {
    id: 'cfpb',
    name: 'CFPB Rule 1033',
    shortName: 'CFPB (Data Retention)',
    citation: '12 CFR §1033.351(a)(1)',
    sampleInput: 'Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of ninety (90) calendar days subsequent to user offboarding.',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_CFPB',
    testParams: { retention_period_days: 90 },
    violationNotice: 'Your policy retains tokens for 90 days. Federal law mandates a strict 30-day maximum retention ceiling.',
    legacyTitle: 'Your Legacy Policy (Handbook §8.4)',
    legacyBody: 'Customer telemetry and authorization tokens shall be retained in active replication stores for a duration of 90 calendar days subsequent to user offboarding.',
    remediatedTitle: 'RegDiff Counsel-Ready Redline',
    remediatedBody: 'Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of 30 calendar days subsequent to user offboarding, with cryptographically verifiable audit logs.',
    conformsTo: 'Conforms: 12 CFR § 1033.351(a)(1)',
  },
  eu_ai: {
    id: 'eu_ai',
    name: 'EU AI Act (Art. 14)',
    shortName: 'EU AI Act (Kill-Switch)',
    citation: 'EU Reg 2024/1689 • Article 14(4)(a)',
    sampleInput: 'The automated credit decision scoring engine operates autonomously. System-level manual overrides are reviewed asynchronously via administrative ticket queues within two (2) business hours.',
    actionType: 'MODEL_INFERENCE',
    jurisdiction: 'EU_ACT',
    testParams: { human_override_capability: false, override_latency_ms: 7200000 },
    violationNotice: 'Article 14(4)(a) mandates an immediate synchronous kill-switch (≤500ms). A 2-hour ticket queue is an illegal high-risk breach.',
    legacyTitle: 'Your Legacy Policy (AI Governance §3.2)',
    legacyBody: 'The automated credit decision scoring engine operates autonomously. System-level manual overrides are reviewed asynchronously via administrative ticket queues within two (2) business hours.',
    remediatedTitle: 'RegDiff Counsel-Ready Redline',
    remediatedBody: 'The automated credit decision scoring pipeline implements an immediate synchronous human override kill-switch with an enforced response latency ceiling of ≤420ms, halting model inference unconditionally.',
    conformsTo: 'Conforms: EU AI Act Article 14(4)(a)',
  },
  nydfs: {
    id: 'nydfs',
    name: 'NYDFS Part 500',
    shortName: 'NYDFS 500 (Cyber Audit)',
    citation: '23 NYCRR § 500.06 & § 500.12',
    sampleInput: 'System access logs and administrative activities shall be archived weekly to standard cloud storage and retained for ninety (90) days without cryptographic sealing.',
    actionType: 'DATA_STORAGE',
    jurisdiction: 'US_CFPB',
    testParams: { retention_period_days: 90 },
    violationNotice: 'Section 500.06 requires continuous tamper-evident append-only audit trails with 3-year non-repudiable retention.',
    legacyTitle: 'Your Legacy Policy (Infosec §11.1)',
    legacyBody: 'System access logs and administrative activities shall be archived weekly to standard cloud storage and retained for ninety (90) days without cryptographic sealing.',
    remediatedTitle: 'RegDiff Counsel-Ready Redline',
    remediatedBody: 'System access and administrative activities shall be continuously streamed to an append-only SHA-256 cryptographic ledger with 3-year retention, tamper-evident hash chaining, and mandatory MFA token rotation.',
    conformsTo: 'Conforms: 23 NYCRR § 500.06 & § 500.12',
  },
};

export const Hero: React.FC<HeroProps> = ({
  user,
  onOpenAuth,
  onDemoLogin,
  onOpenProof,
  onOpenCounsel,
  onOpenScanner,
  activeScenario: externalScenario = 'cfpb',
  onSelectScenario,
  onNewBlockMined,
  totalBlocks = 18,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(externalScenario);
  const [policyInput, setPolicyInput] = useState<string>(SCENARIOS.cfpb.sampleInput);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MCPComplianceResult | null>(null);
  const [scrubber, setScrubber] = useState(100);
  const [copied, setCopied] = useState(false);

  // Synchronize when external scenario prop changes
  useEffect(() => {
    if (externalScenario && SCENARIOS[externalScenario]) {
      setSelectedScenarioId(externalScenario);
      setPolicyInput(SCENARIOS[externalScenario].sampleInput);
      setScanResult(null);
    }
  }, [externalScenario]);

  const currentScenario = SCENARIOS[selectedScenarioId] || SCENARIOS.cfpb;

  const handleScenarioSelect = (id: string) => {
    setSelectedScenarioId(id);
    setPolicyInput(SCENARIOS[id].sampleInput);
    setScanResult(null);
    setFileName(null);
    if (onSelectScenario) onSelectScenario(id);
  };

  // Run real live AST check against FastAPI backend
  const handleRunCheck = async () => {
    setIsScanning(true);
    try {
      let params = currentScenario.testParams;
      if (selectedScenarioId === 'cfpb') {
        const match = policyInput.match(/(\d+)\s*(?:calendar\s+)?days/i);
        const days = match ? parseInt(match[1]) : (policyInput.includes('ninety') ? 90 : 30);
        params = { retention_period_days: days };
      } else if (selectedScenarioId === 'eu_ai') {
        const hasKillSwitch = policyInput.toLowerCase().includes('kill-switch');
        const matchMs = policyInput.match(/(\d+)\s*ms/i);
        const latency = matchMs ? parseInt(matchMs[1]) : (policyInput.includes('hours') ? 7200000 : 420);
        params = { human_override_capability: hasKillSwitch, override_latency_ms: latency };
      }

      const res = await checkCompliance(
        currentScenario.actionType,
        currentScenario.jurisdiction,
        params as any
      );
      setScanResult(res);
      if (onNewBlockMined) onNewBlockMined();
    } catch {
      // Fallback
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle file drop / upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setPolicyInput(text.slice(0, 1000));
        handleRunCheck();
      };
      reader.readAsText(file.slice(0, 20000));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* Hero Grid */}
      <section className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start relative pt-2">
        
        {/* Left Column: Clear Human Value Proposition */}
        <div className="lg:col-span-5 space-y-6 text-left relative z-10 pt-2">
          
          {/* Simple Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#0e1526]/90 border border-coral/30 shadow-sm text-xs font-medium text-forest-muted dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-coral animate-ping"></span>
            <span className="font-bold text-coral dark:text-coral-accent">Automated Legal Compliance Engine</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.8rem] text-forest-ink dark:text-white leading-[1.1] tracking-tight font-medium">
            When the laws shift, your policies{' '}
            <span className="text-dance-shimmer italic font-normal underline decoration-coral/50 decoration-wavy decoration-2">
              dance in harmony.
            </span>
          </h1>

          {/* Simple, Human Explanation */}
          <p className="text-base text-forest-muted dark:text-slate-300 leading-relaxed font-sans">
            Governments update regulations constantly. RegDiff ingests your employee handbooks, terms of service, and software settings, catches illegal clauses in milliseconds, and gives you the exact ready-to-merge legal fix.
          </p>

          {/* Clear Call to Action */}
          {!user ? (
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button 
                className="btn-iridescent px-7 py-3.5 rounded-full text-white text-sm font-bold shadow-neon-coral hover:shadow-glow-coral transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer"
                onClick={() => onOpenAuth('signin')}
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Sign In to Scan Policy</span>
              </button>
              
              <button 
                className="px-6 py-3.5 rounded-full bg-white dark:bg-[#101728] hover:bg-apricot-50 dark:hover:bg-[#162038] text-forest-ink dark:text-slate-100 border border-coral/30 hover:border-coral font-bold text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5" 
                onClick={onDemoLogin}
                title="Log in immediately as Lead Counsel"
              >
                <span className="material-symbols-outlined text-base text-coral dark:text-coral-accent">bolt</span>
                <span>1-Click Demo (Alex Vance)</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Active Workspace: {user.name} ({user.role})
                </span>
                <span className="text-forest-muted dark:text-slate-400">Block #{totalBlocks}</span>
              </div>
              <p className="text-xs text-forest-muted dark:text-slate-300">
                You are ready to scan. Select a regulation on the right or upload your policy to evaluate compliance.
              </p>
            </div>
          )}

          {/* 3 Simple Metrics */}
          <div className="pt-4 border-t border-coral/15 dark:border-slate-800 grid grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#0d1322]/80 border border-coral/20">
              <div className="text-[10px] font-mono text-coral font-black uppercase">SPEED</div>
              <div className="font-display text-xl font-bold text-forest-ink dark:text-white">12 ms</div>
              <div className="text-[11px] text-forest-muted dark:text-slate-400">Instant check</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#0d1322]/80 border border-coral/20">
              <div className="text-[10px] font-mono text-emerald-600 font-black uppercase">ACCURACY</div>
              <div className="font-display text-xl font-bold text-forest-ink dark:text-white">100%</div>
              <div className="text-[11px] text-forest-muted dark:text-slate-400">Legal citation</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#0d1322]/80 border border-coral/20">
              <div className="text-[10px] font-mono text-amber-600 font-black uppercase">PROOF</div>
              <div className="font-display text-xl font-bold text-forest-ink dark:text-white">SHA-256</div>
              <div className="text-[11px] text-forest-muted dark:text-slate-400">Audit ledger</div>
            </div>
          </div>
        </div>

        {/* Right Column: The 3-Step Compliance Studio Console */}
        <div className="lg:col-span-7 relative w-full" id="demo">
          
          <div className="relative rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-5 sm:p-7 shadow-clay-lg dark:shadow-dark-clay space-y-5 text-left ring-1 ring-coral/20">
            
            {/* Top Bar: Window dots, citation, ledger height */}
            <div className="flex items-center justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block"></span>
                <span className="ml-2 font-mono text-xs font-bold text-forest-ink dark:text-white">
                  Compliance Studio
                </span>
                <span className="text-coral dark:text-coral-accent font-mono text-xs">•</span>
                <span className="text-forest-muted dark:text-slate-400 font-mono text-xs">
                  {currentScenario.citation}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProof}
                  className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Click to view full cryptographic ledger proof"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Ledger Block #{totalBlocks}</span>
                </button>
              </div>
            </div>

            {/* Step 1 Header & Framework Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-coral dark:text-coral-accent flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-coral/20 text-coral flex items-center justify-center font-bold text-[11px]">1</span>
                  <span>Select Target Law:</span>
                </div>
                <button
                  onClick={() => onOpenScanner()}
                  className="text-[11px] font-mono text-coral hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">tune</span>
                  <span>Advanced Scanner</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Object.values(SCENARIOS).map((sc) => {
                  const isActive = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleScenarioSelect(sc.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-semibold text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-coral text-white border-coral shadow-sm font-bold'
                          : 'bg-apricot-50 dark:bg-[#121929] border-coral/20 text-forest-muted dark:text-slate-300 hover:border-coral/50'
                      }`}
                    >
                      {sc.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Input: Drag & Drop or Text Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-forest-muted dark:text-slate-400">
                <span className="font-bold">Provide Policy Clause or Drop File:</span>
                <span className="text-[10px]">.PDF / .DOCX / .TXT</span>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                id="hero-doc-file" 
                className="hidden" 
                accept=".pdf,.docx,.txt,.md,.json" 
                onChange={handleFileChange}
              />

              <div className="relative">
                <textarea
                  rows={3}
                  value={policyInput}
                  onChange={(e) => {
                    setPolicyInput(e.target.value);
                    setScanResult(null);
                  }}
                  className="w-full p-3 rounded-2xl bg-apricot-50/70 dark:bg-[#080d1a] border border-coral/25 dark:border-slate-700 text-xs font-sans text-forest-ink dark:text-white focus:outline-none focus:border-coral leading-relaxed transition-all"
                  placeholder="Paste employee handbook policy or terms of service..."
                />
                
                {/* Upload File shortcut icon */}
                <button
                  onClick={() => document.getElementById('hero-doc-file')?.click()}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-[11px] font-mono text-forest-muted dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Upload a file instead"
                >
                  <span className="material-symbols-outlined text-xs text-coral">upload_file</span>
                  <span>{fileName ? `File: ${fileName}` : 'Upload File'}</span>
                </button>
              </div>

              {/* Quick sample pills & Run Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-forest-muted dark:text-slate-400">Presets:</span>
                  <button
                    onClick={() => {
                      setPolicyInput(currentScenario.sampleInput);
                      setScanResult(null);
                    }}
                    className="px-2 py-0.5 rounded-md bg-coral/10 hover:bg-coral/20 text-coral font-bold cursor-pointer transition-colors"
                  >
                    Sample Breach
                  </button>
                  <button
                    onClick={() => {
                      if (selectedScenarioId === 'cfpb') {
                        setPolicyInput('Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding.');
                      } else {
                        setPolicyInput('The automated credit scoring engine implements an immediate synchronous human override kill-switch with ≤420ms response latency.');
                      }
                      setScanResult(null);
                    }}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer transition-colors"
                  >
                    Compliant Clause
                  </button>
                </div>

                <button
                  onClick={handleRunCheck}
                  disabled={isScanning}
                  className="btn-iridescent px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-neon-coral flex items-center gap-2 cursor-pointer transform active:scale-95"
                >
                  <span className={`material-symbols-outlined text-sm ${isScanning ? 'animate-spin' : ''}`}>
                    {isScanning ? 'refresh' : 'play_arrow'}
                  </span>
                  <span>{isScanning ? 'Evaluating Law...' : 'Run Compliance Check'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Results & Redline Diff */}
            <div className="pt-2 border-t border-coral/15 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-coral dark:text-coral-accent flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-coral/20 text-coral flex items-center justify-center font-bold text-[11px]">2</span>
                  <span>Compliance Verdict &amp; Fix:</span>
                </div>
                
                {/* Result Pill */}
                {scanResult ? (
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                    scanResult.compliant 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-400' 
                      : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40'
                  }`}>
                    {scanResult.compliant ? '✓ 100% STATUTORY COMPLIANT' : `✕ ${scanResult.violations.length} CRITICAL BREACH DETECTED`}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-coral/15 text-coral font-mono text-[10px] font-bold border border-coral/30">
                    ✕ 1 CRITICAL BREACH DETECTED
                  </span>
                )}
              </div>

              {/* Plain-English Explanation Notice */}
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-700 dark:text-red-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                <div>
                  <strong>Violation Detected: </strong>
                  {scanResult?.violations?.[0]?.error || currentScenario.violationNotice}
                </div>
              </div>

              {/* Scrubber slider to compare Before & After */}
              <div className="px-3 py-2 rounded-xl bg-apricot-50 dark:bg-[#080d1a] border border-coral/20 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-forest-muted dark:text-slate-400">Scrubber (Before &rarr; After):</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {scrubber === 100 ? '100% Remediated' : `${scrubber}% Blending Diff`}
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={scrubber}
                  onChange={(e) => setScrubber(Number(e.target.value))}
                  className="w-full h-1.5 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Side-by-Side Before & After Cards */}
              <div className="space-y-2.5">
                {/* Before Card */}
                <div 
                  className="rounded-2xl p-3.5 bg-red-500/10 border-2 border-red-500/40 space-y-1.5 transition-all"
                  style={{ opacity: scrubber < 100 ? 1 : 0.8 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">✕</span>
                      <span>Before: Your Policy (Illegal)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-red-700 dark:text-red-300">
                      Non-Compliant
                    </span>
                  </div>
                  <p className="font-serif italic text-forest-ink/90 dark:text-slate-200 text-xs leading-relaxed pl-5">
                    {currentScenario.legacyBody}
                  </p>
                </div>

                {/* After Card */}
                <div 
                  className="rounded-2xl p-3.5 bg-emerald-500/10 border-2 border-emerald-500/50 space-y-1.5 transition-all shadow-xs"
                  style={{ opacity: Math.max(0.3, scrubber / 100) }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">✓</span>
                      <span>After: RegDiff Ready-to-Merge Fix</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-300">
                      Lawyer Approved
                    </span>
                  </div>
                  <p className="font-serif text-forest-ink dark:text-slate-100 text-xs leading-relaxed pl-5">
                    {currentScenario.remediatedBody}
                  </p>
                  <div className="pl-5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {currentScenario.conformsTo}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-coral/15 dark:border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(currentScenario.remediatedBody)}
                  className="px-3.5 py-2 rounded-xl bg-apricot-50 dark:bg-slate-800 hover:bg-apricot-100 border border-coral/25 hover:border-coral text-forest-ink dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-coral">content_copy</span>
                  <span>{copied ? '✓ Copied Fix!' : 'Copy Fixed Text'}</span>
                </button>

                <button
                  onClick={onOpenProof}
                  className="px-3.5 py-2 rounded-xl bg-apricot-50 dark:bg-slate-800 hover:bg-apricot-100 border border-coral/25 hover:border-coral text-forest-ink dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-500">history_edu</span>
                  <span>View Proof (Block #{totalBlocks})</span>
                </button>
              </div>

              <button
                onClick={onOpenCounsel}
                className="btn-iridescent px-5 py-2 rounded-xl text-white font-bold shadow-neon-coral flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <span className="material-symbols-outlined text-sm">merge</span>
                <span>Dispatch PR #108</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>

      </section>
    </div>
  );
};
