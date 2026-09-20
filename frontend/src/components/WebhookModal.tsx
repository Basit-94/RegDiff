import React, { useState } from 'react';
import { dispatchDirectWebhook } from '../lib/api';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle?: string;
  organization?: string;
  overallScore: number;
  breachCount: number;
  auditHash: string;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  docTitle = 'Corporate Governance Policy',
  organization = 'Apex Financial Technologies LLC',
  overallScore,
  breachCount,
  auditHash,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !webhookUrl.startsWith('http')) {
      alert('Please enter a valid HTTP/HTTPS webhook URL (e.g. Slack Incoming Webhook URL).');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await dispatchDirectWebhook({
        webhook_url: webhookUrl.trim(),
        doc_title: docTitle,
        organization: organization,
        overall_score: overallScore,
        breach_count: breachCount,
        audit_hash: auditHash,
      });

      setResult({
        success: res.success,
        message: res.message,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to dispatch webhook event.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border border-coral/30 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">webhook</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold">
                SIEM &amp; Alert Orchestration
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Dispatch Compliance Webhook
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

        {/* Info */}
        <div className="p-3.5 rounded-2xl bg-apricot-50/80 dark:bg-[#070b14] border border-coral/20 text-xs font-sans text-forest-muted dark:text-slate-300">
          Dispatches a real-time RFC 7807 compliance alert payload to your enterprise Slack channel, Microsoft Teams webhook, or SOC SIEM alerting gateway.
        </div>

        {/* Payload Preview */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-1">
          <div className="text-forest-muted text-[10px] uppercase">Payload Summary:</div>
          <div>Document: <strong className="text-white">{docTitle}</strong></div>
          <div>Compliance Index: <strong className="text-emerald-400">{overallScore}%</strong></div>
          <div>Breaches: <strong className="text-red-400">{breachCount}</strong></div>
          <div className="truncate">Ledger Hash: <span className="text-coral">{auditHash}</span></div>
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
              <span>{result.success ? 'Webhook Delivered!' : 'Delivery Failed'}</span>
            </div>
            <p className="mt-1 font-sans">{result.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-forest-ink dark:text-slate-300 font-bold">
              Target Webhook URL:
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
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
                {loading ? 'refresh' : 'send'}
              </span>
              <span>{loading ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
