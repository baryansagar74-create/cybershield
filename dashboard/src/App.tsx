import React from 'react';
import { useApp } from './lib/state';
import { Shell } from './components/Shell';
import { SignInScreen } from './screens/SignInScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ScanScreen } from './screens/ScanScreen';
import { AssessmentScreen } from './screens/AssessmentScreen';
import { FlaggedQueueScreen } from './screens/FlaggedQueueScreen';
import { CasesScreen } from './screens/CasesScreen';
import { CaseDetailScreen } from './screens/CaseDetailScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { NodalQueueScreen } from './screens/NodalQueueScreen';
import { SettingsDesignSystemScreen } from './screens/SettingsDesignSystemScreen';

export const App: React.FC = () => {
  const { currentScreen, isAuthenticated } = useApp();

  const renderScreen = () => {
    if (!isAuthenticated) return <SignInScreen />;

    switch (currentScreen) {
      case 'sign_in':
        return <SignInScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'scan':
        return <ScanScreen />;
      case 'assessment':
        return <AssessmentScreen />;
      case 'flagged_queue':
        return <FlaggedQueueScreen />;
      case 'cases':
        return <CasesScreen />;
      case 'case_detail':
        return <CaseDetailScreen />;
      case 'audit_log':
        return <AuditLogScreen />;
      case 'nodal_queue':
        return <NodalQueueScreen />;
      case 'settings_design':
        return <SettingsDesignSystemScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return <Shell>{renderScreen()}</Shell>;
};
