import React, { useState, useEffect } from 'react';
import { fetchCustomRules, compileCustomRule, type CustomRuleItem } from '../lib/api';

interface CustomRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCompiled?: (rule: CustomRuleItem) => void;
}

export const CustomRuleModal: React.FC<CustomRuleModalProps> = ({
  isOpen,
  onClose,
  onRuleCompiled,
}) => {
  const [rules, setRules] = useState<CustomRuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  
  // Builder form state
  const [ruleName, setRuleName] = useState('Vendor Telemetry Ceiling (14-Day Limit)');
  const [department, setDepartment] = useState('Vendor Risk & Cloud Infrastructure');
  const [paramKey, setParamKey] = useState('max_data_retention_days');
  const [operator, setOperator] = useState('<=');
  const [expectedValue, setExpectedValue] = useState('14');
  const [statuteRef, setStatuteRef] = useState('Corporate Internal Governance Standard § 3.2');
  const [testClause, setTestClause] = useState('All third-party vendor logs shall be retained in operational storage for thirty (30) calendar days prior to destruction.');
  
  const [compileResult, setCompileResult] = useState<{
    success: boolean;
    rule_id: string;
    rule_hash: string;
    evaluation_result?: {
      compliant: boolean;
      message: string;
      extracted_parameters: Record<string, unknown>;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRules();
    }
  }, [isOpen]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomRules();
      setRules(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    setCompileResult(null);
    try {
      const res = await compileCustomRule({
        rule_name: ruleName,
        department,
        parameter_key: paramKey,
        operator,
        expected_value: expectedValue,
        statute_reference: statuteRef,
        test_clause: testClause,
      });
      setCompileResult(res);
      await loadRules();
      if (onRuleCompiled) {
        onRuleCompiled({
          rule_id: res.rule_id,
          rule_name: ruleName,
          department,
          parameter_key: paramKey,
          operator,
          expected_value: expectedValue,
          statute_reference: statuteRef,
          rule_hash: res.rule_hash,
          created_at: res.registered_at,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-coral/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">code_blocks</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Policy-as-Code Compiler (Phase 2)</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Custom Enterprise Ruleset Builder
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
        <div className="p-4 rounded-2xl bg-apricot-50/70 dark:bg-[#070b14] border border-coral/15 text-xs font-sans text-forest-ink/90 dark:text-slate-200">
          <p className="leading-relaxed">
            Translate internal company governance policies, data sovereignty requirements, or specific vendor SLAs into <strong>deterministic AST assertions</strong> that run continuously across the Policy Vault and Policy Gate.
          </p>
        </div>

        {/* Builder Form */}
        <form onSubmit={handleCompile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                Target Department / Scope
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                AST Parameter Key
              </label>
              <select
                value={paramKey}
                onChange={(e) => setParamKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
              >
                <option value="max_data_retention_days">max_data_retention_days</option>
                <option value="max_consumer_request_days">max_consumer_request_days</option>
                <option value="min_audit_log_retention_days">min_audit_log_retention_days</option>
                <option value="human_override_latency_ms">human_override_latency_ms</option>
                <option value="require_fips_encryption">require_fips_encryption</option>
                <option value="require_dedicated_tenancy">require_dedicated_tenancy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
              >
                <option value="<=">&le; (Maximum Ceiling)</option>
                <option value=">=">&ge; (Minimum Standard)</option>
                <option value="==">== (Exact Match / Boolean)</option>
                <option value="!=">!= (Prohibited)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                Target / Expected Ceiling
              </label>
              <input
                type="text"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
              Internal Statute / Standard Reference
            </label>
            <input
              type="text"
              value={statuteRef}
              onChange={(e) => setStatuteRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
              Sample Clause for Live AST Evaluation &amp; Test Run
            </label>
            <textarea
              rows={2}
              value={testClause}
              onChange={(e) => setTestClause(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={compiling}
            className="w-full py-2.5 rounded-xl bg-coral hover:bg-coral-vivid text-white font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {compiling ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Compiling AST Assertion...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">terminal</span>
                <span>Compile &amp; Register Deterministic Rule</span>
              </>
            )}
          </button>
        </form>

        {/* Live Compilation / Test Result */}
        {compileResult && (
          <div className={`p-4 rounded-2xl border font-mono text-xs space-y-2 animate-fade-in ${
            compileResult.evaluation_result?.compliant === false
              ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {compileResult.evaluation_result?.compliant === false ? 'warning' : 'check_circle'}
                </span>
                <span>Compiled Rule ID: {compileResult.rule_id} ({compileResult.rule_hash})</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/40 text-[10px]">
                {compileResult.evaluation_result?.compliant === false ? 'TEST FAILED (VIOLATION CAUGHT)' : 'TEST PASSED'}
              </span>
            </div>
            {compileResult.evaluation_result && (
              <p className="text-[11px] leading-relaxed">
                {compileResult.evaluation_result.message}
              </p>
            )}
          </div>
        )}

        {/* Existing Custom Rules Registry Table */}
        <div className="space-y-3 pt-2 border-t border-coral/15 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-forest-muted dark:text-slate-400">
              Active Enterprise Custom Rules Registry ({rules.length})
            </h3>
            {loading && <span className="text-xs font-mono text-coral animate-pulse">Loading...</span>}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rules.map((r) => (
              <div
                key={r.rule_id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="font-bold text-forest-ink dark:text-white flex items-center gap-2">
                    <span className="text-coral">{r.rule_id}</span>
                    <span>{r.rule_name}</span>
                  </div>
                  <div className="text-[10px] text-forest-muted dark:text-slate-400">
                    {r.department} &bull; <span className="text-coral">{r.parameter_key} {r.operator} {r.expected_value}</span> &bull; {r.statute_reference}
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  ACTIVE
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
