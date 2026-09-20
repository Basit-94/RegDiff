import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; role: string; email: string }) => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  defaultTab = 'signin' 
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    setEmail('alex.vance@regdiff.internal');
    setPassword('CompliancePass2025!');
    setLoading(true);
    setFeedback('Attesting enterprise credentials against append-only ledger...');
    
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: 'Alex Vance',
        role: 'LEAD COUNSEL',
        email: 'alex.vance@regdiff.internal',
      });
      onClose();
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFeedback('Please enter an enterprise email');
      return;
    }
    setLoading(true);
    setFeedback('Authenticating with zero-knowledge cryptographic signature...');

    setTimeout(() => {
      setLoading(false);
      const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
      onLoginSuccess({
        name: name || 'Compliance Lead',
        role: 'ENTERPRISE AUDITOR',
        email,
      });
      onClose();
    }, 700);
  };

  const handleSso = (provider: string) => {
    setLoading(true);
    setFeedback(`Connecting via ${provider} Enterprise SSO...`);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: 'Alex Vance',
        role: `${provider.toUpperCase()} SSO AUDITOR`,
        email: `alex.vance@${provider.toLowerCase()}.com`,
      });
      onClose();
    }, 650);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="relative w-full max-w-md bg-obsidian-surface border border-obsidian-border dark:border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 overflow-hidden"
        style={{ animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Top subtle highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-coral via-orange-400 to-amber-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/10 border border-coral/30 text-coral text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            Zero-Trust Access
          </div>
          <h2 className="text-2xl font-bold font-serif tracking-tight text-white">
            {tab === 'signin' ? 'Enterprise Access' : 'Create Organization Workspace'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Regulatory Engine & Cryptographic Ledger
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-5 flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-coral/15 via-coral/10 to-amber-500/10 border border-coral/40 hover:border-coral transition-all text-left group shadow-lg shadow-coral/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-coral/20 border border-coral/40 flex items-center justify-center text-coral group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-coral transition-colors flex items-center gap-2">
                1-Click Demo Login
                <span className="px-1.5 py-0.5 text-[10px] bg-coral text-white font-mono rounded font-bold">LEAD</span>
              </div>
              <div className="text-xs text-slate-400">Alex Vance • Senior Legal Counsel</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-coral group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Launch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-obsidian-canvas p-1 mb-5 border border-obsidian-border">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              tab === 'signin'
                ? 'bg-coral text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              tab === 'signup'
                ? 'bg-coral text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Request Access
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Enterprise Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="counsel@enterprise.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-obsidian-canvas border border-obsidian-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-coral transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Master Passphrase / Token
              </label>
              <button
                type="button"
                onClick={() => setFeedback('Passphrase reset dispatched to cryptographic recovery contact.')}
                className="text-[11px] text-coral hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 text-sm bg-obsidian-canvas border border-obsidian-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-coral transition-colors font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-obsidian-border text-coral focus:ring-coral/40 bg-obsidian-canvas"
              />
              Remember hardware token
            </label>
            <span className="text-[11px] text-slate-500 font-mono">TLS 1.3 / E2EE</span>
          </div>

          {feedback && (
            <div className="p-2.5 rounded-lg bg-coral/10 border border-coral/30 text-xs text-coral font-mono text-center">
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-coral hover:bg-coral-hover text-white font-semibold text-sm shadow-neon-coral transition-all transform active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Verifying Ledger...</span>
              </>
            ) : (
              <span>{tab === 'signin' ? 'Sign In to Workspace' : 'Submit Access Request'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-obsidian-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-obsidian-surface text-slate-500 uppercase tracking-wider">
              Or federate identity
            </span>
          </div>
        </div>

        {/* SSO Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSso('Google')}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-obsidian-canvas border border-obsidian-border hover:border-slate-500 text-xs font-medium text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google Workspace
          </button>
          <button
            type="button"
            onClick={() => handleSso('GitHub')}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-obsidian-canvas border border-obsidian-border hover:border-slate-500 text-xs font-medium text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub Enterprise
          </button>
        </div>

        {/* Footer Seal */}
        <div className="mt-6 pt-4 border-t border-obsidian-border flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-pistachio">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>SOC2 Type II • Verified</span>
          </div>
          <span>v2.4.0-stable</span>
        </div>
      </div>
    </div>
  );
};
