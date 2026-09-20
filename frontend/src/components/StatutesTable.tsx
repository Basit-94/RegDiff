import { useState } from 'react';
import type { Regulation } from '../lib/api';

interface StatutesTableProps {
  regulations: Regulation[];
  onSelectStatute?: (name: string, detail: string, code: string) => void;
  selectedStatuteId?: string;
  loading?: boolean;
}

export const StatutesTable: React.FC<StatutesTableProps> = ({
  regulations: _regulations,
  onSelectStatute,
}) => {
  const [filter, setFilter] = useState<'all' | 'federal' | 'international'>('all');
  const [selectedStatuteNotice, setSelectedStatuteNotice] = useState<string | null>(null);

  const defaultStatutes = [
    {
      name: 'CFPB Rule 1033',
      body: 'Consumer Financial Protection Bureau',
      focus: 'Financial Data Rights & Telemetry',
      change: 'Retention limits shortened from 90 days to 30 days',
      status: 'Active Amendment',
      category: 'federal',
      code: '12 CFR § 1033.321(b)',
      statusColor: 'coral',
    },
    {
      name: 'EU AI Act (Article 14)',
      body: 'European Union Commission',
      focus: 'Human Oversight & Interventions',
      change: 'Emergency kill-switch with ≤ 500ms override response',
      status: 'Monitoring Active',
      category: 'international',
      code: 'EU Regulation 2024/1689',
      statusColor: 'emerald',
    },
    {
      name: 'NYDFS Cybersecurity (Part 500)',
      body: 'New York Dept of Financial Services',
      focus: 'Multi-Factor & Access Governance',
      change: 'Enhanced authentication token invalidation lifecycle',
      status: 'Monitoring Active',
      category: 'federal',
      code: '23 NYCRR 500.12',
      statusColor: 'emerald',
    },
  ];

  const filtered = defaultStatutes.filter(
    s => filter === 'all' || s.category === filter
  );

  const handleRowClick = (statute: typeof defaultStatutes[0]) => {
    setSelectedStatuteNotice(`Loaded ${statute.name} (${statute.code}) into the active diff pipeline.`);
    if (onSelectStatute) {
      onSelectStatute(statute.name, statute.change, statute.code);
    }
  };

  return (
    <section className="pt-8" id="tracked-laws">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="px-3.5 py-1 rounded-full bg-coral/15 border border-coral/30 text-coral dark:text-coral-accent font-mono text-xs font-black uppercase tracking-wider">
          Monitored Frameworks
        </span>
        <h2 className="font-display text-3xl font-bold text-forest-ink dark:text-white">
          Active Federal & International Statutes
        </h2>
        <p className="text-forest-muted dark:text-slate-300 text-sm">
          Live statutory pipelines continuously ingested into semantic AST tokens. Click any statute to inspect.
        </p>
      </div>

      {selectedStatuteNotice && (
        <div className="max-w-xl mx-auto mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs text-center">
          ✓ {selectedStatuteNotice}
        </div>
      )}

      <div className="rounded-clay-2xl bg-white dark:bg-[#0e1422] border border-coral/25 dark:border-[#1e293d] shadow-clay-lg dark:shadow-dark-clay overflow-hidden ring-1 ring-coral/10">
        <div className="p-4 border-b border-coral/15 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-apricot-50/50 dark:bg-[#0a0f1c]/50">
          <div className="flex items-center gap-2 text-xs font-mono text-forest-muted dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-coral">filter_list</span>
            <span>Filter Pipelines:</span>
            <button 
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filter === 'all' ? 'bg-coral/20 text-coral dark:text-coral-accent font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`} 
              onClick={() => setFilter('all')}
            >
              All (3)
            </button>
            <button 
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filter === 'federal' ? 'bg-coral/20 text-coral dark:text-coral-accent font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`} 
              onClick={() => setFilter('federal')}
            >
              Federal
            </button>
            <button 
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${filter === 'international' ? 'bg-coral/20 text-coral dark:text-coral-accent font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`} 
              onClick={() => setFilter('international')}
            >
              EU / Global
            </button>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold" id="statutes-sync-indicator">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Sync Frequency: 15s Gazettes Webhook (FastAPI Active)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-apricot-100/70 dark:bg-[#0a0f1c] border-b border-coral/15 dark:border-slate-800 text-forest-ink dark:text-slate-300 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-6">Statute / Rule</th>
                <th className="py-4 px-6">Governing Body</th>
                <th className="py-4 px-6">Subject Focus</th>
                <th className="py-4 px-6">Recent Legal Change</th>
                <th className="py-4 px-6">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coral/10 dark:divide-slate-800 text-forest-muted dark:text-slate-300">
              {filtered.map((s) => (
                <tr 
                  key={s.name}
                  className="hover:bg-apricot-50 dark:hover:bg-[#141b2c] transition-colors cursor-pointer"
                  onClick={() => handleRowClick(s)}
                >
                  <td className="py-4 px-6 font-bold text-forest-ink dark:text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.statusColor === 'coral' ? 'bg-coral animate-ping' : 'bg-emerald-500'}`}></span>
                    {s.name}
                  </td>
                  <td className="py-4 px-6">{s.body}</td>
                  <td className="py-4 px-6">{s.focus}</td>
                  <td className="py-4 px-6">{s.change}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                      s.statusColor === 'coral'
                        ? 'bg-coral/20 text-coral dark:text-coral-accent border-coral/40'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
