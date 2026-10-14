import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FlaskConical,
  HelpCircle,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Claim,
  ClaimVerificationAnswers,
  CustodyStatus,
  ItemReport,
  PotentialMatchPair,
  ReportStatus,
  ReportType,
  ScreenRoute,
  User,
  UserRole,
} from '../types/campusfind';
import {
  getMatchesForSingleReport,
  runMatchingEngineUnitTests,
} from '../utils/matchingEngine';
import {
  CategoryFallbackIcon,
  getCustodyLabel,
  getStatusLabel,
  isValidImageSource,
} from './ReportCard';

/* ============================================================================
 * 1. ITEM DETAILS PAGE
 * ========================================================================== */
interface ItemDetailProps {
  report: ItemReport;
  allReports: ItemReport[];
  claims: Claim[];
  currentUser: User;
  onBack: () => void;
  onStartClaim: (targetReport: ItemReport, matchedLostReportId?: string) => void;
  onSelectReport: (report: ItemReport) => void;
  onUpdateReportStatus: (
    reportId: string,
    updates: { status?: ReportStatus; custodyStatus?: CustodyStatus }
  ) => Promise<void>;
  onNavigate: (screen: ScreenRoute) => void;
}

export const ItemDetailPage: React.FC<ItemDetailProps> = ({
  report,
  allReports,
  claims,
  currentUser,
  onBack,
  onStartClaim,
  onSelectReport,
  onUpdateReportStatus,
  onNavigate,
}) => {
  const [imgError, setImgError] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setImgError(false);
  }, [report.imageReference]);

  const statusInfo = getStatusLabel(report.status);
  const isLost = report.reportType === ReportType.LOST;
  const isOwnerOfReport = report.reporterId === currentUser.id;
  const isAdmin =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SECURITY;

  const itemMatches = useMemo(
    () => getMatchesForSingleReport(report, allReports, 35),
    [report, allReports]
  );

  const existingClaimsForReport = useMemo(
    () => claims.filter((c) => c.reportId === report.id),
    [claims, report.id]
  );

  const canSubmitClaim =
    report.status !== ReportStatus.RETURNED &&
    report.status !== ReportStatus.CLOSED &&
    !(report.reportType === ReportType.FOUND && isOwnerOfReport);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setActionMsg(null);
    try {
      await onUpdateReportStatus(report.id, { status: newStatus });
      setActionMsg(`Report status updated to ${newStatus}.`);
    } catch (err: any) {
      setActionMsg(err.message || 'Could not update status.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Reports</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Item Visual */}
          <div className="lg:col-span-5 bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[260px] flex items-center justify-center">
            {isValidImageSource(report.imageReference) && !imgError ? (
              <img
                src={report.imageReference}
                alt={report.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth <= 1 && e.currentTarget.naturalHeight <= 1) {
                    setImgError(true);
                  }
                }}
                className="w-full h-full max-h-[420px] object-cover"
              />
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <CategoryFallbackIcon
                  category={report.category}
                  title={report.title}
                  className="w-14 h-14 text-slate-400 mb-3"
                />
                <div className="text-sm font-semibold text-slate-600">
                  {report.category} · {report.color}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {report.imageReference
                    ? 'Photo preview unavailable'
                    : 'No public photograph attached to protect verification integrity'}
                </div>
              </div>
            )}
          </div>

          {/* Right: Structured Metadata & Actions */}
          <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Unboxed Kicker Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span
                  className={`font-bold ${
                    isLost ? 'text-[#B45309]' : 'text-[#15803D]'
                  }`}
                >
                  {isLost ? 'LOST ITEM REPORT' : 'FOUND ITEM REPORT'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-semibold text-slate-700">
                  {report.id}
                </span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${statusInfo.colorClass}`}>
                  {statusInfo.text}
                </span>
                {report.isDemoRecord && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">Demonstration Record</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {report.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {report.description}
              </p>

              {/* Structured Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-500">Category</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {report.category}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Primary Color</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {report.color}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Brand</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {report.brand || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Campus Location</div>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {report.generalLocation}
                      {report.specificArea ? ` (${report.specificArea})` : ''}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">
                    {isLost ? 'Date Lost' : 'Date Found'}
                  </div>
                  <div className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {report.dateOccurred}
                      {report.approximateTime ? ` ${report.approximateTime}` : ''}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Custody / Handling</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {getCustodyLabel(report.custodyStatus)}
                  </div>
                </div>
              </div>

              {/* Privacy & Hidden Verification Notice */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A]">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Private Ownership Verification Details</span>
                </div>
                {report.privateIdentifyingDetails ? (
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">
                      Visible to you ({isAdmin ? 'Authorized Admin/Security' : 'Reporter'}):
                    </strong>{' '}
                    {report.privateIdentifyingDetails}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Hidden from public view to prevent fraudulent claims. To claim this
                    item, you must provide matching identifying marks, accessories, or
                    contents on the claim verification form.
                  </p>
                )}
              </div>

              {report.handoverConfirmedAt && (
                <div className="bg-emerald-50/80 rounded-xl border border-emerald-200 p-4 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    <span>Official Return Handover Completed</span>
                  </div>
                  <div>
                    Confirmed by: <strong>{report.handoverConfirmedBy}</strong> on{' '}
                    <span className="font-mono">{report.handoverConfirmedAt.slice(0, 10)}</span>
                  </div>
                  {report.handoverNotes && <div>Notes: {report.handoverNotes}</div>}
                </div>
              )}

              {actionMsg && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#1E3A8A]">
                  {actionMsg}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {canSubmitClaim ? (
                  <button
                    type="button"
                    onClick={() => onStartClaim(report)}
                    className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {isLost
                      ? 'I Found This / Submit Verification'
                      : 'Submit Ownership Claim'}
                  </button>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    {report.status === ReportStatus.RETURNED
                      ? 'This item has already been returned to its rightful owner.'
                      : isOwnerOfReport && !isLost
                      ? 'You registered this found item (cannot claim your own found report).'
                      : 'Claims are closed for this report.'}
                  </span>
                )}

                {(isOwnerOfReport || isAdmin) &&
                  report.status !== ReportStatus.RETURNED && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          report.status === ReportStatus.CLOSED
                            ? ReportStatus.OPEN
                            : ReportStatus.CLOSED
                        )
                      }
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      {report.status === ReportStatus.CLOSED
                        ? 'Reopen Report'
                        : 'Close My Report'}
                    </button>
                  )}
              </div>

              <span className="text-xs text-slate-500 tabular-nums">
                Active claims on item: {existingClaimsForReport.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Potential Matches Specific to This Item */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Smart Potential Matches for {report.id}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Deterministic similarity scores comparing this {report.reportType.toLowerCase()} report against active{' '}
              {isLost ? 'found' : 'lost'} reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('matches')}
            className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
          >
            View All Campus Matches →
          </button>
        </div>

        {itemMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-600">
            No strong potential matches above the 35% similarity threshold yet. New
            reports are automatically evaluated as they arrive.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itemMatches.map((pair) => {
              const counterpart = isLost ? pair.foundReport : pair.lostReport;
              return (
                <div
                  key={pair.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[#2563EB] tabular-nums">
                        Estimated Similarity: {pair.breakdown.normalizedPercentage}%
                      </span>
                      <span className="font-mono text-slate-500">
                        {counterpart.id} · {counterpart.generalLocation}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Possible match: {counterpart.title} —{' '}
                      <span className="font-mono tabular-nums">
                        {pair.breakdown.normalizedPercentage}%
                      </span>
                    </h3>
                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <div className="font-semibold text-slate-800">Why it matched:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {pair.breakdown.matchedFactors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectReport(counterpart)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                    >
                      Inspect Counterpart Report
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onStartClaim(
                          pair.foundReport,
                          pair.lostReport.id
                        )
                      }
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-semibold"
                    >
                      Start Ownership Claim
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. POTENTIAL MATCHES ENGINE PAGE
 * ========================================================================== */
interface MatchesPageProps {
  matches: PotentialMatchPair[];
  onSelectReport: (report: ItemReport) => void;
  onStartClaim: (foundReport: ItemReport, matchedLostReportId?: string) => void;
  onNavigate: (screen: ScreenRoute) => void;
}

export const PotentialMatchesPage: React.FC<MatchesPageProps> = ({
  matches,
  onSelectReport,
  onStartClaim,
  onNavigate,
}) => {
  const [showFormulaVerify, setShowFormulaVerify] = useState(false);
  const unitTestReport = useMemo(() => runMatchingEngineUnitTests(), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#2563EB]">
            Explainable Deterministic Scoring Algorithm
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">
            Smart Potential-Match Engine
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Compares active Lost and Found reports across five weighted factors (100 points
            maximum). Percentages represent an estimated similarity score, never automatic
            proof of ownership.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFormulaVerify((prev) => !prev)}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 self-start md:self-auto whitespace-nowrap"
        >
          <FlaskConical className="w-4 h-4 text-[#2563EB]" />
          <span>
            {showFormulaVerify
              ? 'Hide Scoring Formula & Unit Tests'
              : 'Inspect 100-Point Formula & Unit Tests'}
          </span>
        </button>
      </div>

      {/* Explainable Formula Breakdown & Live Unit Test Verification */}
      {showFormulaVerify && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weighted Similarity Formula (100 Points Maximum)
              </h2>
              <p className="text-xs text-slate-600">
                Missing fields do not inflate scores. Incompatible types and returned
                items are excluded.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#15803D]">
              Engine Self-Test: {unitTestReport.passed ? 'ALL PASSED' : 'CHECK FAILED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-[#1E3A8A] text-base tabular-nums">
                30 pts
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Category Similarity
              </div>
              <div className="text-slate-500 mt-0.5">
                30 exact · 12 related category
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-[#1E3A8A] text-base tabular-nums">
                25 pts
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Name &amp; Description
              </div>
              <div className="text-slate-500 mt-0.5">
                Token overlap + brand match
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-[#1E3A8A] text-base tabular-nums">
                15 pts
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Color Similarity
              </div>
              <div className="text-slate-500 mt-0.5">
                15 exact · 9 closely related shade
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-[#1E3A8A] text-base tabular-nums">
                15 pts
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Campus Location
              </div>
              <div className="text-slate-500 mt-0.5">
                15 same building · 9 adjacent zone
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-[#1E3A8A] text-base tabular-nums">
                15 pts
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                Date Proximity
              </div>
              <div className="text-slate-500 mt-0.5">
                15 within 1d · 12 within 3d · 8 within 7d
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-800">
              Automated Unit Test Verification Results:
            </div>
            {unitTestReport.results.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="font-medium text-slate-900">
                  {t.passed ? '✓' : '✗'} {t.name}
                </span>
                <span className="font-mono text-[11px] text-slate-600">{t.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Results List */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="text-base font-bold text-slate-900">
            No active potential matches found
          </div>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            There are currently no pairs of active Lost and Found reports scoring above
            the 38% similarity threshold. Submit a Lost and Found report pair to see the
            matching engine in action.
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
        <div className="space-y-4">
          {matches.map((pair) => {
            const { lostReport, foundReport, breakdown } = pair;
            return (
              <div
                key={pair.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5"
              >
                {/* Top Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-[#2563EB] tabular-nums">
                        Estimated Similarity Score: {breakdown.normalizedPercentage}%
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Category: {foundReport.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {lostReport.id} ↔ {foundReport.id}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-1">
                      Possible match: {foundReport.title} —{' '}
                      <span className="font-mono text-[#2563EB] tabular-nums">
                        {breakdown.normalizedPercentage}%
                      </span>
                    </h2>
                  </div>

                  {/* Factor Score Bar */}
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                    <span>Cat:{breakdown.categoryScore}/30</span>
                    <span>·</span>
                    <span>Txt:{breakdown.textScore}/25</span>
                    <span>·</span>
                    <span>Col:{breakdown.colorScore}/15</span>
                    <span>·</span>
                    <span>Loc:{breakdown.locationScore}/15</span>
                    <span>·</span>
                    <span>Date:{breakdown.dateScore}/15</span>
                  </div>
                </div>

                {/* Comparison Columns: Lost Report vs Found Report + Explainability */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Lost Report Summary */}
                  <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-[#B45309]">
                      LOST REPORT · {lostReport.id}
                    </div>
                    {lostReport.imageReference && (
                      <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-200 border border-slate-200">
                        <img
                          src={lostReport.imageReference}
                          alt={lostReport.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="text-sm font-bold text-slate-900">
                      {lostReport.title}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {lostReport.description}
                    </p>
                    <div className="text-xs text-slate-500 pt-1">
                      {lostReport.generalLocation} · {lostReport.dateOccurred} · Color:{' '}
                      {lostReport.color}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectReport(lostReport)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline pt-1 inline-block"
                    >
                      Inspect Lost Report →
                    </button>
                  </div>

                  {/* Found Report Summary */}
                  <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-[#15803D]">
                      FOUND REPORT · {foundReport.id}
                    </div>
                    {foundReport.imageReference && (
                      <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-200 border border-slate-200">
                        <img
                          src={foundReport.imageReference}
                          alt={foundReport.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="text-sm font-bold text-slate-900">
                      {foundReport.title}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {foundReport.description}
                    </p>
                    <div className="text-xs text-slate-500 pt-1">
                      {foundReport.generalLocation} · {foundReport.dateOccurred} ·{' '}
                      {getCustodyLabel(foundReport.custodyStatus)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectReport(foundReport)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline pt-1 inline-block"
                    >
                      Inspect Found Report →
                    </button>
                  </div>

                  {/* Explainable Why It Matched & Uncertain Factors */}
                  <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#15803D]" />
                          <span>Why it matched:</span>
                        </div>
                        <ul className="mt-1 space-y-1 text-slate-600 list-disc list-inside">
                          {breakdown.matchedFactors.map((factor, i) => (
                            <li key={i}>{factor}</li>
                          ))}
                        </ul>
                      </div>

                      {breakdown.uncertainOrMismatchedFactors.length > 0 && (
                        <div className="pt-1">
                          <div className="font-bold text-slate-700 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Factors differing or uncertain:</span>
                          </div>
                          <ul className="mt-1 space-y-1 text-slate-500 list-disc list-inside">
                            {breakdown.uncertainOrMismatchedFactors.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectReport(foundReport)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                      >
                        Inspect Found Item
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartClaim(foundReport, lostReport.id)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Start Ownership Claim</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
 * 3. OWNERSHIP CLAIM SUBMISSION PAGE
 * ========================================================================== */
interface ClaimSubmissionProps {
  targetReport: ItemReport;
  matchedLostReportId?: string;
  currentUser: User;
  userLostReports: ItemReport[];
  onBack: () => void;
  onSubmitClaim: (payload: {
    reportId: string;
    matchedLostReportId?: string;
    verificationResponse: ClaimVerificationAnswers;
  }) => Promise<Claim>;
  onNavigate: (screen: ScreenRoute) => void;
}

export const ClaimSubmissionPage: React.FC<ClaimSubmissionProps> = ({
  targetReport,
  matchedLostReportId,
  currentUser,
  userLostReports,
  onBack,
  onSubmitClaim,
  onNavigate,
}) => {
  const [selectedLostId, setSelectedLostId] = useState<string>(
    matchedLostReportId || ''
  );
  const [distinctiveMarks, setDistinctiveMarks] = useState('');
  const [attachedAccessories, setAttachedAccessories] = useState('');
  const [unlistedDetail, setUnlistedDetail] = useState('');
  const [contentsOrSerial, setContentsOrSerial] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);

  const isOwnFoundReport =
    targetReport.reportType === ReportType.FOUND &&
    targetReport.reporterId === currentUser.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isOwnFoundReport) {
      setError('You cannot claim a found item report that you submitted yourself.');
      return;
    }
    if (distinctiveMarks.trim().length < 5) {
      setError(
        'Please describe a distinctive mark, wear pattern, or engraving (at least 5 characters).'
      );
      return;
    }
    if (unlistedDetail.trim().length < 5) {
      setError(
        'Please provide a detail not included in the public report (at least 5 characters).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const claim = await onSubmitClaim({
        reportId: targetReport.id,
        matchedLostReportId: selectedLostId || undefined,
        verificationResponse: {
          distinctiveMarks: distinctiveMarks.trim(),
          attachedAccessories: attachedAccessories.trim() || 'None specified',
          unlistedDetail: unlistedDetail.trim(),
          contentsOrSerial: contentsOrSerial.trim() || undefined,
        },
      });
      setSubmittedClaim(claim);
    } catch (err: any) {
      setError(err.message || 'Could not submit ownership claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedClaim) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#15803D]/10 text-[#15803D] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-[#15803D]">
              CLAIM SUBMITTED · ID: {submittedClaim.id} · STATUS: PENDING
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Ownership Claim Submitted for Verification
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Your verification answers for <strong>{targetReport.title}</strong> ({targetReport.id}) have been securely recorded. An authorized Campus Security administrator will review your proof before coordinating handover.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900">
              Verification Workflow Lifecycle
            </div>
            <div>1. Claim Submitted ({submittedClaim.id}) — Completed</div>
            <div>2. Pending Administrative Verification — Current Stage</div>
            <div>3. Decision Recorded (Approved, Rejected, or Needs More Info)</div>
            <div>4. Safe Campus Handover &amp; Signed Return Confirmation</div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('student-dashboard')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs sm:text-sm font-semibold"
            >
              Track Claim in My Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin-claims')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold"
            >
              Inspect in Admin Verification View
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Item Details</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <div className="text-xs font-mono font-semibold text-[#2563EB]">
            OWNERSHIP VERIFICATION WORKFLOW · TARGET: {targetReport.id}
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-1">
            Submit Ownership Claim: {targetReport.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Location: {targetReport.generalLocation} · Date: {targetReport.dateOccurred} ·
            Custody: {getCustodyLabel(targetReport.custodyStatus)}
          </p>
        </div>

        {/* Security & Privacy Notice */}
        <div className="bg-amber-50/90 rounded-xl border border-amber-200 p-4 text-xs text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>Important Security &amp; Privacy Guidelines</span>
          </div>
          <p>
            Do <strong>not</strong> enter device unlock passwords, bank PINs, account
            credentials, or full government ID numbers. Your verification responses are
            stored privately and reviewed only by authorized Campus Security personnel.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-[#B91C1C] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {userLostReports.length > 0 && (
            <div>
              <label
                htmlFor="linked-lost-report"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Link to Your Existing Lost Item Report (Optional)
              </label>
              <select
                id="linked-lost-report"
                value={selectedLostId}
                onChange={(e) => setSelectedLostId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
              >
                <option value="">None / Not linked to a prior report</option>
                {userLostReports.map((lr) => (
                  <option key={lr.id} value={lr.id}>
                    {lr.id} — {lr.title} ({lr.generalLocation}, {lr.dateOccurred})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="claim-marks"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              1. Describe a distinctive mark, sticker, engraving, or wear pattern{' '}
              <span className="text-[#B91C1C]">*</span>
            </label>
            <textarea
              id="claim-marks"
              rows={2}
              value={distinctiveMarks}
              onChange={(e) => setDistinctiveMarks(e.target.value)}
              placeholder="e.g., Engraved initials on the back cover, small silver sticker near the bottom base..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="claim-accessories"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              2. Describe any case, keychain charm, strap, or accessory attached to the
              item
            </label>
            <input
              id="claim-accessories"
              type="text"
              value={attachedAccessories}
              onChange={(e) => setAttachedAccessories(e.target.value)}
              placeholder="e.g., Black carabiner clip on lid, mint silicone protective skin..."
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="claim-unlisted"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              3. Provide a specific detail not mentioned in the public description{' '}
              <span className="text-[#B91C1C]">*</span>
            </label>
            <textarea
              id="claim-unlisted"
              rows={2}
              value={unlistedDetail}
              onChange={(e) => setUnlistedDetail(e.target.value)}
              placeholder="e.g., Formula reference card tucked inside the slide cover, yellow sticky note on page 42..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label
              htmlFor="claim-contents"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              4. Bag contents or last 4 digits of serial number (if applicable, stored
              privately)
            </label>
            <input
              id="claim-contents"
              type="text"
              value={contentsOrSerial}
              onChange={(e) => setContentsOrSerial(e.target.value)}
              placeholder="e.g., Last 4 digits of serial: 8492, or spiral drawing pad in front pocket"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOwnFoundReport}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold"
            >
              {isSubmitting
                ? 'Submitting Claim...'
                : 'Submit Private Ownership Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
