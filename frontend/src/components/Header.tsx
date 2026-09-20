import React, { useState, useRef, useEffect } from 'react';

export type PageType = 'landing' | 'signin' | 'upload' | 'results' | 'proof' | 'vault' | 'sentinel' | 'verify';

interface HeaderProps {
  user: { name: string; role: string; email: string } | null;
  onNavigate: (page: PageType) => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  currentPage: PageType;
  onOpenCICD?: () => void;
  onOpenConnectors?: () => void;
  onOpenCustomRules?: () => void;
  onOpenWordAddin?: () => void;
  onOpenGRC?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onNavigate,
  onSignOut,
  isDark,
  onToggleTheme,
  currentPage,
  onOpenCICD,
  onOpenConnectors,
  onOpenCustomRules,
  onOpenWordAddin,
  onOpenGRC,
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };
    if (toolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toolsOpen]);

  const handleToolClick = (callback?: () => void) => {
    setToolsOpen(false);
    setMobileMenuOpen(false);
    if (callback) callback();
  };

  const navItems: { id: PageType; label: string; shortLabel: string; step: string }[] = [
    { id: 'upload', label: 'Ingest & Redline', shortLabel: 'Ingest', step: '1.' },
    { id: 'vault', label: 'Policy Vault', shortLabel: 'Vault', step: '2.' },
    { id: 'sentinel', label: 'Sentinel Radar', shortLabel: 'Radar', step: '3.' },
    { id: 'proof', label: 'Proof & Cert', shortLabel: 'Proof', step: '4.' },
    { id: 'verify', label: 'InsurTech', shortLabel: 'InsurTech', step: '5.' },
  ];

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-6 my-2">
      <div className="max-w-7xl mx-auto rounded-2xl md:rounded-full bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl border border-coral/25 dark:border-coral/30 px-3 sm:px-5 py-2 shadow-clay dark:shadow-dark-clay flex items-center justify-between transition-all ring-1 ring-black/5 dark:ring-white/5 relative">
        
        {/* Left: Brand Logo & Main Nav */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          {/* Logo */}
          <button 
            onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 group cursor-pointer text-left shrink-0"
            title="Go to RegDiff Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-coral-vivid via-coral to-coral-tangerine flex items-center justify-center text-white shadow-neon-coral transform group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shrink-0">
              <span className="font-display italic font-bold text-base sm:text-lg leading-none">§</span>
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-forest-ink dark:text-white">
              RegDiff
            </span>
          </button>

          {/* Logged-In Primary Workflow Tabs */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
              {navItems.map((item) => {
                const isActive = currentPage === item.id || (item.id === 'upload' && currentPage === 'results');
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`px-2.5 lg:px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-coral text-white font-bold shadow-xs'
                        : 'text-forest-muted dark:text-slate-300 hover:text-coral hover:bg-apricot-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="opacity-75">{item.step}</span>
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="inline xl:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Tools Dropdown Menu, Theme Toggle, User Avatar & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Logged-in Enterprise Tools Menu */}
          {user && (
            <div className="relative" ref={toolsMenuRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  toolsOpen
                    ? 'bg-coral text-white border-coral shadow-neon-coral'
                    : 'bg-apricot-100 dark:bg-slate-800 border-coral/20 text-forest-ink dark:text-slate-200 hover:text-coral hover:border-coral'
                }`}
                title="Open Enterprise Suite & Integrations"
              >
                <span className="material-symbols-outlined text-sm text-coral">extension</span>
                <span className="hidden sm:inline">Tools</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-coral/15 dark:bg-coral/25 text-coral font-sans font-bold">
                  5
                </span>
                <span className="material-symbols-outlined text-xs transition-transform duration-200" style={{ transform: toolsOpen ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>

              {/* Tools Dropdown Floating Popover */}
              {toolsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0e1526] border border-coral/30 p-2 shadow-2xl z-50 animate-fade-in text-left">
                  <div className="px-3 py-2 border-b border-coral/15 dark:border-slate-800 flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase font-bold text-coral tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Enterprise Suite</span>
                    </div>
                    <span className="text-[9px] font-mono text-forest-muted dark:text-slate-400">Phase 1 - 4 Modules</span>
                  </div>

                  <div className="py-1 space-y-1 font-sans">
                    {/* Connectors */}
                    {onOpenConnectors && (
                      <button
                        onClick={() => handleToolClick(onOpenConnectors)}
                        className="w-full p-2 rounded-xl hover:bg-apricot-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 text-left cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-coral/10 text-coral flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-sm">hub</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                            <span>Connectors Hub</span>
                            <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-coral/10 text-coral">Phase 1</span>
                          </div>
                          <p className="text-[10px] text-forest-muted dark:text-slate-400 leading-tight">
                            SharePoint, Google Drive, DocuSign &amp; Jira sync
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Rules Builder */}
                    {onOpenCustomRules && (
                      <button
                        onClick={() => handleToolClick(onOpenCustomRules)}
                        className="w-full p-2 rounded-xl hover:bg-apricot-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 text-left cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-coral/10 text-coral flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-sm">code_blocks</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                            <span>Rules Builder</span>
                            <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-coral/10 text-coral">Phase 2</span>
                          </div>
                          <p className="text-[10px] text-forest-muted dark:text-slate-400 leading-tight">
                            Deterministic AST Policy-as-Code compiler
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Word 365 */}
                    {onOpenWordAddin && (
                      <button
                        onClick={() => handleToolClick(onOpenWordAddin)}
                        className="w-full p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-start gap-2.5 text-left cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-sm">description</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                            <span>Word 365 Add-in</span>
                            <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">Office JS</span>
                          </div>
                          <p className="text-[10px] text-forest-muted dark:text-slate-400 leading-tight">
                            In-app legal editor with 1-click Track Changes
                          </p>
                        </div>
                      </button>
                    )}

                    {/* GRC Sync */}
                    {onOpenGRC && (
                      <button
                        onClick={() => handleToolClick(onOpenGRC)}
                        className="w-full p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-start gap-2.5 text-left cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                            <span>GRC Evidence Sync</span>
                            <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">SOC 2 / ISO</span>
                          </div>
                          <p className="text-[10px] text-forest-muted dark:text-slate-400 leading-tight">
                            Vanta, Drata &amp; Secureframe live attestations
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Policy Gate CI/CD */}
                    {onOpenCICD && (
                      <button
                        onClick={() => handleToolClick(onOpenCICD)}
                        className="w-full p-2 rounded-xl hover:bg-apricot-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 text-left cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-sm">verified_user</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-forest-ink dark:text-white flex items-center gap-1.5">
                            <span>Policy Gate CI/CD</span>
                            <span className="text-[9px] font-mono font-normal px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">GitHub</span>
                          </div>
                          <p className="text-[10px] text-forest-muted dark:text-slate-400 leading-tight">
                            Block non-compliant pull requests in pipelines
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Switcher */}
          <button 
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-apricot-100 dark:bg-slate-800 border border-coral/20 text-xs font-bold text-forest-ink dark:text-slate-200 hover:text-coral transition-colors flex items-center gap-1 shadow-xs cursor-pointer shrink-0" 
            onClick={onToggleTheme} 
            id="theme-btn" 
            title="Toggle Light / Dark Mode"
          >
            <span>{isDark ? '🌙' : '☀️'}</span>
            <span className="hidden lg:inline">{isDark ? 'Dark' : 'Light'}</span>
          </button>

          {/* Authentication State */}
          {!user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button 
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-forest-muted dark:text-slate-300 hover:text-coral transition-colors cursor-pointer" 
                onClick={() => onNavigate('signin')}
              >
                Sign In
              </button>
              
              <button 
                className="btn-iridescent px-3 sm:px-4 py-1.5 rounded-full text-white font-bold text-xs shadow-neon-coral hover:shadow-glow-coral transition-all cursor-pointer" 
                onClick={() => onNavigate('signin')}
              >
                Get Started &rarr;
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* User Avatar Chip */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-apricot-50 dark:bg-[#121929] border border-coral/25 text-xs font-mono shrink-0">
                <span className="w-5 h-5 rounded-full bg-coral text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {user.name.charAt(0)}
                </span>
                <span className="text-forest-ink dark:text-slate-200 font-bold hidden sm:inline max-w-[90px] truncate">{user.name}</span>
              </div>

              {/* Sign Out */}
              <button 
                onClick={onSignOut} 
                className="p-1.5 rounded-full hover:bg-apricot-100 dark:hover:bg-slate-800 text-forest-muted dark:text-slate-400 hover:text-coral transition-colors cursor-pointer shrink-0" 
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>

              {/* Mobile Hamburger Toggle for < md screens */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-full bg-apricot-100 dark:bg-slate-800 text-forest-ink dark:text-slate-200 hover:text-coral transition-colors cursor-pointer shrink-0"
                title="Toggle Menu"
              >
                <span className="material-symbols-outlined text-sm">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Menu Dropdown (< md screens) */}
      {user && mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl border border-coral/30 shadow-2xl space-y-3 animate-fade-in text-left">
          <div className="text-[10px] font-mono uppercase font-bold text-coral tracking-wider">
            Workflow Navigation
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-left font-bold flex items-center gap-1.5 cursor-pointer ${
                  currentPage === item.id || (item.id === 'upload' && currentPage === 'results')
                    ? 'bg-coral text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-forest-ink dark:text-slate-200'
                }`}
              >
                <span>{item.step}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-coral/15 dark:border-slate-800 text-[10px] font-mono uppercase font-bold text-coral tracking-wider">
            Enterprise Integrations
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {onOpenConnectors && (
              <button
                onClick={() => handleToolClick(onOpenConnectors)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-forest-ink dark:text-slate-200 hover:text-coral flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-coral">hub</span>
                <span>Connectors</span>
              </button>
            )}
            {onOpenCustomRules && (
              <button
                onClick={() => handleToolClick(onOpenCustomRules)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-forest-ink dark:text-slate-200 hover:text-coral flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-coral">code_blocks</span>
                <span>Rules Builder</span>
              </button>
            )}
            {onOpenWordAddin && (
              <button
                onClick={() => handleToolClick(onOpenWordAddin)}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-blue-500">description</span>
                <span>Word 365</span>
              </button>
            )}
            {onOpenGRC && (
              <button
                onClick={() => handleToolClick(onOpenGRC)}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-emerald-500">assignment_turned_in</span>
                <span>GRC Sync</span>
              </button>
            )}
            {onOpenCICD && (
              <button
                onClick={() => handleToolClick(onOpenCICD)}
                className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-bold cursor-pointer col-span-2"
              >
                <span className="material-symbols-outlined text-sm text-purple-500">verified_user</span>
                <span>Policy Gate CI/CD</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
