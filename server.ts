import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'campusfind-db.json');

interface ServerDB {
  initialized: boolean;
  users: any[];
  credentials: Record<string, string>; // userId -> passwordHash
  sessions: Record<string, string>; // token -> userId
  reports: any[];
  claims: any[];
  notifications: any[];
  auditEvents: any[];
}

function hashSecret(input: string): string {
  return crypto.createHash('sha256').update(`campusfind-salt:${input}`).digest('hex');
}

function sanitizeString(val: unknown, maxLen = 1200): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEMO_IMAGE_MAP: Record<string, string> = {
  'LF-FOUND-1001': '/images/items/water_bottle_found.jpg',
  'LF-LOST-1002': '/images/items/water_bottle_lost.jpg',
  'LF-FOUND-1003': '/images/items/calculator_found.jpg',
  'LF-LOST-1004': '/images/items/calculator_lost.jpg',
  'LF-FOUND-1005': '/images/items/grey_backpack.jpg',
  'LF-LOST-1006': '/images/items/blue_notebook.jpg',
  'LF-LOST-1007': '/images/items/silver_keychain.jpg',
  'LF-FOUND-1008': '/images/items/earbuds_found.jpg',
  'LF-LOST-1009': '/images/items/earbuds_lost.jpg',
  'LF-LOST-1010': '/images/items/purple_umbrella.jpg',
};

function loadDB(): ServerDB {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const db: ServerDB = JSON.parse(raw);
      let needsSave = false;
      if (Array.isArray(db.reports)) {
        for (const report of db.reports) {
          if (DEMO_IMAGE_MAP[report.id]) {
            if (!report.imageReference || report.imageReference.startsWith('file://') || report.imageReference.includes('1791715')) {
              report.imageReference = DEMO_IMAGE_MAP[report.id];
              needsSave = true;
            }
          }
        }
      }
      if (needsSave) {
        saveDB(db);
      }
      return db;
    } catch (err) {
      console.error('Failed to parse DB file, reinitializing:', err);
    }
  }
  return {
    initialized: false,
    users: [],
    credentials: {},
    sessions: {},
    reports: [],
    claims: [],
    notifications: [],
    auditEvents: [],
  };
}

function saveDB(db: ServerDB) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function getAuthenticatedUser(req: Request, db: ServerDB) {
  const userIdHeader = req.headers['x-campusfind-user-id'] as string | undefined;
  const tokenHeader = req.headers['x-campusfind-session-token'] as string | undefined;

  if (tokenHeader && db.sessions[tokenHeader]) {
    const uid = db.sessions[tokenHeader];
    const found = db.users.find((u) => u.id === uid);
    if (found) return found;
  }

  if (userIdHeader) {
    const found = db.users.find((u) => u.id === userIdHeader);
    if (found) return found;
  }

  return db.users[0] || null;
}

function isAdminOrSecurity(user: any): boolean {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'SECURITY'));
}

/**
 * Strip private fields from reports and claims before sending to clients based on caller identity & role.
 */
function sanitizeStateForUser(db: ServerDB, caller: any) {
  const isPrivileged = isAdminOrSecurity(caller);
  const callerId = caller?.id;

  const safeReports = db.reports.map((r) => {
    const canSeePrivate = isPrivileged || (callerId && r.reporterId === callerId);
    if (canSeePrivate) {
      return r;
    }
    const { privateIdentifyingDetails, ...publicFields } = r;
    return {
      ...publicFields,
      hasPrivateVerificationDetails: Boolean(privateIdentifyingDetails),
    };
  });

  const safeClaims = db.claims.map((c) => {
    const canSeeClaimDetails = isPrivileged || (callerId && c.claimantId === callerId);
    if (canSeeClaimDetails) {
      return c;
    }
    // Redact private verification answers and decision details for other standard users
    return {
      id: c.id,
      reportId: c.reportId,
      reportTitle: c.reportTitle,
      reportType: c.reportType,
      matchedLostReportId: c.matchedLostReportId,
      claimantId: 'REDACTED',
      claimantName: 'Verified Campus Member (Protected)',
      status: c.status,
      isDemoRecord: c.isDemoRecord,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });

  const userNotifications = db.notifications.filter(
    (n) => !callerId || n.recipientId === callerId || (isPrivileged && n.recipientId === 'usr-admin-1')
  );

  return {
    currentUser: caller,
    users: db.users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: isPrivileged || u.id === callerId ? u.email : 'protected@campus.edu.example',
      role: u.role,
      department: u.department,
      notificationPrefs: u.notificationPrefs,
      createdAt: u.createdAt,
    })),
    reports: safeReports,
    claims: safeClaims,
    notifications: userNotifications,
    auditEvents: isPrivileged ? db.auditEvents : db.auditEvents.slice(0, 10),
    serverMeta: {
      persistenceEngine: 'Express + Node.js JSON Persistent Store (data/campusfind-db.json)',
      rbacEnforced: true,
      awsDeployed: false,
    },
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Ensure public directory is always statically served by Express
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // 1. Bootstrap or read state
  app.post('/api/bootstrap', (req: Request, res: Response) => {
    const db = loadDB();
    const { seedUsers, seedReports, seedClaims, seedNotifications, seedAuditEvents, forceReset } =
      req.body || {};

    if ((!db.initialized || forceReset) && Array.isArray(seedUsers)) {
      db.initialized = true;
      db.users = seedUsers;
      db.reports = seedReports || [];
      db.claims = seedClaims || [];
      db.notifications = seedNotifications || [];
      db.auditEvents = seedAuditEvents || [];
      db.credentials = {};
      for (const u of seedUsers) {
        db.credentials[u.id] = hashSecret('campusfind2026');
      }
      saveDB(db);
    }

    const caller = getAuthenticatedUser(req, db);
    res.json(sanitizeStateForUser(db, caller));
  });

  // 2. Get current state
  app.get('/api/state', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    res.json(sanitizeStateForUser(db, caller));
  });

  // 3. Clear all reports (for testing empty state)
  app.post('/api/demo/clear', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    db.reports = [];
    db.claims = [];
    db.notifications = [];
    db.auditEvents.unshift({
      id: `AUD-${Date.now()}`,
      actorId: caller?.id || 'system',
      actorName: caller?.displayName || 'User',
      actorRole: caller?.role || 'STUDENT',
      action: 'DEMO_DATA_CLEARED',
      entityType: 'SYSTEM',
      entityId: 'ALL',
      timestamp: new Date().toISOString(),
      metadata: { reason: 'Empty state verification' },
    });
    saveDB(db);
    res.json(sanitizeStateForUser(db, caller));
  });

  // 4. Authentication: Login / Switch Role / Register
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const db = loadDB();
    const { userId, email, password } = req.body || {};

    let targetUser = null;
    if (userId) {
      targetUser = db.users.find((u) => u.id === userId);
    } else if (email) {
      targetUser = db.users.find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (targetUser && password) {
        const expected = db.credentials[targetUser.id];
        if (expected && expected !== hashSecret(String(password))) {
          res.status(401).json({ error: 'Invalid email or password.' });
          return;
        }
      }
    }

    if (!targetUser) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');
    db.sessions[sessionToken] = targetUser.id;
    saveDB(db);

    res.json({
      sessionToken,
      user: targetUser,
      state: sanitizeStateForUser(db, targetUser),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const db = loadDB();
    const displayName = sanitizeString(req.body?.displayName, 80);
    const email = sanitizeString(req.body?.email, 120).toLowerCase();
    const department = sanitizeString(req.body?.department || 'General Studies', 80);
    const password = String(req.body?.password || '');

    if (!displayName || displayName.length < 2) {
      res.status(400).json({ error: 'Please provide a valid display name (at least 2 characters).' });
      return;
    }
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid university email address.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      displayName,
      email,
      role: 'STUDENT',
      department,
      notificationPrefs: {
        matchAlerts: true,
        claimUpdates: true,
        handoverConfirmations: true,
      },
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.credentials[newUser.id] = hashSecret(password);
    const sessionToken = crypto.randomBytes(24).toString('hex');
    db.sessions[sessionToken] = newUser.id;
    saveDB(db);

    res.status(201).json({
      sessionToken,
      user: newUser,
      state: sanitizeStateForUser(db, newUser),
    });
  });

  // 5. Create Lost or Found Report
  app.post('/api/reports', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    if (!caller) {
      res.status(401).json({ error: 'Authentication required to submit a report.' });
      return;
    }

    const body = req.body || {};
    const reportType = body.reportType === 'FOUND' ? 'FOUND' : 'LOST';
    const title = sanitizeString(body.title, 120);
    const category = sanitizeString(body.category, 60);
    const color = sanitizeString(body.color, 40);
    const brand = sanitizeString(body.brand, 60);
    const description = sanitizeString(body.description, 1000);
    const generalLocation = sanitizeString(body.generalLocation, 60);
    const specificArea = sanitizeString(body.specificArea, 120);
    const dateOccurred = sanitizeString(body.dateOccurred, 20);
    const approximateTime = sanitizeString(body.approximateTime, 20);
    const privateIdentifyingDetails = sanitizeString(body.privateIdentifyingDetails, 800);
    const preferredContactMethod = body.preferredContactMethod || 'IN_APP';
    const custodyStatus =
      reportType === 'LOST'
        ? 'OWNER_LOST'
        : body.custodyStatus === 'HANDED_TO_SECURITY'
        ? 'HANDED_TO_SECURITY'
        : body.custodyStatus === 'AWAITING_ADMIN'
        ? 'AWAITING_ADMIN'
        : 'HELD_BY_FINDER';

    if (!title || title.length < 3) {
      res.status(400).json({ error: 'Item name must be at least 3 characters long.' });
      return;
    }
    if (!category) {
      res.status(400).json({ error: 'Please select a valid item category.' });
      return;
    }
    if (!color) {
      res.status(400).json({ error: 'Please select the primary item color.' });
      return;
    }
    if (!description || description.length < 10) {
      res.status(400).json({ error: 'General description must be at least 10 characters.' });
      return;
    }
    if (!generalLocation) {
      res.status(400).json({ error: 'Please specify the campus location.' });
      return;
    }
    if (!dateOccurred) {
      res.status(400).json({ error: 'Please provide the date the item was lost or found.' });
      return;
    }

    // Duplicate guard: prevent same user submitting identical title + type + location within 2 minutes
    const twoMinutesAgo = Date.now() - 120_000;
    const duplicate = db.reports.find(
      (r) =>
        r.reporterId === caller.id &&
        r.reportType === reportType &&
        r.title.toLowerCase() === title.toLowerCase() &&
        r.generalLocation === generalLocation &&
        Date.parse(r.createdAt) > twoMinutesAgo
    );

    if (duplicate) {
      res.status(409).json({
        error: `Duplicate submission prevented: You already submitted "${title}" (${duplicate.id}) moments ago.`,
      });
      return;
    }

    // Validate image size if provided as base64 data URI
    let imageReference: string | undefined = undefined;
    if (typeof body.imageReference === 'string' && body.imageReference.length > 0) {
      if (body.imageReference.length > 2_800_000) {
        res.status(400).json({ error: 'Uploaded image exceeds maximum compressed size limit (2MB).' });
        return;
      }
      imageReference = body.imageReference;
    }

    const seqNum = 1000 + db.reports.length + 1;
    const reportId = `LF-${reportType}-${seqNum}`;
    const now = new Date().toISOString();

    const newReport = {
      id: reportId,
      reporterId: caller.id,
      reporterName: caller.displayName,
      reportType,
      title,
      category,
      color,
      brand: brand || undefined,
      description,
      generalLocation,
      specificArea: specificArea || undefined,
      dateOccurred,
      approximateTime: approximateTime || undefined,
      imageReference,
      status: 'OPEN',
      custodyStatus,
      preferredContactMethod,
      privateIdentifyingDetails: privateIdentifyingDetails || undefined,
      isDemoRecord: false,
      createdAt: now,
      updatedAt: now,
    };

    db.reports.unshift(newReport);

    // Create notification for opposite-type matching candidates (same category)
    const oppositeType = reportType === 'LOST' ? 'FOUND' : 'LOST';
    const sameCategoryCandidates = db.reports.filter(
      (r) => r.id !== newReport.id && r.reportType === oppositeType && r.category === category && r.status !== 'RETURNED'
    );

    if (sameCategoryCandidates.length > 0) {
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}-1`,
        recipientId: caller.id,
        title: `Potential Match Candidate Found (${sameCategoryCandidates.length})`,
        message: `Your ${reportType.toLowerCase()} report "${title}" (${reportId}) has ${sameCategoryCandidates.length} potential match(es) in ${category}.`,
        type: 'MATCH_FOUND',
        relatedEntityId: newReport.id,
        targetScreen: 'matches',
        readAt: null,
        createdAt: now,
      });

      // Notify the reporter of the top opposite report
      const topOther = sameCategoryCandidates[0];
      if (topOther.reporterId !== caller.id) {
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-2`,
          recipientId: topOther.reporterId,
          title: `New Potential Match for "${topOther.title}"`,
          message: `A newly submitted ${reportType.toLowerCase()} report (${reportId}) in ${generalLocation} may match your item.`,
          type: 'MATCH_FOUND',
          relatedEntityId: newReport.id,
          targetScreen: 'matches',
          readAt: null,
          createdAt: now,
        });
      }
    }

    db.auditEvents.unshift({
      id: `AUD-${Date.now()}`,
      actorId: caller.id,
      actorName: caller.displayName,
      actorRole: caller.role,
      action: `${reportType}_REPORT_CREATED`,
      entityType: 'REPORT',
      entityId: reportId,
      timestamp: now,
      metadata: { category, generalLocation, custodyStatus },
    });

    saveDB(db);
    res.status(201).json({
      report: newReport,
      state: sanitizeStateForUser(db, caller),
    });
  });

  // 6. Update or Close Own Report (or Admin update)
  app.patch('/api/reports/:id', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    const report = db.reports.find((r) => r.id === req.params.id);

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const isOwner = caller && report.reporterId === caller.id;
    const isAdmin = isAdminOrSecurity(caller);

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        error: 'Forbidden: You can only modify or close reports that you submitted.',
      });
      return;
    }

    const { status, custodyStatus, description, specificArea, flaggedReason } = req.body || {};
    const now = new Date().toISOString();

    if (status) {
      // Standard users can only close or reopen their own reports; only Admin can mark RETURNED or FLAGGED directly
      if (!isAdmin && (status === 'RETURNED' || status === 'FLAGGED')) {
        res.status(403).json({
          error: 'Forbidden: Only Campus Security / Administrators can mark an item as Returned or Flagged.',
        });
        return;
      }
      report.status = status;
    }

    if (custodyStatus) {
      report.custodyStatus = custodyStatus;
    }
    if (typeof description === 'string' && description.trim().length >= 10) {
      report.description = sanitizeString(description, 1000);
    }
    if (typeof specificArea === 'string') {
      report.specificArea = sanitizeString(specificArea, 120);
    }
    if (isAdmin && typeof flaggedReason === 'string') {
      report.flaggedReason = sanitizeString(flaggedReason, 300);
    }

    report.updatedAt = now;

    db.auditEvents.unshift({
      id: `AUD-${Date.now()}`,
      actorId: caller.id,
      actorName: caller.displayName,
      actorRole: caller.role,
      action: 'REPORT_UPDATED',
      entityType: 'REPORT',
      entityId: report.id,
      timestamp: now,
      metadata: { status: report.status, custodyStatus: report.custodyStatus },
    });

    saveDB(db);
    res.json({
      report,
      state: sanitizeStateForUser(db, caller),
    });
  });

  // 7. Submit Ownership Claim
  app.post('/api/claims', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    if (!caller) {
      res.status(401).json({ error: 'Authentication required to submit a claim.' });
      return;
    }

    const { reportId, matchedLostReportId, verificationResponse } = req.body || {};
    const report = db.reports.find((r) => r.id === reportId);

    if (!report) {
      res.status(404).json({ error: 'Target item report not found.' });
      return;
    }

    if (report.status === 'RETURNED' || report.status === 'CLOSED') {
      res.status(400).json({ error: 'This item has already been returned or closed.' });
      return;
    }

    // Prevent claiming own FOUND report
    if (report.reportType === 'FOUND' && report.reporterId === caller.id) {
      res.status(400).json({
        error: 'Invalid action: You cannot submit an ownership claim on a found report that you registered yourself.',
      });
      return;
    }

    // Prevent duplicate active claim by same user on same report
    const existingClaim = db.claims.find(
      (c) =>
        c.reportId === reportId &&
        c.claimantId === caller.id &&
        c.status !== 'REJECTED'
    );
    if (existingClaim) {
      res.status(409).json({
        error: `You already have an active claim (${existingClaim.id}) for this item.`,
      });
      return;
    }

    const distinctiveMarks = sanitizeString(verificationResponse?.distinctiveMarks, 500);
    const attachedAccessories = sanitizeString(verificationResponse?.attachedAccessories, 500);
    const unlistedDetail = sanitizeString(verificationResponse?.unlistedDetail, 600);
    const contentsOrSerial = sanitizeString(verificationResponse?.contentsOrSerial, 500);

    if (!distinctiveMarks || distinctiveMarks.length < 5) {
      res.status(400).json({
        error: 'Please describe distinctive marks or wear patterns (at least 5 characters).',
      });
      return;
    }
    if (!unlistedDetail || unlistedDetail.length < 5) {
      res.status(400).json({
        error: 'Please provide at least one private identifying detail not shown in the public report.',
      });
      return;
    }

    const now = new Date().toISOString();
    const claimId = `CLM-${2000 + db.claims.length + 1}`;

    const newClaim = {
      id: claimId,
      reportId: report.id,
      reportTitle: report.title,
      reportType: report.reportType,
      matchedLostReportId: matchedLostReportId || undefined,
      claimantId: caller.id,
      claimantName: caller.displayName,
      verificationResponse: {
        distinctiveMarks,
        attachedAccessories: attachedAccessories || 'None specified',
        unlistedDetail,
        contentsOrSerial: contentsOrSerial || undefined,
      },
      status: 'PENDING',
      handoverLocation: 'Main Building — Central Campus Security Desk (Room G-02)',
      isDemoRecord: false,
      createdAt: now,
      updatedAt: now,
    };

    db.claims.unshift(newClaim);
    report.status = 'CLAIM_PENDING';
    report.updatedAt = now;

    // Notify claimant
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-c1`,
      recipientId: caller.id,
      title: `Ownership Claim Submitted (${claimId})`,
      message: `Your claim for "${report.title}" is now pending administrative verification.`,
      type: 'CLAIM_SUBMITTED',
      relatedEntityId: claimId,
      targetScreen: 'student-dashboard',
      readAt: null,
      createdAt: now,
    });

    // Notify Admin
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-c2`,
      recipientId: 'usr-admin-1',
      title: `New Claim Awaiting Review (${claimId})`,
      message: `${caller.displayName} submitted ownership verification for "${report.title}" (${report.id}).`,
      type: 'CLAIM_SUBMITTED',
      relatedEntityId: claimId,
      targetScreen: 'admin-claims',
      readAt: null,
      createdAt: now,
    });

    db.auditEvents.unshift({
      id: `AUD-${Date.now()}`,
      actorId: caller.id,
      actorName: caller.displayName,
      actorRole: caller.role,
      action: 'CLAIM_SUBMITTED',
      entityType: 'CLAIM',
      entityId: claimId,
      timestamp: now,
      metadata: { reportId: report.id, status: 'PENDING' },
    });

    saveDB(db);
    res.status(201).json({
      claim: newClaim,
      state: sanitizeStateForUser(db, caller),
    });
  });

  // 8. Admin-Only: Review Claim (Approve / Reject / Needs Info) & Confirm Handover
  app.post('/api/admin/claims/:id/decision', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);

    if (!isAdminOrSecurity(caller)) {
      db.auditEvents.unshift({
        id: `AUD-${Date.now()}`,
        actorId: caller?.id || 'anonymous',
        actorName: caller?.displayName || 'Anonymous',
        actorRole: caller?.role || 'STUDENT',
        action: 'UNAUTHORIZED_ADMIN_CLAIM_DECISION_BLOCKED',
        entityType: 'CLAIM',
        entityId: String(req.params.id),
        timestamp: new Date().toISOString(),
        metadata: { blockedByServerRBAC: true },
      });
      saveDB(db);
      res.status(403).json({
        error: 'Server RBAC 403 Forbidden: Only authorized Campus Security or Administrators can approve, reject, or finalize claims.',
      });
      return;
    }

    const claim = db.claims.find((c) => c.id === req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim record not found.' });
      return;
    }

    const { status, decisionReason, handoverLocation } = req.body || {};
    const validStatuses = ['APPROVED', 'REJECTED', 'NEEDS_INFO', 'HANDOVER_COMPLETED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid claim decision status.' });
      return;
    }

    const reason = sanitizeString(decisionReason, 500);
    if (!reason || reason.length < 4) {
      res.status(400).json({
        error: 'Please record a clear verification reason for the audit log (at least 4 characters).',
      });
      return;
    }

    const now = new Date().toISOString();
    claim.status = status;
    claim.decisionReason = reason;
    claim.reviewedBy = caller.displayName;
    claim.reviewedAt = now;
    if (handoverLocation) {
      claim.handoverLocation = sanitizeString(handoverLocation, 160);
    }
    claim.updatedAt = now;

    const report = db.reports.find((r) => r.id === claim.reportId);
    if (report) {
      if (status === 'APPROVED') {
        report.status = 'VERIFIED_AWAITING_HANDOVER';
      } else if (status === 'REJECTED') {
        report.status = 'OPEN';
      } else if (status === 'NEEDS_INFO') {
        report.status = 'CLAIM_PENDING';
      } else if (status === 'HANDOVER_COMPLETED') {
        report.status = 'RETURNED';
        report.custodyStatus = 'RETURNED_TO_OWNER';
        report.handoverNotes = reason;
        report.handoverConfirmedBy = caller.displayName;
        report.handoverConfirmedAt = now;
        claim.handoverCompletedAt = now;

        // Also mark linked lost report as RETURNED if linked
        if (claim.matchedLostReportId) {
          const linkedLost = db.reports.find((r) => r.id === claim.matchedLostReportId);
          if (linkedLost) {
            linkedLost.status = 'RETURNED';
            linkedLost.custodyStatus = 'RETURNED_TO_OWNER';
            linkedLost.handoverConfirmedBy = caller.displayName;
            linkedLost.handoverConfirmedAt = now;
            linkedLost.updatedAt = now;
          }
        }
      }
      report.updatedAt = now;
    }

    const statusLabels: Record<string, string> = {
      APPROVED: 'Approved — Ready for Safe Handover',
      REJECTED: 'Rejected',
      NEEDS_INFO: 'Additional Verification Requested',
      HANDOVER_COMPLETED: 'Handover Confirmed — Item Returned',
    };

    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      recipientId: claim.claimantId,
      title: `Claim ${claim.id}: ${statusLabels[status] || status}`,
      message: `Campus Security updated your claim for "${claim.reportTitle}": ${reason}`,
      type:
        status === 'HANDOVER_COMPLETED'
          ? 'ITEM_RETURNED'
          : status === 'NEEDS_INFO'
          ? 'NEEDS_VERIFICATION'
          : 'CLAIM_STATUS',
      relatedEntityId: claim.id,
      targetScreen: 'student-dashboard',
      readAt: null,
      createdAt: now,
    });

    db.auditEvents.unshift({
      id: `AUD-${Date.now()}`,
      actorId: caller.id,
      actorName: caller.displayName,
      actorRole: caller.role,
      action: `CLAIM_${status}`,
      entityType: 'CLAIM',
      entityId: claim.id,
      timestamp: now,
      metadata: { reportId: claim.reportId, reason },
    });

    saveDB(db);
    res.json({
      claim,
      state: sanitizeStateForUser(db, caller),
    });
  });

  // 9. Notifications: Mark as read
  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    const { notificationId, markAll } = req.body || {};
    const now = new Date().toISOString();

    for (const n of db.notifications) {
      if (markAll && (!caller || n.recipientId === caller.id)) {
        n.readAt = n.readAt || now;
      } else if (notificationId && n.id === notificationId) {
        n.readAt = now;
      }
    }

    saveDB(db);
    res.json(sanitizeStateForUser(db, caller));
  });

  // 10. Profile & Privacy Settings Update
  app.patch('/api/profile', (req: Request, res: Response) => {
    const db = loadDB();
    const caller = getAuthenticatedUser(req, db);
    if (!caller) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { displayName, department, notificationPrefs } = req.body || {};
    if (typeof displayName === 'string' && displayName.trim().length >= 2) {
      caller.displayName = sanitizeString(displayName, 80);
    }
    if (typeof department === 'string') {
      caller.department = sanitizeString(department, 80);
    }
    if (notificationPrefs && typeof notificationPrefs === 'object') {
      caller.notificationPrefs = {
        matchAlerts: Boolean(notificationPrefs.matchAlerts),
        claimUpdates: Boolean(notificationPrefs.claimUpdates),
        handoverConfirmations: Boolean(notificationPrefs.handoverConfirmations),
      };
    }

    saveDB(db);
    res.json(sanitizeStateForUser(db, caller));
  });

  // Vite middleware in development, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFind server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
