import React, { useMemo, useState } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  ItemReport,
  PotentialMatchPair,
  ReportStatus,
  ReportType,
  ScreenRoute,
} from '../types/campusfind';
import { ReportCard } from './ReportCard';

interface SearchPageProps {
  reports: ItemReport[];
  matches: PotentialMatchPair[];
  onSelectReport: (report: ItemReport) => void;
  onNavigate: (screen: ScreenRoute) => void;
}

const QUICK_SUGGESTIONS = [
  'Water bottle',
  'Calculator',
  'Earbuds',
  'Backpack',
  'Notebook',
  'Keychain',
];

export const SearchAndBrowsePage: React.FC<SearchPageProps> = ({
  reports,
  matches,
  onSelectReport,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | ReportType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [colorFilter, setColorFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<'RECENT' | 'OLDEST' | 'HIGHEST_MATCH'>('RECENT');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Map each report ID to its highest potential match score
  const topScoreByReportId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pair of matches) {
      const score = pair.breakdown.normalizedPercentage;
      map[pair.lostReport.id] = Math.max(map[pair.lostReport.id] || 0, score);
      map[pair.foundReport.id] = Math.max(map[pair.foundReport.id] || 0, score);
    }
    return map;
  }, [matches]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = reports.filter((r) => {
      if (reportTypeFilter !== 'ALL' && r.reportType !== reportTypeFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) {
        return false;
      }
      if (
        colorFilter !== 'ALL' &&
        r.color.toLowerCase() !== colorFilter.toLowerCase()
      ) {
        return false;
      }
      if (locationFilter !== 'ALL' && r.generalLocation !== locationFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (dateFrom && r.dateOccurred < dateFrom) {
        return false;
      }
      if (dateTo && r.dateOccurred > dateTo) {
        return false;
      }
      if (q) {
        const searchable = `${r.id} ${r.title} ${r.description} ${r.brand || ''} ${
          r.category
        } ${r.color} ${r.generalLocation} ${r.specificArea || ''}`.toLowerCase();
        if (!searchable.includes(q)) {
          return false;
        }
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'HIGHEST_MATCH') {
        const scoreA = topScoreByReportId[a.id] || 0;
        const scoreB = topScoreByReportId[b.id] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      const timeA = Date.parse(a.dateOccurred || a.createdAt) || 0;
      const timeB = Date.parse(b.dateOccurred || b.createdAt) || 0;
      return sortBy === 'OLDEST' ? timeA - timeB : timeB - timeA;
    });
  }, [
    reports,
    query,
    reportTypeFilter,
    categoryFilter,
    colorFilter,
    locationFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortBy,
    topScoreByReportId,
  ]);

  const hasActiveFilters =
    query.trim() !== '' ||
    reportTypeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    colorFilter !== 'ALL' ||
    locationFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  const handleClearFilters = () => {
    setQuery('');
    setReportTypeFilter('ALL');
    setCategoryFilter('ALL');
    setColorFilter('ALL');
    setLocationFilter('ALL');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSortBy('RECENT');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Search &amp; Browse Campus Reports
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Filter lost and found belongings by category, campus building, color, date
            range, or similarity score.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('report-lost')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A] transition-colors whitespace-nowrap"
          >
            + Report Lost
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report-found')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            + Report Found
          </button>
        </div>
      </div>

      {/* Search & Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by item name, brand, description, or report ID (e.g., Hydro Flask, Casio)..."
              aria-label="Search item reports"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Segmented Report Type Controls (Interactive Buttons) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setReportTypeFilter('ALL')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                reportTypeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setReportTypeFilter(ReportType.LOST)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                reportTypeFilter === ReportType.LOST
                  ? 'bg-white text-[#B45309] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost ({reports.filter((r) => r.reportType === ReportType.LOST).length})
            </button>
            <button
              type="button"
              onClick={() => setReportTypeFilter(ReportType.FOUND)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                reportTypeFilter === ReportType.FOUND
                  ? 'bg-white text-[#15803D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found ({reports.filter((r) => r.reportType === ReportType.FOUND).length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
        </div>

        {/* Quick Search Suggestions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Quick search:</span>
          {QUICK_SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className={`px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                query.toLowerCase() === term.toLowerCase()
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#1E3A8A] font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        {/* Primary Dropdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="filter-category"
              className="block text-[11px] font-semibold text-slate-600 mb-1"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Categories</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-location"
              className="block text-[11px] font-semibold text-slate-600 mb-1"
            >
              Campus Location
            </label>
            <select
              id="filter-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Campus Locations</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-color"
              className="block text-[11px] font-semibold text-slate-600 mb-1"
            >
              Item Color
            </label>
            <select
              id="filter-color"
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
            >
              <option value="ALL">All Colors</option>
              {ITEM_COLORS.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sort-by"
              className="block text-[11px] font-semibold text-slate-600 mb-1"
            >
              Sort Results By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
            >
              <option value="RECENT">Most Recent First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="HIGHEST_MATCH">Highest Potential Match Score</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters: Status & Date Range */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label
                htmlFor="filter-status"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Current Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
              >
                <option value="ALL">All Statuses</option>
                <option value={ReportStatus.OPEN}>Active / Open</option>
                <option value={ReportStatus.CLAIM_PENDING}>
                  Claim Under Verification
                </option>
                <option value={ReportStatus.VERIFIED_AWAITING_HANDOVER}>
                  Verified · Ready for Handover
                </option>
                <option value={ReportStatus.RETURNED}>Returned to Owner</option>
                <option value={ReportStatus.CLOSED}>Closed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-date-from"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                From Date
              </label>
              <input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label
                htmlFor="filter-date-to"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                To Date
              </label>
              <input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Active Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums font-medium">
              Showing {filteredReports.length} of {reports.length} campus reports
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#B91C1C] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
          <div className="text-base font-bold text-slate-900">
            No matching campus reports found
          </div>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            No items matched your current search criteria. Try clearing one or more
            filters, or submit a new report so our matching engine can alert you when a
            match arrives.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                Reset Search Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('report-lost')}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
            >
              Report a Lost Item
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              matchScore={topScoreByReportId[report.id]}
              onSelect={onSelectReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};
