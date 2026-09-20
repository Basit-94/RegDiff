import React, { useState } from 'react';
import { loginUser, registerUser, demoLogin } from '../../lib/api';

interface SignInPageProps {
  onLoginSuccess: (user: { name: string; role: string; email: string; organization?: string }) => void;
  onBack: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await demoLogin();
      onLoginSuccess({
        name: user.full_name,
        role: user.role,
        email: user.email,
        organization: user.organization,
      });
    } catch (e: any) {
      // Fallback
      onLoginSuccess({
        name: 'Alex Vance',
        role: 'LEAD COUNSEL',
        email: 'alex.vance@regdiff.internal',
        organization: 'Apex Financial Technologies LLC',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
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
    <div className="max-w-md mx-auto px-4 pt-10 pb-24 text-left space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-forest-muted dark:text-slate-400 hover:text-coral transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Home</span>
      </button>

      <div className="rounded-3xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] p-7 sm:p-8 shadow-clay-lg dark:shadow-dark-clay space-y-6">
        
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 text-coral font-mono text-xs font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
            Compliance Vault Access
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest-ink dark:text-white">
            {isRegister ? 'Create Vault Account' : 'Sign In to RegDiff'}
          </h2>
          <p className="text-xs text-forest-muted dark:text-slate-400">
            {isRegister
              ? 'Register to access your organization’s persistent Compliance Vault.'
              : 'Sign in to review policies, inspect redlines, and attest audit certificates.'}
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-coral/15 via-coral/10 to-amber-500/10 border border-coral/40 hover:border-coral transition-all text-left group shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral/20 border border-coral/40 flex items-center justify-center text-coral group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-forest-ink dark:text-white group-hover:text-coral transition-colors flex items-center gap-2">
                1-Click Demo Login (Lead Counsel)
                <span className="px-1.5 py-0.2 text-[9px] bg-coral text-white font-mono rounded font-bold">COUNSEL</span>
              </div>
              <div className="text-xs text-forest-muted dark:text-slate-400">Alex Vance • Lead Counsel (Demo Verified)</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-coral group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-coral/15 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-[#0e1422] px-3 text-[11px] font-mono text-forest-muted dark:text-slate-400">
            OR {isRegister ? 'REGISTER NEW USER' : 'SIGN IN WITH CREDENTIALS'}
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
            <span>{loading ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Sign In to Vault')}</span>
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
