import React, { useState } from 'react';
import { dispatchCounterpartyPack, downloadRedlineDocx } from '../lib/api';

interface CounterpartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyTitle: string;
  citation: string;
  originalText: string;
  remediatedText: string;
  organization?: string;
  onDispatched?: () => void;
}

export const CounterpartyModal: React.FC<CounterpartyModalProps> = ({
  isOpen,
  onClose,
  policyTitle,
  citation,
  originalText,
  remediatedText,
  organization = 'Apex Financial Technologies LLC',
  onDispatched,
}) => {
  const [counterpartyName, setCounterpartyName] = useState('CloudScale Infrastructure Partners LLP');
  const [counselEmail, setCounselEmail] = useState('legal-notices@cloudscale.io');
  const [sending, setSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    pack_id: string;
    certificate_id: string;
    cover_letter: string;
    dispatched_at: string;
    status: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await dispatchCounterpartyPack({
        counterparty_name: counterpartyName,
        counsel_email: counselEmail,
        policy_title: policyTitle,
        citation: citation,
        remediated_text: remediatedText,
        organization: organization,
        include_fre902_cert: true,
      });
      setDispatchResult(res);
      if (onDispatched) {
        onDispatched();
      }
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadDocx = () => {
    downloadRedlineDocx({
      title: policyTitle,
      original_text: originalText,
      remediated_text: remediatedText,
      citation: citation,
      organization: organization,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="bg-white dark:bg-[#0e1422] rounded-3xl border-2 border-coral/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-coral/15 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">forward_to_inbox</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Counterparty Legal Exchanger (Phase 3)</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Dispatch Word Track Changes Pack
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

        {/* Overview Prompt */}
        <div className="p-4 rounded-2xl bg-apricot-50/70 dark:bg-[#070b14] border border-coral/15 text-xs font-sans text-forest-ink/90 dark:text-slate-200 space-y-1">
          <p className="leading-relaxed">
            Eliminate days of email back-and-forth. Send opposing counsel a formal remediation notice containing the native <strong>Microsoft Word (.docx) Track Changes redline</strong> and an immutable <strong>FRE 902(13) Merkle Certificate</strong>.
          </p>
        </div>

        {!dispatchResult ? (
          <form onSubmit={handleDispatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                  Counterparty Organization / Vendor
                </label>
                <input
                  type="text"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-forest-ink dark:text-slate-300 mb-1">
                  Opposing Legal Counsel Email
                </label>
                <input
                  type="email"
                  value={counselEmail}
                  onChange={(e) => setCounselEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/25 text-xs text-forest-ink dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 text-xs font-mono space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-coral flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">attach_file</span>
                <span>Included Legal Artifacts:</span>
              </div>
              <ul className="text-[11px] text-forest-ink/80 dark:text-slate-300 list-disc list-inside space-y-0.5">
                <li><strong>Native Word Redline (.docx)</strong>: Standard XML &lt;w:del&gt; &amp; &lt;w:ins&gt; Track Changes</li>
                <li><strong>Statutory Citation</strong>: {citation}</li>
                <li><strong>Evidentiary Seal</strong>: Self-Authenticating FRE 902(13) Affidavit &amp; Merkle Root</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="flex-1 py-2.5 rounded-xl border border-coral/40 text-coral dark:text-coral-accent font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-coral/10 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Word .docx</span>
              </button>

              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl bg-coral hover:bg-coral-vivid text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Transmitting Pack...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>1-Click Dispatch to Counsel</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-600">mark_email_read</span>
                  <span>Legal Pack Dispatched Successfully!</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                  {dispatchResult.pack_id}
                </span>
              </div>
              <div className="text-[11px] space-y-1">
                <div><strong>Recipient:</strong> {counselEmail} ({counterpartyName})</div>
                <div><strong>Certificate:</strong> {dispatchResult.certificate_id}</div>
                <div><strong>Timestamp:</strong> {dispatchResult.dispatched_at}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
                Formal Counsel Transmission Letter:
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 text-[10px] font-mono text-forest-ink/90 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {dispatchResult.cover_letter}
              </pre>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDownloadDocx}
                className="flex-1 py-2 rounded-xl border border-coral/40 text-coral dark:text-coral-accent font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-coral/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Download .docx File</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-coral hover:bg-coral-vivid text-white font-mono font-bold text-xs flex items-center justify-center cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
