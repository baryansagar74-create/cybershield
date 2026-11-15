import React, { useState, useEffect } from 'react';
import { useApp, ScreenId } from '../lib/state';
import { translations } from '../lib/translations';
import { ToastContainer } from './Toast';
import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  ListFilter, 
  FolderKanban, 
  History, 
  Scale, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Languages, 
  LogOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { clsx } from 'clsx';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const {
    officerId,
    currentScreen,
    setCurrentScreen,
    theme,
    setTheme,
    language,
    setLanguage,
    density,
    setDensity,
    logout,
    cases
  } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = translations[language];

  // Cases count with nodal cell
  const nodalCount = cases.filter((c) => c.status === 'with_nodal_cell').length;

  // Keyboard shortcut `/` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'scan', label: t.nav.scan, icon: <Search className="w-4 h-4" /> },
    { id: 'flagged_queue', label: t.nav.queue, icon: <ListFilter className="w-4 h-4" /> },
    { id: 'cases', label: t.nav.cases, icon: <FolderKanban className="w-4 h-4" />, badge: cases.length },
    { id: 'audit_log', label: t.nav.audit, icon: <History className="w-4 h-4" /> },
    { id: 'nodal_queue', label: t.nav.nodal, icon: <Scale className="w-4 h-4" />, badge: nodalCount },
    { id: 'settings_design', label: t.nav.settings, icon: <Settings className="w-4 h-4" /> },
  ];

  if (currentScreen === 'sign_in') {
    return (
      <div className="min-h-screen bg-base text-txt flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
        <footer className="py-3 px-6 border-t border-line text-center text-2xs font-mono text-txt-muted bg-raised select-none">
          {t.footerPolicy} • <span className="text-teal">{t.illustrativeNotice}</span>
        </footer>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-txt flex flex-col overflow-x-hidden selection:bg-teal selection:text-white">
      {/* Top Bar (56px) */}
      <header className="h-14 bg-raised border-b border-line px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          {/* Original ProfileGuard Shield Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('dashboard')}>
            <div className="w-8 h-8 rounded-panel bg-teal/15 border border-teal/40 flex items-center justify-center text-teal">
              <Shield className="w-5 h-5 fill-teal/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-txt">{t.appTitle}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-chip bg-sunken text-txt-muted border border-line">
                  ITBP MHA
                </span>
              </div>
              <span className="text-[10px] text-txt-muted hidden sm:block">
                {t.appSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Search trigger + Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-input bg-sunken border border-line text-txt-muted text-xs hover:border-teal transition-colors"
            title="Press / to search"
            aria-label="Open search dialog"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search handles, cases, hashes…</span>
            <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-raised border border-line text-txt-muted">
              /
            </kbd>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="p-1.5 rounded-input border border-line text-txt-muted hover:text-txt bg-sunken transition-colors text-xs font-mono flex items-center gap-1"
            title="Toggle English / Hindi"
            aria-label="Toggle language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-input border border-line text-txt-muted hover:text-txt bg-sunken transition-colors"
            title="Toggle Dark / Light theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-saffron" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Density Toggle */}
          <button
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            className="p-1.5 rounded-input border border-line text-txt-muted hover:text-txt bg-sunken transition-colors hidden sm:flex"
            title="Toggle Density"
            aria-label="Toggle density"
          >
            {density === 'comfortable' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Officer Identity */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-line text-xs">
            <div className="w-7 h-7 rounded-full bg-sunken border border-line flex items-center justify-center font-mono font-semibold text-teal">
              RK
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-txt">{officerId}</span>
              <span className="text-[10px] text-teal">Nodal Desk Active</span>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="p-1.5 rounded-input border border-line text-txt-muted hover:text-risk-high hover:border-risk-high/40 bg-sunken transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail (64px collapsed, 232px expanded) */}
        <aside
          className={clsx(
            "hidden md:flex flex-col justify-between bg-raised border-r border-line transition-all duration-200 select-none z-20 flex-shrink-0",
            collapsed ? "w-16" : "w-58"
          )}
        >
          {/* Nav List */}
          <nav className="p-2 space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-input text-xs font-medium transition-colors select-none text-left focus-visible:outline-none",
                    isActive
                      ? "bg-teal/15 text-teal font-semibold border border-teal/30"
                      : "text-txt-muted hover:text-txt hover:bg-sunken border border-transparent"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={clsx("flex-shrink-0", isActive ? "text-teal" : "text-txt-muted")}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="font-mono text-2xs px-1.5 py-0.2 rounded-chip bg-sunken text-txt-muted border border-line">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="p-2 border-t border-line">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-input text-txt-muted hover:text-txt hover:bg-sunken text-xs transition-colors focus-visible:outline-none"
              aria-label={collapsed ? "Expand navigation rail" : "Collapse navigation rail"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Content Area (Max Width 1440px) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex justify-center pb-20 md:pb-10">
          <div className="w-full max-w-content">
            {children}
          </div>
        </main>
      </div>

      {/* Persistent Footer Line */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-raised border-t border-line px-4 flex items-center justify-between text-2xs font-mono text-txt-muted z-30 select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-txt font-medium">{t.footerPolicy}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-2xs text-txt-muted">
          <span>SHA-256 Chained Ledger</span>
          <span>•</span>
          <span className="text-teal font-mono">{t.illustrativeNotice}</span>
        </div>
      </footer>

      {/* Phone Bottom Tab Bar at 390px */}
      <nav
        className="md:hidden fixed bottom-8 left-0 right-0 h-12 bg-raised border-t border-line flex items-center justify-around z-30 select-none"
        aria-label="Mobile Navigation"
      >
        <button
          onClick={() => setCurrentScreen('scan')}
          className={clsx("flex flex-col items-center gap-0.5 text-2xs", currentScreen === 'scan' ? "text-teal font-semibold" : "text-txt-muted")}
        >
          <Search className="w-4 h-4" />
          <span>Scan</span>
        </button>
        <button
          onClick={() => setCurrentScreen('flagged_queue')}
          className={clsx("flex flex-col items-center gap-0.5 text-2xs", currentScreen === 'flagged_queue' ? "text-teal font-semibold" : "text-txt-muted")}
        >
          <ListFilter className="w-4 h-4" />
          <span>Queue</span>
        </button>
        <button
          onClick={() => setCurrentScreen('cases')}
          className={clsx("flex flex-col items-center gap-0.5 text-2xs", currentScreen === 'cases' ? "text-teal font-semibold" : "text-txt-muted")}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Cases</span>
        </button>
        <button
          onClick={() => setCurrentScreen('settings_design')}
          className={clsx("flex flex-col items-center gap-0.5 text-2xs", currentScreen === 'settings_design' ? "text-teal font-semibold" : "text-txt-muted")}
        >
          <Settings className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#081A33]/70 backdrop-blur-[6px]"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-raised border border-line rounded-modal shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
              <Search className="w-4 h-4 text-teal" />
              <input
                type="text"
                autoFocus
                placeholder="Search handles, case references, or hashes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-txt focus:outline-none"
              />
              <kbd className="text-[10px] font-mono text-txt-muted px-1.5 py-0.5 rounded bg-sunken border border-line">
                ESC
              </kbd>
            </div>
            <div className="p-3 text-xs text-txt-muted">
              <p className="px-2 py-1 uppercase text-2xs font-mono font-semibold">Quick Jump:</p>
              <div className="space-y-1 mt-1">
                <button
                  onClick={() => { setCurrentScreen('assessment'); setSearchOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-input hover:bg-sunken flex items-center justify-between text-txt"
                >
                  <span className="font-mono text-teal">@officer_rajesh_8841</span>
                  <span className="text-2xs text-txt-muted">HIGH RISK (0.84) • Instagram</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('assessment'); setSearchOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-input hover:bg-sunken flex items-center justify-between text-txt"
                >
                  <span className="font-mono text-teal">@itbp_recruit_2024</span>
                  <span className="text-2xs text-txt-muted">HIGH RISK (0.91) • Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};
