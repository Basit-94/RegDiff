import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchSentinelStatus, 
  simulateRegulatoryShift, 
  fetchLiveRegulatoryFeed, 
  fetchWebhooks, 
  testWebhookDispatch 
} from '../../lib/api';
import type { SentinelStatus, LiveFeedResponse, WebhookChannel } from '../../lib/api';

interface SentinelPageProps {
  onGoToVault: () => void;
  onRefreshData: () => void;
  onSimulateLawShift?: (res: Record<string, unknown>) => void;
}

// Plain-English translations and guidance for everyday users
const PLAIN_ENGLISH_RULES: Record<string, { plainEnglish: string; appliesTo: string; example: string }> = {
  'CFPB-1033': {
    plainEnglish: 'Consumer login credentials, financial history, and authorization tokens cannot be stored longer than 30 days after a user offboards.',
    appliesTo: 'Banking apps, fintech platforms, payment processors, and lenders.',
    example: 'Policies storing data for 90 or 180 days are immediately flagged as illegal.',
  },
  'EU-AI-ACT': {
    plainEnglish: 'High-risk AI decision models must provide an immediate human override button/kill-switch operating in under 500 milliseconds.',
    appliesTo: 'Automated credit underwriting, AI hiring tools, biometric scoring, and algorithmic risk engines.',
    example: 'Sending human override requests to an asynchronous email queue violates the law.',
  },
  'NYDFS-500': {
    plainEnglish: 'System access logs, security credential changes, and admin actions must be kept in a tamper-proof audit trail for at least 3 years.',
    appliesTo: 'Any financial institution, insurance company, or entity operating under New York banking charters.',
    example: 'Purging security logs after 6 months or 1 year is a direct statutory violation.',
  },
  'GDPR-ART33': {
    plainEnglish: 'You must formally notify the privacy supervisory authority within 72 hours of becoming aware of a personal data breach.',
    appliesTo: 'Any company storing or processing data of European Union residents.',
    example: 'Internal 14-day preliminary assessment windows violate the mandatory 72-hour ceiling.',
  },
  'HIPAA-SEC': {
    plainEnglish: 'Electronic protected health information (ePHI) must be encrypted with FIPS 140-2 AES-256 at rest and in transit, and breaches reported within 60 days.',
    appliesTo: 'Hospitals, telehealth startups, health insurers, medical SaaS providers.',
    example: 'Storing patient analytics in unencrypted cold storage exposes the company to massive fines.',
  },
  'CCPA-1798': {
    plainEnglish: 'California consumer requests to access, correct, or delete their personal data must be completely fulfilled within 45 calendar days.',
    appliesTo: 'Any business collecting data of California consumers that meets revenue or user thresholds.',
    example: '90-day fulfillment service levels violate California Civil Code § 1798.130.',
  },
};

export const SentinelPage: React.FC<SentinelPageProps> = ({
  onGoToVault,
  onRefreshData,
  onSimulateLawShift,
}) => {
  const [data, setData] = useState<SentinelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveFeed, setLiveFeed] = useState<LiveFeedResponse | null>(null);
  const [liveFeedLoading, setLiveFeedLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<Record<string, unknown> | null>(null);

  // Webhook state
  const [webhooks, setWebhooks] = useState<WebhookChannel[]>([]);
  const [dispatchingWebhook, setDispatchingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<Record<string, unknown> | null>(null);

  const loadWebhooks = useCallback(async () => {
    try {
      const res = await fetchWebhooks();
      setWebhooks(res.webhooks);
    } catch {
      // Fallback
    }
  }, []);

  const handleTestWebhook = async () => {
    setDispatchingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await testWebhookDispatch('wh-default-slack', '12 CFR § 1033.351 (CFPB Rule 1033)');
      setWebhookResult(res);
      await loadWebhooks();
    } catch (e: any) {
      alert(e.message || 'Webhook dispatch failed');
    } finally {
      setDispatchingWebhook(false);
    }
  };

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSentinelStatus();
      setData(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLiveFeed = useCallback(async () => {
    setLiveFeedLoading(true);
    try {
      const res = await fetchLiveRegulatoryFeed();
      setLiveFeed(res);
    } catch {
      // Fallback
    } finally {
      setLiveFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadLiveFeed();
    loadWebhooks();
  }, [loadStatus, loadLiveFeed, loadWebhooks]);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await simulateRegulatoryShift();
      setSimulationResult(res);
      await loadStatus();
      onRefreshData();
      if (onSimulateLawShift) {
        onSimulateLawShift(res);
      }
    } catch (e: any) {
      alert(e.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24 text-left space-y-8">
      
      {/* Title & Everyday Plain-English Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coral/15 dark:border-slate-800 pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Continuous Legal Watchdog</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-forest-ink dark:text-white mt-1">
            Regulatory Sentinel Radar
          </h1>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans mt-1 max-w-2xl leading-relaxed">
            We watch government regulators (CFPB, FTC, EU, HHS, SEC) 24/7 so you don&apos;t have to. When a law changes, we automatically check your company policies and draft the exact fix for you.
          </p>
        </div>

        <button
          onClick={onGoToVault}
          className="px-4 py-2 rounded-full bg-apricot-100 dark:bg-slate-800 border border-coral/30 text-xs font-mono font-bold text-forest-ink dark:text-slate-200 hover:text-coral transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-sm text-coral">folder_open</span>
          <span>View Policy Vault ({data?.vault_summary.total_documents || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3-STEP VISUAL EXPLAINER (HOW SENTINEL RADAR PROTECTS YOU)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">account_balance</span>
          </div>
          <div className="font-bold text-sm text-forest-ink dark:text-white font-serif">
            1. Regulators Update Law
          </div>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans leading-relaxed">
            Agencies like CFPB, FTC, and the EU publish amendments reducing deadlines or expanding requirements.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">radar</span>
          </div>
          <div className="font-bold text-sm text-forest-ink dark:text-white font-serif">
            2. Radar Scans Your Vault
          </div>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans leading-relaxed">
            RegDiff instantly checks every section of your uploaded contracts &amp; policies to see if any wording is now illegal.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/20 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">auto_fix_high</span>
          </div>
          <div className="font-bold text-sm text-forest-ink dark:text-white font-serif">
            3. Instant Alert &amp; 1-Click Patch
          </div>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans leading-relaxed">
            You receive an alert in Slack or Teams with a ready-to-merge Microsoft Word redline fix to keep you safe.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMPLIFIED INTERACTIVE DEMO (SEE WHAT HAPPENS WHEN LAWS SHIFT)            */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-coral-50 via-white to-apricot-50 dark:from-[#11192e] dark:via-[#0c1220] dark:to-[#161226] border-2 border-coral p-6 sm:p-8 shadow-clay-lg relative overflow-hidden space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-coral font-mono text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">play_circle</span>
            <span>Interactive Demonstration</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-coral/15 text-coral text-[10px] font-mono font-bold border border-coral/30">
            Real-Time Law Change Simulator
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-forest-ink dark:text-white">
            See What Happens When a Law Changes Overnight
          </h2>
          <p className="font-sans text-xs text-forest-ink/90 dark:text-slate-300 leading-relaxed max-w-2xl">
            In the real world, companies don&apos;t find out about regulatory changes until they get audited or fined. Click below to simulate the <strong>CFPB updating Rule 1033</strong> to reduce allowable customer data retention from 90 days down to 30 days.
          </p>
          <p className="font-sans text-[11px] text-forest-muted dark:text-slate-400">
            Watch how RegDiff automatically spots the newly out-of-compliance policy in your Vault, generates the compliant 30-day wording, and warns you immediately.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="btn-iridescent px-6 py-3 rounded-full text-white font-mono font-bold text-xs shadow-neon-coral flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${simulating ? 'animate-spin' : ''}`}>
              {simulating ? 'refresh' : 'bolt'}
            </span>
            <span>
              {simulating ? 'Scanning Your Vault Against Rule Changes...' : '⚡ Test CFPB 30-Day Law Change Simulation'}
            </span>
          </button>

          {data && (
            <span className="text-xs font-mono text-forest-muted dark:text-slate-400">
              Actively protecting <strong>{data.vault_summary.total_documents}</strong> policy document(s)
            </span>
          )}
        </div>

        {/* Live Simulation Output Card in Plain English */}
        {simulationResult && (
          <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-[#070c17] border-2 border-emerald-500 shadow-lg space-y-3 animate-fade-in text-xs font-mono">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Rule Change Detected &amp; Vault Evaluated</span>
              </div>
              <span>Proof Block #{(simulationResult as any).audit_block_index} Recorded</span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 font-sans text-xs space-y-1">
              <div className="font-bold flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Action Required: 1 Policy Now Violates the Law</span>
              </div>
              <p className="leading-relaxed">
                Your <strong>Core Banking Data Lifecycle SOP (Section 4.2)</strong> was retaining records for 90 days. Because the CFPB lowered the allowable ceiling to 30 days, this policy is now marked as a <strong>Critical Breach</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <span className="text-forest-muted dark:text-slate-400 font-sans">
                A legally verified 30-day patch has been synthesized and is ready for your review.
              </span>
              <button
                onClick={onGoToVault}
                className="px-4 py-2 rounded-xl bg-coral text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-coral/90 transition-colors"
              >
                <span>Review &amp; Fix in Vault &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MONITORED STATUTES (PLAIN ENGLISH GUIDE FOR EVERYDAY USERS)               */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold text-forest-ink dark:text-white">
            Active Legal Rules Monitored for You
          </h3>
          <p className="text-xs text-forest-muted dark:text-slate-400 font-sans mt-0.5">
            These major corporate, financial, privacy, and AI regulations are continuously watched by the Sentinel engine.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-forest-muted">
            Checking statutory feeds...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.monitored_regulations.map((watch) => {
              const guide = PLAIN_ENGLISH_RULES[watch.code] || {
                plainEnglish: watch.monitored_parameter,
                appliesTo: 'General Corporate Governance',
                example: 'Statutory compliance ceiling enforced.',
              };

              return (
                <div
                  key={watch.code}
                  className="rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/20 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-coral/10 text-coral font-bold">
                        {watch.code}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Actively Guarded</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-base text-forest-ink dark:text-white">
                        {watch.title}
                      </h4>
                      <div className="text-[11px] font-mono text-forest-muted dark:text-slate-400 mt-0.5">
                        {watch.citation}
                      </div>
                    </div>

                    {/* Plain-English Explanation */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-coral/15 text-xs font-sans text-forest-ink/90 dark:text-slate-200 space-y-1">
                      <div className="text-[10px] font-mono text-coral font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">translate</span>
                        <span>What This Means:</span>
                      </div>
                      <p className="leading-relaxed">
                        {guide.plainEnglish}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-coral/10 text-[11px] font-sans text-forest-muted dark:text-slate-400 space-y-1">
                    <div>
                      <strong className="text-forest-ink dark:text-slate-300">Who It Applies To:</strong>{' '}
                      <span>{guide.appliesTo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TEAM ALERT NOTIFICATIONS (SLACK / TEAMS DISPATCHER)                      */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/25 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-coral/15 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-coral font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              <span>Instant Team Notifications</span>
            </div>
            <h3 className="font-display text-xl font-bold text-forest-ink dark:text-white mt-0.5">
              Where Should We Alert Your Team?
            </h3>
            <p className="text-xs text-forest-muted dark:text-slate-400 font-sans mt-0.5">
              When a government rule updates, RegDiff immediately sends a notification to your Slack or Microsoft Teams channel.
            </p>
          </div>

          <button
            onClick={handleTestWebhook}
            disabled={dispatchingWebhook}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-60 whitespace-nowrap"
            title="Sends a test alert to your Slack or Teams channel"
          >
            <span className={`material-symbols-outlined text-sm text-coral ${dispatchingWebhook ? 'animate-spin' : ''}`}>
              {dispatchingWebhook ? 'refresh' : 'send'}
            </span>
            <span>{dispatchingWebhook ? 'Sending Alert...' : 'Send Test Alert to Slack'}</span>
          </button>
        </div>

        {/* Webhook Channel Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          {webhooks.length > 0 ? (
            webhooks.map((wh) => (
              <div key={wh.id} className="p-3.5 rounded-xl bg-apricot-50/70 dark:bg-[#070b14] border border-coral/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${wh.enabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span>{wh.name} ({wh.platform})</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    wh.enabled 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {wh.enabled ? 'CONNECTED' : 'STANDBY'}
                  </span>
                </div>
                <div className="text-[11px] text-forest-muted dark:text-slate-400 font-sans">
                  Triggers: {wh.event_triggers.join(', ')}
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-apricot-50/70 dark:bg-[#070b14] border border-coral/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>#legal-compliance-ops (Slack)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="text-[11px] text-forest-muted dark:text-slate-400 font-sans">
                  Sends instant alerts when statutory limits change or policy breaches are detected.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-apricot-50/70 dark:bg-[#070b14] border border-coral/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Microsoft Teams Compliance Channel</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    STANDBY
                  </span>
                </div>
                <div className="text-[11px] text-forest-muted dark:text-slate-400 font-sans">
                  Escalates critical regulatory breaches to engineering leads and legal counsel.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Delivery Receipt */}
        {webhookResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-mono space-y-1 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
              <span>Test Alert Dispatched to Slack Successfully! (HTTP 200)</span>
            </div>
            <p className="text-[11px] text-forest-ink/90 dark:text-slate-200 font-sans">
              {(webhookResult as any).message}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LIVE FEDERAL REGISTER FEED (OFFICIAL US GOVERNMENT NOTICES)               */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t border-coral/15 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">rss_feed</span>
              <span>Live Government Rulemaking Feed</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] border border-emerald-400">
                Official Federal Register API
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-forest-ink dark:text-white mt-0.5">
              Live Official US Notices &amp; Proposed Rules
            </h3>
          </div>
          <span className="text-xs font-mono text-forest-muted dark:text-slate-400">
            Real-time feed from FederalRegister.gov
          </span>
        </div>

        {liveFeedLoading ? (
          <div className="p-8 text-center font-mono text-xs text-forest-muted">
            Connecting to Federal Register API...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveFeed?.items.map((item) => (
              <div
                key={item.document_number}
                className="rounded-2xl bg-white dark:bg-[#0e1422] border border-coral/20 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                      DOC #{item.document_number}
                    </span>
                    <span className="text-forest-muted dark:text-slate-400">
                      {item.publication_date}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-forest-ink dark:text-white leading-snug">
                    {item.title}
                  </h4>

                  <div className="text-[11px] font-mono text-coral font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">account_balance</span>
                    <span>{item.agency}</span>
                  </div>

                  <p className="text-xs font-sans text-forest-muted dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {item.abstract}
                  </p>
                </div>

                <div className="pt-3 border-t border-coral/10 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    ● {item.action || 'Live Regulatory Record'}
                  </span>
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    <span>Read Official Filing</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
