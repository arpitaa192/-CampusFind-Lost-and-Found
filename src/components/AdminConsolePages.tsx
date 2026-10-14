import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  AuditEvent,
  CAMPUS_LOCATIONS,
  Claim,
  ClaimStatus,
  CustodyStatus,
  ITEM_CATEGORIES,
  ItemReport,
  ReportStatus,
  ReportType,
  ScreenRoute,
  User,
  UserRole,
} from '../types/campusfind';
import { getCustodyLabel, getStatusLabel } from './ReportCard';

interface AdminConsoleProps {
  activeSubPage: 'admin-dashboard' | 'admin-reports' | 'admin-claims';
  currentUser: User;
  reports: ItemReport[];
  claims: Claim[];
  auditEvents: AuditEvent[];
  onNavigate: (screen: ScreenRoute) => void;
  onSelectReport: (report: ItemReport) => void;
  onUpdateReport: (
    reportId: string,
    updates: {
      status?: ReportStatus;
      custodyStatus?: CustodyStatus;
      flaggedReason?: string;
    }
  ) => Promise<void>;
  onClaimDecision: (
    claimId: string,
    payload: {
      status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'HANDOVER_COMPLETED';
      decisionReason: string;
      handoverLocation?: string;
    }
  ) => Promise<void>;
  onSwitchToAdminSession: () => Promise<void>;
}

export const AdminConsolePages: React.FC<AdminConsoleProps> = ({
  activeSubPage,
  currentUser,
  reports,
  claims,
  auditEvents,
  onNavigate,
  onSelectReport,
  onUpdateReport,
  onClaimDecision,
  onSwitchToAdminSession,
}) => {
  const isAuthorizedAdmin =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SECURITY;

  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('ALL');
  const [decisionReasons, setDecisionReasons] = useState<Record<string, string>>({});
  const [handoverLocations, setHandoverLocations] = useState<Record<string, string>>({});
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Calculated Overview Metrics from Real Stored Data
  const totalReports = reports.length;
  const lostCount = reports.filter((r) => r.reportType === ReportType.LOST).length;
  const foundCount = reports.filter((r) => r.reportType === ReportType.FOUND).length;
  const pendingClaimsCount = claims.filter(
    (c) => c.status === ClaimStatus.PENDING || c.status === ClaimStatus.NEEDS_INFO
  ).length;
  const returnedCount = reports.filter(
    (r) => r.status === ReportStatus.RETURNED
  ).length;
  const resolutionRate =
    totalReports > 0 ? Math.round((returnedCount / totalReports) * 100) : 0;

  // Category & Location Analytics
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of ITEM_CATEGORIES) counts[cat] = 0;
    for (const r of reports) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const locationBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const loc of CAMPUS_LOCATIONS) counts[loc] = 0;
    for (const r of reports) {
      counts[r.generalLocation] = (counts[r.generalLocation] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const filteredAdminReports = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return reports.filter((r) => {
      if (reportStatusFilter !== 'ALL' && r.status !== reportStatusFilter) {
        return false;
      }
      if (q) {
        const text = `${r.id} ${r.title} ${r.category} ${r.generalLocation} ${r.reporterName}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [reports, reportSearch, reportStatusFilter]);

  const handleDecisionAction = async (
    claim: Claim,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'HANDOVER_COMPLETED'
  ) => {
    setFeedbackBanner(null);
    const reason =
      decisionReasons[claim.id]?.trim() ||
      (status === 'HANDOVER_COMPLETED'
        ? 'Campus ID checked and physical handover signed at Security Desk.'
        : '');

    try {
      await onClaimDecision(claim.id, {
        status,
        decisionReason: reason,
        handoverLocation:
          handoverLocations[claim.id] ||
          claim.handoverLocation ||
          'Main Building — Central Campus Security Desk (Room G-02)',
      });
      setFeedbackBanner({
        type: 'success',
        text: `Claim ${claim.id} updated to ${status} and recorded in audit trail.`,
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Server rejected administrative action.',
      });
    }
  };

  const handleReportAdminUpdate = async (
    reportId: string,
    updates: {
      status?: ReportStatus;
      custodyStatus?: CustodyStatus;
      flaggedReason?: string;
    }
  ) => {
    setFeedbackBanner(null);
    try {
      await onUpdateReport(reportId, updates);
      setFeedbackBanner({
        type: 'success',
        text: `Report ${reportId} updated successfully.`,
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err.message || 'Server rejected administrative update.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-semibold text-[#1E3A8A]">
            CAMPUS SECURITY &amp; LOST-AND-FOUND ADMINISTRATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-0.5">
            Administrative Oversight Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review reports, verify private ownership claims, confirm safe handovers, and
            monitor real campus recovery analytics.
          </p>
        </div>

        {/* Sub-page Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => onNavigate('admin-dashboard')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === 'admin-dashboard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview &amp; Analytics
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin-claims')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === 'admin-claims'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claim Verification ({pendingClaimsCount} Pending)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin-reports')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubPage === 'admin-reports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Report Management ({reports.length})
          </button>
        </div>
      </div>

      {/* Server-Enforced RBAC Notice Banner */}
      {!isAuthorizedAdmin ? (
        <div className="bg-amber-50 rounded-2xl border border-amber-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#B45309]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Read-Only Preview: Current Session Role is {currentUser.role} (
                {currentUser.displayName})
              </span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed max-w-3xl">
              Administrative privileges are strictly enforced on the Express backend
              server (`server.ts`). While logged in as a Student or Faculty member,
              private verification answers from other users are redacted by the server,
              and attempting to approve or reject a claim below will return a real{' '}
              <code className="font-mono font-bold">403 Forbidden</code> server response.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToAdminSession}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch to Campus Security Admin</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>
              Server RBAC Authorized: Signed in as {currentUser.displayName} (Role:{' '}
              {currentUser.role}). Private verification records are unlocked.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-[#1E3A8A] font-semibold hover:underline"
          >
            Switch Back to Student Role →
          </button>
        </div>
      )}

      {feedbackBanner && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#15803D]'
              : 'bg-red-50 border-red-200 text-[#B91C1C]'
          }`}
        >
          <span className="font-medium">{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================
       * VIEW 1: ADMIN OVERVIEW & ANALYTICS
       * ==================================================================== */}
      {activeSubPage === 'admin-dashboard' && (
        <div className="space-y-6">
          {/* 6-Card Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Total Reports</div>
              <div className="text-2xl font-extrabold text-[#0F172A] font-mono tabular-nums mt-1">
                {totalReports}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Lost Reports</div>
              <div className="text-2xl font-extrabold text-[#B45309] font-mono tabular-nums mt-1">
                {lostCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Found Reports</div>
              <div className="text-2xl font-extrabold text-[#1E3A8A] font-mono tabular-nums mt-1">
                {foundCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Pending Claims</div>
              <div className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
                {pendingClaimsCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Returned Items</div>
              <div className="text-2xl font-extrabold text-[#15803D] font-mono tabular-nums mt-1">
                {returnedCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Resolution Rate</div>
              <div className="text-2xl font-extrabold text-[#2563EB] font-mono tabular-nums mt-1">
                {resolutionRate}%
              </div>
            </div>
          </div>

          {/* Analytics Visual Summaries: Category & Campus Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports by Category */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                  <span>Reports by Item Category</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {totalReports} total
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No category data available when database is empty.
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map(([cat, count]) => {
                    const pct =
                      totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{cat}</span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E3A8A] rounded-full"
                            style={{ width: `${Math.max(6, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reports by Campus Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#15803D]" />
                  <span>Reports by Campus Location</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Hotspot Distribution
                </span>
              </div>

              {locationBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No campus location data available when database is empty.
                </p>
              ) : (
                <div className="space-y-3">
                  {locationBreakdown.map(([loc, count]) => {
                    const pct =
                      totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
                    return (
                      <div key={loc} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{loc}</span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB] rounded-full"
                            style={{ width: `${Math.max(6, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Audit Event Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Security &amp; Status Change Audit Log
                </h2>
                <p className="text-xs text-slate-500">
                  Immutable server-recorded history of report submissions, claim reviews,
                  handovers, and blocked RBAC attempts.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {auditEvents.length} events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Event ID</th>
                    <th className="py-2.5 pr-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 pr-4 font-semibold">Actor &amp; Role</th>
                    <th className="py-2.5 pr-4 font-semibold">Action</th>
                    <th className="py-2.5 pr-4 font-semibold">Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditEvents.slice(0, 12).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-4 font-mono text-slate-700 tabular-nums">
                        {ev.id}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-slate-500 tabular-nums">
                        {ev.timestamp.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-800">
                        {ev.actorName} ({ev.actorRole})
                      </td>
                      <td className="py-2.5 pr-4 font-mono font-semibold text-[#1E3A8A]">
                        {ev.action}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-slate-600">
                        {ev.entityType}: {ev.entityId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * VIEW 2: ADMIN CLAIM VERIFICATION & ITEM HANDOVER
       * ==================================================================== */}
      {activeSubPage === 'admin-claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No ownership claims are currently stored in the system.
            </div>
          ) : (
            claims.map((claim) => {
              const targetReport = reports.find((r) => r.id === claim.reportId);
              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#1E3A8A]">
                        {claim.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Claimant: {claim.claimantName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Item: {claim.reportId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">
                        Status: {claim.status}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      Submitted: {claim.createdAt.slice(0, 10)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {targetReport?.imageReference && (
                      <img
                        src={targetReport.imageReference}
                        alt={claim.reportTitle}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {claim.reportTitle}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Claimant: {claim.claimantName}
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Private Verification Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          Reporter&apos;s Hidden Verification Record ({claim.reportId})
                        </span>
                      </div>
                      {targetReport?.privateIdentifyingDetails ? (
                        <p className="text-slate-800 leading-relaxed">
                          {targetReport.privateIdentifyingDetails}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic">
                          {isAuthorizedAdmin
                            ? 'No hidden identifying notes were entered on this report.'
                            : 'Redacted by server — switch to Campus Security Admin role to view.'}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Claimant&apos;s Submitted Verification Proof</span>
                      </div>
                      {claim.verificationResponse ? (
                        <div className="space-y-1 text-slate-700">
                          <div>
                            <strong>Distinctive Marks:</strong>{' '}
                            {claim.verificationResponse.distinctiveMarks}
                          </div>
                          <div>
                            <strong>Accessories:</strong>{' '}
                            {claim.verificationResponse.attachedAccessories}
                          </div>
                          <div>
                            <strong>Unlisted Detail:</strong>{' '}
                            {claim.verificationResponse.unlistedDetail}
                          </div>
                          {claim.verificationResponse.contentsOrSerial && (
                            <div>
                              <strong>Contents / Serial:</strong>{' '}
                              {claim.verificationResponse.contentsOrSerial}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">
                          Redacted by server for non-admin users to protect claimant
                          privacy.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Decision & Handover Form */}
                  <div className="pt-2 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`reason-${claim.id}`}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Verification Decision Reason / Handover Notes (Required)
                        </label>
                        <input
                          id={`reason-${claim.id}`}
                          type="text"
                          value={
                            decisionReasons[claim.id] ??
                            claim.decisionReason ??
                            ''
                          }
                          onChange={(e) =>
                            setDecisionReasons({
                              ...decisionReasons,
                              [claim.id]: e.target.value,
                            })
                          }
                          placeholder="e.g., Engraved initials A.S. and Laplace card verified at desk"
                          className="w-full min-h-[42px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`loc-${claim.id}`}
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Authorized Handover Desk Location
                        </label>
                        <input
                          id={`loc-${claim.id}`}
                          type="text"
                          value={
                            handoverLocations[claim.id] ??
                            claim.handoverLocation ??
                            'Main Building — Central Campus Security Desk (Room G-02)'
                          }
                          onChange={(e) =>
                            setHandoverLocations({
                              ...handoverLocations,
                              [claim.id]: e.target.value,
                            })
                          }
                          className="w-full min-h-[42px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDecisionAction(claim, 'APPROVED')}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#15803D] hover:bg-emerald-800 text-white text-xs font-semibold"
                      >
                        Approve Claim
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDecisionAction(claim, 'HANDOVER_COMPLETED')
                        }
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-semibold"
                      >
                        Confirm Handover &amp; Mark Returned
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecisionAction(claim, 'NEEDS_INFO')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                      >
                        Request Additional Proof
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecisionAction(claim, 'REJECTED')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white text-xs font-semibold"
                      >
                        Reject Claim
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ====================================================================
       * VIEW 3: ADMIN REPORT MANAGEMENT
       * ==================================================================== */}
      {activeSubPage === 'admin-reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Filter reports by ID, title, category, or reporter..."
                className="w-full min-h-[42px] pl-10 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="min-h-[42px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Statuses</option>
              <option value={ReportStatus.OPEN}>Open</option>
              <option value={ReportStatus.CLAIM_PENDING}>Claim Pending</option>
              <option value={ReportStatus.VERIFIED_AWAITING_HANDOVER}>
                Verified Awaiting Handover
              </option>
              <option value={ReportStatus.RETURNED}>Returned</option>
              <option value={ReportStatus.FLAGGED}>Flagged</option>
              <option value={ReportStatus.CLOSED}>Closed</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {filteredAdminReports.map((report) => {
              const statusInfo = getStatusLabel(report.status);
              return (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {report.imageReference ? (
                      <img
                        src={report.imageReference}
                        alt={report.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                        <Flag className="w-5 h-5" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-900">
                          {report.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{report.reportType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{report.category}</span>
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
                      <div className="text-xs text-slate-600">
                        Reporter: {report.reporterName} · Custody:{' '}
                        {getCustodyLabel(report.custodyStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectReport(report)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                    >
                      Inspect
                    </button>

                    {report.reportType === ReportType.FOUND &&
                      report.custodyStatus !== CustodyStatus.HANDED_TO_SECURITY && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAdminUpdate(report.id, {
                              custodyStatus: CustodyStatus.HANDED_TO_SECURITY,
                            })
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-200 text-xs font-semibold"
                        >
                          Log Security Custody
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        handleReportAdminUpdate(report.id, {
                          status:
                            report.status === ReportStatus.FLAGGED
                              ? ReportStatus.OPEN
                              : ReportStatus.FLAGGED,
                          flaggedReason:
                            report.status === ReportStatus.FLAGGED
                              ? undefined
                              : 'Flagged by administrator for content review',
                        })
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-red-200 text-[#B91C1C] hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>
                        {report.status === ReportStatus.FLAGGED
                          ? 'Unflag'
                          : 'Flag Report'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
