import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockAccounts, MockAccount } from '../mock/accounts';
import { mockCases, TakedownCase } from '../mock/cases';
import { mockAuditLogs, AuditEntry } from '../mock/auditLogs';
import { Language } from './translations';

export type ScreenId = 
  | 'sign_in' 
  | 'dashboard' 
  | 'scan' 
  | 'assessment' 
  | 'flagged_queue' 
  | 'cases' 
  | 'case_detail' 
  | 'audit_log' 
  | 'nodal_queue' 
  | 'settings_design';

interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'danger' | 'saffron';
  message: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  officerId: string;
  currentScreen: ScreenId;
  setCurrentScreen: (s: ScreenId) => void;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  
  accounts: MockAccount[];
  cases: TakedownCase[];
  auditLogs: AuditEntry[];
  
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  density: 'comfortable' | 'compact';
  setDensity: (d: 'comfortable' | 'compact') => void;
  language: Language;
  setLanguage: (l: Language) => void;
  reducedMotion: boolean;
  setReducedMotion: (r: boolean) => void;
  
  simulateTampering: boolean;
  setSimulateTampering: (t: boolean) => void;
  
  toasts: ToastMessage[];
  addToast: (msg: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  
  login: (officerId: string) => void;
  logout: () => void;
  sendAccountToCell: (id: string) => void;
  confirmAsFake: (id: string, reason: string) => void;
  markAsGenuine: (id: string) => void;
  updateCaseStatus: (caseId: string, status: TakedownCase['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default true for immediate navigation, can sign out to test
  const [officerId, setOfficerId] = useState<string>("Insp. Rajesh Kumar (NC-104)");
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>("acc-001");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>("case-001");
  
  const [accounts, setAccounts] = useState<MockAccount[]>(mockAccounts);
  const [cases, setCases] = useState<TakedownCase[]>(mockCases);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(mockAuditLogs);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [language, setLanguage] = useState<Language>('en');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [simulateTampering, setSimulateTampering] = useState<boolean>(false);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Apply density
  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') {
      root.classList.add('density-compact');
    } else {
      root.classList.remove('density-compact');
    }
  }, [density]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = (id: string) => {
    setIsAuthenticated(true);
    setOfficerId(id || "Insp. Rajesh Kumar (NC-104)");
    setCurrentScreen('dashboard');
    addToast("Signed in successfully as authorized officer.", "success");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('sign_in');
    addToast("Session ended safely.", "info");
  };

  const sendAccountToCell = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    
    // Create new case in Cases
    const newCase: TakedownCase = {
      id: `case-${Date.now()}`,
      caseRef: `ITBP-PG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      targetHandle: `@${target.handle}`,
      targetName: target.name,
      platform: target.platform,
      riskScore: target.score,
      status: 'with_nodal_cell',
      statutoryBasis: 'Section 79(3)(b) Information Technology Act',
      slaDueMinutes: target.slaDueMinutes,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      assignedAnalyst: officerId,
      evidenceSummary: {
        followers: target.followers,
        following: target.following,
        accountAgeDays: target.accountAgeDays,
        sha256EvidenceHash: target.evidenceHash + "e9102c48d910283a",
        identifiedViolations: ["Impersonation", "Urgent Phishing"],
        safeBrowsingStatus: target.urlReputation.safe ? "CLEAN" : "THREAT DETECTED"
      },
      timeline: [
        { time: "Just now", title: "Dispatched to Nodal Cell", actor: officerId, detail: "Sent for supervisor and legal nodal review." }
      ],
      noticeDraft: {
        addressedTo: `Grievance Officer, ${target.platform.toUpperCase()} Legal Operations`,
        section: "Section 79(3)(b) IT Act",
        deadlineHours: 36,
        body: `Legal takedown docket initiated for @${target.handle}. Evidence digest signed.`
      }
    };
    setCases((prev) => [newCase, ...prev]);

    // Append to audit log
    const newAudit: AuditEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      action: "SENT_TO_NODAL_CELL",
      actor: officerId,
      targetHandle: `@${target.handle}`,
      prevHash: auditLogs[auditLogs.length - 1]?.thisHash || "0000000000",
      thisHash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
    };
    setAuditLogs((prev) => [...prev, newAudit]);

    addToast(`Sent to cell: @${target.handle}`, "success");
  };

  const confirmAsFake = (id: string, reason: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'confirmed_fake' } : a))
    );

    sendAccountToCell(id);
    addToast(`Confirmed: @${target.handle} marked as fake account`, "danger");
  };

  const markAsGenuine = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'genuine', band: 'LOW' } : a))
    );
    addToast(`Marked as genuine: @${target.handle}`, "info");
  };

  const updateCaseStatus = (caseId: string, status: TakedownCase['status']) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status } : c))
    );
    addToast(`Case ${caseId} status updated to ${status.replace('_', ' ')}`, "info");
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        officerId,
        currentScreen,
        setCurrentScreen,
        selectedAccountId,
        setSelectedAccountId,
        selectedCaseId,
        setSelectedCaseId,
        accounts,
        cases,
        auditLogs,
        theme,
        setTheme,
        density,
        setDensity,
        language,
        setLanguage,
        reducedMotion,
        setReducedMotion,
        simulateTampering,
        setSimulateTampering,
        toasts,
        addToast,
        removeToast,
        login,
        logout,
        sendAccountToCell,
        confirmAsFake,
        markAsGenuine,
        updateCaseStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
