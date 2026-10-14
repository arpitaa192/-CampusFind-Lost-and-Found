export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  SECURITY = 'SECURITY',
  ADMIN = 'ADMIN',
}

export enum ReportType {
  LOST = 'LOST',
  FOUND = 'FOUND',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  CLAIM_PENDING = 'CLAIM_PENDING',
  VERIFIED_AWAITING_HANDOVER = 'VERIFIED_AWAITING_HANDOVER',
  RETURNED = 'RETURNED',
  CLOSED = 'CLOSED',
  FLAGGED = 'FLAGGED',
}

export enum CustodyStatus {
  OWNER_LOST = 'OWNER_LOST',
  HELD_BY_FINDER = 'HELD_BY_FINDER',
  HANDED_TO_SECURITY = 'HANDED_TO_SECURITY',
  AWAITING_ADMIN = 'AWAITING_ADMIN',
  RETURNED_TO_OWNER = 'RETURNED_TO_OWNER',
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  NEEDS_INFO = 'NEEDS_INFO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HANDOVER_COMPLETED = 'HANDOVER_COMPLETED',
}

export const ITEM_CATEGORIES = [
  'Electronics',
  'Books and stationery',
  'Bags and backpacks',
  'Clothing',
  'Accessories and jewelry',
  'Identification cards',
  'Keys',
  'Water bottles',
  'Personal belongings',
  'Other',
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const CAMPUS_LOCATIONS = [
  'Library',
  'Classroom',
  'Laboratory',
  'Canteen',
  'Playground',
  'Parking area',
  'Main building',
  'Corridor',
  'Hostel',
  'Other',
] as const;

export type CampusLocation = (typeof CAMPUS_LOCATIONS)[number];

export const ITEM_COLORS = [
  'Black',
  'Grey',
  'Silver',
  'White',
  'Blue',
  'Navy',
  'Red',
  'Green',
  'Brown',
  'Yellow / Gold',
  'Multi-color',
  'Other',
] as const;

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  department?: string;
  notificationPrefs: {
    matchAlerts: boolean;
    claimUpdates: boolean;
    handoverConfirmations: boolean;
  };
  createdAt: string;
}

export interface ItemReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportType: ReportType;
  title: string;
  category: ItemCategory;
  color: string;
  brand?: string;
  description: string;
  generalLocation: CampusLocation;
  specificArea?: string;
  dateOccurred: string; // YYYY-MM-DD
  approximateTime?: string; // HH:mm
  imageReference?: string;
  status: ReportStatus;
  custodyStatus: CustodyStatus;
  preferredContactMethod?: 'IN_APP' | 'CAMPUS_EMAIL' | 'SECURITY_DESK';
  /**
   * Private verification details provided by the reporter/finder.
   * NEVER returned in public report queries; only accessible to the reporter or authorized ADMIN/SECURITY during verification.
   */
  privateIdentifyingDetails?: string;
  isDemoRecord?: boolean;
  flaggedReason?: string;
  handoverNotes?: string;
  handoverConfirmedBy?: string;
  handoverConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimVerificationAnswers {
  distinctiveMarks: string;
  attachedAccessories: string;
  unlistedDetail: string;
  contentsOrSerial?: string;
  additionalProofContext?: string;
}

export interface Claim {
  id: string;
  reportId: string;
  reportTitle: string;
  reportType: ReportType;
  matchedLostReportId?: string;
  claimantId: string;
  claimantName: string;
  /**
   * Stored privately. Only returned to the claimant who submitted it or authorized ADMIN/SECURITY personnel.
   */
  verificationResponse?: ClaimVerificationAnswers;
  status: ClaimStatus;
  decisionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  handoverLocation?: string;
  handoverCompletedAt?: string;
  isDemoRecord?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'MATCH_FOUND' | 'CLAIM_SUBMITTED' | 'CLAIM_STATUS' | 'NEEDS_VERIFICATION' | 'ITEM_RETURNED';
  relatedEntityId?: string;
  targetScreen?: ScreenRoute;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'REPORT' | 'CLAIM' | 'USER' | 'SYSTEM';
  entityId: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean>;
}

export interface MatchFactorBreakdown {
  categoryScore: number; // max 30
  textScore: number; // max 25
  colorScore: number; // max 15
  locationScore: number; // max 15
  dateScore: number; // max 15
  rawTotal: number;
  normalizedPercentage: number; // 0 - 100
  matchedFactors: string[];
  uncertainOrMismatchedFactors: string[];
}

export interface PotentialMatchPair {
  id: string;
  lostReport: ItemReport;
  foundReport: ItemReport;
  breakdown: MatchFactorBreakdown;
}

export type ScreenRoute =
  | 'home'
  | 'search'
  | 'report-lost'
  | 'report-found'
  | 'item-detail'
  | 'matches'
  | 'claim-submit'
  | 'student-dashboard'
  | 'notifications'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-reports'
  | 'admin-claims'
  | 'safety-privacy'
  | 'auth';
