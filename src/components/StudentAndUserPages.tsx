import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  FolderKanban,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  Claim,
  ClaimStatus,
  ItemReport,
  NotificationItem,
  PotentialMatchPair,
  ReportStatus,
  ReportType,
  ScreenRoute,
  User,
} from '../types/campusfind';
import { getStatusLabel } from './ReportCard';

/* ============================================================================
 * 1. STUDENT DASHBOARD PAGE ("My Items")
 * ========================================================================== */
interface StudentDashboardProps {
  currentUser: User;
  reports: ItemReport[];
  claims: Claim[];
  matches: PotentialMatchPair[];
  onSelectReport: (report: ItemReport) => void;
  onStartClaim: (foundReport: ItemReport, matchedLostReportId?: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    updates: { status?: ReportStatus }
  ) => Promise<void>;
  onNavigate: (screen: ScreenRoute) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardProps> = ({
  currentUser,
  reports,
  claims,
  matches,
  onSelectReport,
  onStartClaim,
  onUpdateReportStatus,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'MATCHES' | 'CLAIMS'>(
    'REPORTS'
  );

  // Personalized user records calculated strictly from stored application data
  const myLostReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.reporterId === currentUser.id && r.reportType === ReportType.LOST
      ),
    [reports, currentUser.id]
  );

  const myFoundReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.reporterId === currentUser.id && r.reportType === ReportType.FOUND
      ),
    [reports, currentUser.id]
  );

  const myActiveLostCount = useMemo(
    () =>
      myLostReports.filter(
        (r) =>
          r.status !== ReportStatus.RETURNED && r.status !== ReportStatus.CLOSED
      ).length,
    [myLostReports]
  );

  const myMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.lostReport.reporterId === currentUser.id ||
          m.foundReport.reporterId === currentUser.id
      ),
    [matches, currentUser.id]
  );

  const myClaims = useMemo(
    () => claims.filter((c) => c.claimantId === currentUser.id),
    [claims, currentUser.id]
  );

  const myPendingClaimsCount = useMemo(
    () =>
      myClaims.filter(
        (c) =>
          c.status === ClaimStatus.PENDING || c.status === ClaimStatus.NEEDS_INFO
      ).length,
    [myClaims]
  );

  const myApprovedClaimsCount = useMemo(
    () => myClaims.filter((c) => c.status === ClaimStatus.APPROVED).length,
    [myClaims]
  );

  const myReturnedCount = useMemo(() => {
    const returnedReports = reports.filter(
      (r) =>
        r.reporterId === currentUser.id && r.status === ReportStatus.RETURNED
    ).length;
    const completedClaims = myClaims.filter(
      (c) => c.status === ClaimStatus.HANDOVER_COMPLETED
    ).length;
    return Math.max(returnedReports, completedClaims);
  }, [reports, myClaims, currentUser.id]);

  const allMyReports = useMemo(
    () => reports.filter((r) => r.reporterId === currentUser.id),
    [reports, currentUser.id]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#2563EB]">
            Personal Campus Recovery Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-0.5">
            {currentUser.displayName}&apos;s Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {currentUser.department || 'Campus Member'} · Role: {currentUser.role} ·
            All counts below are calculated from your stored reports and claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('report-lost')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A]"
          >
            + Report Lost Item
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-found')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50"
          >
            + Report Found Item
          </button>
        </div>
      </div>

      {/* Personalized 6-Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Active Lost Reports</div>
          <div className="text-2xl font-extrabold text-[#B45309] font-mono tabular-nums mt-1">
            {myActiveLostCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Found Items Logged</div>
          <div className="text-2xl font-extrabold text-[#1E3A8A] font-mono tabular-nums mt-1">
            {myFoundReports.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Potential Matches</div>
          <div className="text-2xl font-extrabold text-[#2563EB] font-mono tabular-nums mt-1">
            {myMatches.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Pending Claims</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {myPendingClaimsCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Approved Claims</div>
          <div className="text-2xl font-extrabold text-[#15803D] font-mono tabular-nums mt-1">
            {myApprovedClaimsCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Returned Items</div>
          <div className="text-2xl font-extrabold text-[#15803D] font-mono tabular-nums mt-1">
            {myReturnedCount}
          </div>
        </div>
      </div>

      {/* Interactive Tab Selector */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('REPORTS')}
          className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'REPORTS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Submitted Reports ({allMyReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MATCHES')}
          className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'MATCHES'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Potential Matches ({myMatches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CLAIMS')}
          className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'CLAIMS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Ownership Claims ({myClaims.length})
        </button>
      </div>

      {/* TAB 1: MY REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-3">
          {allMyReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-base font-bold text-slate-900">
                You haven&apos;t submitted any reports yet
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Report a lost belonging or log a found item to track its recovery
                progress and receive automatic match alerts.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('report-lost')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
                >
                  Report Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('report-found')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                >
                  Report Found Item
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {allMyReports.map((report) => {
                const statusInfo = getStatusLabel(report.status);
                const matchCountForReport = myMatches.filter(
                  (m) =>
                    m.lostReport.id === report.id || m.foundReport.id === report.id
                ).length;

                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {report.imageReference ? (
                        <img
                          src={report.imageReference}
                          alt={report.title}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <FolderKanban className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`font-bold ${
                              report.reportType === ReportType.LOST
                                ? 'text-[#B45309]'
                                : 'text-[#15803D]'
                            }`}
                          >
                            {report.reportType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-semibold text-slate-700 tabular-nums">
                            {report.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{report.dateOccurred}</span>
                          <span aria-hidden="true">·</span>
                          <span>{report.generalLocation}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusInfo.colorClass}`}>
                            {statusInfo.text}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {report.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {report.description}
                        </p>
                        {matchCountForReport > 0 && (
                          <div className="text-xs font-semibold text-[#2563EB] flex items-center gap-1 pt-0.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {matchCountForReport} potential match candidate(s) available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectReport(report)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold"
                      >
                        View Details
                      </button>
                      {report.status !== ReportStatus.RETURNED && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateReportStatus(report.id, {
                              status:
                                report.status === ReportStatus.CLOSED
                                  ? ReportStatus.OPEN
                                  : ReportStatus.CLOSED,
                            })
                          }
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                        >
                          {report.status === ReportStatus.CLOSED
                            ? 'Reopen'
                            : 'Close Report'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY POTENTIAL MATCHES */}
      {activeTab === 'MATCHES' && (
        <div className="space-y-3">
          {myMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No potential matches found for your active reports yet.
            </div>
          ) : (
            myMatches.map((pair) => (
              <div
                key={pair.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[#2563EB] tabular-nums">
                    Estimated Similarity: {pair.breakdown.normalizedPercentage}% ·{' '}
                    {pair.lostReport.id} ↔ {pair.foundReport.id}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pair.foundReport.title} ({pair.foundReport.generalLocation})
                  </h3>
                  <div className="text-xs text-slate-600">
                    Matched factors: {pair.breakdown.matchedFactors.join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectReport(pair.foundReport)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    Inspect Item
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartClaim(pair.foundReport, pair.lostReport.id)
                    }
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
                  >
                    Submit Claim
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MY CLAIMS */}
      {activeTab === 'CLAIMS' && (
        <div className="space-y-3">
          {myClaims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              You have not submitted any ownership claims yet.
            </div>
          ) : (
            myClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {claim.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Target Report: {claim.reportId}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#1E3A8A]">
                      Status: {claim.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Submitted: {claim.createdAt.slice(0, 10)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {claim.reportTitle}
                </h3>

                {claim.decisionReason && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong>Administrator Review Note:</strong> {claim.decisionReason}
                    {claim.reviewedBy ? ` (Reviewed by ${claim.reviewedBy})` : ''}
                  </div>
                )}

                {claim.handoverLocation && (
                  <div className="text-xs text-slate-600">
                    <strong>Designated Handover Location:</strong>{' '}
                    {claim.handoverLocation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. NOTIFICATIONS CENTER PAGE
 * ========================================================================== */
interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkRead: (params: { notificationId?: string; markAll?: boolean }) => Promise<void>;
  onNavigate: (screen: ScreenRoute) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onMarkRead,
  onNavigate,
}) => {
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            In-App Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time alerts generated by potential match discoveries, claim submissions,
            verification status updates, and confirmed handovers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => onMarkRead({ markAll: true })}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-[#15803D]" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-900">
            No notifications right now
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            When a matching item is reported or a claim status changes, alerts will appear
            here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnread ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`font-semibold ${
                        isUnread ? 'text-[#2563EB]' : 'text-slate-500'
                      }`}
                    >
                      {isUnread ? 'Unread Alert' : 'Read'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {n.createdAt.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {n.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.targetScreen && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnread) {
                          onMarkRead({ notificationId: n.id });
                        }
                        onNavigate(n.targetScreen!);
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
                    >
                      Open
                    </button>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => onMarkRead({ notificationId: n.id })}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. PROFILE, SETTINGS, AUTH & DEMO DATA MANAGEMENT PAGE
 * ========================================================================== */
interface ProfileAndAuthProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (params: {
    userId?: string;
    email?: string;
    password?: string;
  }) => Promise<void>;
  onRegisterUser: (params: {
    displayName: string;
    email: string;
    department: string;
    password: string;
  }) => Promise<void>;
  onUpdateProfile: (payload: {
    displayName?: string;
    department?: string;
    notificationPrefs?: {
      matchAlerts: boolean;
      claimUpdates: boolean;
      handoverConfirmations: boolean;
    };
  }) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onNavigate: (screen: ScreenRoute) => void;
}

export const ProfileAndSettingsPage: React.FC<ProfileAndAuthProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onRegisterUser,
  onUpdateProfile,
  onResetDemoData,
  onClearAllData,
  onNavigate,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [prefs, setPrefs] = useState(currentUser.notificationPrefs);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await onUpdateProfile({
        displayName,
        department,
        notificationPrefs: prefs,
      });
      setStatusMessage('Profile and notification preferences saved.');
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to save profile.');
    }
  };

  const handleQuickRoleSwitch = async (userId: string) => {
    setStatusMessage(null);
    setAuthError(null);
    try {
      await onSwitchUser({ userId });
      const chosen = users.find((u) => u.id === userId);
      if (chosen) {
        setDisplayName(chosen.displayName);
        setDepartment(chosen.department || '');
        setPrefs(chosen.notificationPrefs);
      }
      setStatusMessage(
        `Switched active session to ${chosen?.displayName} (${chosen?.role}). Server RBAC updated.`
      );
    } catch (err: any) {
      setAuthError(err.message || 'Could not switch account.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await onRegisterUser({
        displayName: regName,
        email: regEmail,
        department: regDept,
        password: regPassword,
      });
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setStatusMessage('New campus student account created and signed in!');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
          Profile, Authentication &amp; Data Controls
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your profile, switch between Student and Campus Security Admin roles to
          test server-side RBAC, or reset demonstration data.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-[#15803D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Role & Session Switcher (For Mobile Testing of Student vs Admin RBAC) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#2563EB]" />
              <span>Active Authenticated Session &amp; Role Switcher</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tap any account below to obtain a real server session token and test
              role-based permissions (Student vs. Finder vs. Campus Security Admin).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickRoleSwitch(u.id)}
                className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#2563EB] bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-[#1E3A8A]">
                    ROLE: {u.role} {isCurrent ? '· ACTIVE SESSION' : ''}
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {u.displayName}
                  </div>
                  <div className="text-xs text-slate-500">{u.department}</div>
                </div>
                <UserCheck
                  className={`w-5 h-5 shrink-0 ${
                    isCurrent ? 'text-[#2563EB]' : 'text-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Profile Settings & Notification Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            Profile &amp; Notification Preferences
          </h2>

          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label
              htmlFor="profile-dept"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Department / Faculty
            </label>
            <input
              id="profile-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800">
              In-App Alert Subscriptions
            </div>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs?.matchAlerts ?? true}
                onChange={(e) =>
                  setPrefs({ ...prefs, matchAlerts: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A]"
              />
              <span>Notify me when the Smart Match Engine finds a candidate</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs?.claimUpdates ?? true}
                onChange={(e) =>
                  setPrefs({ ...prefs, claimUpdates: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A]"
              />
              <span>Notify me when an ownership claim status changes</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 min-h-[36px] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs?.handoverConfirmations ?? true}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    handoverConfirmations: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A]"
              />
              <span>Notify me when a return handover is officially recorded</span>
            </label>
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A]"
          >
            Save Profile Preferences
          </button>
        </form>

        {/* Register a New Custom Account */}
        <form
          onSubmit={handleRegisterSubmit}
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#2563EB]" />
            <span>Register New Student Account</span>
          </h2>
          <p className="text-xs text-slate-600">
            Create a fresh account with zero reports to test new-user empty states.
          </p>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B91C1C]">
              {authError}
            </div>
          )}

          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="e.g., Priya Patel"
              className="w-full min-h-[42px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              University Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="priya.patel@campus.edu.example"
              className="w-full min-h-[42px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label
              htmlFor="reg-pass"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Password (min 6 chars)
            </label>
            <input
              id="reg-pass"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[42px] px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Create Account &amp; Sign In
          </button>
        </form>
      </div>

      {/* 3. Demonstration Data & Privacy Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Demonstration Data &amp; Empty-State Controls
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Restore the initial demonstration dataset (water bottle, calculator,
              backpack, notebook, keychain, earbuds) or clear all reports to verify how
              the platform behaves when the database is empty.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={async () => {
                await onResetDemoData();
                setStatusMessage('Demonstration dataset restored to initial state.');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demonstration Data</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await onClearAllData();
                setStatusMessage(
                  'All reports and claims cleared. You can now test empty states across all screens.'
                );
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#B91C1C] text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Reports (Test Empty State)</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Privacy Guarantee: Personal phone numbers, email addresses, and private
              claim answers are redacted from public API queries.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('safety-privacy')}
            className="text-[#2563EB] font-semibold hover:underline"
          >
            View Full Privacy &amp; AWS Readiness Docs →
          </button>
        </div>
      </div>
    </div>
  );
};
