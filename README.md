# CampusFind — Smart Campus Lost & Found Platform

> **Tagline:** *Lost something? Find it faster. Found something? Return it safely.*  
> **Project Category:** Campus Lost & Found Management System · AI-Assisted University Innovation Challenge

---

## 1. Project Title
**CampusFind** — A centralized, privacy-conscious, mobile-first digital platform for reporting lost campus belongings, logging found items, discovering explainable potential matches, verifying ownership claims, and auditing safe property handovers.

---

## 2. Problem Statement
Students and faculty frequently misplace personal belongings—such as water bottles, scientific calculators, notebooks, ID cards, keys, and earbuds—across university campuses. Currently, recovery relies on fragmented WhatsApp groups, informal noticeboards, and uncoordinated security desk logbooks. Finders have no structured way to report items without exposing their personal phone numbers, while rightful owners struggle to locate items or prove ownership safely.

---

## 3. Proposed Solution
CampusFind provides a single trusted campus platform where:
- **Students & Faculty** report lost or found belongings in under a minute from a mobile phone browser.
- **Smart Potential-Match Engine** automatically ranks active Lost and Found report pairs using a transparent, deterministic 100-point similarity formula.
- **Private Ownership Verification** keeps hidden identifying markers (engravings, serial suffixes, stickers, unlisted bag contents) out of public listings and requires claimants to answer verification prompts before handover.
- **Campus Security Administrators** review claims side-by-side against hidden reporter notes, approve/reject claims with mandatory audit reasons, confirm physical handovers, and monitor live campus recovery analytics.

---

## 4. Main Features
1. **Mobile-First Responsive Interface (360px–430px primary target + 1440px desktop):** Built specifically for comfortable one-handed operation on Android phones with $\ge 44\text{px}$ touch targets and a bottom navigation bar.
2. **Structured Lost & Found Reporting:** 10 campus categories, 10 campus locations, client-side image validation & canvas compression, duplicate submission guard, and explicit custody tracking (*Held by finder*, *In Campus Security custody*, *Awaiting administrative intake*, *Returned*).
3. **Explainable 100-Point Potential-Match Engine:** Deterministic rule-based scoring with transparent factor breakdowns (*Why it matched* vs. *Uncertain/differing factors*) and built-in unit tests.
4. **Private Ownership Claim & Verification Workflow:** Prevents users from claiming their own found reports, blocks duplicate claims, and stores verification answers privately.
5. **Personalized Student Dashboard:** Real-time user-specific counts for active lost reports, found reports, potential matches, pending/approved claims, and returned items.
6. **Server-Enforced Admin Console:** Role-Based Access Control (`STUDENT`, `FACULTY`, `SECURITY`, `ADMIN`) enforced on the Express backend (`server.ts`), with category/location analytics and an immutable audit log.
7. **In-App Notification Center:** Real event-driven notifications for match discoveries, claim submissions, verification updates, and completed handovers.
8. **Interactive Verification & Diagnostic Suite:** Built-in 20-scenario verification runner on the *Safety & AWS* screen so judges and developers can test API validation, privacy redaction, and RBAC directly from a mobile browser.

---

## 5. Technology Stack Actually Used
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide React icons.
- **Backend API:** Node.js with Express 4 (`server.ts`), enforcing server-side input sanitization, duplicate prevention, privacy field stripping, and Role-Based Access Control (RBAC).
- **Database / Persistence:** Server-side persistent JSON document store (`data/campusfind-db.json`) synchronized with a browser `localStorage` fallback adapter (`src/services/dataService.ts`).
- **Cloud Deployment Readiness:** Configured with `amplify.yml` and `.env.example` for 1-click GitHub-to-AWS Amplify Hosting deployment.

---

## 6. Technical Architecture Explanation (For University Judging Panel)

| Architectural Layer | Implemented in Prototype | Target Production AWS Service |
| :--- | :--- | :--- |
| **1. Frontend** | React 19 + TypeScript SPA (`src/`), responsive mobile-first design system, client-side image compression | **AWS Amplify Hosting** (Global CloudFront CDN + automated CI/CD from GitHub) |
| **2. Backend API** | Express.js REST server (`server.ts`) with `/api/reports`, `/api/claims`, `/api/admin/*`, and `/api/auth/*` | **AWS AppSync** (GraphQL) or **Amazon API Gateway + AWS Lambda** |
| **3. Database** | Persistent JSON file store (`data/campusfind-db.json`) + `localStorage` offline mirror | **Amazon DynamoDB** (On-demand NoSQL tables with GSI on `reportType` and `category`) |
| **4. Authentication** | Salted SHA-256 credentials + cryptographic session tokens (`x-campusfind-session-token`) + server RBAC | **Amazon Cognito User Pools** (University email verification + `STUDENT`/`ADMIN` groups) |
| **5. Matching Logic** | Reusable deterministic TypeScript module (`src/utils/matchingEngine.ts`) | Shared TypeScript module executed in Lambda / AppSync resolver |
| **6. Media Storage** | Client-compressed Data URLs (validated $\le 2\text{MB}$, 800px max dimension) | **Amazon S3** with pre-signed upload URLs |

---

## 7. Data Model

### A. `User`
- `id`, `displayName`, `email`, `role` (`STUDENT` | `FACULTY` | `SECURITY` | `ADMIN`), `department`, `notificationPrefs`, `createdAt`

### B. `ItemReport`
- `id` (`LF-LOST-XXXX` / `LF-FOUND-XXXX`), `reporterId`, `reporterName`, `reportType` (`LOST` | `FOUND`), `title`, `category`, `color`, `brand`, `description`, `generalLocation`, `specificArea`, `dateOccurred`, `approximateTime`, `imageReference`, `status`, `custodyStatus`, `privateIdentifyingDetails` *(redacted in public queries)*, `isDemoRecord`, `createdAt`, `updatedAt`

### C. `Claim`
- `id` (`CLM-XXXX`), `reportId`, `matchedLostReportId`, `claimantId`, `claimantName`, `verificationResponse` *(stored privately; redacted for other students)*, `status` (`PENDING` | `NEEDS_INFO` | `APPROVED` | `REJECTED` | `HANDOVER_COMPLETED`), `decisionReason`, `reviewedBy`, `handoverLocation`, `createdAt`, `updatedAt`

### D. `NotificationItem` & `AuditEvent`
- Event-driven notifications per `recipientId` and immutable audit trail entries (`actorId`, `actorRole`, `action`, `entityType`, `entityId`, `timestamp`, `metadata`).

---

## 8. Matching Algorithm & Scoring Formula
Implemented in `src/utils/matchingEngine.ts`. Compares active `LOST` and `FOUND` reports (excluding `RETURNED`, `CLOSED`, and `FLAGGED` items) across five weighted dimensions:

$$\text{Total Similarity Score (Max 100)} = C_{\text{cat}} (30) + T_{\text{text}} (25) + K_{\text{color}} (15) + L_{\text{loc}} (15) + D_{\text{date}} (15)$$

1. **Category Similarity ($0\text{–}30\text{ pts}$):** $30\text{ pts}$ for exact category match; $12\text{ pts}$ for functionally related categories; $0\text{ pts}$ otherwise.
2. **Item Name & Description Similarity ($0\text{–}25\text{ pts}$):** Normalized keyword stem overlap across title ($13\text{ pts}$) and description ($12\text{ pts}$), plus brand match bonus.
3. **Color Similarity ($0\text{–}15\text{ pts}$):** $15\text{ pts}$ for exact color match; $9\text{ pts}$ for closely related shade groups (e.g., Navy/Blue, Grey/Silver).
4. **Campus Location Similarity ($0\text{–}15\text{ pts}$):** $15\text{ pts}$ for exact building match; $9\text{ pts}$ for adjacent campus zones mapped in `LOCATION_ADJACENCY`.
5. **Date Proximity ($0\text{–}15\text{ pts}$):** $15\text{ pts}$ within $\le 1\text{ day}$; $12\text{ pts}$ within $\le 3\text{ days}$; $8\text{ pts}$ within $\le 7\text{ days}$; $4\text{ pts}$ within $\le 14\text{ days}$; $2\text{ pts}$ if found $>3\text{ days}$ prior to reported loss.

*Missing fields never automatically count as a match. All percentages are labeled as estimated similarity scores, never proof of ownership.*

---

## 9. Privacy & Security Considerations
- **Server-Side Redaction:** `server.ts` strips `privateIdentifyingDetails` from `ItemReport` objects and `verificationResponse` from `Claim` objects unless the requester is the record creator or holds an `ADMIN`/`SECURITY` role.
- **Server-Enforced RBAC:** Administrative endpoints (`/api/admin/claims/:id/decision`) verify the caller's server-side role and return `HTTP 403 Forbidden` if called by a student, logging an `UNAUTHORIZED_ADMIN_CLAIM_DECISION_BLOCKED` audit event.
- **Input Sanitization & Upload Limits:** All string fields strip HTML/script tags; image uploads are restricted to JPG/PNG/WebP and compressed client-side.
- **Zero Exposed Secrets:** No AWS keys or private credentials exist in frontend code.

---

## 10. Setup Instructions
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express API + Vite on port 3000)
npm run dev

# 3. Verify TypeScript types and production build
npm run lint
npm run build
```

---

## 11. Environment Variables
See `.env.example`. No external API keys are required to run the full application locally or in the preview environment.

---

## 12. Testing Instructions
1. Open the **Safety & AWS** page inside the application and tap **"Run Live Verification Suite"** to execute automated checks for form validation, persistence, 100-point matching unit tests, privacy redaction, and server RBAC `403` enforcement.
2. Use **Profile → Switch Account / Role** to test switching between **Arpita Pandey (Student)**, **Meera Nair (Finder)**, and **Officer R. Deshmukh (Campus Security Admin)**.

---

## 13. AWS Deployment Steps (From an Android Phone Browser)
1. Push or export this project repository to **GitHub**.
2. Open `https://console.aws.amazon.com/amplify` in Chrome on your Android phone.
3. Tap **Create new app → GitHub**, select your repository and branch (`main`).
4. AWS Amplify automatically reads `amplify.yml` (`npm ci` → `npm run build` → `dist`).
5. In Amplify Console → **Hosting → Rewrites and redirects**, add a `200 Rewrite` rule sending all SPA paths to `/index.html`.
6. *(Optional Full Cloud Backend)* To migrate from the built-in Express/LocalStorage adapter to Amazon DynamoDB + Cognito, enable **Amplify Gen 2 Data & Auth** and populate `VITE_COGNITO_*` and `VITE_APPSYNC_*` in Amplify Environment Variables.

---

## 14. Known Limitations
- **Email / SMS Push Notifications:** Out-of-app email/SMS alerts are not active in the prototype; notifications operate via the real-time In-App Notification Center.
- **AWS Account Connection:** The project is packaged with `amplify.yml` and ready for AWS Amplify, but is not deployed to a live AWS account until you authorize your own GitHub & AWS account.

---

## 15. Future Improvements
- Integration with university SSO (SAML 2.0 / OIDC via Amazon Cognito).
- QR code printable locker tags for Campus Security physical storage bins.
- Optional Amazon Rekognition image label extraction to auto-suggest item categories and colors on photo upload.
