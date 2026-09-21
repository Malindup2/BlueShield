# SE4030 – Secure Software Development Assignment
## BlueShield — Work Plan & Remediation Playbook

> **Status:** Planning complete. No application code changed yet.
> **Audit date:** 2026-09-21
> **Target application:** BlueShield (MERN maritime hazard & illegal-fishing reporting platform)
> **Baseline commit audited:** `5aee302` (2026-04-11)
> **Local path:** `D:\SLIIT\SE-2\pre\AF\BlueShield`

---

## 1. Assignment at a Glance

| Item | Detail |
|---|---|
| Module | SE4030 – Secure Software Development |
| Marks | 25 |
| Group size | 4 |
| Minimum vulnerabilities | 7 DISTINCT (we have **17 concrete + 3 residual**) |
| Extra requirement | Implement an OAuth / OpenID Connect grant type |
| Deliverable 1 | `README.txt` (members, repo links, YouTube link) |
| Deliverable 2 | Report (PDF) |
| Packaging | Single ZIP → Courseweb |
| Assessed later | Presentation + viva |

### Rubric mapping — what each criterion needs from us

| Criterion | What earns 8–10 | Our plan |
|---|---|---|
| Application scope & complexity | Non-trivial, multi-role, real integrations | 8 route groups, 5 RBAC roles, 10 models, 4 external APIs — §2 |
| Identifying vulnerabilities | Many, distinct, tool-backed | 17 findings, 8 OWASP categories, ZAP + npm audit + NoSQLMap evidence — §6, §9 |
| Fixing vulnerabilities | Correct, verified, well-committed | Per-vuln fix spec with acceptance criteria — §7 |
| OAuth/OIDC function | Working, meaningful, not bolted on | Google OIDC Auth Code + PKCE, replaces a weak flow — §8 |
| Discussion | Root cause + prevention, honest about gaps | Best practices §11, not-fixed §10 |
| Individual contribution | Clear, evidenced per member | Ownership matrix §4 + commit history |

---

## 1a. Alignment with the SSD Lab Work

Every lab in this module maps onto a finding in our register. Making that mapping explicit in the report shows the marker we applied the taught material rather than improvising — and it is the safest source of viva questions.

| Lab / Lecture | Taught | Maps to our finding |
|---|---|---|
| **Lec 2 / Lab 2** | Threat modelling (STRIDE) | §11 discussion — STRIDE *Elevation of Privilege* on the registration flow is precisely what V1 is |
| **Lab 3** | Cryptography — AES file encryption, RSA | V7 (OTP must be crypto-random and stored hashed), bcrypt cost factor review |
| **Lab 4 / Lec 4** | Tomcat HTTPS, PKCS12 keystore, TLS 1.3 handshake, cipher suites; Heartbleed, POODLE | **V17** — transport security (new finding, see §6) |
| **Lab 5** | CSRF — OWASP CSRFGuard, **Synchronizer Token Pattern** | The CSRF control required by the V13 cookie migration — same pattern, Node implementation |
| **Lab 6** | XSS — OWASP Java Encoder, **ZAP before/after HTML reports** | R1 (DOM XSS sinks); the ZAP evidence convention we use throughout §9 |
| **Lab 7** | SAST via SpotBugs/QAPlug **before/after HTML reports**; OWASP Dependency-Check; SQL injection → `PreparedStatement` | V16 (Dependency-Check), V6 (injection — NoSQL variant), the SAST evidence convention |
| **Lec 6** | Injection, sqlmap, third-party dependency risk | V6 (NoSQL injection), V16 |
| **Lab 8** | **OAuth — registering a client app in the Facebook/Meta developer studio** | §8, the OAuth/OIDC deliverable |

### Important: the lab tools are Java-only — use the Node equivalents

Three tools from the labs **cannot** run against BlueShield. Do not lose time trying; name the substitute in the report and explain why, which reads as understanding rather than substitution.

| Lab tool (Java) | Why it will not work here | Node equivalent to use |
|---|---|---|
| SpotBugs / FindBugs / QAPlug (Lab 7) | Analyses JVM bytecode | **njsscan**, **Semgrep**, **ESLint `eslint-plugin-security`**, or SonarQube |
| OWASP Java Encoder (Lab 6) | Java taglib / JSP | React escapes by default; use **DOMPurify** for the three `innerHTML` sinks in R1 |
| OWASP CSRFGuard (Lab 5) | Java servlet filter | **`csurf`** or a double-submit cookie — *same Synchronizer Token Pattern*, different runtime |

Two carry over unchanged: **OWASP ZAP** is protocol-level and works against any web app, and **OWASP Dependency-Check** ships a Node Audit analyzer — you already have the tool extracted at `lab7/odc-tool/dependency-check`, and its cache shows a `NODEAUDIT` entry, so point it at the BlueShield repo directly.

---

## 2. Application Chosen & Eligibility

**BlueShield** — a coastal protection platform where fishermen report maritime hazards and illegal fishing activity, and officers/admins triage, investigate and enforce.

- **Original repo:** https://github.com/Malindup2/BlueShield
- **Stack:** Node.js + Express 5, MongoDB/Mongoose, React 19 + Vite, JWT auth, Cloudinary uploads
- **External integrations:** Google Gemini (AI risk scoring), Azure Translator, MapBox, MyShipTracking (vessel AIS), Nodemailer/SMTP
- **Roles:** `FISHERMAN`, `OFFICER`, `HAZARD_ADMIN`, `ILLEGAL_ADMIN`, `SYSTEM_ADMIN`

### Eligibility checklist — state this explicitly in the report

- [x] **Not** a deliberately-vulnerable teaching app (not WebGoat / DVWA / DVNA / DIVA / DVHMA)
- [x] Last commit `5aee302` dated **2026-04-11**, earlier than semester start
- [x] No public "fixed/improved" version exists
- [x] Sufficient scope: multi-role RBAC, file upload, email OTP flow, third-party API proxying, AI feature, geospatial data
- [x] Team has original authorship → viva questions answerable in depth

---

## 3. Repository & Commit Strategy

> **The brief explicitly requires a commit history with detailed comments. A squashed or single-commit submission is an automatic fail.**

### Setup

1. Create a **new public repo**: `BlueShield-Secure`. Do **not** just push onto the original — we need a clean before/after pair.
2. First commit = **unmodified** baseline of `5aee302`, message: `chore: import baseline BlueShield at 5aee302 (pre-remediation)`. This proves the original state.
3. Tag it: `git tag v0-vulnerable`.
4. One **branch per vulnerability**: `fix/v01-role-mass-assignment`, `fix/v02-unauth-vessel-routes`, …
5. Merge via PR — even self-reviewed — so the history shows review.
6. Tag the final state `v1-remediated`.

### Commit message template

```
fix(V03): enforce SYSTEM_ADMIN authorization on report deletion

Vulnerability : Broken Access Control (OWASP A01:2021, CWE-862)
Location      : backend/src/routes/reportRoutes.js:35
Impact        : Any authenticated FISHERMAN could delete any report,
                destroying evidence of illegal fishing activity.
Root cause    : authorize() middleware omitted from the DELETE route;
                a TODO comment on the next line acknowledged the gap.
Fix           : Added authorize("SYSTEM_ADMIN") and an ownership check
                in the controller; delete is now a soft delete.
Verified      : tests/security/v03-report-delete.test.js — FISHERMAN
                token now receives 403; ZAP re-scan shows finding cleared.

Co-authored-by: <member> <email>
```

**Rule: every fix commit names the CWE, the `file:line`, the impact, and how it was verified.** Reuse this template verbatim — consistency reads as discipline.

---

## 4. Team Ownership Matrix

Fill in names and index numbers. Each member owns **4 vulnerabilities + one cross-cutting deliverable**, so individual contribution is provable straight from the commit log.

| Member | Index No. | Owns vulnerabilities | Cross-cutting deliverable |
|---|---|---|---|
| Member 1 | | V1, V3, V4, V15 — access control cluster | Report §Access Control + ZAP scanning |
| Member 2 | | V6, V7, V8, V9 — auth & injection cluster | **OAuth/OIDC implementation (§8)** |
| Member 3 | | V5, V10, V13, V14 — data exposure cluster | Report compilation + PDF production |
| Member 4 | | V2, V11, V12, V16, V17 — config, transport & supply chain cluster | YouTube video + `README.txt` |

> Every member must be able to explain **all** findings at the viva, not only their own.

---

## 5. Pre-flight Actions — do these before touching code

| # | Action | Why | Owner |
|---|---|---|---|
| P1 | **Rotate every credential in `backend/.env` and `frontend/.env`** | A `.env` was committed in `d5cbcf6` and is still in public git history (V11). Treat all 25 secrets as burned: MongoDB URI, `JWT_SECRET`, Cloudinary secret, SMTP password, Gemini / Azure / MapBox keys. | M4 |
| P2 | Take any deployed instance offline | V1 + V3 make it trivially compromisable right now. | M4 |
| P3 | Snapshot the vulnerable app running locally | Needed for before/after demo footage in the video. | M4 |
| P4 | Capture baseline tool output — ZAP, npm audit, NoSQLMap | The report needs "before" evidence. See §9. | M1 |
| P5 | Create `backend/tests/security/` | Each fix must ship with a failing→passing test. | M2 |

---

## 6. Vulnerability Register

**17 concrete findings across 8 OWASP Top 10 (2021) categories.**

| ID | Vulnerability | OWASP | CWE | Sev | Location |
|---|---|---|---|---|---|
| V1 | Privilege escalation via mass assignment on registration | A01 | 269/915 | **Critical** | `backend/src/controllers/authController.js:13,33` |
| V2 | Unauthenticated API endpoints (`/api/vessels/*`) | A01 | 306 | **Critical** | `backend/src/routes/vesselRoutes.js:7,10,15` |
| V3 | Missing authorization on report deletion | A01 | 862 | **Critical** | `backend/src/routes/reportRoutes.js:35` |
| V4 | IDOR + mass assignment on report update | A01 | 639/915 | High | `backend/src/controllers/reportController.js:91-99` |
| V5 | Anonymous-reporter de-anonymisation | A01/A02 | 359 | High | `backend/src/controllers/reportController.js:64,83` |
| V6 | NoSQL injection in authentication flows | A03 | 943 | High | `authController.js:75,122,163,190` |
| V7 | Predictable OTP via `Math.random()` | A02 | 338/330 | High | `authController.js:22,129` |
| V8 | OTP disclosed in HTTP response (`debugCode`) | A04 | 200 | High | `authController.js:57,147` |
| V9 | No rate limiting / account lockout | A07 | 307 | High | `backend/src/app.js` — absent |
| V10 | Sensitive fields returned by `GET /api/auth/me` | A02 | 200 | High | `authMiddleware.js:19` + `models/User.js:46-50` |
| V11 | Secrets committed to git history | A05 | 540 | Medium | `frontend/src/.env` in `d5cbcf6`, `7042633` |
| V12 | Security misconfiguration — no helmet/CSP/body cap, public Swagger | A05 | 693/16 | Medium | `backend/src/app.js:30,33` |
| V13 | JWT in `localStorage`, 7-day life, no revocation | A02/A07 | 522/613 | Medium | `AuthContext.jsx:30-32`, `generateToken.js:5`, `api.js:25-28` |
| V14 | User enumeration + verbose error leakage | A01/A09 | 204/209 | Medium | `authController.js:17,112,151,181,191,226,258` |
| V15 | Weak admin check via substring match | A01 | 697 | Medium | `authMiddleware.js:39` |
| V16 | Vulnerable dependencies — 27 (15 high) | A06 | 1035 | Medium | `npm audit`, both packages |
| V17 | No transport security — plain HTTP, no HSTS, no `Secure` cookies | A02 | 319/311 | Medium | `backend/server.js:17`, `app.js` |

**Residual — documented, not fixed (see §10):** R1 DOM XSS sinks · R2 LLM prompt injection · R3 over-broad report read access.

---

## 7. Remediation Plan (per vulnerability)

Each entry: **what to change → acceptance criteria**. Do not mark a vulnerability done until its acceptance test passes.

### V1 — Privilege escalation via mass assignment · CRITICAL
**Change:** Strip `role` from the registration payload entirely. Force `role: 'FISHERMAN'` server-side. Privileged roles are assigned only by an existing `SYSTEM_ADMIN` through a new protected `PATCH /api/auth/users/:id/role` endpoint. Add an `express-validator` allow-list schema for `/register` that rejects unknown keys.
**Files:** `controllers/authController.js:13,33`, new `validations/auth.validation.js`, `routes/authRoutes.js`
**Accept:** `POST /register` carrying `"role":"SYSTEM_ADMIN"` creates a FISHERMAN. Unknown body keys → 400.

### V2 — Unauthenticated endpoints · CRITICAL
**Change:** Add `protect` to all three vessel routes; add `authorize("OFFICER","ILLEGAL_ADMIN","SYSTEM_ADMIN")` to `/zone`. Delete or gate the two unimplemented placeholder handlers. Apply a dedicated rate limiter because `/zone` proxies a metered paid API.
**Files:** `routes/vesselRoutes.js`, `controllers/vesselController.js`
**Accept:** All `/api/vessels/*` return 401 without a token, 403 for FISHERMAN.

### V3 — Missing authorization on delete · CRITICAL
**Change:** Add `authorize("SYSTEM_ADMIN")`. Convert the hard delete to a **soft delete** (`isDeleted`, `deletedBy`, `deletedAt`) so evidence is never destroyed, and log the action.
**Files:** `routes/reportRoutes.js:35`, `controllers/reportController.js`, `models/Report.js`
**Accept:** FISHERMAN and OFFICER tokens → 403. SYSTEM_ADMIN → 200, record still present with `isDeleted: true`.

### V4 — IDOR + mass assignment on update · HIGH
**Change:** Fetch the document first, verify `report.reportedBy.equals(req.user._id)` **or** that the caller holds an elevated role. Replace `req.body` with an explicit field allow-list — `title`, `description`, `severity` for owners; `status`, `assignedTo` for officers. Never allow `reportedBy` or `isAnonymous` to be rewritten.
**Files:** `controllers/reportController.js:91-99`
**Accept:** Fisherman A editing fisherman B's report → 403. Sending `reportedBy` in the body does not change ownership.

### V5 — Anonymous-reporter de-anonymisation · HIGH
**Change:** Honour `isAnonymous` on every read path. Build a serializer that omits the `reportedBy` populate when `isAnonymous === true`, unless the caller is `SYSTEM_ADMIN` — and log that access. Apply to `getById`, `list`, and any admin dashboard queries.
**Files:** `controllers/reportController.js:64,83`, new `utils/reportSerializer.js`; also check read paths in `illegalCaseController.js` and `hazardController.js`
**Accept:** An anonymous report fetched by an OFFICER returns no reporter identity; an audit log entry is written when an admin unmasks.

### V6 — NoSQL injection · HIGH
**Change:** Three layers — (a) add `express-mongo-sanitize` globally in `app.js`; (b) coerce and validate: `String(req.body.email)` plus an `isEmail()` validator on every auth route; (c) set `app.set('query parser', 'simple')`. Verify Express 5 compatibility of the sanitizer; if incompatible, use a small custom middleware that rejects keys starting with `$` or containing `.`.
**Files:** `app.js`, `authController.js:75,122,163,190`, new `validations/auth.validation.js`
**Accept:** `{"email":{"$ne":null}}` on `/login` and `/forgot-password` → 400, not a match.

### V7 — Predictable OTP · HIGH
**Change:** Use `crypto.randomInt(100000, 1000000)`. Store only a **hash** of the OTP (`crypto.createHash('sha256')`) and compare with `crypto.timingSafeEqual`. Add an `attempts` counter on `PendingUser`; invalidate after 5 failures.
**Files:** `authController.js:22,129`, `models/PendingUser.js`
**Accept:** OTP never stored in plaintext; the 6th wrong attempt invalidates the session.

### V8 — OTP in HTTP response · HIGH
**Change:** Delete both `debugCode` fields outright. On mail failure return a generic 500 and log server-side only.
**Files:** `authController.js:57,147`
**Accept:** `grep -r debugCode backend/src` returns nothing. A forced SMTP failure leaks no code.

### V9 — No rate limiting · HIGH
**Change:** Add `express-rate-limit`. Global: 100 req / 15 min / IP. Strict limiter on `/login`, `/verify-otp`, `/resend-otp`, `/forgot-password`: 5 req / 15 min / IP **and** a per-account counter with progressive lockout. Set `app.set('trust proxy', 1)` so the limiter sees real client IPs behind the host's proxy.
**Files:** `app.js`, `routes/authRoutes.js`, `models/User.js` (`failedLoginAttempts`, `lockUntil`)
**Accept:** 6th login attempt inside the window → 429. Automated OTP brute force cannot exhaust the keyspace.

### V10 — Sensitive fields in `/me` · HIGH
**Change:** Mark `otp`, `otpExpire`, `resetPasswordToken`, `resetPasswordExpire` as `select: false` in the schema, and change `authMiddleware` to an explicit allow-list: `.select('name email role isActive isVerified createdAt')`. Add a `toJSON` transform that strips them defensively.
**Files:** `models/User.js:46-50`, `authMiddleware.js:19`, `authController.js` (`getMe`)
**Accept:** `GET /api/auth/me` contains no token or OTP fields under any state.

### V11 — Secrets in git history · MEDIUM
**Change:** (1) **Rotate all credentials first** — this is the actual fix. (2) Purge the blob with `git filter-repo --path frontend/src/.env --invert-paths` on the new repo. (3) Commit a complete `.env.example`. (4) Add `gitleaks` to CI (§9) so it cannot recur.
**Accept:** `git log --all -- "*.env"` returns nothing in the new repo; the gitleaks CI job passes; old keys confirmed revoked at each provider.
**Report note:** history rewrite alone is *not* remediation — anything pushed publicly must be assumed harvested.

### V12 — Security misconfiguration · MEDIUM
**Change:** `app.use(helmet())` with an explicit CSP; `express.json({ limit: '100kb' })`; add `hpp`; put `/api-docs` behind `protect + authorize("SYSTEM_ADMIN")` or disable it when `NODE_ENV === 'production'`; remove the hardcoded DNS "hotfix" at `server.js:5-6` and make it env-driven; add a central error handler (see V14); fail fast at boot if `JWT_SECRET` is missing or shorter than 32 characters.
**Files:** `app.js:30,33`, `server.js`
**Accept:** `curl -I` shows HSTS / CSP / `X-Content-Type-Options`; a 1 MB JSON body → 413; `/api-docs` returns 401 for anonymous callers.

### V13 — JWT handling · MEDIUM
**Change:** Move the access token into an `httpOnly; Secure; SameSite=Strict` cookie. Shorten the access token to **15 minutes** and add a rotating refresh token (7 days) stored hashed server-side so logout can revoke it. Re-enable the 401 interceptor at `api.js:25-28` to force logout. Stop trusting `localStorage.userRole` for anything beyond cosmetics — the server already re-checks.
**Files:** `AuthContext.jsx:30-32`, `services/api.js:25-28`, `utils/generateToken.js:5`, `authController.js`, new `models/RefreshToken.js`
**Accept:** No token in `localStorage`; logout invalidates the refresh token server-side; an expired access token auto-refreshes once, then forces re-login.

> **CSRF note — this is Lab 5 applied to our stack.** Moving to cookies introduces CSRF risk, because the browser attaches the cookie automatically no matter which site triggered the request — the exact failure mode demonstrated on `welcome.jsp`. Apply the **Synchronizer Token Pattern** from Lab 5: a long, unpredictable, server-side, per-session token delivered in the page body (never as a cookie), required on every state-changing request. CSRFGuard is a Java servlet filter, so use **`csurf`** or a double-submit cookie in Express, and tighten the CORS config at `app.js:20-29` in the same commit. Present this in the report as a *deliberate trade-off that required a compensating control* — and say explicitly that it is the Lab 5 pattern re-implemented for Node. Excellent viva material.

### V14 — Enumeration + error leakage · MEDIUM
**Change:** Make `/register` and `/forgot-password` return an identical generic 200 — "If an account exists, an email has been sent" — regardless of outcome, with constant-time behaviour. Add a central Express error-handling middleware returning generic messages in production while logging full detail server-side. Add structured security logging (failed logins, role changes, admin unmask events, 403s) so V9-style attacks become detectable.
**Files:** `authController.js:17,112,151,181,191,226,258`, `translationController.js`, new `middlewares/errorHandler.js`, new `utils/logger.js`
**Accept:** Unknown vs known email are indistinguishable in status, body and timing. No 500 response contains a stack trace or driver text.

### V15 — Weak admin check · MEDIUM
**Change:** Replace the substring test with strict set membership: `const ADMIN_ROLES = new Set(['SYSTEM_ADMIN','HAZARD_ADMIN','ILLEGAL_ADMIN'])`. Better still: delete `adminOnly` and standardise on the existing `authorize(...roles)` middleware, so there is one authorization mechanism rather than two.
**Files:** `authMiddleware.js:39`
**Accept:** A role named e.g. `PENDING_ADMIN` does not gain admin; a unit test covers it.

### V16 — Vulnerable dependencies · MEDIUM
**Change:** `npm audit fix` on both packages; manual upgrade for `vite` (→ ≥ 7.3.4) and `undici`; remove the bogus `"node": "^25.6.1"` dependency at `backend/package.json:36`; commit the lockfiles — `package-lock.json` is currently **gitignored**, which also silently blocks reproducible builds; add `npm audit --audit-level=high` and OWASP Dependency-Check to CI.
**Accept:** `npm audit` reports 0 high/critical; before/after audit output captured for the report.

### V17 — No transport security · MEDIUM · *(directly applies Lab 4 and Lecture 4)*
**Change:** `server.js:17` starts a plain `http` listener, so JWTs, passwords, OTPs and reset tokens all travel in cleartext on any non-TLS-terminated deployment. Generate a self-signed certificate with `keytool`/`openssl` exactly as in Lab 4, serve the API over HTTPS locally with Node's `https` module, and enforce it: redirect HTTP→HTTPS, enable HSTS via `helmet.hsts()`, and set `Secure` on every cookie introduced by V13. Restrict to **TLS 1.2+** and disable legacy ciphers — cite **POODLE** (SSL 3.0 CBC padding oracle) and **Heartbleed** from Lecture 4 as the reason legacy protocol support is a liability.
**Files:** `server.js:17`, `app.js` (helmet HSTS), cookie options in `authController.js`
**Accept:** `curl -vk https://localhost:5000/` negotiates **TLS 1.3** and returns 200 — capture the `ClientHello` / `ServerHello` / cipher-suite evidence exactly as in Lab 4 §7. HTTP requests redirect. `Strict-Transport-Security` header present. No cookie lacks `Secure`.
**Evidence tip:** reuse the Lab 4 grep to extract handshake lines into a snippet file for the report appendix — it is the same technique, and it demonstrates transferring a lab skill to a different stack.

### Cross-cutting hardening — fold into the above, mention in the report
- Remove `package.json` / `package-lock.json` from `.gitignore`; they must be tracked.
- Add `.env.example` documenting every key, with no values.
- Add `npm run test:security` running the whole `tests/security/` suite.

---

## 8. OAuth 2.0 / OpenID Connect Implementation

**Provider:** Google — a public OIDC provider, so there is no identity server to run.
**Grant type:** **Authorization Code with PKCE** (RFC 7636).

### Provider choice: Google vs Facebook (Lab 8)

Lab 8 walked through registering a client app in the **Facebook/Meta developer studio**, and the brief explicitly permits "google, Facebook, etc". Both are valid. **Recommend Google**, for three reasons worth stating in the report:

1. Google is a certified **OpenID Connect** provider — it returns a signed **ID token**, publishes a **JWKS** endpoint, and supports `nonce`. Facebook Login is OAuth 2.0 for authorization, with only a limited OIDC mode. The assignment asks for "OAuth **or** OpenID Connect", and Google lets us demonstrate genuine OIDC — token signature verification, `iss`/`aud`/`exp`/`nonce` validation — which is far richer to discuss at the viva than an access token and a `/me` call.
2. Meta's app review and permission model has grown restrictive for anything beyond basic profile scope, which risks blocking the demo close to the deadline.
3. The Lab 8 experience still transfers: client registration, redirect URI allow-listing and the consent flow are identical concepts.

If the team prefers to reuse Lab 8 directly, Facebook is acceptable — but then implement the **Authorization Code grant with `state`**, never the implicit flow, and say in the report why OIDC-specific steps (ID token signature, `nonce`) are absent.

### Why this grant, and why it is a real improvement

State this clearly in the report and the viva — the marker wants to see a deliberate choice:

- **Implicit grant** is deprecated by the OAuth 2.0 Security BCP; tokens land in the URL fragment and leak via history and referrer headers.
- **Resource Owner Password Credentials** defeats the purpose — the app would still handle raw passwords.
- **Client Credentials** is machine-to-machine and carries no user identity.
- **Authorization Code + PKCE** is current best practice for browser and mobile clients, protects against authorization-code interception, and needs no client secret in the browser.

**It also structurally eliminates several of our findings on the federated path:** identity and email verification come from Google, so **V7** (weak OTP), **V8** (OTP leakage) and much of **V9** (credential brute force) no longer apply; and because the account is provisioned server-side from verified claims, the client never supplies `role` — the same defence that fixes **V1**.

### Feature being added

**"Sign in with Google"** on the login and registration screens, provisioning or linking a BlueShield account from verified Google claims.

### Implementation steps

1. **Google Cloud Console** → create an OAuth 2.0 Client ID (Web application). Authorised redirect URI: `http://localhost:5000/api/auth/oauth/google/callback`, plus the deployed URL. Store `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env` — never in frontend code.
2. **`GET /api/auth/oauth/google`** — generate a `code_verifier` (43–128 crypto-random chars), derive `code_challenge = BASE64URL(SHA256(verifier))`, generate an anti-CSRF `state` and an OIDC `nonce`. Persist verifier/state/nonce in a short-lived httpOnly cookie or a server-side store. Redirect to Google's authorization endpoint with `scope=openid email profile` and `code_challenge_method=S256`.
3. **`GET /api/auth/oauth/google/callback`** — validate `state` (reject on mismatch), then exchange `code` + `code_verifier` at Google's token endpoint.
4. **Validate the ID token properly** — this is where marks are won or lost. Verify the JWT **signature against Google's JWKS**, and check `iss`, `aud` (must equal our client ID), `exp`, `nonce`, and `email_verified === true`. Do **not** merely decode the token. Use `google-auth-library`'s `verifyIdToken`.
5. **Provision or link the user** — find by `googleSub` (the stable `sub` claim), else link by verified email, else create with **`role: 'FISHERMAN'` forced server-side** and `isVerified: true`. Add `googleId` and `authProvider` to the `User` schema, and make `password` conditionally required so federated accounts have none.
6. **Issue our own session** using the hardened scheme from V13 — short-lived access token in an httpOnly cookie plus a refresh token — then redirect to the frontend dashboard.
7. **Frontend** — a "Sign in with Google" button that navigates to step 2, plus a callback route that reads the session and populates `AuthContext`.

### Security checklist for the OIDC work — walk through this on camera

- [ ] PKCE uses `S256`, never `plain`
- [ ] `state` parameter validated → CSRF on the callback blocked
- [ ] `nonce` validated → ID token replay blocked
- [ ] ID token signature verified against JWKS; `iss` / `aud` / `exp` checked
- [ ] `email_verified` enforced → blocks account takeover via unverified-email linking
- [ ] Client secret stays server-side and never reaches the browser
- [ ] Redirect URI exactly matched and allow-listed
- [ ] Role never taken from the OIDC response or from the client
- [ ] Open-redirect check on any post-login `returnTo` parameter

### Acceptance criteria

A new user signs in with Google → a BlueShield account is created as FISHERMAN → they land on the fisherman dashboard. An existing email signing in with Google links to the existing account with no duplicate. A tampered `state` is rejected. A tampered ID token signature is rejected.

---

## 9. Security Testing & Evidence Collection

Run **before** and **after** remediation; both outputs go into the report as appendices. Before/after screenshots are what make the "identifying vulnerabilities" criterion score well.

| Tool | Type | From lab | Target | Evidence produced |
|---|---|---|---|---|
| **OWASP ZAP** | Black box (DAST) | **Lab 6** — carries over unchanged | `http://localhost:5000` — baseline + authenticated active scan | Missing headers (V12), enumeration (V14), verbose errors. Export **HTML before and after**, exactly as in Lab 6 step 6. |
| **OWASP Dependency-Check** | SCA | **Lab 7** — already extracted at `lab7/odc-tool/dependency-check`; has a Node Audit analyzer | whole BlueShield repo | CVE HTML report, before/after, for the PDF appendix |
| **npm audit** | SCA | Lec 6 (third-party dependency risk) | both `package.json` files | 27 → 0 high (V16) |
| **njsscan / Semgrep / `eslint-plugin-security`** | White box (SAST) | **Lab 7 substitute** — SpotBugs is JVM-only | `backend/src` | V6, V7, V12. Export before/after in the same style as the SpotBugs HTML reports. |
| **NoSQLMap / manual `curl`** | Black box | **Lec 6 substitute** — sqlmap targets SQL; Mongo needs the NoSQL variant | `/api/auth/login`, `/forgot-password` | V6 proof of concept |
| **`curl -vk` + TLS handshake log** | Transport | **Lab 4** — same technique, Node instead of Tomcat | `https://localhost:5000` | V17: negotiated TLS 1.3, cipher suite, `ClientHello`/`ServerHello` snippets |
| **Burp / Postman** | Manual | — | `/register`, `/api/vessels/*`, `/api/reports/:id` | V1, V2, V3, V4, V5 PoCs |
| **gitleaks / truffleHog** | Secret scanning | — | full git history | V11 proof |
| **DOMPurify review** | Manual | **Lab 6 substitute** — OWASP Java Encoder is Java-only | the three `innerHTML` sinks | R1 assessment |
| **Jest** (`tests/security/`) | Regression | — | per vulnerability | Proves each fix holds |

### Evidence convention — follow the lab submission format

Labs 6 and 7 both required **HTML tool reports exported before and after the fix**. Your marker already expects that shape, so use it throughout:

- `ZAP-before.html` / `ZAP-after.html`
- `depcheck-before.html` / `depcheck-after.html`
- `njsscan-before.html` / `njsscan-after.html`
- Per-finding request/response screenshots: `V03-before.png`, `V03-after.png`

For every vulnerability capture: (a) the exploit request/response *before*, (b) the same request *after*, showing 400/401/403, (c) the commit hash that fixed it. A finding without a before/after pair is much harder to defend at the viva.

### Suggested CI — `.github/workflows/security.yml`

`npm audit --audit-level=high` · `gitleaks detect` · `npm run test:security` · OWASP Dependency-Check. This demonstrates "shift-left" in the discussion section.

---

## 10. Vulnerabilities We Will NOT Fix — and why

The rubric rewards honesty here. Document each with a real justification, not an excuse.

| ID | Issue | Why not fixed |
|---|---|---|
| **R1** | DOM XSS sinks — `innerHTML` at `vesselMap.jsx:35,67` and `IllegalReports.jsx:396` | The interpolated values are static style markup plus `vessel.NAME` / `MMSI` originating from the MyShipTracking API, not from user input. Exploitation requires a compromised or spoofed upstream feed, so real-world reachability is low. **Compensating control:** the CSP added under V12 blocks inline script execution. Recorded as accepted residual risk; the correct long-term fix is DOM construction via `textContent` / `createElement`, or **DOMPurify** — the Node counterpart to the OWASP Java Encoder used in Lab 6. *If time allows this is the cheapest finding to promote from residual to fixed, and it lets you reuse the Lab 6 ZAP before/after workflow verbatim.* |
| **R2** | LLM prompt injection — `services/geminiService.js:33-38` interpolates attacker-controlled report `description` into the enforcement risk-scoring prompt | Mitigating this properly means redesigning the AI feature: structured input separation, output schema validation, and human-in-the-loop before any enforcement action. That is a feature-level architectural change beyond the assignment's remediation scope, and the output is advisory rather than automatically actioned. Documented with a recommended design. |
| **R3** | FISHERMAN role can `GET /api/reports` — all reports, all reporters — at `reportRoutes.js:31` | Ambiguous whether this is intended product behaviour (a community feed) or an access-control defect. Changing it without the product owner risks breaking a legitimate feature. **Note:** the V5 fix already removes reporter identity from anonymous reports on this path, addressing the sharpest part of the risk. Flagged for the product owner to decide. |

> If time runs short, further candidates to move into this table are the full V13 cookie migration (it drags in CSRF work) and the V11 history rewrite. Be explicit about *why* — "ran out of time" is a much weaker answer than a scoped risk rationale.

---

## 11. Best Practices Discussion (report section)

This codebase supplies unusually concrete evidence for this section — use the actual artefacts, not generic advice.

| Evidence found in the code | Practice that would have prevented it | Prevents |
|---|---|---|
| `debugCode: otp, // For development purposes` shipped in a live response | Environment-gated debug output; a PR checklist item banning debug fields in responses | V8 |
| `// need to figure out the Authorization level for this CRUD` — a TODO naming the exact missing control, left in place | Definition of Done requiring every route to declare its authorization; deny-by-default router | V3 |
| `frontend/src/.env` committed in the very first commit | Secret scanning as a pre-commit hook and CI gate; `.env.example` from day one | V11 |
| Device-specific DNS "hotfix" hardcoded at `server.js:5-6` | Externalised configuration; no machine-specific workarounds in shared code | V12 |
| Two parallel authorization mechanisms — `adminOnly` and `authorize` | A single, centrally-reviewed authorization component | V15 |
| `role` accepted from the request body | Threat modelling (STRIDE — *Elevation of Privilege*) on the registration flow before implementation | V1 |
| `findByIdAndUpdate(id, req.body)` | Input allow-listing as a team coding standard; never bind request bodies directly to persistence | V4 |
| `package-lock.json` listed in `.gitignore` | Reproducible builds; lockfiles are tracked artefacts | V16 |

**Process-level recommendations to present:**

1. **Threat modelling during design** — STRIDE over the auth and reporting flows catches V1, V3 and V4 before a line is written.
2. **Security-focused code review** — a mandatory reviewer checklist ("does every route have authz? is any body bound directly? any debug output?") catches V3, V4 and V8.
3. **SAST + SCA in CI** with build-failing thresholds — catches V6, V12 and V16 continuously.
4. **Secret management** — vault or platform-injected env vars plus pre-commit secret scanning — catches V11.
5. **Secure-by-default framework configuration** — helmet, rate limiting and a central error handler in the project scaffold — catches V9, V12 and V14 for free.
6. **Security regression tests** — each fix ships with a test, so remediation cannot silently regress.
7. **Least privilege as the default** — routers deny unless a role is explicitly granted, which makes V2 and V3 structurally impossible.

---

## 12. Report Structure (PDF)

1. **Cover** — module, assignment title, group number, all four members with index numbers
2. **Table of contents**
3. **Introduction** — purpose and scope of the security assessment
4. **Application overview** — BlueShield architecture, roles, data flows, trust boundaries. *Include an architecture diagram; it makes the complexity criterion self-evident.*
5. **Eligibility justification** — the §2 checklist, with the `5aee302` commit date as proof
6. **Methodology** — black box + white box, tools used, how findings were triaged (§9)
7. **Vulnerability findings** — one subsection per finding, each containing:
   - Description and OWASP/CWE classification
   - Affected code, quoted with `file:line`
   - Root cause
   - Exploit scenario / PoC with request-response evidence
   - Risk rating and business impact. *Frame V5 in terms of whistle-blower safety and V3 in terms of evidence destruction — domain impact reads far stronger than a generic severity label.*
   - The fix, with the "after" code snippet
   - Verification evidence and the fixing commit hash
8. **OAuth/OIDC implementation** — grant-type justification, sequence diagram, code walkthrough, security checklist (§8)
9. **Vulnerabilities not fixed** — §10, with justifications
10. **Best practices discussion** — §11
11. **Individual contributions** — the §4 table with per-member commit counts and links
12. **Conclusion**
13. **References** — OWASP Top 10, OAuth 2.0 Security BCP (RFC 9700), RFC 8252, RFC 7636, CWE entries
14. **Appendices** — full ZAP report, npm audit before/after, Dependency-Check output

---

## 13. `README.txt` Template (Deliverable 1)

```
SE4030 - Secure Software Development - Group Assignment
Group: <group number>

MEMBERS
  <Name> - <IT Index No>
  <Name> - <IT Index No>
  <Name> - <IT Index No>
  <Name> - <IT Index No>

ORIGINAL PROJECT
  https://github.com/Malindup2/BlueShield
  Baseline commit: 5aee302 (2026-04-11)
  Note: original project developed by members of this group.

MODIFIED (SECURED) PROJECT
  https://github.com/<org>/BlueShield-Secure
  Baseline tag : v0-vulnerable
  Final tag    : v1-remediated
  The commit history documents each vulnerability and its fix individually.

YOUTUBE DEMONSTRATION (max 20 min)
  https://youtu.be/<id>

SUMMARY
  17 vulnerabilities identified across 8 OWASP Top 10 (2021) categories.
  14 fixed, 3 documented as accepted residual risk.
  OAuth 2.0 / OpenID Connect: Google Sign-In using the
  Authorization Code grant with PKCE (RFC 7636).
```

---

## 14. YouTube Video Plan (≤ 20 minutes)

| Time | Segment | Owner |
|---|---|---|
| 0:00–1:00 | Intro — team, app overview, why BlueShield qualifies | M4 |
| 1:00–2:30 | Methodology and tooling (ZAP, npm audit, SAST) with scan screenshots | M1 |
| 2:30–8:30 | **Live exploitation** of the four critical/high findings — register as SYSTEM_ADMIN (V1), delete another user's report (V3), unmask an anonymous reporter (V5), NoSQL-inject login (V6) | M1, M3 |
| 8:30–13:30 | Fixes — side-by-side code diff, then re-run each exploit showing 400/401/403 | owners |
| 13:30–17:30 | **OAuth/OIDC demo** — Google sign-in end to end, then the code: PKCE, `state`, ID-token signature verification, server-forced role | M2 |
| 17:30–19:00 | Not-fixed findings with justification; best practices | M3 |
| 19:00–20:00 | Individual contributions and close | all |

**Every member must speak** — the viva marks individual contribution. Rehearse once; 20 minutes is a hard cap.

---

## 15. Suggested Sequence

| Phase | Work | Gate |
|---|---|---|
| 1 | Pre-flight §5 — rotate secrets, new repo, baseline commit + tag, baseline scans | `v0-vulnerable` tagged, "before" evidence captured |
| 2 | Fix V1, V2, V3 — the criticals | Exploits fail; tests pass |
| 3 | Fix V4, V5, V6, V7, V8, V9, V10 — the highs | Re-scan clean |
| 4 | Fix V11–V17 plus cross-cutting hardening | `npm audit` 0 high; security headers present |
| 5 | OAuth/OIDC §8 | Google sign-in works; security checklist fully ticked |
| 6 | Final ZAP + audit re-scan, "after" evidence | Before/after pairs complete for every fixed finding |
| 7 | Report PDF + `README.txt` + video | Peer-reviewed by all four members |
| 8 | ZIP and submit; rehearse viva | Every member can explain every finding |

> Sequence the criticals first: if anything slips, the losses land on mediums, which are the cheapest to move into §10 with a defensible rationale.

---

## 16. Submission Checklist

- [ ] All credentials rotated (P1) — do this even if nothing else changes
- [ ] New repo public, `v0-vulnerable` and `v1-remediated` tagged
- [ ] One descriptive commit per vulnerability, with CWE + `file:line` + verification in each message
- [ ] At least 7 distinct vulnerabilities fixed and verified (we target 14)
- [ ] Not-fixed vulnerabilities documented with justification
- [ ] OAuth/OIDC feature working end to end
- [ ] Before/after evidence captured for every fixed finding
- [ ] `README.txt` complete with all three links
- [ ] Report exported as **PDF**
- [ ] YouTube video ≤ 20 min, unlisted or public, link tested in a private window
- [ ] Everything zipped into a single file → Courseweb
- [ ] All four members prepared for the viva on **all** findings
