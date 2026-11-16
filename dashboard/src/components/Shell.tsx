import React, { useState, useEffect } from 'react';
import { useApp, ScreenId } from '../lib/state';
import { translations } from '../lib/translations';
import { ToastContainer } from './Toast';
import { 
  Search, 
  Languages, 
  Sun, 
  Moon, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity
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
    logout,
    cases,
    runLiveScan,
  } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = translations[language];

  // Cases count with nodal cell
  const nodalCount = cases.filter((c) => c.status === 'with_nodal_cell').length;

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

  const navItems: { id: ScreenId; label: string; dotColor: string }[] = [
    { id: 'assessment', label: "Assessment", dotColor: "#12D8C4" },
    { id: 'dashboard', label: t.nav.dashboard, dotColor: "#34F0DB" },
    { id: 'scan', label: t.nav.scan, dotColor: "#12D8C4" },
    { id: 'flagged_queue', label: "Flagged queue", dotColor: "#FF9F2E" },
    { id: 'cases', label: "Cases", dotColor: "#FF3D8B" },
    { id: 'audit_log', label: "Audit log", dotColor: "#8E6BFF" },
    { id: 'nodal_queue', label: "Nodal queue", dotColor: "#3DDC97" },
    { id: 'settings_design', label: "Settings", dotColor: "#A9B9E0" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#030614] via-[#070D24] to-[#0A102E] text-[#F0F4FF] font-sans antialiased overflow-x-hidden selection:bg-[#12D8C4] selection:text-[#032622]">
      {/* CYBER GRID PATTERN OVERLAY */}
      <div className="pointer-events-none fixed inset-0 cyber-grid opacity-75 z-0" />

      {/* GLOSSY COLOUR MIX AMBIENT GLOW ORBS WITH LIVING ORGANIC FLOAT ANIMATION */}
      <div className="pointer-events-none fixed left-[-100px] top-[-100px] w-[580px] h-[580px] rounded-full bg-[#12D8C4] opacity-25 blur-[140px] z-0 animate-aurora-1" />
      <div className="pointer-events-none fixed right-[-80px] top-[40px] w-[500px] h-[500px] rounded-full bg-[#FF3D8B] opacity-20 blur-[150px] z-0 animate-aurora-2" />
      <div className="pointer-events-none fixed left-[340px] bottom-[-180px] w-[600px] h-[450px] rounded-full bg-[#FF9F2E] opacity-15 blur-[140px] z-0 animate-aurora-3" />
      <div className="pointer-events-none fixed right-[180px] bottom-[-100px] w-[450px] h-[450px] rounded-full bg-[#7A4DFF] opacity-25 blur-[140px] z-0 animate-aurora-1" />

      {/* Main Layout Container */}
      <div className="relative z-10 flex min-h-screen p-3 md:p-6 gap-5">
        
        {/* GLOSSY GLASSMORPHIC LEFT SIDEBAR */}
        <aside
          className={clsx(
            "hidden md:flex flex-col justify-between flex-shrink-0 rounded-[22px] p-5 glass-panel select-none transition-all duration-200 z-20",
            collapsed ? "w-18" : "w-[214px]"
          )}
        >
          <div className="space-y-4">
            {/* Header with Official Two-Tone Shield from Main.dc.html */}
            <div
              className="flex items-center gap-2.5 pb-4 border-b border-white/10 cursor-pointer"
              onClick={() => setCurrentScreen('assessment')}
            >
              <svg width="34" height="38" viewBox="0 0 40 44" role="img" aria-label="ProfileGuard shield" className="flex-shrink-0 drop-shadow-[0_0_12px_rgba(255,77,141,0.5)]">
                <defs>
                  <linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFC15A"></stop><stop offset="1" stopColor="#FF4D8D"></stop></linearGradient>
                  <linearGradient id="sh2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2C6B"></stop><stop offset="1" stopColor="#080E30"></stop></linearGradient>
                </defs>
                <path d="M20 2 L37 8 V22 C37 33 29 39 20 42 C11 39 3 33 3 22 V8 Z" fill="url(#sh)"></path>
                <path d="M20 5.5 L34 10.5 V22 C34 31 27.5 36 20 38.8 C12.5 36 6 31 6 22 V10.5 Z" fill="url(#sh2)"></path>
                <circle cx="20" cy="16" r="4.2" fill="#2EE6D0"></circle>
                <path d="M12 28 C12 22 28 22 28 28 Z" fill="#2EE6D0"></path>
                <path d="M8 12 L20 7 L20 12 Z" fill="#fff" opacity=".18"></path>
              </svg>
              {!collapsed && (
                <div>
                  <div className="font-bold text-[18px] tracking-tight text-white leading-none">
                    ProfileGuard
                  </div>
                  <div className="text-[10px] text-[#A9B9E0] font-mono mt-0.5 tracking-wider uppercase">
                    ITBP Cyber Cell
                  </div>
                </div>
              )}
            </div>

            {/* Navigation List */}
            <nav className="space-y-1.5" aria-label="Workstation Navigation">
              {navItems.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentScreen(item.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-xs font-semibold transition-all select-none text-left focus-visible:outline-none",
                      isActive
                        ? "bg-gradient-to-b from-[#34F0DB] to-[#0FA79B] text-[#032622] font-bold shadow-glow-teal border-t border-white/70"
                        : "text-[#C9D6F5] hover:bg-white/10 hover:text-white"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                      style={{
                        backgroundColor: isActive ? '#032622' : item.dotColor,
                        boxShadow: isActive ? 'none' : `0 0 10px ${item.dotColor}`,
                      }}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Notice in Sidebar */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            {!collapsed && (
              <div className="p-3 rounded-[14px] bg-white/[0.07] border border-white/[0.14] text-[11px] leading-relaxed text-[#B8C6EA]">
                No notice is sent without analyst and nodal-cell approval.
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-[12px] bg-white/5 hover:bg-white/10 text-white/70 transition-colors text-xs"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 z-10 space-y-4">
          
          {/* Top Bar with Live Search, Language, Theme & Officer Pill */}
          <header className="flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Quick search handles, case ref, hashes... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      await runLiveScan(searchQuery.trim());
                      setCurrentScreen('assessment');
                    }
                  }}
                  className="w-full glass-input rounded-[14px] px-3.5 py-2 pl-9 text-xs text-white placeholder-white/40 focus:outline-none font-mono"
                />
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 select-none">
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="px-2.5 py-1.5 rounded-[12px] bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono text-white transition-colors flex items-center gap-1.5"
                title="Toggle Language"
              >
                <Languages className="w-3.5 h-3.5 text-[#12D8C4]" />
                <span>{language.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-[12px] bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors"
                title="Toggle Dark/Light Mode"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#FF9F2E]" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[14px] bg-white/10 border border-white/15 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#3DDC97] shadow-[0_0_8px_#3DDC97]" />
                <span className="font-semibold text-white truncate max-w-[150px]">{officerId}</span>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-[12px] bg-white/10 hover:bg-[#FF3D8B]/20 border border-white/15 text-white/70 hover:text-[#FF3D8B] transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Children Screen Views */}
          <main className="flex-1 min-w-0 pb-12">
            {children}
          </main>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
