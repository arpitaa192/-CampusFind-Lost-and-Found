import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  BookOpen,
  Cpu,
  KeyRound,
  Package,
  MapPin,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Umbrella,
} from 'lucide-react';
import {
  CustodyStatus,
  ItemCategory,
  ItemReport,
  ReportStatus,
  ReportType,
} from '../types/campusfind';

interface ReportCardProps {
  report: ItemReport;
  matchScore?: number;
  onSelect: (report: ItemReport) => void;
}

/**
 * Validate that an image source string is non-empty, accessible, and not a broken 1x1/truncated data URI.
 */
export function isValidImageSource(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed.startsWith('data:')) {
    if (!trimmed.includes(';base64,') && !trimmed.startsWith('data:image/svg+xml')) {
      return false;
    }
    // Truncated or empty dummy 1x1 test pixels are < 200 chars
    if (trimmed.length < 200) {
      return false;
    }
  }
  return true;
}

export function getStatusLabel(status: ReportStatus): {
  text: string;
  colorClass: string;
} {
  switch (status) {
    case ReportStatus.OPEN:
      return { text: 'Active Report', colorClass: 'text-[#1E3A8A]' };
    case ReportStatus.MATCHED:
      return { text: 'Potential Match Found', colorClass: 'text-[#2563EB]' };
    case ReportStatus.CLAIM_PENDING:
      return { text: 'Claim Under Verification', colorClass: 'text-[#B45309]' };
    case ReportStatus.VERIFIED_AWAITING_HANDOVER:
      return { text: 'Verified · Ready for Handover', colorClass: 'text-[#15803D]' };
    case ReportStatus.RETURNED:
      return { text: 'Returned to Owner', colorClass: 'text-[#15803D]' };
    case ReportStatus.FLAGGED:
      return { text: 'Flagged for Admin Review', colorClass: 'text-[#B91C1C]' };
    case ReportStatus.CLOSED:
    default:
      return { text: 'Closed', colorClass: 'text-slate-500' };
  }
}

export function getCustodyLabel(custody: CustodyStatus): string {
  switch (custody) {
    case CustodyStatus.OWNER_LOST:
      return 'Reported missing by owner';
    case CustodyStatus.HELD_BY_FINDER:
      return 'Held safely by finder';
    case CustodyStatus.HANDED_TO_SECURITY:
      return 'In Campus Security custody';
    case CustodyStatus.AWAITING_ADMIN:
      return 'Awaiting administrative intake';
    case CustodyStatus.RETURNED_TO_OWNER:
      return 'Handover completed & verified';
    default:
      return 'Recorded';
  }
}

export function CategoryFallbackIcon({
  category,
  title = '',
  className = 'w-8 h-8 text-slate-400',
}: {
  category: ItemCategory | string;
  title?: string;
  className?: string;
}) {
  const lowerTitle = (title || '').toLowerCase();
  if (lowerTitle.includes('umbrella')) {
    return <Umbrella className={className} />;
  }
  switch (category) {
    case 'Electronics':
      return <Cpu className={className} />;
    case 'Books and stationery':
      return <BookOpen className={className} />;
    case 'Bags and backpacks':
      return <Briefcase className={className} />;
    case 'Keys':
      return <KeyRound className={className} />;
    default:
      return <Package className={className} />;
  }
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  matchScore,
  onSelect,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [report.imageReference]);

  const isImgValid = isValidImageSource(report.imageReference);
  const statusInfo = getStatusLabel(report.status);
  const isLost = report.reportType === ReportType.LOST;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5">
      <div>
        {/* Resilient Image Slot with Zero-Broken-Image Fallback */}
        <div className="relative aspect-[4/3] w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
          {isImgValid && !imgError ? (
            <img
              src={report.imageReference}
              alt={`${report.title} (${report.category})`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth <= 1 && e.currentTarget.naturalHeight <= 1) {
                  setImgError(true);
                }
              }}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200/70 text-center">
              <CategoryFallbackIcon
                category={report.category}
                title={report.title}
                className="w-10 h-10 text-slate-400 mb-2"
              />
              <span className="text-xs font-medium text-slate-500">
                {report.category} · {report.color}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {report.imageReference ? 'Photo preview unavailable' : 'No public photo attached'}
              </span>
            </div>
          )}
        </div>

        {/* Card Content - Leads with quiet 1-line unboxed metadata kicker (Zero-Pill Discipline) */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span
              className={`font-semibold ${
                isLost ? 'text-[#B45309]' : 'text-[#15803D]'
              }`}
            >
              {isLost ? 'Lost Report' : 'Found Report'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{report.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] tabular-nums">{report.id}</span>
            {report.isDemoRecord && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">Demo Sample</span>
              </>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
            {report.title}
          </h3>

          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {report.description}
          </p>

          {/* Unboxed Metadata Details */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {report.generalLocation}
                {report.specificArea ? ` — ${report.specificArea}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="tabular-nums">
                {report.dateOccurred}
                {report.approximateTime ? ` at ${report.approximateTime}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span>Color: {report.color}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={`font-medium ${statusInfo.colorClass}`}>
                {statusInfo.text}
              </span>
              {typeof matchScore === 'number' && matchScore > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-[#2563EB] tabular-nums">
                    {matchScore}% similarity
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1">
        <button
          type="button"
          onClick={() => onSelect(report)}
          className="w-full min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] bg-slate-100 hover:bg-[#1E3A8A] hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
};
