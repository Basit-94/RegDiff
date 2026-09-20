import React, { useState, useEffect } from 'react';
import { 
  fetchEnterpriseConnectors, 
  toggleEnterpriseConnector, 
  syncEnterpriseConnector, 
  dispatchTicket,
  type EnterpriseConnector, 
  type ConnectorSyncResult 
} from '../lib/api';

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const ConnectorsModal: React.FC<ConnectorsModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [connectors, setConnectors] = useState<EnterpriseConnector[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<ConnectorSyncResult | null>(null);
  
  // Ticket Dispatch state
  const [ticketModal, setTicketModal] = useState<{
    open: boolean;
    system: 'Jira' | 'ServiceNow' | 'Slack';
    policyTitle: string;
    statute: string;
  }>({
    open: false,
    system: 'Jira',
    policyTitle: 'Vendor Master Services Agreement (CloudScale LLC)',
    statute: 'CFPB Rule 1033 (12 CFR § 1033.351)',
  });
  const [dispatching, setDispatching] = useState(false);
  const [ticketResult, setTicketResult] = useState<{
    ticket_id: string;
    system: string;
    ticket_url: string;
    summary: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchEnterpriseConnectors();
      setConnectors(list);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleEnterpriseConnector(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Toggle failed');
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setSyncResult(null);
    try {
      const res = await syncEnterpriseConnector(id);
      setSyncResult(res);
      if (onSyncComplete) {
        onSyncComplete();
      }
      await load();
    } catch (e: any) {
      alert(e.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDispatchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setTicketResult(null);
    try {
      const res = await dispatchTicket({
        statute: ticketModal.statute,
        policy_title: ticketModal.policyTitle,
        violation_details: 'Retention period exceeds statutory cap of 30 days under 12 CFR § 1033.351(a)(1).',
        priority: 'P1-CRITICAL',
        system_target: ticketModal.system,
      });
      setTicketResult(res);
    } catch (err: any) {
      alert(err.message || 'Ticket dispatch failed');
    } finally {
      setDispatching(false);
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
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-coral font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Enterprise Ecosystem Connectors (Phase 1)</span>
              </div>
              <h2 className="font-display text-xl font-bold text-forest-ink dark:text-white">
                Zero-Click Repository Sync &amp; Ticketing
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
            Continuously synchronize contracts, customer agreements, and SOPs from <strong>SharePoint, Google Drive, and DocuSign</strong>. When a statutory drift is detected, RegDiff dispatches automated high-priority tickets to <strong>Jira and ServiceNow</strong>.
          </p>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono space-y-2 animate-fade-in">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                <span>Synchronized {syncResult.documents_scanned} documents from {syncResult.connector_id}!</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                {syncResult.merkle_batch_hash.slice(0, 16)}...
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              {syncResult.synced_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/40 dark:bg-black/30 p-1.5 rounded-lg">
                  <span className="truncate">{item.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.status === 'FLAGGED' ? 'bg-red-500/20 text-red-700 dark:text-red-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {item.status} ({item.statute})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121b2d] border border-coral/20 flex flex-col justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{c.icon}</span>
                  </div>
                  <div>
                    <div className="font-bold text-forest-ink dark:text-white">{c.name}</div>
                    <div className="text-[10px] text-forest-muted dark:text-slate-400">{c.auth_account}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(c.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    c.status === 'CONNECTED'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {c.status}
                </button>
              </div>

              <div className="text-[10px] text-forest-muted dark:text-slate-400 flex items-center justify-between border-t border-coral/10 pt-2">
                <span>Docs Synced: <strong>{c.documents_synced}</strong></span>
                <span>Auto-Sync: <strong>{c.auto_sync_enabled ? 'Active' : 'Off'}</strong></span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {c.category === 'TICKETING' ? (
                  <button
                    onClick={() => {
                      setTicketModal({
                        open: true,
                        system: c.id === 'servicenow' ? 'ServiceNow' : 'Jira',
                        policyTitle: 'Vendor Master Services Agreement (CloudScale LLC)',
                        statute: 'CFPB Rule 1033 (12 CFR § 1033.351)',
                      });
                      setTicketResult(null);
                    }}
                    className="w-full py-1.5 rounded-xl bg-coral/15 hover:bg-coral/25 text-coral dark:text-coral-accent font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    <span>Dispatch Remediation Ticket</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSync(c.id)}
                    disabled={syncingId === c.id || c.status !== 'CONNECTED'}
                    className="w-full py-1.5 rounded-xl bg-coral hover:bg-coral-vivid text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-40"
                  >
                    {syncingId === c.id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Scanning Cloud Drive...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Sync Active Folder</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Dispatch Sub-Modal */}
        {ticketModal.open && (
          <div className="p-5 rounded-2xl bg-coral/5 border-2 border-coral/30 space-y-4 animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between font-bold text-forest-ink dark:text-white">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-coral">local_activity</span>
                <span>Dispatch Automated {ticketModal.system} Incident</span>
              </span>
              <button
                onClick={() => setTicketModal((p) => ({ ...p, open: false }))}
                className="text-forest-muted hover:text-coral cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!ticketResult ? (
              <form onSubmit={handleDispatchTicket} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Non-Compliant Policy</label>
                  <input
                    type="text"
                    value={ticketModal.policyTitle}
                    onChange={(e) => setTicketModal((p) => ({ ...p, policyTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#121b2d] border border-coral/25 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Governing Statute Violation</label>
                  <input
                    type="text"
                    value={ticketModal.statute}
                    onChange={(e) => setTicketModal((p) => ({ ...p, statute: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#121b2d] border border-coral/25 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTicketModal((p) => ({ ...p, open: false }))}
                    className="px-3 py-1.5 rounded-xl border border-coral/20 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="px-4 py-1.5 rounded-xl bg-coral hover:bg-coral-vivid text-white font-bold cursor-pointer shadow-xs"
                  >
                    {dispatching ? 'Dispatching Ticket...' : `Create ${ticketModal.system} P1 Ticket`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>{ticketResult.system} Ticket Created: {ticketResult.ticket_id}</span>
                </div>
                <p className="text-[11px]">{ticketResult.summary}</p>
                <a
                  href={ticketResult.ticket_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors"
                >
                  Open in {ticketResult.system} &rarr;
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
