import {
  AuditEvent,
  Claim,
  ClaimVerificationAnswers,
  CustodyStatus,
  ItemReport,
  NotificationItem,
  ReportStatus,
  ReportType,
  User,
} from '../types/campusfind';
import {
  DEMO_USERS,
  INITIAL_DEMO_AUDIT_EVENTS,
  INITIAL_DEMO_CLAIMS,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_REPORTS,
} from '../data/seedData';

const STORAGE_KEYS = {
  USER_ID: 'campusfind_active_user_id_v2',
  SESSION_TOKEN: 'campusfind_session_token_v2',
  FALLBACK_STATE: 'campusfind_fallback_state_v2',
};

export interface AppDataState {
  currentUser: User;
  users: User[];
  reports: ItemReport[];
  claims: Claim[];
  notifications: NotificationItem[];
  auditEvents: AuditEvent[];
  serverMeta: {
    persistenceEngine: string;
    rbacEnforced: boolean;
    awsDeployed: boolean;
  };
}

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || DEMO_USERS[0].id;
  const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) || '';
  return {
    'Content-Type': 'application/json',
    'x-campusfind-user-id': userId,
    'x-campusfind-session-token': token,
  };
}

function saveLocalMirror(state: AppDataState) {
  try {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_STATE, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export async function bootstrapData(forceReset = false): Promise<AppDataState> {
  if (forceReset) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, DEMO_USERS[0].id);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  try {
    const res = await fetch('/api/bootstrap', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        forceReset,
        seedUsers: DEMO_USERS,
        seedReports: INITIAL_DEMO_REPORTS,
        seedClaims: INITIAL_DEMO_CLAIMS,
        seedNotifications: INITIAL_DEMO_NOTIFICATIONS,
        seedAuditEvents: INITIAL_DEMO_AUDIT_EVENTS,
      }),
    });

    if (res.ok) {
      const data: AppDataState = await res.json();
      saveLocalMirror(data);
      return data;
    }
  } catch (err) {
    console.warn('Server API unreachable, using localStorage mirror:', err);
  }

  // Fallback if running in static preview environment
  const cached = localStorage.getItem(STORAGE_KEYS.FALLBACK_STATE);
  if (cached && !forceReset) {
    return JSON.parse(cached);
  }

  const initial: AppDataState = {
    currentUser: DEMO_USERS[0],
    users: DEMO_USERS,
    reports: INITIAL_DEMO_REPORTS,
    claims: INITIAL_DEMO_CLAIMS,
    notifications: INITIAL_DEMO_NOTIFICATIONS,
    auditEvents: INITIAL_DEMO_AUDIT_EVENTS,
    serverMeta: {
      persistenceEngine: 'Browser LocalStorage Fallback Adapter',
      rbacEnforced: false,
      awsDeployed: false,
    },
  };
  saveLocalMirror(initial);
  return initial;
}

export async function clearAllDemoData(): Promise<AppDataState> {
  const res = await fetch('/api/demo/clear', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to clear data' }));
    throw new Error(err.error || 'Failed to clear demo data');
  }
  const data = await res.json();
  saveLocalMirror(data);
  return data;
}

export async function switchOrLoginUser(params: {
  userId?: string;
  email?: string;
  password?: string;
}): Promise<AppDataState> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(err.error || 'Authentication failed');
  }

  const data = await res.json();
  if (data.user?.id) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
  }
  if (data.sessionToken) {
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.sessionToken);
  }
  saveLocalMirror(data.state);
  return data.state;
}

export async function registerNewUser(params: {
  displayName: string;
  email: string;
  department: string;
  password: string;
}): Promise<AppDataState> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Registration failed');
  }

  const data = await res.json();
  if (data.user?.id) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
  }
  if (data.sessionToken) {
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.sessionToken);
  }
  saveLocalMirror(data.state);
  return data.state;
}

export async function submitItemReport(payload: {
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
}): Promise<{ report: ItemReport; state: AppDataState }> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      saveLocalMirror(data.state);
      return data;
    }

    const err = await res.json().catch(() => ({ error: 'Failed to submit report' }));
    if (res.status === 400 || res.status === 409) {
      throw new Error(err.error || 'Failed to submit report');
    }
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('characters') ||
        err.message.includes('category') ||
        err.message.includes('Duplicate submission') ||
        err.message.includes('limit'))
    ) {
      throw err;
    }
    console.warn('Server API unavailable, persisting report directly to localStorage:', err);
  }

  // Purely client-side fallback persistence (survives refreshes even without backend)
  const cached = localStorage.getItem(STORAGE_KEYS.FALLBACK_STATE);
  const state: AppDataState = cached ? JSON.parse(cached) : await bootstrapData();
  const userId =
    localStorage.getItem(STORAGE_KEYS.USER_ID) || state.currentUser?.id || DEMO_USERS[0].id;
  const user = state.users.find((u) => u.id === userId) || state.currentUser || DEMO_USERS[0];
  const now = new Date().toISOString();
  const seqNum = 1000 + (state.reports?.length || 0) + 1;
  const newReport: ItemReport = {
    id: `LF-${payload.reportType}-${seqNum}`,
    reporterId: user.id,
    reporterName: user.displayName,
    reportType: payload.reportType,
    title: payload.title,
    category: payload.category as any,
    color: payload.color,
    brand: payload.brand,
    description: payload.description,
    generalLocation: payload.generalLocation as any,
    specificArea: payload.specificArea,
    dateOccurred: payload.dateOccurred,
    approximateTime: payload.approximateTime,
    imageReference: payload.imageReference,
    status: ReportStatus.OPEN,
    custodyStatus:
      payload.reportType === ReportType.LOST
        ? CustodyStatus.OWNER_LOST
        : payload.custodyStatus || CustodyStatus.HANDED_TO_SECURITY,
    preferredContactMethod: payload.preferredContactMethod || 'IN_APP',
    privateIdentifyingDetails: payload.privateIdentifyingDetails,
    isDemoRecord: false,
    createdAt: now,
    updatedAt: now,
  };

  const updatedReports = [newReport, ...(state.reports || [])];
  const updatedState: AppDataState = {
    ...state,
    reports: updatedReports,
  };
  saveLocalMirror(updatedState);
  return { report: newReport, state: updatedState };
}

export async function updateReport(
  reportId: string,
  updates: {
    status?: ReportStatus;
    custodyStatus?: CustodyStatus;
    description?: string;
    specificArea?: string;
    flaggedReason?: string;
  }
): Promise<{ report: ItemReport; state: AppDataState }> {
  const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update report' }));
    throw new Error(err.error || 'Failed to update report');
  }

  const data = await res.json();
  saveLocalMirror(data.state);
  return data;
}

export async function submitOwnershipClaim(payload: {
  reportId: string;
  matchedLostReportId?: string;
  verificationResponse: ClaimVerificationAnswers;
}): Promise<{ claim: Claim; state: AppDataState }> {
  const res = await fetch('/api/claims', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit claim' }));
    throw new Error(err.error || 'Failed to submit claim');
  }

  const data = await res.json();
  saveLocalMirror(data.state);
  return data;
}

export async function submitAdminClaimDecision(
  claimId: string,
  payload: {
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'HANDOVER_COMPLETED';
    decisionReason: string;
    handoverLocation?: string;
  }
): Promise<{ claim: Claim; state: AppDataState }> {
  const res = await fetch(`/api/admin/claims/${encodeURIComponent(claimId)}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to process claim decision' }));
    throw new Error(err.error || 'Failed to process claim decision');
  }

  const data = await res.json();
  saveLocalMirror(data.state);
  return data;
}

export async function markNotificationsRead(params: {
  notificationId?: string;
  markAll?: boolean;
}): Promise<AppDataState> {
  const res = await fetch('/api/notifications/read', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Failed to update notifications');
  }

  const data = await res.json();
  saveLocalMirror(data);
  return data;
}

export async function updateProfileSettings(payload: {
  displayName?: string;
  department?: string;
  notificationPrefs?: {
    matchAlerts: boolean;
    claimUpdates: boolean;
    handoverConfirmations: boolean;
  };
}): Promise<AppDataState> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
    throw new Error(err.error || 'Failed to update profile');
  }

  const data = await res.json();
  saveLocalMirror(data);
  return data;
}
