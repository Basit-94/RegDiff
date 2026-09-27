import React, { useState } from 'react';
import { loginUser, registerUser, demoLogin } from '../../lib/api';

interface SignInPageProps {
  onLoginSuccess: (user: { name: string; role: string; email: string; organization?: string }) => void;
  onBack: () => void;
}

interface DemoPersona {
  name: string;
  role: string;
  email: string;
  org: string;
  icon: string;
  badge: string;
  focusArea: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Alex Vance',
    role: 'LEAD COUNSEL',
    email: 'alex.vance@regdiff.internal',
    org: 'Apex Financial Technologies LLC',
    icon: 'gavel',
    badge: 'LEGAL COUNSEL',
    focusArea: '⚖️ FinTech & CFPB 1033 SOPs',
  },
  {
    name: 'Dr. Elena Rostova',
    role: 'AI SAFETY AUDITOR',
    email: 'elena.rostova@aisafety.org',
    org: 'Center for Algorithmic Governance',
    icon: 'smart_toy',
    badge: 'AI GOVERNANCE',
    focusArea: '🛡️ EU AI Act & Bias Audits',
  },
  {
    name: 'Marcus Chen',
    role: 'DEVOPS & POLICY LEAD',
    email: 'marcus.chen@enterprise.io',
    org: 'CloudScale Infrastructure Inc',
    icon: 'terminal',
    badge: 'CI/CD & DEVOPS',
    focusArea: '⚡ Policy Gates & Git CI/CD',
  },
  {
    name: 'Maya Lin',
    role: 'CIVIC RIGHTS DIRECTOR',
    email: 'justice@civictech.law',
    org: 'Access to Justice Project',
    icon: 'balance',
    badge: 'CIVIC TECH',
    focusArea: '📜 Plain-English Legal Rights',
  },
  {
    name: 'Sarah Sterling',
    role: 'CHIEF COMPLIANCE AUDITOR',
    email: 'sarah.sterling@enterprise.org',
    org: 'Enterprise Governance Board',
    icon: 'verified',
    badge: 'EXECUTIVE AUDITOR',
    focusArea: '💡 Full Enclave Verification',
  },
];

export const SignInPage: React.FC<SignInPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPersona = (persona: DemoPersona) => {
    onLoginSuccess({
      name: persona.name,
      role: persona.role,
      email: persona.email,
      organization: persona.org,
    });
    demoLogin().catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        const user = await registerUser({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          organization: organization.trim() || 'Independent Counsel',
        });
        onLoginSuccess({
          name: user.full_name,
          role: user.role,
          email: user.email,
          organization: user.organization,
        });
      } else {
        const user = await loginUser(email.trim(), password);
        onLoginSuccess({
          name: user.full_name,
          role: user.role,
          email: user.email,
          organization: user.organization,
        });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed. Please verify credentials or use 1-Click Demo Login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 text-left space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-forest-muted dark:text-slate-400 hover:text-coral transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Home</span>
      </button>

      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-6 sm:p-8 shadow-clay-lg dark:shadow-dark-clay space-y-6">
        
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 text-coral font-mono text-xs font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
            Compliance Enclave Access
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white">
            {isRegister ? 'Create Organization Vault' : 'Sign In to RegDiff'}
          </h2>
          <p className="text-xs text-forest-muted dark:text-slate-400">
            {isRegister
              ? 'Register to access your organization’s persistent Compliance Vault.'
              : 'Sign in or select a 1-Click Fast Persona to explore the continuous compliance enclave.'}
          </p>
        </div>

        {/* 1-Click Demo Personas Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-coral uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>1-Click Fast Track Personas</span>
            </span>
            <span className="text-[9px] text-forest-muted dark:text-slate-400 lowercase font-normal">0s latency</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPersona(p)}
                disabled={loading}
                className="p-3 rounded-2xl bg-gradient-to-r from-coral/10 via-amber-500/5 to-transparent border border-coral/30 hover:border-coral hover:bg-coral/15 transition-all text-left group shadow-xs cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-coral/20 border border-coral/30 flex items-center justify-center text-coral group-hover:scale-105 transition-transform flex-shrink-0">
                    <span className="material-symbols-outlined text-base">{p.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-forest-ink dark:text-white group-hover:text-coral transition-colors truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-forest-muted dark:text-slate-400 truncate">{p.focusArea}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-coral text-sm group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-coral/15 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-[#0e1422] px-3 text-[11px] font-mono text-forest-muted dark:text-slate-400 whitespace-nowrap">
            OR {isRegister ? 'REGISTER CUSTOM ACCOUNT' : 'ENTER CREDENTIALS'}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-600 dark:text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
                  Full Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-apricot-50 dark:bg-[#080d1a] border border-coral/30 text-xs font-sans text-forest-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-coral/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
                  Organization / Law Firm:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Financial Technologies"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-apricot-50 dark:bg-[#080d1a] border border-coral/30 text-xs font-sans text-forest-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-coral/40"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
              Work Email:
            </label>
            <input
              type="email"
              placeholder="counsel@enterprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apricot-50 dark:bg-[#080d1a] border border-coral/30 text-xs font-mono text-forest-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-coral/40"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-forest-ink dark:text-slate-300">
              Password:
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apricot-50 dark:bg-[#080d1a] border border-coral/30 text-xs font-mono text-forest-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-coral/40"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-iridescent py-3 rounded-full text-white font-bold text-xs shadow-neon-coral flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'sync' : (isRegister ? 'person_add' : 'login')}
            </span>
            <span>{loading ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Sign In to Enclave')}</span>
          </button>
        </form>

        {/* Toggle between Sign In and Register */}
        <div className="text-center pt-2 text-xs font-mono text-forest-muted dark:text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setErrorMsg(null); }}
                className="text-coral font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new organization vault?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setErrorMsg(null); }}
                className="text-coral font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
