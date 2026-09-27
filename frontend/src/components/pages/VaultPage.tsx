import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchVaultPolicies, 
  deleteVaultPolicy, 
  downloadVaultDocx, 
  loadSampleSuite, 
  clearVaultPolicies, 
  batchRemediateVaultPolicies,
  type Policy 
} from '../../lib/api';
import { ConnectorsModal } from '../ConnectorsModal';

interface VaultPageProps {
  onNewScan: () => void;
  onViewPolicy: (policy: Policy) => void;
  onGoToSentinel: () => void;
  statutoryAlert?: { active: boolean; statute: string; description: string } | null;
  onDismissAlert?: () => void;
  openBatchDiff?: boolean;
  onResetOpenBatchDiff?: () => void;
}

// Department / Scope definition for "What applies to me?"
const DEPARTMENTS = [
  { id: 'ALL', label: 'All Business Units & Roles', icon: 'domain' },
  { id: 'FINTECH', label: 'Banking & Fintech Operations', icon: 'account_balance', matchKeywords: ['banking', 'financial', 'cfpb', 'nydfs', 'token', 'retention', 'sop'] },
  { id: 'AI_OPS', label: 'AI Engineering & ML Ops', icon: 'smart_toy', matchKeywords: ['ai', 'underwriting', 'model', 'override', 'algorithm', 'inference'] },
  { id: 'CYBERSECURITY', label: 'Cybersecurity & Infrastructure', icon: 'shield', matchKeywords: ['cybersecurity', 'audit', 'nydfs', 'log', 'encryption', 'security', 'hipaa'] },
  { id: 'PRIVACY_LEGAL', label: 'Data Privacy & Legal Office', icon: 'policy', matchKeywords: ['privacy', 'gdpr', 'ccpa', 'cpra', 'erasure', 'breach', 'consumer'] },
  { id: 'HEALTHCARE', label: 'Healthcare & HealthTech', icon: 'health_and_safety', matchKeywords: ['health', 'hipaa', 'ephi', 'medical', 'patient'] },
];

const STATUTES = [
  { id: 'ALL', label: 'All Frameworks' },
  { id: 'cfpb', label: 'CFPB Rule 1033', subtitle: 'Consumer Financial Data' },
  { id: 'eu_ai', label: 'EU AI Act', subtitle: 'Human Oversight & Override' },
  { id: 'nydfs', label: 'NYDFS Part 500', subtitle: 'Cybersecurity Audit Logs' },
  { id: 'gdpr', label: 'EU GDPR', subtitle: '72-Hr Breach Notification' },
  { id: 'hipaa', label: 'HIPAA Security', subtitle: 'ePHI & FIPS AES-256' },
  { id: 'ccpa', label: 'CCPA / CPRA', subtitle: 'Consumer Rights Fulfillment' },
];

export const VaultPage: React.FC<VaultPageProps> = ({
  onNewScan,
  onViewPolicy,
  onGoToSentinel,
  statutoryAlert,
  onDismissAlert,
  openBatchDiff,
  onResetOpenBatchDiff,
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState<string | null>(null);
  const [loadingSuite, setLoadingSuite] = useState(false);
  const [clearingVault, setClearingVault] = useState(false);

  // Batch Diff & Multi-Policy Remediation State
  const [isBatchDiffModalOpen, setIsBatchDiffModalOpen] = useState(false);
  const [batchRemediating, setBatchRemediating] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Auto-open modal when requested via navigation prop
  useEffect(() => {
    if (openBatchDiff) {
      setIsBatchDiffModalOpen(true);
      if (onResetOpenBatchDiff) onResetOpenBatchDiff();
    }
  }, [openBatchDiff, onResetOpenBatchDiff]);

  // Advanced Navigation & Customization State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatute, setSelectedStatute] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BREACH' | 'COMPLIANT'>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'OLDEST' | 'BREACH_FIRST' | 'TITLE_ASC'>('BREACH_FIRST');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);

  const loadVault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaultPolicies();
      setPolicies(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load Compliance Vault');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const handleDownloadDocx = async (pol: Policy, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingDocxId(pol.id);
    try {
      await downloadVaultDocx(pol.id, pol.title);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingDocxId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this document from your Compliance Vault?')) return;
    setDeletingId(id);
    try {
      await deleteVaultPolicy(id);
      setPolicies(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message || 'Failed to delete policy');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadSampleSuite = async () => {
    setLoadingSuite(true);
    try {
      await loadSampleSuite();
      await loadVault();
    } catch (e: any) {
      alert(e.message || 'Failed to load sample suite');
    } finally {
      setLoadingSuite(false);
    }
  };

  const handleClearVault = async () => {
    if (!confirm('Are you sure you want to clear your vault? This resets the repository to a clean state.')) return;
    setClearingVault(true);
    try {
      await clearVaultPolicies();
      setPolicies([]);
    } catch (e: any) {
      alert(e.message || 'Failed to clear vault');
    } finally {
      setClearingVault(false);
    }
  };

  const toggleExpandSection = (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedStatute('ALL');
    setSelectedDept('ALL');
    setStatusFilter('ALL');
    setSortBy('RECENT');
  };

  // Helper to test if a policy matches a statute
  const policyMatchesStatute = (p: Policy, statuteId: string) => {
    if (statuteId === 'ALL') return true;
    const cat = (p.category || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const clausesText = (p.clauses || []).map(c => `${c.section_label} ${c.body_text}`).join(' ').toLowerCase();
    const allText = `${cat} ${title} ${clausesText}`;

    if (statuteId === 'cfpb') {
      return cat.includes('data governance') || title.includes('banking') || allText.includes('cfpb') || allText.includes('1033') || allText.includes('retention');
    }
    if (statuteId === 'eu_ai') {
      return cat.includes('ai') || title.includes('underwriting') || allText.includes('1689') || allText.includes('override') || allText.includes('kill-switch');
    }
    if (statuteId === 'nydfs') {
      return cat.includes('cybersecurity') || allText.includes('500') || allText.includes('audit trail') || allText.includes('nydfs');
    }
    if (statuteId === 'gdpr') {
      return cat.includes('privacy') || allText.includes('gdpr') || allText.includes('2016') || allText.includes('supervisory') || allText.includes('72');
    }
    if (statuteId === 'hipaa') {
      return cat.includes('health') || allText.includes('hipaa') || allText.includes('ephi') || allText.includes('164') || allText.includes('fips');
    }
    if (statuteId === 'ccpa') {
      return allText.includes('ccpa') || allText.includes('cpra') || allText.includes('california') || allText.includes('1798');
    }
    return true;
  };

  // Helper to test if a policy matches a department scope
  const policyMatchesDepartment = (p: Policy, deptId: string) => {
    if (deptId === 'ALL') return true;
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept || !dept.matchKeywords) return true;

    const hay = `${p.title} ${p.category} ${p.organization || ''} ${(p.clauses || []).map(c => `${c.section_label} ${c.body_text}`).join(' ')}`.toLowerCase();
    return dept.matchKeywords.some(kw => hay.includes(kw));
  };

  // Filter and sort policies
  const filteredPolicies = useMemo(() => {
    let result = policies.filter((pol) => {
      // 1. Status Filter
      if (statusFilter === 'BREACH' && pol.current_status === 'COMPLIANT') return false;
      if (statusFilter === 'COMPLIANT' && pol.current_status !== 'COMPLIANT') return false;

      // 2. Statute Filter
      if (!policyMatchesStatute(pol, selectedStatute)) return false;

      // 3. Department Filter ("What applies to me?")
      if (!policyMatchesDepartment(pol, selectedDept)) return false;

      // 4. Search Query across title, org, category, and section labels/text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = pol.title.toLowerCase().includes(q);
        const orgMatch = (pol.organization || '').toLowerCase().includes(q);
        const catMatch = (pol.category || '').toLowerCase().includes(q);
        const clauseMatch = (pol.clauses || []).some(
          c => (c.section_label || '').toLowerCase().includes(q) || (c.body_text || '').toLowerCase().includes(q)
        );
        if (!titleMatch && !orgMatch && !catMatch && !clauseMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort policies
    result.sort((a, b) => {
      if (sortBy === 'BREACH_FIRST') {
        const aBreach = a.current_status !== 'COMPLIANT' ? 1 : 0;
        const bBreach = b.current_status !== 'COMPLIANT' ? 1 : 0;
        if (aBreach !== bBreach) return bBreach - aBreach;
        return (b.created_at || '').localeCompare(a.created_at || '');
      }
      if (sortBy === 'RECENT') {
        return (b.created_at || '').localeCompare(a.created_at || '');
      }
      if (sortBy === 'OLDEST') {
        return (a.created_at || '').localeCompare(b.created_at || '');
      }
      if (sortBy === 'TITLE_ASC') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [policies, searchQuery, selectedStatute, selectedDept, statusFilter, sortBy]);

  // Telemetry counts
  const totalCount = policies.length;
  const compliantCount = policies.filter(p => p.current_status === 'COMPLIANT').length;
  const breachCount = totalCount - compliantCount;
  const healthPercent = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100;
  const breachedPolicies = useMemo(() => policies.filter(p => p.current_status !== 'COMPLIANT'), [policies]);

  const handleBatchRemediateAll = async () => {
    setBatchRemediating(true);
    setError(null);
    try {
      const res = await batchRemediateVaultPolicies();
      setPolicies(prev => prev.map(p => ({ ...p, current_status: 'COMPLIANT' })));
      await loadVault();
      setIsBatchDiffModalOpen(false);
      if (onDismissAlert) onDismissAlert();
      setBatchSuccessMsg(`✅ All ${res.remediated_count} breached documents in your Vault have been patched to 100% statutory compliance and sealed into Merkle Ledger Block #${res.audit_block_index}!`);
      setTimeout(() => setBatchSuccessMsg(null), 8000);
    } catch (err: any) {
      console.error('Batch remediation error:', err);
      setError(err.message || 'Batch remediation failed');
    } finally {
      setBatchRemediating(false);
    }
  };

  // Active filters count
  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatute !== 'ALL' || selectedDept !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 text-left space-y-6">
      
      {/* Batch Remediation Success Toast */}
      {batchSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs flex items-center justify-between gap-3 animate-fade-in shadow-clay">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
            <span className="font-bold">{batchSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setBatchSuccessMsg(null)}
            className="p-1 hover:text-emerald-950 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reactive Statutory Amendment Alert Banner */}
      {statutoryAlert && statutoryAlert.active && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in font-mono text-xs shadow-clay">
          <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300">
            <span className="material-symbols-outlined text-xl text-red-600 animate-pulse">warning</span>
            <div>
              <span className="font-bold uppercase tracking-wider">Statutory Amendment Detected:</span>{' '}
              <span className="font-sans text-forest-ink dark:text-slate-200">
                {statutoryAlert.description || 'Statutory threshold revised. 1 document in your Vault is now non-compliant.'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBatchDiffModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              title="Inspect side-by-side legal diffs for all breached policies"
            >
              <span className="material-symbols-outlined text-sm">difference</span>
              <span>Review Diff &amp; Apply Patch &rarr;</span>
            </button>
            <button
              onClick={handleBatchRemediateAll}
              disabled={batchRemediating}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1"
              title="Apply statutory patch to all breached documents in Vault with 1 click"
            >
              <span className={`material-symbols-outlined text-sm ${batchRemediating ? 'animate-spin' : ''}`}>
                {batchRemediating ? 'refresh' : 'bolt'}
              </span>
              <span>{batchRemediating ? 'Patching All...' : '1-Click Auto-Patch All'}</span>
            </button>
            {onDismissAlert && (
              <button
                onClick={onDismissAlert}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Banner & Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coral/15 dark:border-slate-800 pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-coral font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
            <span>Continuous Compliance Vault</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-forest-ink dark:text-white mt-1">
            Enterprise Policy Repository
          </h1>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-mono mt-1">
            Organized compliance repository persistently monitored against statutory mandates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {breachedPolicies.length > 0 && (
            <button
              onClick={() => setIsBatchDiffModalOpen(true)}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse"
              title="Review diff and apply patch to all breached documents"
            >
              <span className="material-symbols-outlined text-sm">difference</span>
              <span>Review Diff &amp; Patch All ({breachedPolicies.length})</span>
            </button>
          )}

          {policies.length > 0 && (
            <button
              onClick={handleClearVault}
              disabled={clearingVault}
              className="px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Reset vault to empty clean slate"
            >
              <span>{clearingVault ? 'Resetting...' : 'Clear Vault'}</span>
            </button>
          )}

          <button
            onClick={onGoToSentinel}
            className="px-4 py-2 rounded-full bg-apricot-100 dark:bg-slate-800 border border-coral/30 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 hover:text-coral transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Open Regulatory Sentinel Statutory Radar"
          >
            <span className="material-symbols-outlined text-sm text-coral">radar</span>
            <span>Regulatory Sentinel</span>
          </button>

          <button
            onClick={() => setIsConnectorsModalOpen(true)}
            className="px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-900/30 border border-blue-500/30 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Connect Enterprise Repositories: Google Drive, Confluence, GitHub Enterprise, Notion"
          >
            <span className="material-symbols-outlined text-sm text-blue-500">hub</span>
            <span>Connectors</span>
          </button>

          <button
            onClick={onNewScan}
            className="btn-iridescent px-4 py-2 rounded-full text-xs font-mono font-bold text-white shadow-neon-coral flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Vault Health Overview Bar */}
      {policies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/25 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold text-xl font-mono">
              {policies.length}
            </div>
            <div>
              <div className="text-xs font-mono text-forest-muted dark:text-slate-400">Total Policies</div>
              <div className="text-lg font-bold text-forest-ink dark:text-white">Active in Repository</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/25 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl font-mono">
              {compliantCount}
            </div>
            <div>
              <div className="text-xs font-mono text-forest-muted dark:text-slate-400">Statutory Compliant</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{healthPercent}% Health Score</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/25 p-5 shadow-xs flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl font-mono ${
              breachCount > 0 ? 'bg-red-500/10 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {breachCount}
            </div>
            <div>
              <div className="text-xs font-mono text-forest-muted dark:text-slate-400">Requires Remediation</div>
              <div className={`text-lg font-bold ${breachCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                {breachCount > 0 ? `${breachCount} Critical Breach${breachCount > 1 ? 'es' : ''}` : 'All Clean'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADVANCED REPOSITORY NAVIGATION: SEARCH, DEPARTMENT & STATUTE FILTERS     */}
      {/* ========================================================================= */}
      {policies.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-5 shadow-clay space-y-4">
          
          {/* Row 1: Real-time Search Input + Department Dropdown + View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Omni-Search Box */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-muted dark:text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies, section numbers (e.g. Section 4.2), keywords, or clauses..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/20 dark:border-slate-800 text-xs font-sans text-forest-ink dark:text-slate-100 placeholder:text-forest-muted focus:outline-none focus:border-coral transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-coral text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* "What Applies to Me?" (Department / Scope Selector) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-forest-muted dark:text-slate-400 uppercase tracking-wider font-bold whitespace-nowrap hidden lg:inline">
                Scope:
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/20 dark:border-slate-800 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 focus:outline-none focus:border-coral cursor-pointer"
                title="Filter by role or business unit"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/20 dark:border-slate-800 text-xs font-mono text-forest-ink dark:text-slate-200 focus:outline-none focus:border-coral cursor-pointer"
            >
              <option value="BREACH_FIRST">🚨 Breaches First</option>
              <option value="RECENT">📅 Most Recent</option>
              <option value="OLDEST">⏳ Oldest First</option>
              <option value="TITLE_ASC">🔤 Title A &rarr; Z</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#070b14] p-1 border border-coral/15">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white dark:bg-slate-800 text-coral shadow-xs'
                    : 'text-forest-muted dark:text-slate-400 hover:text-forest-ink'
                }`}
                title="Detailed Card View"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
                <span>Cards</span>
              </button>

              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-slate-800 text-coral shadow-xs'
                    : 'text-forest-muted dark:text-slate-400 hover:text-forest-ink'
                }`}
                title="High-density Table View"
              >
                <span className="material-symbols-outlined text-sm">table_rows</span>
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Row 2: Status & Statute Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-coral/10 text-xs font-mono">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-forest-muted dark:text-slate-400 uppercase font-bold mr-1">
                Status:
              </span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-forest-muted dark:text-slate-400 hover:text-forest-ink'
                }`}
              >
                All ({policies.length})
              </button>

              <button
                onClick={() => setStatusFilter('BREACH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'BREACH'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>Critical Breaches ({breachCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('COMPLIANT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'COMPLIANT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <span>✓ Conforming ({compliantCount})</span>
              </button>
            </div>

            {/* Statute Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-forest-muted dark:text-slate-400 uppercase font-bold mr-1">
                Statute:
              </span>
              {STATUTES.map((s) => {
                const count = s.id === 'ALL' 
                  ? policies.length 
                  : policies.filter(p => policyMatchesStatute(p, s.id)).length;
                if (count === 0 && s.id !== 'ALL') return null;

                const isSelected = selectedStatute === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStatute(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-coral text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-forest-muted dark:text-slate-400 hover:text-coral'
                    }`}
                  >
                    {s.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Indicator & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-forest-muted dark:text-slate-400 border-t border-coral/10">
              <div className="flex items-center gap-1.5">
                <span>Showing <strong>{filteredPolicies.length}</strong> of <strong>{policies.length}</strong> policies</span>
                {searchQuery && <span>matching &ldquo;{searchQuery}&rdquo;</span>}
              </div>
              <button
                onClick={resetAllFilters}
                className="text-coral hover:underline font-bold cursor-pointer"
              >
                Reset All Filters ✕
              </button>
            </div>
          )}

        </div>
      )}

      {/* Main Vault Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-forest-muted">
            <span className="material-symbols-outlined text-2xl animate-spin text-coral mb-2">sync</span>
            <div>Loading Compliance Vault repository...</div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 font-mono text-xs">
            {error}
          </div>
        ) : policies.length === 0 ? (
          
          /* ========================================================================= */
          /* EMPTY-STATE VIEW: Clean Default Onboarding */
          /* ========================================================================= */
          <div className="rounded-3xl bg-white dark:bg-[#0e1422] border-2 border-dashed border-coral/30 p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-display text-2xl font-bold text-forest-ink dark:text-white">
                Your Compliance Vault is empty.
              </h3>
              <p className="font-sans text-xs text-forest-muted dark:text-slate-400 leading-relaxed">
                Upload your organization's privacy policy, terms, or SOP to initialize automated statutory tracking against federal and EU regulatory ceilings.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onNewScan}
                className="btn-iridescent px-6 py-3 rounded-xl text-white font-bold text-xs shadow-neon-coral flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Upload Policy Document &rarr;</span>
              </button>

              <button
                onClick={handleLoadSampleSuite}
                disabled={loadingSuite}
                className="px-4 py-3 rounded-xl bg-apricot-50 dark:bg-slate-800 hover:bg-apricot-100 dark:hover:bg-slate-700 border border-coral/25 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-60"
                title="Populate the benchmark policies across CFPB 1033, EU AI Act, NYDFS 500, GDPR, HIPAA, CCPA"
              >
                <span className="material-symbols-outlined text-sm text-coral mr-1.5 align-middle">science</span>
                <span>{loadingSuite ? 'Loading Test Suite...' : 'Load Sample Test Suite'}</span>
              </button>
            </div>
          </div>
        ) : filteredPolicies.length === 0 ? (
          
          /* ========================================================================= */
          /* NO MATCHES FOR SEARCH / FILTER */
          /* ========================================================================= */
          <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/25 p-10 text-center space-y-4 animate-fade-in shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-coral/10 text-coral flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-forest-ink dark:text-white">
                No matching policies found
              </h3>
              <p className="text-xs text-forest-muted dark:text-slate-400 font-mono">
                No stored policies match your search query or selected filters.
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl bg-coral text-white text-xs font-mono font-bold cursor-pointer hover:bg-coral/90 transition-colors shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'TABLE' ? (

          /* ========================================================================= */
          /* COMPACT MATRIX / TABLE VIEW (FAST NAVIGATION ACROSS 50+ POLICIES)        */
          /* ========================================================================= */
          <div className="overflow-x-auto rounded-2xl border border-coral/20 dark:border-slate-800 shadow-xs bg-white dark:bg-[#0e1422]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-apricot-50/80 dark:bg-[#080d1a] border-b border-coral/20 dark:border-slate-800 text-[11px] uppercase tracking-wider text-forest-ink dark:text-slate-300">
                  <th className="p-3.5 w-[35%]">Policy Document &amp; Entity</th>
                  <th className="p-3.5 w-[22%]">Statutory Framework</th>
                  <th className="p-3.5 w-[15%]">Sections</th>
                  <th className="p-3.5 w-[16%]">Compliance Status</th>
                  <th className="p-3.5 w-[12%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coral/10 dark:divide-slate-800">
                {filteredPolicies.map((pol) => {
                  const isCompliant = pol.current_status === 'COMPLIANT';
                  return (
                    <tr 
                      key={pol.id}
                      onClick={() => onViewPolicy(pol)}
                      className="align-middle hover:bg-slate-50/70 dark:hover:bg-slate-900/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-serif font-bold text-sm text-forest-ink dark:text-white line-clamp-1">
                          {pol.title}
                        </div>
                        {pol.organization && (
                          <div className="text-[10px] text-forest-muted dark:text-slate-400 mt-0.5">
                            {pol.organization}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-coral/10 text-coral border border-coral/20">
                          {pol.category || 'General Governance'}
                        </span>
                      </td>

                      <td className="p-3.5 text-[11px] text-forest-muted dark:text-slate-400">
                        {pol.clauses?.length || 1} section(s)
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isCompliant
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompliant ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                          <span>{isCompliant ? 'CONFORMING' : 'BREACH'}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDownloadDocx(pol, e)}
                          disabled={downloadingDocxId === pol.id}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 cursor-pointer transition-colors"
                          title="Download Word (.docx) Redline"
                        >
                          <span className="material-symbols-outlined text-base">description</span>
                        </button>
                        <button
                          onClick={() => onViewPolicy(pol)}
                          className="p-1.5 rounded-lg hover:bg-coral/10 text-coral cursor-pointer transition-colors"
                          title="Review Redlines & Certificate"
                        >
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(pol.id, e)}
                          disabled={deletingId === pol.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                          title="Delete from Vault"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* DETAILED CARDS VIEW (WITH SECTION ACCORDIONS & SNIPPETS)                 */
          /* ========================================================================= */
          <div className="grid grid-cols-1 gap-4">
            {filteredPolicies.map((pol) => {
              const isCompliant = pol.current_status === 'COMPLIANT';
              const clauses = pol.clauses || [];
              const firstClause = clauses.length > 0 ? clauses[0] : null;
              const isExpanded = !!expandedSections[pol.id];

              return (
                <div
                  key={pol.id}
                  className={`rounded-2xl bg-white dark:bg-[#0e1422] border p-6 shadow-xs hover:shadow-clay transition-all space-y-4 ${
                    isCompliant 
                      ? 'border-coral/25 dark:border-[#1e293d] hover:border-coral/60' 
                      : 'border-red-500/40 bg-red-500/[0.02]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-coral/10 text-coral border border-coral/20">
                          {pol.category || 'General Governance'}
                        </span>
                        {pol.organization && (
                          <span className="text-[11px] font-mono text-forest-muted dark:text-slate-400">
                            {pol.organization}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-forest-ink dark:text-white">
                        {pol.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                        isCompliant
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isCompliant ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                        <span>{isCompliant ? '100% COMPLIANT' : 'CRITICAL BREACH'}</span>
                      </span>

                      <button
                        onClick={(e) => handleDelete(pol.id, e)}
                        disabled={deletingId === pol.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete from Vault"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {deletingId === pol.id ? 'sync' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Clause Preview */}
                  {firstClause && !isExpanded && (
                    <div className="p-3.5 rounded-xl bg-apricot-50/70 dark:bg-[#090f1e] border border-coral/15 font-sans text-xs text-forest-ink/80 dark:text-slate-300 leading-relaxed">
                      <div className="font-mono text-[10px] text-coral font-bold mb-1 flex items-center justify-between">
                        <span>{firstClause.section_label}</span>
                        {clauses.length > 1 && (
                          <button
                            onClick={(e) => toggleExpandSection(pol.id, e)}
                            className="text-forest-muted dark:text-slate-400 hover:text-coral underline font-mono text-[10px] cursor-pointer"
                          >
                            +{clauses.length - 1} more sections
                          </button>
                        )}
                      </div>
                      <p className="line-clamp-2 italic">
                        &ldquo;{firstClause.body_text}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Expanded Sections Accordion */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-1 animate-fade-in">
                      <div className="text-[11px] font-mono text-coral font-bold flex items-center justify-between">
                        <span>All Indexed Sections in Document ({clauses.length}):</span>
                        <button
                          onClick={(e) => toggleExpandSection(pol.id, e)}
                          className="hover:underline cursor-pointer text-xs"
                        >
                          Collapse ▲
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {clauses.map((clause, cIdx) => (
                          <div 
                            key={clause.id || cIdx} 
                            className="p-3 rounded-xl bg-apricot-50/70 dark:bg-[#090f1e] border border-coral/15 font-sans text-xs text-forest-ink/80 dark:text-slate-300 space-y-1"
                          >
                            <div className="font-mono text-[10px] text-coral font-bold">
                              {clause.section_label}
                            </div>
                            <p className="italic text-[11px] leading-relaxed">
                              &ldquo;{clause.body_text}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-coral/10 text-xs font-mono">
                    <div className="flex items-center gap-3 text-forest-muted dark:text-slate-400 text-[11px]">
                      <span>{clauses.length} indexed section(s)</span>
                      {clauses.length > 1 && (
                        <button
                          onClick={(e) => toggleExpandSection(pol.id, e)}
                          className="text-coral hover:underline font-bold cursor-pointer"
                        >
                          {isExpanded ? 'Collapse Sections' : 'View All Sections ▼'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDownloadDocx(pol, e)}
                        disabled={downloadingDocxId === pol.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] disabled:opacity-60"
                        title="Download Microsoft Word .docx with native Track Changes revisions"
                      >
                        <span className="material-symbols-outlined text-xs text-blue-400">description</span>
                        <span>{downloadingDocxId === pol.id ? 'Generating...' : 'Word (.docx)'}</span>
                      </button>

                      <button
                        onClick={() => onViewPolicy(pol)}
                        className="px-3.5 py-1.5 rounded-lg bg-coral/10 hover:bg-coral/20 text-coral font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Review Redlines &amp; Certificate</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Workflow Banner: Step 2 -> Step 3 */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-coral/15 via-apricot-500/10 to-purple-500/15 border-2 border-coral/40 shadow-clay dark:shadow-dark-clay space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-coral font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
              <span>Next Milestone: Step 3 of 5</span>
            </div>
            <h3 className="font-display font-bold text-lg text-forest-ink dark:text-white">
              Regulatory Sentinel Radar &amp; Federal Register Surveillance
            </h3>
            <p className="text-xs text-forest-muted dark:text-slate-300">
              Surveil live Federal Register rule amendments, test legislative shift simulations against your Vault policies, and trigger autonomous webhook alerts.
            </p>
          </div>

          <button
            onClick={onGoToSentinel}
            className="btn-iridescent px-6 py-3.5 rounded-full text-white font-bold text-xs sm:text-sm shadow-neon-coral flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 transform hover:-translate-y-0.5 transition-all"
          >
            <span>Proceed to Sentinel Radar &rarr;</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Enterprise Repositories Connector Modal */}
      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
        onSyncComplete={loadVault}
      />

      {/* Batch Diff & Statutory Remediation Modal */}
      {isBatchDiffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white dark:bg-[#0e1422] border-2 border-coral/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-coral/20 bg-gradient-to-r from-coral/15 via-red-500/10 to-transparent flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-coral uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  <span>1-Click Multi-Policy Statutory Diff &amp; Remediation</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-forest-ink dark:text-white">
                  Review Policy Diffs &amp; Batch Apply Patches
                </h2>
                <p className="text-xs text-forest-muted dark:text-slate-400 font-mono">
                  {breachedPolicies.length} breached documents identified. Review side-by-side AST deltas below and patch all documents simultaneously.
                </p>
              </div>

              <button
                onClick={() => setIsBatchDiffModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-forest-ink dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-apricot-50 dark:bg-[#070b14] border border-coral/20">
                <div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase font-bold">Affected Documents</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">{breachedPolicies.length} Policies</div>
                </div>
                <div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase font-bold">Statutory Frameworks</div>
                  <div className="text-xs font-bold text-forest-ink dark:text-slate-200 mt-1">CFPB 1033 • EU AI Act • NYDFS 500</div>
                </div>
                <div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400 uppercase font-bold">Evidentiary Standard</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">FRE 902(13) Merkle Certified</div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-red-600">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* List of Policies with Side-by-Side Diff */}
              <div className="space-y-4">
                <div className="font-bold text-forest-ink dark:text-slate-200 flex items-center justify-between">
                  <span>Policy Breach Diffs ({breachedPolicies.length}):</span>
                  <span className="text-[10px] text-forest-muted dark:text-slate-400 font-normal">
                    Red = Breached Statutory Language • Green = Remediated Enforceable Language
                  </span>
                </div>

                {breachedPolicies.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-3xl mb-1">check_circle</span>
                    <div className="font-bold text-sm">All Vault Policies are 100% Compliant!</div>
                    <div className="text-xs opacity-80 mt-1">No outstanding statutory breaches detected.</div>
                  </div>
                ) : (
                  breachedPolicies.map((pol, idx) => {
                    const clause = pol.clauses && pol.clauses.length > 0 ? pol.clauses[0] : null;
                    const origText = clause ? clause.body_text : 'Original clause text';
                    
                    // Generate remediation preview
                    let remediatedText = origText;
                    const catLower = (pol.category || '').toLowerCase();
                    const titleLower = pol.title.toLowerCase();
                    const origLower = origText.toLowerCase();

                    if (catLower.includes('ai') || titleLower.includes('ai') || origLower.includes('algorithm') || origLower.includes('override')) {
                      remediatedText = 'The automated decision scoring pipeline implements an immediate synchronous human override kill-switch with an enforced latency ceiling of ≤420ms, and mandates quarterly independent algorithmic bias audits guaranteeing an Adverse Impact Ratio of ≥80.0% across all protected groups.';
                    } else if (catLower.includes('cyber') || origLower.includes('500') || origLower.includes('audit log')) {
                      remediatedText = 'System access and administrative activities shall be continuously streamed to an append-only SHA-256 cryptographic ledger with 3-year retention, tamper-evident hash chaining, and mandatory MFA token rotation.';
                    } else if (catLower.includes('privacy') || origLower.includes('gdpr') || origLower.includes('supervisory')) {
                      remediatedText = 'In the event of a personal data breach, the Data Protection Officer shall notify the competent supervisory authority without undue delay and, where feasible, not later than 72 hours after having become aware of it per GDPR Article 33.';
                    } else if (catLower.includes('health') || origLower.includes('hipaa') || origLower.includes('ephi')) {
                      remediatedText = 'All electronic protected health information (ePHI) at rest and in transit shall be encrypted utilizing FIPS 140-2 validated AES-256 bit encryption under 45 CFR § 164.312(a)(2)(iv), with individual breach notifications dispatched without unreasonable delay and in no case later than 60 calendar days.';
                    } else if (catLower.includes('ccpa') || origLower.includes('cpra') || origLower.includes('california')) {
                      remediatedText = 'Consumer requests to exercise CCPA/CPRA rights (access, deletion, correction) shall be fulfilled within forty-five (45) calendar days pursuant to Cal. Civ. Code § 1798.130, and opt-out requests processed within fifteen (15) business days.';
                    } else {
                      remediatedText = origText.replace(/ninety\s*\(\s*90\s*\)\s*calendar\s*days/gi, 'thirty (30) calendar days')
                        .replace(/90\s*days/gi, '30 days')
                        .replace(/90\s*calendar\s*days/gi, '30 calendar days');
                      if (remediatedText === origText) {
                        remediatedText = 'Customer telemetry and authorization tokens shall be expunged from all active stores within a mandatory ceiling of thirty (30) calendar days subsequent to user offboarding, with cryptographically verifiable audit logs.';
                      }
                    }

                    return (
                      <div key={pol.id || idx} className="p-4 rounded-2xl bg-white dark:bg-[#070b14] border border-coral/25 space-y-3">
                        <div className="flex items-center justify-between border-b border-coral/15 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-red-500/20 text-red-600 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-forest-ink dark:text-white">{pol.title}</span>
                            <span className="text-[10px] text-forest-muted dark:text-slate-400">({pol.organization})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px]">
                            {clause?.section_label || 'Section 1.1'} • {pol.category}
                          </span>
                        </div>

                        {/* Side-by-Side Diff Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Original Breached Clause */}
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-red-700 dark:text-red-300 font-bold uppercase">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">remove_circle</span>
                                <span>Original (Breached)</span>
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px]">NON-COMPLIANT</span>
                            </div>
                            <div className="font-serif text-xs text-red-950 dark:text-red-200 leading-relaxed">
                              “{origText}”
                            </div>
                          </div>

                          {/* Remediated Compliant Clause */}
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">add_circle</span>
                                <span>Statutory Remediation Patch</span>
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px]">ENFORCED</span>
                            </div>
                            <div className="font-serif text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                              “{remediatedText}”
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-coral/20 bg-apricot-50/70 dark:bg-[#070b14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
              <div className="text-xs text-forest-muted dark:text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-coral text-sm">lock</span>
                <span>Applying patch creates an immutable SHA-256 Merkle Ledger block.</span>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsBatchDiffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={handleBatchRemediateAll}
                  disabled={batchRemediating || breachedPolicies.length === 0}
                  className="btn-iridescent px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-neon-coral flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${batchRemediating ? 'animate-spin' : ''}`}>
                    {batchRemediating ? 'refresh' : 'bolt'}
                  </span>
                  <span>
                    {batchRemediating 
                      ? 'Applying Patches & Sealing Ledger...' 
                      : `Apply Patch to All ${breachedPolicies.length} Policies (1-Click) →`}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
