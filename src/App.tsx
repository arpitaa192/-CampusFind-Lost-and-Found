import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Claim,
  ClaimStatus,
  ClaimVerificationAnswers,
  CustodyStatus,
  ItemReport,
  ReportStatus,
  ReportType,
  ScreenRoute,
} from './types/campusfind';
import {
  AppDataState,
  bootstrapData,
  clearAllDemoData,
  markNotificationsRead,
  registerNewUser,
  submitAdminClaimDecision,
  submitItemReport,
  submitOwnershipClaim,
  switchOrLoginUser,
  updateProfileSettings,
  updateReport,
} from './services/dataService';
import { findPotentialMatches } from './utils/matchingEngine';
import { NavbarAndMobileNav } from './components/NavbarAndMobileNav';
import { LandingPage } from './components/LandingPage';
import { ReportFormPage } from './components/ReportForms';
import { SearchAndBrowsePage } from './components/SearchAndBrowsePage';
import {
  ClaimSubmissionPage,
  ItemDetailPage,
  PotentialMatchesPage,
} from './components/ItemDetailAndClaimPage';
import {
  NotificationsPage,
  ProfileAndSettingsPage,
  StudentDashboardPage,
} from './components/StudentAndUserPages';
import { AdminConsolePages } from './components/AdminConsolePages';
import { SafetyAndAwsReadinessPage } from './components/SafetyAndAwsReadinessPage';

export default function App() {
  const [dataState, setDataState] = useState<AppDataState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [activeScreen, setActiveScreen] = useState<ScreenRoute>('home');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [claimTargetReportId, setClaimTargetReportId] = useState<string | null>(
    null
  );
  const [claimMatchedLostId, setClaimMatchedLostId] = useState<
    string | undefined
  >(undefined);

  // Initial bootstrap from Express server / persistent storage
  useEffect(() => {
    let mounted = true;
    bootstrapData(false)
      .then((initial) => {
        if (mounted) {
          setDataState(initial);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setGlobalError(err.message || 'Failed to load CampusFind data.');
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigate = useCallback((screen: ScreenRoute) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectReport = useCallback((report: ItemReport) => {
    setSelectedReportId(report.id);
    setActiveScreen('item-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStartClaim = useCallback(
    (targetReport: ItemReport, matchedLostReportId?: string) => {
      setClaimTargetReportId(targetReport.id);
      setClaimMatchedLostId(matchedLostReportId);
      setActiveScreen('claim-submit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const potentialMatches = useMemo(() => {
    if (!dataState) return [];
    return findPotentialMatches(dataState.reports, 38);
  }, [dataState]);

  const unreadNotificationsCount = useMemo(() => {
    if (!dataState) return 0;
    return dataState.notifications.filter((n) => !n.readAt).length;
  }, [dataState]);

  const pendingAdminClaimsCount = useMemo(() => {
    if (!dataState) return 0;
    return dataState.claims.filter(
      (c) =>
        c.status === ClaimStatus.PENDING || c.status === ClaimStatus.NEEDS_INFO
    ).length;
  }, [dataState]);

  const selectedReport = useMemo(() => {
    if (!dataState || !selectedReportId) return dataState?.reports[0] || null;
    return (
      dataState.reports.find((r) => r.id === selectedReportId) ||
      dataState.reports[0] ||
      null
    );
  }, [dataState, selectedReportId]);

  const claimTargetReport = useMemo(() => {
    if (!dataState || !claimTargetReportId)
      return selectedReport || dataState?.reports[0] || null;
    return (
      dataState.reports.find((r) => r.id === claimTargetReportId) ||
      selectedReport ||
      dataState.reports[0] ||
      null
    );
  }, [dataState, claimTargetReportId, selectedReport]);

  const userLostReports = useMemo(() => {
    if (!dataState) return [];
    return dataState.reports.filter(
      (r) =>
        r.reporterId === dataState.currentUser.id &&
        r.reportType === ReportType.LOST &&
        r.status !== ReportStatus.RETURNED
    );
  }, [dataState]);

  // Handlers wired to Backend Persistence API
  const handleCreateReport = async (payload: {
    reportType: ReportType;
    title: string;
    category: string;
    color: string;
    brand?: string;
    description: string;
    generalLocation: string;
    specificArea?: string;
    dateOccurred: string;
    approximateTime?: string;
    imageReference?: string;
    custodyStatus?: CustodyStatus;
    preferredContactMethod?: 'IN_APP' | 'CAMPUS_EMAIL' | 'SECURITY_DESK';
    privateIdentifyingDetails?: string;
  }): Promise<ItemReport> => {
    const result = await submitItemReport(payload);
    setDataState(result.state);
    setSelectedReportId(result.report.id);
    return result.report;
  };

  const handleUpdateReport = async (
    reportId: string,
    updates: {
      status?: ReportStatus;
      custodyStatus?: CustodyStatus;
      description?: string;
      specificArea?: string;
      flaggedReason?: string;
    }
  ) => {
    const result = await updateReport(reportId, updates);
    setDataState(result.state);
  };

  const handleCreateClaim = async (payload: {
    reportId: string;
    matchedLostReportId?: string;
    verificationResponse: ClaimVerificationAnswers;
  }): Promise<Claim> => {
    const result = await submitOwnershipClaim(payload);
    setDataState(result.state);
    return result.claim;
  };

  const handleAdminClaimDecision = async (
    claimId: string,
    payload: {
      status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'HANDOVER_COMPLETED';
      decisionReason: string;
      handoverLocation?: string;
    }
  ) => {
    const result = await submitAdminClaimDecision(claimId, payload);
    setDataState(result.state);
  };

  const handleMarkNotificationsRead = async (params: {
    notificationId?: string;
    markAll?: boolean;
  }) => {
    const updatedState = await markNotificationsRead(params);
    setDataState(updatedState);
  };

  const handleSwitchUser = async (params: {
    userId?: string;
    email?: string;
    password?: string;
  }) => {
    const updatedState = await switchOrLoginUser(params);
    setDataState(updatedState);
  };

  const handleRegisterUser = async (params: {
    displayName: string;
    email: string;
    department: string;
    password: string;
  }) => {
    const updatedState = await registerNewUser(params);
    setDataState(updatedState);
  };

  const handleUpdateProfile = async (payload: {
    displayName?: string;
    department?: string;
    notificationPrefs?: {
      matchAlerts: boolean;
      claimUpdates: boolean;
      handoverConfirmations: boolean;
    };
  }) => {
    const updatedState = await updateProfileSettings(payload);
    setDataState(updatedState);
  };

  const handleResetDemoData = async () => {
    const updatedState = await bootstrapData(true);
    setDataState(updatedState);
  };

  const handleClearAllData = async () => {
    const updatedState = await clearAllDemoData();
    setDataState(updatedState);
  };

  if (isLoading || !dataState) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="text-xs text-slate-500 text-center">
            Loading CampusFind platform &amp; synchronizing persistent store...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-20 md:pb-10">
      <NavbarAndMobileNav
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        currentUser={dataState.currentUser}
        unreadNotificationsCount={unreadNotificationsCount}
        pendingAdminClaimsCount={pendingAdminClaimsCount}
      />

      {globalError && (
        <div
          role="alert"
          className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 w-full"
        >
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center justify-between">
            <span>{globalError}</span>
            <button
              type="button"
              onClick={() => setGlobalError(null)}
              className="underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeScreen === 'home' && (
          <LandingPage
            reports={dataState.reports}
            matches={potentialMatches}
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        )}

        {activeScreen === 'search' && (
          <SearchAndBrowsePage
            reports={dataState.reports}
            matches={potentialMatches}
            onSelectReport={handleSelectReport}
            onNavigate={handleNavigate}
          />
        )}

        {activeScreen === 'report-lost' && (
          <ReportFormPage
            mode={ReportType.LOST}
            onBack={() => handleNavigate('home')}
            onSubmitReport={handleCreateReport}
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        )}

        {activeScreen === 'report-found' && (
          <ReportFormPage
            mode={ReportType.FOUND}
            onBack={() => handleNavigate('home')}
            onSubmitReport={handleCreateReport}
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        )}

        {activeScreen === 'item-detail' && selectedReport && (
          <ItemDetailPage
            report={selectedReport}
            allReports={dataState.reports}
            claims={dataState.claims}
            currentUser={dataState.currentUser}
            onBack={() => handleNavigate('search')}
            onStartClaim={handleStartClaim}
            onSelectReport={handleSelectReport}
            onUpdateReportStatus={handleUpdateReport}
            onNavigate={handleNavigate}
          />
        )}

        {activeScreen === 'matches' && (
          <PotentialMatchesPage
            matches={potentialMatches}
            onSelectReport={handleSelectReport}
            onStartClaim={handleStartClaim}
            onNavigate={handleNavigate}
          />
        )}

        {activeScreen === 'claim-submit' && claimTargetReport && (
          <ClaimSubmissionPage
            targetReport={claimTargetReport}
            matchedLostReportId={claimMatchedLostId}
            currentUser={dataState.currentUser}
            userLostReports={userLostReports}
            onBack={() =>
              selectedReport
                ? handleNavigate('item-detail')
                : handleNavigate('matches')
            }
            onSubmitClaim={handleCreateClaim}
            onNavigate={handleNavigate}
          />
        )}

        {activeScreen === 'student-dashboard' && (
          <StudentDashboardPage
            currentUser={dataState.currentUser}
            reports={dataState.reports}
            claims={dataState.claims}
            matches={potentialMatches}
            onSelectReport={handleSelectReport}
            onStartClaim={handleStartClaim}
            onUpdateReportStatus={handleUpdateReport}
            onNavigate={handleNavigate}
          />
        )}

        {activeScreen === 'notifications' && (
          <NotificationsPage
            notifications={dataState.notifications}
            onMarkRead={handleMarkNotificationsRead}
            onNavigate={handleNavigate}
          />
        )}

        {(activeScreen === 'profile' || activeScreen === 'auth') && (
          <ProfileAndSettingsPage
            currentUser={dataState.currentUser}
            users={dataState.users}
            onSwitchUser={handleSwitchUser}
            onRegisterUser={handleRegisterUser}
            onUpdateProfile={handleUpdateProfile}
            onResetDemoData={handleResetDemoData}
            onClearAllData={handleClearAllData}
            onNavigate={handleNavigate}
          />
        )}

        {(activeScreen === 'admin-dashboard' ||
          activeScreen === 'admin-reports' ||
          activeScreen === 'admin-claims') && (
          <AdminConsolePages
            activeSubPage={activeScreen}
            currentUser={dataState.currentUser}
            reports={dataState.reports}
            claims={dataState.claims}
            auditEvents={dataState.auditEvents}
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
            onUpdateReport={handleUpdateReport}
            onClaimDecision={handleAdminClaimDecision}
            onSwitchToAdminSession={() =>
              handleSwitchUser({ userId: 'usr-admin-1' })
            }
          />
        )}

        {activeScreen === 'safety-privacy' && (
          <SafetyAndAwsReadinessPage
            currentUser={dataState.currentUser}
            reports={dataState.reports}
            claims={dataState.claims}
            matches={potentialMatches}
            serverMeta={dataState.serverMeta}
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
