import React, { useState } from 'react';
import {
  Bell,
  Home,
  PlusCircle,
  Search,
  ShieldCheck,
  User as UserIcon,
  FolderKanban,
  FileSearch,
  PackagePlus,
  X,
  Lock,
} from 'lucide-react';
import { ScreenRoute, User, UserRole } from '../types/campusfind';

interface NavbarProps {
  activeScreen: ScreenRoute;
  onNavigate: (screen: ScreenRoute) => void;
  currentUser: User;
  unreadNotificationsCount: number;
  pendingAdminClaimsCount: number;
}

export const NavbarAndMobileNav: React.FC<NavbarProps> = ({
  activeScreen,
  onNavigate,
  currentUser,
  unreadNotificationsCount,
  pendingAdminClaimsCount,
}) => {
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const isAdmin =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SECURITY;

  const handleOpenReportChoice = () => {
    setReportSheetOpen(true);
  };

  return (
    <>
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-lg font-extrabold tracking-tight text-[#0F172A] hover:text-[#1E3A8A] transition-colors whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#2563EB]"
          >
            CampusFind
          </button>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeScreen === 'home'
                  ? 'text-[#0F172A] border-[#2563EB] font-semibold'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeScreen === 'search'
                  ? 'text-[#0F172A] border-[#2563EB] font-semibold'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeScreen === 'matches'
                  ? 'text-[#0F172A] border-[#2563EB] font-semibold'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => onNavigate('student-dashboard')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeScreen === 'student-dashboard'
                  ? 'text-[#0F172A] border-[#2563EB] font-semibold'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              My Items
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate(isAdmin ? 'admin-dashboard' : 'safety-privacy')
              }
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeScreen.startsWith('admin-') ||
                activeScreen === 'safety-privacy'
                  ? 'text-[#0F172A] border-[#2563EB] font-semibold'
                  : 'border-transparent hover:text-[#0F172A] hover:border-slate-300'
              }`}
            >
              {isAdmin ? 'Admin Console' : 'Safety & AWS'}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenReportChoice}
              className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#0F172A] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              Report Item
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Contextual Workspace Bar (Non-sticky to honor 15% mobile sticky cap) */}
      <div className="bg-slate-100/80 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-800 truncate">
              {currentUser.displayName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] text-slate-600">
              Role: {currentUser.role}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-[#2563EB] hover:underline font-medium whitespace-nowrap shrink-0"
            >
              Switch Account / Role
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="md:hidden text-slate-700 hover:text-[#1E3A8A] font-medium whitespace-nowrap"
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin-dashboard')}
              className="text-slate-700 hover:text-[#1E3A8A] font-medium flex items-center gap-1 whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>
                Admin{pendingAdminClaimsCount > 0 ? ` (${pendingAdminClaimsCount})` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-slate-700 hover:text-[#1E3A8A] font-medium flex items-center gap-1 whitespace-nowrap"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
            >
              <Bell className="w-3.5 h-3.5 text-slate-700" />
              <span className="tabular-nums">
                Alerts{unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount})` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('safety-privacy')}
              className="hidden sm:inline text-slate-700 hover:text-[#1E3A8A] font-medium whitespace-nowrap"
            >
              Safety &amp; AWS Readiness
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Primary viewport 360px - 430px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeScreen === 'home'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('search')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeScreen === 'search'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
              Search
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenReportChoice}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeScreen === 'report-lost' || activeScreen === 'report-found'
                ? 'text-[#2563EB] font-semibold'
                : 'text-[#1E3A8A]'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-0.5 font-semibold whitespace-nowrap">
              Report
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('student-dashboard')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeScreen === 'student-dashboard'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
              My Items
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeScreen === 'profile' || activeScreen === 'auth'
                ? 'text-[#1E3A8A] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* REPORT ACTION CHOICE SHEET / MODAL */}
      {reportSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-choice-title"
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xl">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  id="report-choice-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Submit a Campus Report
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Choose whether you lost an item or found someone else&apos;s property.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setReportSheetOpen(false);
                  onNavigate('report-lost');
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-[#2563EB] hover:bg-slate-50 transition-colors flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Report a Lost Item
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Register a belonging you misplaced on campus and get automatic match alerts.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReportSheetOpen(false);
                  onNavigate('report-found');
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-[#15803D] hover:bg-slate-50 transition-colors flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[#15803D]/10 text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Report a Found Item
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Log an item you discovered or turned in to Campus Security without exposing private contact details.
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Private verification details are encrypted in transit and hidden from public search.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
