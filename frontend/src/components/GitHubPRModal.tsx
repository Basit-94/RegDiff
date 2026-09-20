import React, { useState } from 'react';
import { dispatchGitHubPullRequest } from '../lib/api';

interface GitHubPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  remediatedContent: string;
  docTitle?: string;
}

export const GitHubPRModal: React.FC<GitHubPRModalProps> = ({
  isOpen,
  onClose,
  remediatedContent,
  docTitle = 'Corporate Governance Policy',
}) => {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('enterprise-org/compliance-policies');
  const [branch, setBranch] = useState('regdiff/statutory-patch-v1');
  const [filePath, setFilePath] = useState('policies/data_governance_policy.md');
  const [prTitle, setPrTitle] = useState(`fix(compliance): remediate statutory policy breaches in ${docTitle}`);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; pr_url?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      alert('Please provide a GitHub Personal Access Token with "repo" scope.');
      return;
    }
    if (!repo.trim() || !repo.includes('/')) {
      alert('Please specify the GitHub repository as "owner/repo" (e.g. acme-corp/policies).');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await dispatchGitHubPullRequest({
        github_token: token.trim(),
        repo: repo.trim(),
        branch_name: branch.trim(),
        file_path: filePath.trim(),
        remediated_content: remediatedContent,
        pr_title: prTitle.trim(),
        doc_title: docTitle,
      });

      setResult({
        success: res.success,
        message: res.message,
        pr_url: res.pr_url,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to dispatch GitHub Pull Request.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border border-coral/30 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">fork_right</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold">
                Automated Legal CI/CD Dispatch
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Open GitHub Pull Request
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-forest-muted dark:text-slate-400 hover:text-coral flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Informational Banner */}
        <div className="p-3.5 rounded-2xl bg-apricot-50/80 dark:bg-[#070b14] border border-coral/20 text-xs font-sans text-forest-muted dark:text-slate-300">
          Directly branches your policy repository, commits the compliant redline patch, and opens an authoritative GitHub Pull Request for legal and compliance review.
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-2xl border text-xs font-mono animate-fade-in ${
            result.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}>
            <div className="font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">
                {result.success ? 'check_circle' : 'error'}
              </span>
              <span>{result.success ? 'Pull Request Dispatched!' : 'Dispatch Error'}</span>
            </div>
            <p className="mt-1 font-sans">{result.message}</p>
            {result.pr_url && (
              <a
                href={result.pr_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-coral underline"
              >
                <span>View Pull Request on GitHub</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-forest-ink dark:text-slate-300 font-bold">
              GitHub Personal Access Token:
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 text-forest-ink dark:text-white focus:border-coral outline-none"
            />
            <span className="text-[10px] text-forest-muted dark:text-slate-400">
              Requires &quot;repo&quot; permissions to create branches and pull requests.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-forest-ink dark:text-slate-300 font-bold">
                Repository (owner/repo):
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="acme-corp/policies"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 text-forest-ink dark:text-white focus:border-coral outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-forest-ink dark:text-slate-300 font-bold">
                New Branch Name:
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="regdiff/patch-v1"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 text-forest-ink dark:text-white focus:border-coral outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-forest-ink dark:text-slate-300 font-bold">
              Target File Path:
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="policies/data_retention.md"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 text-forest-ink dark:text-white focus:border-coral outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-forest-ink dark:text-slate-300 font-bold">
              Pull Request Title:
            </label>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-coral/20 text-forest-ink dark:text-white focus:border-coral outline-none"
            />
          </div>

          <div className="pt-3 border-t border-coral/15 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-forest-ink dark:text-slate-300 font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-iridescent px-6 py-2.5 rounded-full text-white font-bold shadow-neon-coral flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'refresh' : 'call_split'}
              </span>
              <span>{loading ? 'Creating PR on GitHub...' : 'Create GitHub Pull Request'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
