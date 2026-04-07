# BlueShield Project Index

Last updated: 2026-04-02

## Purpose

This file is a quick navigation map for the current codebase. It is intentionally shorter than `PROJECT_DETAILED_OVERVIEW.md` and focuses on where things live today.

## Top Level

- `backend/` - Express API, MongoDB models, business logic, integrations
- `frontend/` - React + Vite client app
- `README.md` - project overview, setup, API summary
- `PROJECT_DETAILED_OVERVIEW.md` - longer architecture and feature notes
- `BlueShield-Report-API.postman_collection.json` - API collection

## Runtime Entry Points

### Backend

- `backend/server.js`
  - Loads environment variables
  - Connects to MongoDB
  - Registers API route groups under `/api`
  - Starts Express server on `PORT` or `5000`

### Frontend

- `frontend/src/main.jsx`
  - Boots the React app
- `frontend/src/App.jsx`
  - Declares the client routes:
    - `/`
    - `/login`
    - `/register`
    - `/create-report`

## Backend Map

### Main folders

- `backend/src/config/` - database and third-party config
- `backend/src/controllers/` - request handlers
- `backend/src/middlewares/` - auth, upload, validation middleware
- `backend/src/models/` - Mongoose models
- `backend/src/routes/` - Express routers
- `backend/src/services/` - integration and domain logic
- `backend/src/utils/` - shared helpers
- `backend/src/validations/` - request validation schemas

### Registered route groups

From `backend/server.js`:

- `/api/auth` -> `backend/src/routes/authRoutes.js`
- `/api/enforcements` -> `backend/src/routes/enforcementRoutes.js`
- `/api/hazards` -> `backend/src/routes/hazardRoutes.js`
- `/api/zones` -> `backend/src/routes/zoneRoutes.js`
- `/api/illegal-cases` -> `backend/src/routes/illegalCaseRoutes.js`
- `/api/reports` -> `backend/src/routes/reportRoutes.js`
- `/api/vessels` -> `backend/src/routes/vesselRoutes.js`

### Route file summary

- `backend/src/routes/authRoutes.js`
  - register, login, current user
- `backend/src/routes/reportRoutes.js`
  - create, list, get, update, delete reports
- `backend/src/routes/illegalCaseRoutes.js`
  - case review lifecycle, vessel tracking, escalation, notes
- `backend/src/routes/enforcementRoutes.js`
  - enforcement CRUD, stats, actions, close flow, risk score, evidence, team
- `backend/src/routes/hazardRoutes.js`
  - create from report, list, detail, update, weather, resolve, delete
- `backend/src/routes/zoneRoutes.js`
  - zone CRUD
- `backend/src/routes/vesselRoutes.js`
  - create vessels, list vessels, vessels in zone

### Key models

- `User.js`
- `Report.js`
- `IllegalCase.js`
- `Enforcement.js`
- `Evidence.js`
- `TeamMember.js`
- `Hazard.js`
- `Zone.js`
- `CaseReviewd.js`

### Important services and integrations

- `vesselTrackerService.js` - vessel tracking/external vessel data flow
- `marineService.js` - marine weather or sea-condition integration
- `locationTagService.js` - location tagging and mapping-related helpers
- `geminiService.js` - Gemini-backed risk scoring or AI logic
- `enforcementService.js`, `hazardService.js`, `illegalCaseService.js`, `zoneService.js` - domain services

### Important middleware

- `authMiddleware.js` - JWT protection
- `authorize.js` - role checks
- `validate.js` - request validation
- `upload.js` - file upload handling

## Frontend Map

### Main folders

- `frontend/src/pages/` - route-level pages
- `frontend/src/components/` - reusable UI pieces
- `frontend/src/config/` - frontend config helpers
- `frontend/src/assets/` - bundled assets

### Current pages

- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/SubmitAReport.jsx`
- `frontend/src/pages/auth/Login.jsx`
- `frontend/src/pages/auth/Register.jsx`

### Notable frontend files

- `frontend/src/components/vesselMap.jsx` - map-oriented UI
- `frontend/src/config/api.js` - normalizes the frontend API base URL
- `frontend/src/index.css` - global styles

## Environment and Setup

### Backend

- `backend/.env` exists locally
- Expected variables are described in `README.md`
- Default API port: `5000`

### Frontend

- Uses Vite environment variables
- `frontend/src/config/api.js` reads `VITE_API_BASE_URL`

## Useful First Files To Read

If you are onboarding or returning to the codebase, start here:

1. `README.md`
2. `backend/server.js`
3. `frontend/src/App.jsx`
4. `backend/src/routes/`
5. `backend/src/controllers/`
6. `frontend/src/pages/`

## Current Notes

- The repo has local uncommitted changes in both backend and frontend, so this index reflects the present working tree rather than only committed history.
- A root `package.json` exists but currently only declares `axios`; the main app dependencies live in `backend/package.json` and `frontend/package.json`.
