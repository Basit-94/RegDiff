import React, { useState } from 'react';
import { runCICDCheck, type CICDCheckResponse } from '../lib/api';

interface CICDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CICDModal: React.FC<CICDModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'workflow' | 'cli'>('simulator');
  const [repo, setRepo] = useState('apex-fintech/core-banking');
  const [branch, setBranch] = useState('feature/analytics-retention');
  const [prNumber, setPrNumber] = useState(108);
  const [filePath, setFilePath] = useState('policies/DATA_RETENTION.md');
  const [policyText, setPolicyText] = useState(
    'Consumer transactional authorization records and biometric telemetry data shall be retained for a duration not to exceed 90 calendar days following account termination.'
  );
  const [frameworkId, setFrameworkId] = useState<'cfpb' | 'eu_ai' | 'nydfs'>('cfpb');

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CICDCheckResponse | null>(null);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [showAdvancedGit, setShowAdvancedGit] = useState(false);

  if (!isOpen) return null;

  const handleRunSim = async (overrideText?: string, overrideFw?: 'cfpb' | 'eu_ai' | 'nydfs', overridePr?: number, overrideBranch?: string) => {
    setRunning(true);
    setResult(null);
    try {
      const res = await runCICDCheck({
        repository: repo,
        branch: overrideBranch || branch,
        commit_sha: 'a7f39b1',
        pr_number: overridePr || prNumber,
        file_path: filePath,
        policy_text: overrideText || policyText,
        framework_id: overrideFw || frameworkId,
      });
      setResult(res);
    } catch (e: any) {
      alert(e.message || 'CI/CD check failed');
    } finally {
      setRunning(false);
    }
  };

  const handleLoadScenario = (scenario: 'breach_90d' | 'compliant_30d' | 'eu_ai_breach') => {
    if (scenario === 'breach_90d') {
      const text = 'Consumer transactional authorization records and biometric telemetry data shall be retained for a duration not to exceed 90 calendar days following account termination.';
      setPolicyText(text);
      setFrameworkId('cfpb');
      setBranch('feature/analytics-retention');
      setPrNumber(108);
      handleRunSim(text, 'cfpb', 108, 'feature/analytics-retention');
    } else if (scenario === 'compliant_30d') {
      const text = 'Consumer transactional authorization records and biometric telemetry data shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding, with cryptographically verifiable audit logs.';
      setPolicyText(text);
      setFrameworkId('cfpb');
      setBranch('patch/cfpb-30day-compliance');
      setPrNumber(109);
      handleRunSim(text, 'cfpb', 109, 'patch/cfpb-30day-compliance');
    } else if (scenario === 'eu_ai_breach') {
      const text = 'Autonomous algorithmic credit scoring and underwriting decisions execute unconditionally without human intervention. In the event of system instability, manual review requests are processed asynchronously via email queues within two (2) hours.';
      setPolicyText(text);
      setFrameworkId('eu_ai');
      setBranch('feature/autonomous-underwriting');
      setPrNumber(112);
      handleRunSim(text, 'eu_ai', 112, 'feature/autonomous-underwriting');
    }
  };

  const workflowYaml = `name: RegDiff Continuous Legal Compliance Gate

# Triggers whenever an engineer proposes code or policy changes
on:
  pull_request:
    paths:
      - 'policies/**'
      - 'contracts/**'
      - 'config/retention.json'
      - 'TERMS.md'
      - 'PRIVACY.md'

jobs:
  statutory-audit:
    name: Audit Regulatory Ceilings (CFPB 1033 & EU AI Act)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run RegDiff Statutory Compliance Gate
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          REGDIFF_API_URL: \${{ secrets.REGDIFF_API_URL || 'https://api.regdiff.internal' }}
        run: |
          python scripts/regdiff-cli.py \\
            --file policies/DATA_RETENTION.md \\
            --framework cfpb \\
            --endpoint "\${REGDIFF_API_URL}/api/v1/policies/cicd_check"`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(workflowYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleCopyCli = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-ink/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0c1220] border border-coral/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-clay-lg flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-coral/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-mono font-bold">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold flex items-center gap-1.5">
                <span>Shift-Left Compliance</span>
                <span className="text-forest-muted dark:text-slate-400">•</span>
                <span className="text-emerald-600 dark:text-emerald-400">Automated GitHub Gate</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Automated Policy Enforcement Gate
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

        {/* Plain-English Educational Banner */}
        <div className="mt-3 p-3.5 rounded-2xl bg-coral/5 border border-coral/20 text-xs font-sans text-forest-muted dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
          <span className="material-symbols-outlined text-coral text-lg flex-shrink-0 mt-0.5">tips_and_updates</span>
          <div>
            <strong className="text-forest-ink dark:text-white font-semibold">How it protects your enterprise: </strong>
            Legal counsel writes policies in Word, but software developers write the code that stores user data. 
            RegDiff&apos;s Policy Gate acts as an automated guardrail in GitHub. If an engineer submits code that breaks a legal ceiling 
            (e.g., storing data for 90 days instead of 30), RegDiff <strong>automatically blocks the merge</strong> and comments a lawyer-approved fix.
          </div>
        </div>

        {/* Tab Navigation with Clear Audiences */}
        <div className="flex items-center gap-2 pt-3 border-b border-coral/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-coral text-coral'
                : 'border-transparent text-forest-muted dark:text-slate-400 hover:text-forest-ink'
            }`}
          >
            <span>🧪</span>
            <span>Interactive Simulator</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-coral/10 text-coral font-normal hidden sm:inline">Try it Live</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-coral text-coral'
                : 'border-transparent text-forest-muted dark:text-slate-400 hover:text-forest-ink'
            }`}
          >
            <span>⚙️</span>
            <span>GitHub CI/CD Config</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 font-normal hidden sm:inline">For DevOps</span>
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'border-coral text-coral'
                : 'border-transparent text-forest-muted dark:text-slate-400 hover:text-forest-ink'
            }`}
          >
            <span>💻</span>
            <span>Developer CLI Tool</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 font-normal hidden sm:inline">Terminal</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          
          {/* TAB 1: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              
              {/* 1-Click Interactive Preset Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-forest-muted dark:text-slate-400">
                    1-Click Test Scenarios (Zero Coding Required)
                  </span>
                  <span className="text-[10px] text-coral font-mono">Click to test instantly &rarr;</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleLoadScenario('breach_90d')}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span>🛑 Scenario A: Breach</span>
                    </div>
                    <div className="text-[10px] text-forest-muted dark:text-slate-400 mt-0.5">
                      Engineer sets 90-day retention under CFPB 1033
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadScenario('compliant_30d')}
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>✅ Scenario B: Compliant</span>
                    </div>
                    <div className="text-[10px] text-forest-muted dark:text-slate-400 mt-0.5">
                      Engineer adopts legal 30-day ceiling
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadScenario('eu_ai_breach')}
                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <span>🤖 Scenario C: AI Violation</span>
                    </div>
                    <div className="text-[10px] text-forest-muted dark:text-slate-400 mt-0.5">
                      Autonomous AI with no human kill-switch
                    </div>
                  </button>
                </div>
              </div>

              {/* Proposed Clause & Statute Selection */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-forest-muted dark:text-slate-400 font-bold uppercase">
                      Proposed Code / Policy Clause in Pull Request
                    </label>
                    <span className="text-[10px] text-coral font-bold">
                      Evaluated Against Federal Statutory Ceilings
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/20 text-forest-ink dark:text-white font-serif text-xs leading-relaxed focus:outline-none focus:border-coral"
                    placeholder="Enter policy clause to test..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-forest-muted dark:text-slate-400 font-bold uppercase">
                      Target Legal Standard
                    </label>
                    <select
                      value={frameworkId}
                      onChange={(e) => setFrameworkId(e.target.value as any)}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/20 text-forest-ink dark:text-white text-xs"
                    >
                      <option value="cfpb">CFPB Rule 1033 (12 CFR § 1033.351 - 30-Day Retention)</option>
                      <option value="eu_ai">EU AI Act (Regulation 2024/1689 Art. 14 - Human Stop-Switch)</option>
                      <option value="nydfs">NYDFS Part 500 (23 NYCRR § 500.06 - 3-Year Audit Logs)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => setShowAdvancedGit(!showAdvancedGit)}
                      className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-forest-ink dark:text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">{showAdvancedGit ? 'expand_less' : 'tune'}</span>
                      <span>{showAdvancedGit ? 'Hide Advanced Git Settings' : 'Custom Git Settings (Optional)'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Git/DevOps Details */}
                {showAdvancedGit && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 space-y-3 animate-fade-in">
                    <div className="text-[10px] font-bold text-coral uppercase tracking-wider">
                      Developer / Repository Parameters
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-forest-muted dark:text-slate-400">Repository</label>
                        <input
                          type="text"
                          value={repo}
                          onChange={(e) => setRepo(e.target.value)}
                          className="w-full mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#0c1220] border border-coral/20 text-forest-ink dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-forest-muted dark:text-slate-400">Target PR #</label>
                        <input
                          type="number"
                          value={prNumber}
                          onChange={(e) => setPrNumber(Number(e.target.value))}
                          className="w-full mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#0c1220] border border-coral/20 text-forest-ink dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-forest-muted dark:text-slate-400">Branch Name</label>
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className="w-full mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#0c1220] border border-coral/20 text-forest-ink dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-forest-muted dark:text-slate-400">File Path</label>
                        <input
                          type="text"
                          value={filePath}
                          onChange={(e) => setFilePath(e.target.value)}
                          className="w-full mt-0.5 p-1.5 rounded-lg bg-white dark:bg-[#0c1220] border border-coral/20 text-forest-ink dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trigger Button */}
              <button
                onClick={() => handleRunSim()}
                disabled={running}
                className="w-full py-3 rounded-xl btn-iridescent text-white font-mono font-bold text-xs shadow-neon-coral flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all hover:scale-[1.01]"
              >
                <span className="material-symbols-outlined text-base">
                  {running ? 'hourglass_top' : 'play_circle'}
                </span>
                <span>{running ? 'Evaluating Against Statutory Gate...' : 'Execute Policy Gate Audit'}</span>
              </button>

              {/* Live Verdict Display */}
              {result && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 space-y-3 font-mono text-xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-coral/15">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-forest-ink dark:text-white">Automated Gate Verdict:</span>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 ${
                        result.status === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/50'
                      }`}>
                        <span>{result.status === 'PASSED' ? '✅ MERGE APPROVED' : '🛑 MERGE BLOCKED'}</span>
                        <span className="opacity-70 text-[10px]">(Exit Code: {result.exit_code})</span>
                      </span>
                    </div>
                  </div>

                  {/* Plain English Explanation of the Verdict */}
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-sans">
                    <div className="font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-coral">gavel</span>
                      <span>Legal Compliance Assessment</span>
                    </div>
                    <p className="text-forest-muted dark:text-slate-300 text-xs leading-relaxed">
                      {result.status === 'BLOCKED' 
                        ? 'The proposed Pull Request violates mandatory statutory ceilings. RegDiff has automatically set the GitHub PR status check to FAILED, blocking engineering from merging non-compliant code into production.'
                        : 'All evaluated parameters conform to statutory limits. The Pull Request is cleared for merging, and an attestation certificate has been mined to the ledger.'}
                    </p>
                    <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400 pt-1">
                      Attestation: Block #{result.audit_block_index} &bull; SHA-256: {result.audit_hash.slice(0, 24)}...
                    </div>
                  </div>

                  {/* GitHub PR Bot Comment Payload */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      <span>GitHub Pull Request Bot Comment (Posted to PR #{prNumber})</span>
                      <span className="text-emerald-400">RFC 6962 Verified</span>
                    </div>
                    <pre className="font-mono text-xs whitespace-pre-wrap text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                      {result.github_markdown_comment}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GITHUB ACTIONS CI/CD WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 font-sans text-xs text-forest-muted dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-forest-ink dark:text-white mb-1">
                  How to install into your team&apos;s GitHub repository:
                </div>
                Copy the file below into <code>.github/workflows/regdiff.yml</code>. Whenever any software engineer opens a pull request that touches terms, policies, or retention settings, GitHub will run this gate automatically.
              </div>

              {/* Visual 3-Step Pipeline Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-sans text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-coral/20 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-coral/15 text-coral font-bold text-xs mx-auto flex items-center justify-center">1</div>
                  <div className="font-bold text-forest-ink dark:text-white text-xs">Developer Push</div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400">Engineer creates PR on GitHub</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-coral/20 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs mx-auto flex items-center justify-center">2</div>
                  <div className="font-bold text-forest-ink dark:text-white text-xs">RegDiff Gate Runs</div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400">Checks CFPB, EU AI Act, NYDFS</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-coral/20 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs mx-auto flex items-center justify-center">3</div>
                  <div className="font-bold text-forest-ink dark:text-white text-xs">Merge or Block</div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400">Blocks breach &amp; posts Track Changes fix</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-forest-muted dark:text-slate-400 text-[11px]">
                  File: <code>.github/workflows/regdiff.yml</code>
                </span>
                <button
                  onClick={handleCopyYaml}
                  className="px-3 py-1.5 rounded-lg bg-coral/10 hover:bg-coral/20 text-coral font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>{copiedYaml ? 'Copied to Clipboard!' : 'Copy Workflow YAML'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {workflowYaml}
              </pre>
            </div>
          )}

          {/* TAB 3: DEVELOPER CLI TOOL */}
          {activeTab === 'cli' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 font-sans text-xs text-forest-muted dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-forest-ink dark:text-white mb-1">
                  What is the Local Enforcement CLI?
                </div>
                A lightweight Python script (<code>scripts/regdiff-cli.py</code>) that software developers can run directly on their laptops before committing code, ensuring zero regulatory bugs ever leave their workstation.
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-forest-muted dark:text-slate-400 text-[11px] font-bold">
                    Command 1: Check Retention Policy (CFPB Rule 1033)
                  </span>
                  <button
                    onClick={() => handleCopyCli('python scripts/regdiff-cli.py --file policies/DATA_RETENTION.md --framework cfpb')}
                    className="px-2.5 py-1 rounded-md bg-coral/10 hover:bg-coral/20 text-coral text-[11px] font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-xs border border-slate-800">
                  python scripts/regdiff-cli.py --file policies/DATA_RETENTION.md --framework cfpb
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-forest-muted dark:text-slate-400 text-[11px] font-bold">
                    Command 2: Check AI Oversight &amp; Kill-Switch (EU AI Act)
                  </span>
                  <button
                    onClick={() => handleCopyCli('python scripts/regdiff-cli.py --file policies/AI_OVERSIGHT.md --framework eu_ai')}
                    className="px-2.5 py-1 rounded-md bg-coral/10 hover:bg-coral/20 text-coral text-[11px] font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-xs border border-slate-800">
                  python scripts/regdiff-cli.py --file policies/AI_OVERSIGHT.md --framework eu_ai
                </div>
              </div>

              {copiedCli && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 text-center animate-fade-in font-bold">
                  ✓ Command copied to clipboard! Paste it into your terminal.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-coral/15 flex items-center justify-between text-xs font-mono">
          <span className="text-forest-muted dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RFC 6962 Sealed &bull; Continuous Legal Enforcement</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-forest-ink dark:text-slate-200 font-bold hover:text-coral transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
