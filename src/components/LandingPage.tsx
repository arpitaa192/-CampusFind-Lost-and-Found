import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Lock,
  PackagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  ItemReport,
  PotentialMatchPair,
  ReportStatus,
  ReportType,
  ScreenRoute,
} from '../types/campusfind';
import { ASSETS } from '../data/seedData';
import { ReportCard } from './ReportCard';

interface LandingPageProps {
  reports: ItemReport[];
  matches: PotentialMatchPair[];
  onNavigate: (screen: ScreenRoute) => void;
  onSelectReport: (report: ItemReport) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  reports,
  matches,
  onNavigate,
  onSelectReport,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);

  // Real metrics calculated strictly from stored application data
  const activeReportsCount = reports.filter(
    (r) => r.status !== ReportStatus.RETURNED && r.status !== ReportStatus.CLOSED
  ).length;
  const lostCount = reports.filter((r) => r.reportType === ReportType.LOST).length;
  const foundCount = reports.filter((r) => r.reportType === ReportType.FOUND).length;
  const returnedCount = reports.filter(
    (r) => r.status === ReportStatus.RETURNED
  ).length;
  const demoCount = reports.filter((r) => r.isDemoRecord).length;

  const recentReports = reports.slice(0, 6);

  return (
    <div className="space-y-14 sm:space-y-20 pb-12">
      {/* HERO SECTION */}
      <section className="pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Core Messaging & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="text-xs font-medium text-[#2563EB] mb-3">
                Campus Lost &amp; Found Management System · University Innovation Challenge
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12] balance-text">
                Lost something on campus?
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Report it, discover possible matches, and get your belongings back
                through one trusted campus platform.
              </p>

              <p className="mt-2 text-xs sm:text-sm font-medium text-slate-500">
                Lost something? Find it faster. Found something? Return it safely.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('search')}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Find an Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('report-lost')}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] border border-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <FileSearch className="w-4 h-4 text-[#B45309]" />
                  <span>Report Lost Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('report-found')}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] border border-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <PackagePlus className="w-4 h-4 text-[#15803D]" />
                  <span>Report Found Item</span>
                </button>
              </div>

              {/* Quick Trust Summary */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                <span>Deterministic 100-Point Matching</span>
                <span aria-hidden="true">·</span>
                <span>Private Ownership Verification</span>
                <span aria-hidden="true">·</span>
                <span>Campus Security Custody Tracking</span>
              </div>
            </div>

            {/* Right Column: Hero Visual with Measured Scrim & Recovery Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-full min-h-[260px] sm:min-h-[340px] flex flex-col justify-end">
                {!heroImgError ? (
                  <img
                    src={ASSETS.heroCampusImg}
                    alt="Students walking across sunlit university campus commons near the central library"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-slate-900" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />

                <div className="relative z-10 p-5 sm:p-6 text-white space-y-3">
                  <div className="text-xs text-slate-200 font-medium">
                    Centralized Campus Recovery Workflow
                  </div>
                  <div className="text-lg font-bold leading-snug">
                    No more scattered WhatsApp messages or unverified desk handovers.
                  </div>
                  <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                    <span className="tabular-nums">
                      {matches.length} Potential Match Pairs Active
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('matches')}
                      className="text-white font-semibold underline underline-offset-4 hover:text-blue-200 flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Inspect Matches</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* C. CAMPUS ACTIVITY (Real Data-Driven KPI Strip Below Hero Split) */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Live Campus Activity Summary
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated directly from stored application records.
                  {demoCount > 0
                    ? ` Currently includes ${demoCount} labeled demonstration records.`
                    : ' Showing user-submitted records only.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="text-xs font-semibold text-[#2563EB] hover:underline self-start sm:self-auto whitespace-nowrap"
              >
                Manage / Reset Demo Data
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <div className="text-xs text-slate-500">Total Active Reports</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono tabular-nums mt-1">
                  {activeReportsCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Open or awaiting claim verification
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Lost Items Reported</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#B45309] font-mono tabular-nums mt-1">
                  {lostCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Registered by students &amp; faculty
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Found Items Logged</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A] font-mono tabular-nums mt-1">
                  {foundCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  With finders or Campus Security
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Successfully Returned</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#15803D] font-mono tabular-nums mt-1">
                  {returnedCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Verified ownership &amp; signed handover
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] balance-text">
            How CampusFind Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            A structured four-step workflow designed to eliminate guesswork and prevent
            unauthorized property handovers.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-mono font-semibold text-[#2563EB] tabular-nums">
              01. Report or Browse
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Report a lost item or browse found reports
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Submit structured details including campus zone, date, category, and
              hidden ownership markers in under a minute from your phone.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-mono font-semibold text-[#2563EB] tabular-nums">
              02. Smart Matching
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Discover possible matches
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Our explainable 100-point scoring engine compares category, description
              keywords, color, location adjacency, and date proximity.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-mono font-semibold text-[#2563EB] tabular-nums">
              03. Ownership Claim
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Submit an ownership claim
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Provide private verification details—such as engravings, stickers, or
              unlisted contents—that are never shown publicly.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-mono font-semibold text-[#2563EB] tabular-nums">
              04. Verified Return
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Verify ownership and arrange a safe return
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Campus Security or designated administrators verify your answers and record
              the official handover in the audit log.
            </p>
          </div>
        </div>
      </section>

      {/* D. RECENT REPORTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Recent Campus Reports
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Browse recently logged lost and found items across university buildings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#1E3A8A] text-xs sm:text-sm font-semibold text-[#0F172A] flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <span>Browse All Reports ({reports.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <h3 className="text-base font-bold text-slate-900">
              No campus reports currently stored
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              All reports have been cleared or none have been submitted yet. Submit a new
              report or restore the demonstration dataset.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('report-lost')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
              >
                Report Lost Item
              </button>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
              >
                Restore Demo Dataset
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onSelect={onSelectReport}
              />
            ))}
          </div>
        )}
      </section>

      {/* B. FEATURE HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Platform Capabilities
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Built for students, faculty, and campus security desks with mobile-first
              ergonomics and transparent verification rules.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Smart Potential Matching</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Deterministic 100-point similarity formula weighing category (30),
                description keywords (25), color (15), location (15), and date (15).
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Search className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Centralized Campus Reports</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Replaces fragmented chat groups with structured, searchable reports across
                libraries, labs, hostels, canteens, and lecture halls.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>Ownership Verification</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                High similarity scores never auto-approve claims. Claimants must prove
                ownership using non-public identifying details.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>Recovery Status Tracking</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Clear custody states distinguish between items held by a finder, handed
                to Campus Security, awaiting review, or returned.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lock className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                <span>Privacy-Conscious Communication</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Personal phone numbers, student IDs, and private verification answers are
                redacted from public report API responses.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                <span>Administrative Oversight</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Role-based administrative console with claim comparison, handover
                confirmation, audit trail logging, and resolution analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* E. TRUST AND SAFETY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-mono text-blue-300">
              Mandatory Ownership Verification Protocol
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Why ownership must be verified before any item is returned
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Public listings intentionally omit unique engravings, serial numbers, key
              stamps, and bag contents. When a student submits a claim, only authorized
              Campus Security or Lost-and-Found administrators can compare the claimant&apos;s
              answers against the hidden verification record before approving handover.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('safety-privacy')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white text-[#0F172A] hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Read Safety &amp; Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-blue-500 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Explore Smart Matching
            </button>
          </div>
        </div>
      </section>

      {/* F. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-600">
          <div className="space-y-2">
            <div className="text-base font-extrabold text-[#0F172A]">CampusFind</div>
            <p className="leading-relaxed">
              Smart Campus Lost &amp; Found Platform built for the AI-Assisted University
              Innovation Challenge.
            </p>
            <p className="text-slate-500">
              Lost something? Find it faster. Found something? Return it safely.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">Platform Navigation</div>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('search')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Search &amp; Filter Reports
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('report-lost')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Report a Lost Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('report-found')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Report a Found Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('matches')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Smart Potential Matches
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">Trust, Safety &amp; Governance</div>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('safety-privacy')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Safety &amp; Verification Rules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('safety-privacy')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Privacy &amp; Data Redaction
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-dashboard')}
                  className="hover:text-[#1E3A8A] hover:underline"
                >
                  Campus Security Admin Console
                </button>
              </li>
              <li>
                <span>Support: Central Security Desk (Main Bldg Room G-02)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">Project Technology</div>
            <p className="leading-relaxed">
              React 19 · TypeScript · Tailwind CSS · Express Server RBAC &amp; Persistent
              JSON Store · AWS Amplify / Cognito / DynamoDB Deployment Ready.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('safety-privacy')}
              className="text-[#2563EB] font-semibold hover:underline"
            >
              View AWS Architecture &amp; Test Suite →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
