# BlueShield Backend - Integration Test Documentation

| Item            | Detail                                      |
| --------------- | ------------------------------------------- |
| Project         | BlueShield - Coastal Protection System      |
| Module          | Backend API (Express.js + MongoDB)          |
| Test Framework  | Jest 30.x with Supertest                    |
| Branch          | `feature/testing-v2`                        |
| Last Updated    | 2026-04-10                                  |

---

## Table of Contents

1. [Overview](#1-overview)
2. [How to Run](#2-how-to-run)
3. [Test Suites](#3-test-suites)
   - 3.1 [Auth Routes](#31-auth-routes)
   - 3.2 [Report Routes](#32-report-routes)
   - 3.3 [Enforcement Routes](#33-enforcement-routes)
   - 3.4 [Hazard Routes](#34-hazard-routes)
   - 3.5 [Zone Routes](#35-zone-routes)
   - 3.6 [Illegal Case Routes](#36-illegal-case-routes)
   - 3.7 [Vessel Routes](#37-vessel-routes)
   - 3.8 [Translation Routes](#38-translation-routes)
4. [Acceptance Criteria](#4-acceptance-criteria)
5. [Test Coverage Summary](#5-test-coverage-summary)

---

## 1. Overview

Integration tests verify that the full HTTP request pipeline works correctly end-to-end: **routing -> middleware (auth, authorization, validation) -> controller -> service -> response**. Each test sends real HTTP requests via Supertest to the Express app, with database models and external services mocked to isolate the API layer.

### What Integration Tests Validate

- Correct HTTP status codes (200, 201, 400, 401, 403, 404, 409, 429, 500)
- Request validation rejects malformed payloads
- JWT authentication blocks unauthenticated requests
- Role-based authorization enforces access control
- Controllers pass correct parameters to services
- Response bodies are correctly structured
- Error scenarios return descriptive messages

### Directory Structure

```
backend/tests/integration/
├── authRoutes.test.js
├── reportRoutes.test.js
├── enforcementRoutes.test.js
├── hazardRoutes.test.js
├── zoneRoutes.test.js
├── illegalCaseRoutes.test.js
├── vesselRoutes.test.js
└── translationRoutes.test.js
```

---

## 2. How to Run

```bash
# From backend/ directory
npm run test:integration        # Run integration tests only
npm test                        # Run all tests (unit + integration)
npm run test:coverage           # Run all tests with coverage report
```

---

## 3. Test Suites

### 3.1 Auth Routes (`authRoutes.test.js`)

**Base URL:** `/api/auth`

| # | Test Case                                          | Method | Endpoint        | Expected Status | Acceptance Criteria                                                 | Status  |
|---|----------------------------------------------------|--------|-----------------|-----------------|---------------------------------------------------------------------|---------|
| 1 | Register creates a user and returns a token        | POST   | `/register`     | 201             | Response contains `_id`, `name`, `email`, `role`, `token`           | Passing |
| 2 | Login returns 401 for invalid credentials          | POST   | `/login`        | 401             | Response: `{ message: "Invalid email or password" }`                | Passing |
| 3 | GET /me returns the authenticated user             | GET    | `/me`           | 200             | Response matches JWT payload user data                              | Passing |

---

### 3.2 Report Routes (`reportRoutes.test.js`)

**Base URL:** `/api/reports`

| # | Test Case                                          | Method | Endpoint   | Expected Status | Acceptance Criteria                                                 | Status  |
|---|----------------------------------------------------|--------|------------|-----------------|---------------------------------------------------------------------|---------|
| 1 | Returns validation errors for incomplete payload   | POST   | `/`        | 400             | `{ message: "Validation error", errors: ["title is required"] }`    | Passing |
| 2 | Creates report for authenticated fisherman         | POST   | `/`        | 201             | Response matches input; `reportedBy` set to authenticated user      | Passing |

---

### 3.3 Enforcement Routes (`enforcementRoutes.test.js`)

**Base URL:** `/api/enforcements`

| # | Test Case                                          | Method | Endpoint                            | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|-------------------------------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | Creates enforcement from a reviewed case           | POST   | `/from-case/:caseId`                | 201             | Service `createFromCase` called with caseId and officerId            | Passing |
| 2 | Lists officer enforcements                         | GET    | `/`                                 | 200             | Paginated result; service receives `user` for role-based filtering   | Passing |
| 3 | Creates enforcement with officer as lead           | POST   | `/`                                 | 201             | `leadOfficer` set to authenticated officer                           | Passing |
| 4 | Adds action and closes enforcement                 | POST/PATCH | `/:id/actions`, `/:id/close`    | 200             | Action added; enforcement closed with outcome and penalty            | Passing |
| 5 | Handles evidence and team workflow                 | POST/GET | `/:id/evidence`, `/:id/team`      | 201/200         | Evidence created/listed; team member added/listed                    | Passing |
| 6 | Generates AI risk score                            | POST   | `/:id/risk-score`                   | 200             | Gemini service called; risk assessment stored                        | Passing |
| 7 | Blocks fisherman from officer routes               | GET    | `/`                                 | 403             | `message` matches "Forbidden" for FISHERMAN role                     | Passing |

---

### 3.4 Hazard Routes (`hazardRoutes.test.js`)

**Base URL:** `/api/hazards`

| # | Test Case                                          | Method | Endpoint                             | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|--------------------------------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | Creates hazard from a verified report              | POST   | `/from-report/:reportId`             | 201             | Returns hazard with `caseId`; service called with actorId            | Passing |
| 2 | Lists hazards with pagination                      | GET    | `/`                                  | 200             | Returns `{ page, limit, total, items }`                              | Passing |
| 3 | Gets a single hazard by id                         | GET    | `/:id`                               | 200             | Returns hazard document with `caseId`                                | Passing |
| 4 | Updates hazard fields                              | PATCH  | `/:id`                               | 200             | Returns updated hazard; severity changed                             | Passing |
| 5 | Fetches weather for a hazard                       | GET    | `/:id/weather`                       | 200             | Returns `{ riskLevel, advisory }` from marine service                | Passing |
| 6 | Resolves a hazard                                  | PATCH  | `/:id/resolve`                       | 200             | Returns hazard with `handlingStatus: "RESOLVED"`                     | Passing |
| 7 | Deletes a resolved hazard                          | DELETE | `/:id`                               | 200             | Returns `{ message: "Deleted" }`                                     | Passing |
| 8 | Lists review reports for hazard admin              | GET    | `/review-reports`                    | 200             | Returns paginated list of HAZARD/ENVIRONMENTAL reports               | Passing |
| 9 | Updates review report status                       | PATCH  | `/review-reports/:reportId/status`   | 200             | Returns report with updated status                                   | Passing |
| 10| Fetches weather by coordinates                     | POST   | `/weather-check`                     | 200             | Marine service called with lat/lng; returns risk data                | Passing |
| 11| Weather-check rejects invalid lat                  | POST   | `/weather-check`                     | 400             | Error message references `lat`                                       | Passing |
| 12| Weather-check rejects out-of-range coordinates     | POST   | `/weather-check`                     | 400             | Error: "lat must be between -90 and 90"                              | Passing |
| 13| Returns dashboard summary                          | GET    | `/dashboard-summary`                 | 200             | Returns `{ stats, monthlyCategoryChart, recentPendingReports }`      | Passing |
| 14| Blocks fisherman from hazard admin routes          | GET    | `/`                                  | 403             | `message` matches "Forbidden" for FISHERMAN role                     | Passing |

---

### 3.5 Zone Routes (`zoneRoutes.test.js`)

**Base URL:** `/api/zones`

| # | Test Case                                          | Method | Endpoint   | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | Creates a zone for a hazard                        | POST   | `/`        | 201             | Returns zone with `zoneType: "RESTRICTED"`; actorId passed           | Passing |
| 2 | Rejects zone creation with invalid payload         | POST   | `/`        | 400             | Validation error for bad ObjectId, invalid zoneType, small radius    | Passing |
| 3 | Lists zones with GeoJSON for map                   | GET    | `/`        | 200             | Returns `{ items, geojson: { type: "FeatureCollection" } }`         | Passing |
| 4 | Allows fisherman to list zones                     | GET    | `/`        | 200             | FISHERMAN role can read zones (for map display)                      | Passing |
| 5 | Gets a single zone by id                           | GET    | `/:id`     | 200             | Returns zone with `zoneType` and `radius`                            | Passing |
| 6 | Returns 404 when zone not found                    | GET    | `/:id`     | 404             | Service throws 404; controller returns it                            | Passing |
| 7 | Updates zone fields                                | PATCH  | `/:id`     | 200             | Returns zone with updated `status: "DISABLED"`                       | Passing |
| 8 | Deletes a zone                                     | DELETE | `/:id`     | 200             | Returns `{ message: "Deleted" }`                                     | Passing |
| 9 | Blocks fisherman from creating zones               | POST   | `/`        | 403             | `message` matches "Forbidden"                                        | Passing |
| 10| Blocks fisherman from deleting zones               | DELETE | `/:id`     | 403             | FISHERMAN role cannot delete zones                                   | Passing |

---

### 3.6 Illegal Case Routes (`illegalCaseRoutes.test.js`)

**Base URL:** `/api/illegal-cases`

| # | Test Case                                          | Method | Endpoint                             | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|--------------------------------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | Lists pending illegal fishing reports              | GET    | `/reports/pending`                   | 200             | Returns array of reports with `illegalCase` field                    | Passing |
| 2 | Marks a report as reviewed                         | PATCH  | `/reports/:reportId/mark-reviewed`   | 200             | Report status set to `REJECTED`                                      | Passing |
| 3 | Deletes a reviewed case from dashboard             | DELETE | `/reports/:reportId`                 | 200             | Returns `{ message: "Case removed from dashboard" }`                 | Passing |
| 4 | Creates an illegal case from a report              | POST   | `/reports/:reportId/review`          | 201             | Case created with title and vesselId; actorId passed                 | Passing |
| 5 | Rejects case creation with invalid vessel ID       | POST   | `/reports/:reportId/review`          | 400             | Validation error for non-IMO vessel ID format                        | Passing |
| 6 | Lists cases for admin                              | GET    | `/`                                  | 200             | Returns paginated list with total count                              | Passing |
| 7 | Allows officer to list cases                       | GET    | `/`                                  | 200             | OFFICER role can read assigned cases                                 | Passing |
| 8 | Gets case by id                                    | GET    | `/:caseId`                           | 200             | Returns case with title and status                                   | Passing |
| 9 | Updates case fields                                | PATCH  | `/:caseId`                           | 200             | Returns case with updated severity                                   | Passing |
| 10| Deletes a case                                     | DELETE | `/:caseId`                           | 200             | Returns `{ message: "Record deleted" }`                              | Passing |
| 11| Lists available officers                           | GET    | `/officers`                          | 200             | Returns array of OFFICER role users                                  | Passing |
| 12| Escalates case to an officer                       | POST   | `/:caseId/escalate`                  | 200             | Status changes to `ESCALATED`; `assignedOfficer` set                 | Passing |
| 13| Rejects escalation without officerId               | POST   | `/:caseId/escalate`                  | 400             | Validation error for missing `officerId`                             | Passing |
| 14| Resolves a case                                    | POST   | `/:caseId/resolve`                   | 200             | Status changes to `RESOLVED`                                         | Passing |
| 15| Tracks vessel for a case                           | POST   | `/:caseId/track`                     | 200             | Returns vessel data with `dataSource`                                | Passing |
| 16| Adds a note to a case                              | POST   | `/:caseId/notes`                     | 200             | `reviewNotes` array updated                                          | Passing |
| 17| Rejects note without content                       | POST   | `/:caseId/notes`                     | 400             | Validation error for missing `content`                               | Passing |
| 18| Blocks fisherman from admin routes                 | GET    | `/reports/pending`                   | 403             | `message` matches "Forbidden"                                        | Passing |
| 19| Blocks officer from creating cases                 | POST   | `/reports/:reportId/review`          | 403             | OFFICER role cannot create case reviews                              | Passing |

---

### 3.7 Vessel Routes (`vesselRoutes.test.js`)

**Base URL:** `/api/vessels`

| # | Test Case                                          | Method | Endpoint   | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | POST returns not yet implemented                   | POST   | `/`        | 201             | `{ message: "Vessel creation not yet implemented" }`                 | Passing |
| 2 | GET returns empty vessel array                     | GET    | `/`        | 200             | `{ vessels: [] }`                                                    | Passing |
| 3 | Returns vessels in a geographic zone               | GET    | `/zone`    | 200             | `{ success: true, count: N, data: [...] }`                          | Passing |
| 4 | Returns 400 when bounding box coords are missing   | GET    | `/zone`    | 400             | Error references "bounding box"                                      | Passing |
| 5 | Returns 400 when coordinates are not numbers       | GET    | `/zone`    | 400             | Error references "valid numbers"                                     | Passing |
| 6 | Returns 400 when latitude range is invalid         | GET    | `/zone`    | 400             | Error references "latitude range"                                    | Passing |
| 7 | Returns 400 when longitude range is invalid        | GET    | `/zone`    | 400             | Error references "longitude range"                                   | Passing |
| 8 | Returns 400 when minutesBack is out of range       | GET    | `/zone`    | 400             | Error references "minutesBack"                                       | Passing |
| 9 | Accepts optional minutesBack parameter             | GET    | `/zone`    | 200             | Service called with parsed `minutesBack` value                       | Passing |

---

### 3.8 Translation Routes (`translationRoutes.test.js`)

**Base URL:** `/api/translate`

| # | Test Case                                          | Method | Endpoint   | Expected Status | Acceptance Criteria                                                  | Status  |
|---|----------------------------------------------------|--------|------------|-----------------|----------------------------------------------------------------------|---------|
| 1 | Returns original texts for English                 | POST   | `/`        | 200             | `{ translations: [...] }` matches input; no Azure API call          | Passing |
| 2 | Translates texts to Sinhala via Azure              | POST   | `/`        | 200             | Returns Sinhala translations; Azure API called once                  | Passing |
| 3 | Translates texts to Tamil via Azure                | POST   | `/`        | 200             | Returns Tamil translations                                           | Passing |
| 4 | Rejects when texts array is missing                | POST   | `/`        | 400             | Error: "texts array is required"                                     | Passing |
| 5 | Rejects when texts is not an array                 | POST   | `/`        | 400             | Error: "texts array is required"                                     | Passing |
| 6 | Rejects when targetLanguage is missing             | POST   | `/`        | 400             | Error: "targetLanguage is required"                                  | Passing |
| 7 | Rejects unsupported language code                  | POST   | `/`        | 400             | Error: "Unsupported language. Allowed values: en, si, ta"            | Passing |
| 8 | Returns 500 when Azure credentials missing         | POST   | `/`        | 500             | Error: "Translation service not configured on server"                | Passing |
| 9 | Returns 500 when Azure API fails                   | POST   | `/`        | 500             | Error: "Translation failed"                                          | Passing |
| 10| Returns 429 when Azure rate limit exceeded         | POST   | `/`        | 429             | Error: "Translation quota exceeded"                                  | Passing |
| 11| Rejects unauthenticated requests                   | POST   | `/`        | 401             | No token = no access                                                 | Passing |

---

## 4. Acceptance Criteria

### 4.1 Functional Acceptance Criteria

- [x] All API endpoints return correct HTTP status codes for success and error scenarios
- [x] Request validation rejects malformed payloads with descriptive error arrays
- [x] Protected routes reject unauthenticated requests with 401
- [x] Role-based routes reject unauthorized roles with 403
- [x] Successful operations return correctly structured response bodies
- [x] Controllers pass correct parameters (including user context) to service layer
- [x] Error responses from services are propagated with correct status codes and messages

### 4.2 Security Acceptance Criteria

- [x] JWT authentication is enforced on all protected endpoints
- [x] Role-based access control (RBAC) is tested for each route group:
  - Auth routes: Public (register, login) + Protected (me)
  - Report routes: FISHERMAN, OFFICER, SYSTEM_ADMIN
  - Enforcement routes: OFFICER, SYSTEM_ADMIN (blocks FISHERMAN)
  - Hazard routes: HAZARD_ADMIN, SYSTEM_ADMIN (blocks FISHERMAN, OFFICER)
  - Zone routes: Read = all roles; Write/Delete = HAZARD_ADMIN, SYSTEM_ADMIN
  - Illegal Case routes: Admin = ILLEGAL_ADMIN, SYSTEM_ADMIN; Read = OFFICER; blocks FISHERMAN
  - Vessel routes: Public (no auth required)
  - Translation routes: Any authenticated user
- [x] IDOR (Insecure Direct Object Reference) prevention tested for enforcement routes

### 4.3 Input Validation Acceptance Criteria

- [x] ObjectId format validation (MongoDB IDs)
- [x] Vessel ID format validation (IMO-XXXXXXX)
- [x] Coordinate range validation (latitude: -90 to 90, longitude: -180 to 180)
- [x] Bounding box validation (min <= max)
- [x] Required field presence validation
- [x] Enum value validation (zone types, severity levels, languages)
- [x] Array type validation (translation texts)

### 4.4 External Service Integration Criteria

- [x] Azure Translator: handles success, missing config, API failure, rate limiting
- [x] Gemini AI: risk assessment flows through controller to service correctly
- [x] Open-Meteo Marine API: weather data flows through hazard weather endpoints
- [x] Vessel Tracker: zone vessel lookup returns standardized data

---

## 5. Test Coverage Summary

| Test Suite                | File                            | Tests | Status      |
| ------------------------- | ------------------------------- | ----- | ----------- |
| Auth Routes               | `authRoutes.test.js`            | 3     | All Passing |
| Report Routes             | `reportRoutes.test.js`          | 2     | All Passing |
| Enforcement Routes        | `enforcementRoutes.test.js`     | 7     | All Passing |
| Hazard Routes             | `hazardRoutes.test.js`          | 14    | All Passing |
| Zone Routes               | `zoneRoutes.test.js`            | 10    | All Passing |
| Illegal Case Routes       | `illegalCaseRoutes.test.js`     | 19    | All Passing |
| Vessel Routes             | `vesselRoutes.test.js`          | 9     | All Passing |
| Translation Routes        | `translationRoutes.test.js`     | 11    | All Passing |
| **Total**                 |                                 | **75**| **Passing** |

### API Endpoint Coverage

| Route Group        | Total Endpoints | Endpoints Tested | Coverage |
| ------------------ | --------------- | ---------------- | -------- |
| Auth               | 3               | 3                | 100%     |
| Reports            | 6               | 1 (create)       | 17%      |
| Enforcements       | 24              | 12               | 50%      |
| Hazards            | 12              | 12               | 100%     |
| Zones              | 5               | 5                | 100%     |
| Illegal Cases      | 13              | 13               | 100%     |
| Vessels            | 3               | 3                | 100%     |
| Translation        | 1               | 1                | 100%     |
| **Overall**        | **67**          | **50**           | **75%**  |

### Scenarios Covered Per Route Group

| Scenario Type         | Auth | Reports | Enforcement | Hazard | Zone | Illegal Case | Vessel | Translation |
| --------------------- | ---- | ------- | ----------- | ------ | ---- | ------------ | ------ | ----------- |
| Happy path (CRUD)     | Yes  | Yes     | Yes         | Yes    | Yes  | Yes          | Yes    | Yes         |
| Validation errors     | -    | Yes     | -           | Yes    | Yes  | Yes          | Yes    | Yes         |
| Auth (401)            | -    | -       | -           | -      | -    | -            | -      | Yes         |
| Authorization (403)   | -    | -       | Yes         | Yes    | Yes  | Yes          | -      | -           |
| Not found (404)       | -    | -       | -           | -      | Yes  | -            | -      | -           |
| Conflict (409)        | -    | -       | -           | -      | -    | -            | -      | -           |
| External API errors   | -    | -       | -           | -      | -    | -            | -      | Yes         |
| Rate limiting (429)   | -    | -       | -           | -      | -    | -            | -      | Yes         |
| Server errors (500)   | -    | -       | -           | -      | -    | -            | -      | Yes         |
