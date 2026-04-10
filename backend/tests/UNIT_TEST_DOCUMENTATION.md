# BlueShield Backend - Test Documentation

| Item            | Detail                                      |
| --------------- | ------------------------------------------- |
| Project         | BlueShield - Coastal Protection System      |
| Module          | Backend API (Express.js + MongoDB)          |
| Test Framework  | Jest 30.x with Supertest                    |
| Performance     | Artillery.io                                |
| Branch          | `feature/testing-v2`                        |
| Last Updated    | 2026-04-10                                  |

---

## Table of Contents

1. [Test Overview](#1-test-overview)
2. [How to Run Tests](#2-how-to-run-tests)
3. [Unit Tests](#3-unit-tests)
   - 3.1 [Utilities](#31-utilities)
   - 3.2 [Middlewares](#32-middlewares)
   - 3.3 [Validations](#33-validations)
   - 3.4 [Services](#34-services)
4. [Integration Tests](#4-integration-tests)
5. [Performance Tests](#5-performance-tests)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Test Coverage Summary](#7-test-coverage-summary)

---

## 1. Test Overview

The BlueShield backend test suite is structured into three tiers to ensure reliability, correctness, and performance:

| Tier            | Purpose                                                           | Tool            |
| --------------- | ----------------------------------------------------------------- | --------------- |
| **Unit**        | Validate individual functions and modules in isolation             | Jest            |
| **Integration** | Verify API endpoints, request/response handling, and error flows   | Jest + Supertest|
| **Performance** | Evaluate API throughput under concurrent load                      | Artillery.io    |

### Directory Structure

```
backend/tests/
├── unit/
│   ├── authMiddleware.test.js
│   ├── authorize.test.js
│   ├── validateMiddleware.test.js
│   ├── validation.test.js
│   ├── generateToken.test.js
│   ├── marineAdvisory.test.js
│   ├── geminiService.test.js
│   ├── marineService.test.js
│   ├── vesselTrackerService.test.js
│   ├── enforcementService.test.js
│   ├── hazardService.test.js
│   ├── zoneService.test.js
│   └── illegalCaseService.test.js
├── integration/
│   ├── authRoutes.test.js
│   ├── enforcementRoutes.test.js
│   └── reportRoutes.test.js
├── performance/
│   └── load-test.yml
└── TEST_DOCUMENTATION.md
```

---

## 2. How to Run Tests

All commands should be executed from the `backend/` directory.

| Command                      | Description                          |
| ---------------------------- | ------------------------------------ |
| `npm test`                   | Run all tests (unit + integration)   |
| `npm run test:unit`          | Run unit tests only                  |
| `npm run test:integration`   | Run integration tests only           |
| `npm run test:coverage`      | Run all tests with coverage report   |
| `npm run test:watch`         | Run tests in watch mode              |
| `npm run test:performance`   | Run Artillery load test              |

**Prerequisites:**
- Node.js 18+ installed
- `npm install` completed in `backend/`
- A `.env` file with `JWT_SECRET` defined (test suites set their own test value)
- For performance tests: a running server instance on `http://localhost:5000`

---

## 3. Unit Tests

All unit tests use **mocked dependencies** (Jest mocks) to test each module in complete isolation. No database connections, external API calls, or network requests are made during unit test execution.

---

### 3.1 Utilities

#### 3.1.1 generateToken (`generateToken.test.js`)

**Module Under Test:** `src/utils/generateToken.js`

| # | Test Case                                     | Acceptance Criteria                                                    | Status  |
|---|-----------------------------------------------|------------------------------------------------------------------------|---------|
| 1 | Returns a valid JWT with correct id and role  | Decoded token payload contains the exact `id` and `role` passed in     | Passing |
| 2 | Token expires in 7 days                       | `exp` claim is within 5 seconds of `now + 7 days`                      | Passing |
| 3 | Different IDs produce different tokens        | Two tokens generated with different IDs must not be equal              | Passing |
| 4 | Token is a non-empty string                   | Return value is a string with length > 0                               | Passing |

---

#### 3.1.2 marineAdvisory (`marineAdvisory.test.js`)

**Module Under Test:** `src/utils/marineAdvisory.js`

| # | Test Case                                     | Acceptance Criteria                                                           | Status  |
|---|-----------------------------------------------|-------------------------------------------------------------------------------|---------|
| 1 | HIGH risk when waveHeight >= 3                | `riskLevel === "HIGH"`, advisory contains "Avoid sea travel"                  | Passing |
| 2 | HIGH risk when windWaveHeight >= 2            | `riskLevel === "HIGH"`                                                        | Passing |
| 3 | HIGH risk when both thresholds exceeded       | `riskLevel === "HIGH"`                                                        | Passing |
| 4 | MODERATE risk when waveHeight >= 2 but < 3    | `riskLevel === "MODERATE"`, advisory contains "Caution for small fishing boats" | Passing |
| 5 | MODERATE risk when windWaveHeight >= 1.2      | `riskLevel === "MODERATE"`                                                    | Passing |
| 6 | LOW risk for calm conditions                  | `riskLevel === "LOW"`, advisory contains "Sea conditions appear normal"       | Passing |
| 7 | LOW risk when both values are zero            | `riskLevel === "LOW"`                                                         | Passing |
| 8 | Non-numeric waveHeight treated as 0           | `riskLevel === "LOW"` for `null` input                                        | Passing |
| 9 | Non-numeric windWaveHeight treated as 0       | `riskLevel === "LOW"` for `undefined` input                                   | Passing |
| 10| Missing fields treated as 0                   | `riskLevel === "LOW"` for empty object                                        | Passing |
| 11| Advisory always contains validity note        | All risk levels include "Advice valid for next few hours"                     | Passing |

---

### 3.2 Middlewares

#### 3.2.1 authMiddleware (`authMiddleware.test.js`)

**Module Under Test:** `src/middlewares/authMiddleware.js`

| # | Test Case                                     | Acceptance Criteria                                                    | Status  |
|---|-----------------------------------------------|------------------------------------------------------------------------|---------|
| 1 | `protect` attaches authenticated user         | `req.user` is set, `next()` called once, `User.findById` called       | Passing |
| 2 | `protect` rejects missing token               | 401 response with `"Not authorized, no token"`                         | Passing |
| 3 | `adminOnly` rejects non-admin users           | 403 response with `"Not authorized as an admin"`                       | Passing |
| 4 | `adminOnly` allows system admins              | `next()` called, no error response                                    | Passing |

---

#### 3.2.2 authorize (`authorize.test.js`)

**Module Under Test:** `src/middlewares/authorize.js`

| # | Test Case                                     | Acceptance Criteria                                                    | Status  |
|---|-----------------------------------------------|------------------------------------------------------------------------|---------|
| 1 | Calls `next()` when role is allowed           | `next()` called once, no status/json response                          | Passing |
| 2 | Returns 403 when role is not allowed           | 403 with `"Forbidden: insufficient role"`                              | Passing |
| 3 | Returns 401 when `req.user` is missing         | 401 with `"Not authorized"`                                           | Passing |
| 4 | Returns 401 when `req.user` is null            | 401 response                                                          | Passing |
| 5 | Works with a single allowed role               | `next()` called for matching role                                     | Passing |
| 6 | Works with multiple allowed roles              | `next()` called for any matching role in the list                     | Passing |

---

#### 3.2.3 validate (`validateMiddleware.test.js`)

**Module Under Test:** `src/middlewares/validate.js`

| # | Test Case                                     | Acceptance Criteria                                                    | Status  |
|---|-----------------------------------------------|------------------------------------------------------------------------|---------|
| 1 | Calls `next()` when validation passes         | Validator called with `req`, `next()` invoked                          | Passing |
| 2 | Returns 400 with error array on failure        | 400 with `{ message: "Validation error", errors: [...] }`             | Passing |
| 3 | Calls `next()` when validator returns undefined| No error response                                                     | Passing |
| 4 | Calls `next()` when result has no error field  | No error response                                                     | Passing |
| 5 | Passes full `req` object to validator          | Validator receives `req` with body, params, and query                  | Passing |

---

### 3.3 Validations

#### 3.3.1 Request Validations (`validation.test.js`)

**Modules Under Test:** `src/validations/report.validation.js`, `enforcement.validation.js`, `illegalCase.validation.js`, `hazard.validation.js`, `zone.validation.js`

| # | Test Case                                              | Acceptance Criteria                                                                     | Status  |
|---|--------------------------------------------------------|-----------------------------------------------------------------------------------------|---------|
| 1 | Report: rejects missing core fields                    | Error array includes `"title is required"` and `"description is required"`              | Passing |
| 2 | Report: accepts a valid create payload                 | `error` is `null`                                                                       | Passing |
| 3 | Report: rejects invalid paging and filters             | Error array includes page, limit, and status errors                                     | Passing |
| 4 | Enforcement: accepts boolean-like evidence flags       | `error` is `null` for `isSealed: "true"`                                                | Passing |
| 5 | Enforcement: rejects bad action payloads               | Error array includes ObjectId, actionType, and amount errors                            | Passing |
| 6 | Illegal Case: requires vessel data on create           | Error array includes vesselId format, vesselType, and severity errors                   | Passing |
| 7 | Hazard: rejects resolve with invalid id and type       | Error array includes ObjectId and resolutionNote type errors                            | Passing |
| 8 | Zone: rejects invalid zone creation payload            | Error array includes sourceHazard, zoneType, warningMessage, and radius errors          | Passing |

---

### 3.4 Services

#### 3.4.1 geminiService (`geminiService.test.js`)

**Module Under Test:** `src/services/geminiService.js`

| # | Test Case                                        | Acceptance Criteria                                                          | Status  |
|---|--------------------------------------------------|------------------------------------------------------------------------------|---------|
| 1 | Returns parsed risk assessment                   | Response has correct riskScore, riskLevel, justification, recommendedActions | Passing |
| 2 | Clamps riskScore above 100 to 100               | `riskScore === 100` for input of 150                                         | Passing |
| 3 | Clamps negative riskScore to 0                   | `riskScore === 0` for input of -10                                           | Passing |
| 4 | Derives riskLevel when Gemini returns invalid    | Derives `CRITICAL` for score 80                                              | Passing |
| 5 | Derives LOW for score < 26                       | `riskLevel === "LOW"` for score 10                                           | Passing |
| 6 | Derives MODERATE for score 26-50                 | `riskLevel === "MODERATE"` for score 40                                      | Passing |
| 7 | Derives HIGH for score 51-75                     | `riskLevel === "HIGH"` for score 60                                          | Passing |
| 8 | Handles missing recommendedActions               | Returns empty array                                                          | Passing |
| 9 | Handles missing justification                    | Returns empty string                                                         | Passing |
| 10| Throws 502 when Gemini API fails                 | Error message contains "Gemini enforcement analysis failed"                  | Passing |
| 11| Error has statusCode 502                         | `err.statusCode === 502`                                                     | Passing |
| 12| Throws when Gemini returns invalid JSON          | Error thrown on parse failure                                                | Passing |

---

#### 3.4.2 marineService (`marineService.test.js`)

**Module Under Test:** `src/services/marineService.js`

| # | Test Case                                       | Acceptance Criteria                                                            | Status  |
|---|------------------------------------------------|--------------------------------------------------------------------------------|---------|
| 1 | Returns LOW risk for calm seas                  | `riskLevel === "LOW"`, correct wave/temp values, provider set                  | Passing |
| 2 | Returns MODERATE risk for moderate conditions   | `riskLevel === "MODERATE"`                                                     | Passing |
| 3 | Returns HIGH risk for dangerous conditions      | `riskLevel === "HIGH"`                                                         | Passing |
| 4 | Throws 400 for invalid latitude                 | `err.statusCode === 400`                                                       | Passing |
| 5 | Throws 400 for NaN longitude                    | `err.statusCode === 400`                                                       | Passing |
| 6 | Throws 400 for Infinity coordinates             | `err.statusCode === 400`                                                       | Passing |
| 7 | Throws 502 when Open-Meteo API fails            | `err.statusCode === 502`                                                       | Passing |
| 8 | Calls Open-Meteo with correct parameters        | URL and query params match expected values                                     | Passing |
| 9 | Handles empty hourly data gracefully            | Returns `null` values, defaults to LOW risk                                    | Passing |

---

#### 3.4.3 vesselTrackerService (`vesselTrackerService.test.js`)

**Module Under Test:** `src/services/vesselTrackerService.js`

| # | Test Case                                          | Acceptance Criteria                                                        | Status  |
|---|----------------------------------------------------|----------------------------------------------------------------------------|---------|
| 1 | Returns local fallback when no API keys configured | Returns array with standardized vessel objects                             | Passing |
| 2 | Returns standardized vessel data from DataDocked   | Returns array of vessels from API response                                 | Passing |
| 3 | Vessel objects have DISTANCE_KM set to null        | All items in result have `DISTANCE_KM === null`                            | Passing |
| 4 | Handles general failure with local fallback        | Returns non-empty array of vessels                                         | Passing |
| 5 | trackVessel throws when no API configured          | Error thrown: "Failed to track vessel"                                     | Passing |

---

#### 3.4.4 enforcementService (`enforcementService.test.js`)

**Module Under Test:** `src/services/enforcementService.js`

| # | Test Case                                           | Acceptance Criteria                                                         | Status  |
|---|-----------------------------------------------------|-----------------------------------------------------------------------------|---------|
| 1 | `create` - creates enforcement for valid case       | Returns enforcement doc, `Enforcement.create` called with correct params    | Passing |
| 2 | `create` - throws 409 if duplicate exists           | `err.statusCode === 409`                                                    | Passing |
| 3 | `create` - throws 404 if case not found             | `err.statusCode === 404`                                                    | Passing |
| 4 | `createFromCase` - delegates with correct params    | `Enforcement.create` called with `relatedCase` and `leadOfficer`            | Passing |
| 5 | `list` - returns paginated results                  | Response has `page`, `limit`, `total`, `items`                              | Passing |
| 6 | `list` - filters by leadOfficer for OFFICER role    | Filter includes `leadOfficer` field                                         | Passing |
| 7 | `list` - clamps page to minimum 1                   | `result.page === 1` for `page=0`                                           | Passing |
| 8 | `list` - clamps limit to max 50                     | `result.limit === 50` for `limit=100`                                       | Passing |
| 9 | `getById` - returns enforcement when found          | Returns doc with correct `_id`                                              | Passing |
| 10| `getById` - throws 404 when not found               | `err.statusCode === 404`                                                    | Passing |
| 11| `getById` - throws 403 for IDOR violation           | `err.statusCode === 403` when officer accesses another's case               | Passing |
| 12| `update` - updates enforcement fields               | Returns updated doc                                                         | Passing |
| 13| `update` - throws 404 when not found                | `err.statusCode === 404`                                                    | Passing |
| 14| `update` - throws 403 for IDOR violation            | `err.statusCode === 403`                                                    | Passing |
| 15| `delete` - deletes enforcement                      | Returns deleted doc                                                         | Passing |
| 16| `addAction` - pushes action to enforcement          | `actions.push` called, `save()` called                                      | Passing |
| 17| `closeEnforcement` - closes and syncs case/report   | Status `CLOSED_RESOLVED`, case and report set to `RESOLVED`                 | Passing |
| 18| `closeEnforcement` - throws 409 if already closed   | `err.statusCode === 409`                                                    | Passing |
| 19| `pushRiskAssessment` - saves AI assessment          | `aiRiskScore` updated, `$push` to `riskScoreHistory`                       | Passing |
| 20| `addEvidence` - creates evidence for enforcement    | `Evidence.create` called with correct enforcement ref                       | Passing |
| 21| `addTeamMember` - creates member when valid officer | `TeamMember.create` called with correct data                                | Passing |
| 22| `getBasicStatistics` - returns formatted stats      | Response has `total`, `byStatus`, `byPriority`, `byOutcome`                | Passing |
| 23| `getAssignableOfficers` - returns active officers   | Queries `{ role: "OFFICER", isActive: true }`                               | Passing |

---

#### 3.4.5 hazardService (`hazardService.test.js`)

**Module Under Test:** `src/services/hazardService.js`

| # | Test Case                                           | Acceptance Criteria                                                         | Status  |
|---|-----------------------------------------------------|-----------------------------------------------------------------------------|---------|
| 1 | `createFromReport` - creates from valid report      | Hazard created with `handlingStatus: "OPEN"`, correct category and severity | Passing |
| 2 | `createFromReport` - throws 409 if duplicate exists  | `err.statusCode === 409`                                                    | Passing |
| 3 | `createFromReport` - throws 404 if report not found  | `err.statusCode === 404`                                                    | Passing |
| 4 | `createFromReport` - throws 400 for wrong type       | `err.statusCode === 400` for non-HAZARD/ENVIRONMENTAL                      | Passing |
| 5 | `createFromReport` - throws 409 if not VERIFIED      | `err.statusCode === 409`                                                    | Passing |
| 6 | `list` - returns paginated hazard list               | Response has `page`, `total`, `items`                                       | Passing |
| 7 | `list` - applies filters from query                  | Filter object contains `handlingStatus`, `hazardCategory`, `severity`       | Passing |
| 8 | `getById` - returns hazard when found                | Returns doc with correct `caseId`                                           | Passing |
| 9 | `getById` - throws 404 when not found                | `err.statusCode === 404`                                                    | Passing |
| 10| `update` - updates hazard fields                     | Returns updated doc                                                         | Passing |
| 11| `update` - throws 409 for direct RESOLVED status     | `err.statusCode === 409`                                                    | Passing |
| 12| `update` - throws 404 when not found                 | `err.statusCode === 404`                                                    | Passing |
| 13| `fetchWeatherAndSave` - fetches and updates hazard   | Marine service called with correct lat/lng                                  | Passing |
| 14| `fetchWeatherAndSave` - throws 400 for no coords     | `err.statusCode === 400`                                                    | Passing |
| 15| `resolve` - resolves hazard and disables zone        | Zone set to `DISABLED`, report set to `RESOLVED`                            | Passing |
| 16| `deleteIfAllowed` - deletes resolved hazard          | Returns `{ deletedId }` for resolved hazard with no active zones            | Passing |
| 17| `deleteIfAllowed` - throws 409 if not RESOLVED       | `err.statusCode === 409`                                                    | Passing |
| 18| `deleteIfAllowed` - throws 409 if active zones exist | `err.statusCode === 409`                                                    | Passing |
| 19| `getDashboardSummary` - returns dashboard stats      | Response has `stats`, `monthlyCategoryChart`, `recentPendingReports`        | Passing |

---

#### 3.4.6 zoneService (`zoneService.test.js`)

**Module Under Test:** `src/services/zoneService.js`

| # | Test Case                                           | Acceptance Criteria                                                         | Status  |
|---|-----------------------------------------------------|-----------------------------------------------------------------------------|---------|
| 1 | `create` - creates zone with auto-derived center    | Center coordinates derived from hazard's report location                    | Passing |
| 2 | `create` - throws 409 if zone exists for hazard     | `err.statusCode === 409`                                                    | Passing |
| 3 | `create` - throws 404 if hazard not found            | `err.statusCode === 404`                                                    | Passing |
| 4 | `create` - throws 400 if report has no coordinates   | `err.statusCode === 400`                                                    | Passing |
| 5 | `list` - returns paginated list with GeoJSON          | Response has `items`, `geojson.type === "FeatureCollection"`                | Passing |
| 6 | `list` - applies status and zoneType filters          | Filter object matches query params                                          | Passing |
| 7 | `getById` - returns zone when found                   | Returns doc with correct `zoneType`                                         | Passing |
| 8 | `getById` - throws 404 when not found                 | `err.statusCode === 404`                                                    | Passing |
| 9 | `update` - updates zone fields                        | Returns updated doc                                                         | Passing |
| 10| `remove` - deletes zone                               | Returns deleted doc                                                         | Passing |

---

#### 3.4.7 illegalCaseService (`illegalCaseService.test.js`)

**Module Under Test:** `src/services/illegalCaseService.js`

| # | Test Case                                              | Acceptance Criteria                                                          | Status  |
|---|--------------------------------------------------------|------------------------------------------------------------------------------|---------|
| 1 | `getPendingReports` - returns reports with cases       | Each report includes `illegalCase` (or `null` if no case exists)             | Passing |
| 2 | `markAsReviewed` - sets report status to REJECTED      | `report.status === "REJECTED"`                                               | Passing |
| 3 | `markAsReviewed` - marks associated case as reviewed   | `illegalCase.isReviewed === true`                                            | Passing |
| 4 | `markAsReviewed` - throws 404 when report not found    | `err.statusCode === 404`                                                     | Passing |
| 5 | `createCase` - creates case from ILLEGAL_FISHING       | Case created with `status: "OPEN"`, report set to `VERIFIED`                | Passing |
| 6 | `createCase` - throws 404 if report not found          | `err.statusCode === 404`                                                     | Passing |
| 7 | `createCase` - throws 400 if wrong report type         | `err.statusCode === 400`                                                     | Passing |
| 8 | `createCase` - throws 409 if case already exists       | `err.statusCode === 409`                                                     | Passing |
| 9 | `updateCase` - updates case when OPEN                  | Fields updated and saved                                                     | Passing |
| 10| `updateCase` - throws 403 when case is not OPEN        | `err.statusCode === 403`                                                     | Passing |
| 11| `deleteCase` - deletes non-escalated case              | Returns `{ id }` of deleted case                                            | Passing |
| 12| `deleteCase` - throws 403 for escalated case           | `err.statusCode === 403`                                                     | Passing |
| 13| `escalateCase` - escalates case to officer              | Status set to `ESCALATED`, `assignedOfficer` set                            | Passing |
| 14| `escalateCase` - throws 409 if already escalated        | `err.statusCode === 409`                                                     | Passing |
| 15| `escalateCase` - throws 400 if vessel not tracked       | `err.statusCode === 400`                                                     | Passing |
| 16| `escalateCase` - throws 400 if no officer provided      | `err.statusCode === 400`                                                     | Passing |
| 17| `escalateCase` - throws 400 if officer user invalid     | `err.statusCode === 400`                                                     | Passing |
| 18| `resolveCase` - resolves case and updates report         | `status === "RESOLVED"`, report set to `RESOLVED`                           | Passing |
| 19| `trackVessel` - tracks via external API                  | Returns `dataSource: "external_api"` with vessel data                       | Passing |
| 20| `trackVessel` - falls back on invalid API response       | Returns `dataSource: "fallback"` with static data                           | Passing |
| 21| `trackVessel` - falls back on API failure                | Returns `dataSource: "fallback"`                                            | Passing |
| 22| `trackVessel` - throws 409 if already tracked            | `err.statusCode === 409`                                                     | Passing |
| 23| `addNote` - adds note to case                            | `reviewNotes` updated via `$push`                                           | Passing |
| 24| `getOfficers` - returns active officers                  | Queries `{ role: "OFFICER", isActive: true }`                               | Passing |

---

## 4. Integration Tests

Integration tests use **Supertest** to send real HTTP requests to the Express app with **mocked database models**. This validates the full request pipeline: routing, middleware, validation, controller logic, and response formatting.

### 4.1 Auth Routes (`authRoutes.test.js`)

| # | Test Case                                          | Endpoint                  | Acceptance Criteria                                          | Status  |
|---|----------------------------------------------------|---------------------------|--------------------------------------------------------------|---------|
| 1 | Register creates a user and returns a token        | `POST /api/auth/register` | 201 with `{ _id, name, email, role, token }`                 | Passing |
| 2 | Login returns 401 for invalid credentials          | `POST /api/auth/login`    | 401 with `{ message: "Invalid email or password" }`          | Passing |
| 3 | GET /me returns the authenticated user             | `GET /api/auth/me`        | 200 with user object matching JWT payload                    | Passing |

### 4.2 Enforcement Routes (`enforcementRoutes.test.js`)

| # | Test Case                                          | Endpoint                                               | Acceptance Criteria                                          | Status  |
|---|----------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------------|---------|
| 1 | Creates enforcement from a reviewed case           | `POST /api/enforcements/from-case/:caseId`             | 201 with enforcement doc                                     | Passing |
| 2 | Lists officer enforcements                         | `GET /api/enforcements`                                | 200 with paginated list                                      | Passing |
| 3 | Creates enforcement with officer as lead           | `POST /api/enforcements`                               | 201 with `leadOfficer` set                                   | Passing |
| 4 | Adds action and closes enforcement                 | `POST .../actions` + `PATCH .../close`                 | 200 for both, correct service calls                          | Passing |
| 5 | Handles evidence and team workflow                 | `POST/GET .../evidence` + `POST/GET .../team`          | 201/200 for create/list operations                           | Passing |
| 6 | Generates AI risk score                            | `POST .../risk-score`                                  | 200 with risk assessment from Gemini                         | Passing |
| 7 | Blocks fisherman from officer routes               | `GET /api/enforcements`                                | 403 with `"Forbidden"` message for FISHERMAN role            | Passing |

### 4.3 Report Routes (`reportRoutes.test.js`)

| # | Test Case                                          | Endpoint               | Acceptance Criteria                                          | Status  |
|---|----------------------------------------------------|------------------------|--------------------------------------------------------------|---------|
| 1 | Returns validation errors for incomplete payload   | `POST /api/reports`    | 400 with `{ message: "Validation error", errors: [...] }`    | Passing |
| 2 | Creates report for authenticated fisherman         | `POST /api/reports`    | 201 with full report object matching input                   | Passing |

---

## 5. Performance Tests

### 5.1 Load Test Configuration (`load-test.yml`)

**Tool:** Artillery.io

| Phase               | Duration | Arrival Rate      | Purpose                                    |
| ------------------- | -------- | ----------------- | ------------------------------------------ |
| Warm-up             | 60s      | 5 → 20 users/sec  | Gradual ramp-up to establish baseline       |
| Sustained load      | 120s     | 20 users/sec      | Evaluate stability under constant pressure  |

**Scenarios Tested:**

| # | Scenario                            | Flow                                                                    |
|---|-------------------------------------|-------------------------------------------------------------------------|
| 1 | Authentication and Report Browsing  | Login → GET reports → GET enforcements → GET enforcement stats          |
| 2 | Public Incident Reporting           | POST new report (ILLEGAL_FISHING, HIGH severity, with coordinates)      |

**Acceptance Criteria for Performance:**

| Metric                    | Target                           |
| ------------------------- | -------------------------------- |
| HTTP 2xx success rate     | >= 95%                           |
| p95 response time         | < 500ms                          |
| p99 response time         | < 1000ms                         |
| Error rate                | < 5%                             |
| Sustained throughput      | 20 requests/second for 2 minutes |

**How to Run:**
```bash
npm run test:performance
```

> **Note:** Requires a running server instance on `http://localhost:5000` with a connected MongoDB database and valid test user credentials.

---

## 6. Acceptance Criteria

### 6.1 Unit Testing Acceptance Criteria

- [ ] All individual utility functions produce correct output for valid, boundary, and invalid inputs
- [ ] All middleware functions correctly allow, reject, or transform requests based on their logic
- [ ] All validation modules detect and report missing/invalid fields with correct error messages
- [ ] All service functions correctly handle:
  - **Happy path**: Valid inputs produce expected outputs
  - **Not found**: Missing resources throw 404 errors
  - **Conflict**: Duplicate or invalid state operations throw 409 errors
  - **Forbidden**: Unauthorized access attempts throw 403 errors
  - **Bad request**: Invalid inputs throw 400 errors
  - **External failures**: Third-party API failures throw 502 errors
- [ ] All tests use mocked dependencies (no real DB or API calls)
- [ ] Tests are deterministic and can run in any order

### 6.2 Integration Testing Acceptance Criteria

- [ ] API endpoints return correct HTTP status codes (200, 201, 400, 401, 403, 404, 409)
- [ ] Request validation rejects malformed payloads with descriptive error messages
- [ ] Protected routes reject unauthenticated requests with 401
- [ ] Role-based routes reject unauthorized roles with 403
- [ ] Successful operations return correctly structured response bodies
- [ ] The full request pipeline (routing → middleware → validation → controller → response) functions correctly

### 6.3 Performance Testing Acceptance Criteria

- [ ] API handles 20 concurrent requests per second without degradation
- [ ] Response times remain under 500ms at p95 under sustained load
- [ ] No server crashes or unhandled errors during load test execution
- [ ] Authentication token flow works correctly under concurrent requests

---

## 7. Test Coverage Summary

| Category          | Test Suites | Test Cases | Status      |
| ----------------- | ----------- | ---------- | ----------- |
| Unit - Utils      | 2           | 15         | All Passing |
| Unit - Middleware  | 3           | 15         | All Passing |
| Unit - Validation  | 1           | 8          | All Passing |
| Unit - Services    | 7           | 117        | All Passing |
| Integration        | 3           | 12         | All Passing |
| Performance        | 1           | 2 scenarios| Configured  |
| **Total**          | **17**      | **167+**   | **Passing** |

### Modules Covered

| Module                       | Unit Tested | Integration Tested |
| ---------------------------- | ----------- | ------------------ |
| `utils/generateToken`        | Yes         | -                  |
| `utils/marineAdvisory`       | Yes         | -                  |
| `middlewares/authMiddleware`  | Yes         | Yes (via routes)   |
| `middlewares/authorize`       | Yes         | Yes (via routes)   |
| `middlewares/validate`        | Yes         | Yes (via routes)   |
| `validations/*`              | Yes         | Yes (via routes)   |
| `services/geminiService`     | Yes         | Yes (via routes)   |
| `services/marineService`     | Yes         | -                  |
| `services/vesselTrackerService` | Yes      | -                  |
| `services/enforcementService`| Yes         | Yes                |
| `services/hazardService`     | Yes         | -                  |
| `services/zoneService`       | Yes         | -                  |
| `services/illegalCaseService`| Yes         | -                  |
| `controllers/authController` | -           | Yes                |
| `controllers/reportController`| -          | Yes                |
| `controllers/enforcementController`| -     | Yes                |
