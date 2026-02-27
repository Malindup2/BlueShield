# BlueShield – Life Below Water

SE3040: Application Frameworks Team Project

## Project Overview

BlueShield is a full stack web application designed to help fishermen and authorities report, track, and manage illegal fishing activities and marine hazards. The platform supports secure reporting, case management, enforcement, and marine safety, with real-time data and external API integrations. The system is inspired by the need for sustainable marine resource management and protection of local fishing communities.

## Key Features

- Incident reporting and categorization (illegal fishing, hazards)
- Case management and review workflows
- Enforcement actions and AI-powered risk scoring
- Marine hazard and restricted zone management
- User authentication and role-based access control
- Analytics and dashboards for users and admin
- Integration with external APIs (Mapbox, Vessel Data, Open-Meteo, Gemini)
- Responsive React frontend with state management

## Architecture Overview

**Tech Stack:**

- Backend: Node.js + Express.js
- Frontend: React.js (functional components, Hooks)
- Database: MongoDB
- State Management: Context API (or Redux)
- Styling: Tailwind CSS / Bootstrap
- Deployment: Backend → Render/Railway, Frontend → Vercel/Netlify
- Testing: Jest, Supertest, Artillery

**Architecture Diagram:**

   [Frontend React App] --> REST API --> [Backend Express.js] --> [MongoDB Database]
         |                 |                |
      Context API/Redux   Routes/Controllers   Collections for:
         |                 |                |
      Components           Services/Logic      Reports, Cases, Enforcements, Hazards, Users

## Core Components & Responsibilities

### Incident & Auth Components
- User registration, login, JWT authentication
- Incident report CRUD (illegal fishing, hazards)
- Mapbox API for geolocation

### Case Review & Escalation
- Illegal case CRUD and review
- Vessel Data API simulation using Beeceptor for jurisdiction
- Bulletins and case status updates

### Enforcement & Risk Scoring
- Enforcement record CRUD
- Google Gemini API for AI risk scoring
- Action logging and status management

### Hazard & Marine Safety
- Hazard CRUD and status management
- Open-Meteo API for live sea conditions
- Restricted zone CRUD and updates

## Project Structure

---


## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <[text](https://github.com/Malindup2/BlueShield)>
   cd BlueShield
   ```
2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.template` to `.env` and fill in your values:
     ```bash
     cp .env.template .env
     # Edit .env as needed
     ```
4. **Start the backend server:**
   ```bash
   npm run dev
   # or for production
   npm start
   ```
5. **Base URL:**
   - Local: `http://localhost:5000/api`
   - Production: `[Insert Render URL Here]`

---


## Project Structure

```
backend/
  src/
    config/         # DB and config files
    controllers/    # Route logic
    middlewares/    # Express middlewares
    models/         # Mongoose models
    routes/         # Express routers
    services/       # Business logic
    utils/          # Utility functions
  .env.template     # Example environment variables
  .gitignore        # Ignore sensitive and build files
  server.js         # Main entry point
frontend/
  ...               # React app (see frontend/README.md)
```

---


## Authentication
All protected routes require a JWT in the `Authorization` header:

   Authorization: Bearer <your_jwt_token>

---


## API Components & Endpoints

### 1. Core Auth & Incident Intake (Gateway)
Session management, unified routing for user reports. Integrates with Mapbox Reverse Geocoding.

#### Auth Endpoints
- `POST /auth/register` — Register user
- `POST /auth/login` — Login
- `GET /auth/me` — Get profile (protected)

#### Incident Report Endpoints
- `POST /reports` — Submit report (protected: FISHERMAN)
- `GET /reports` — List all reports (protected: SYSTEM_ADMIN, OFFICER)
- `GET /reports/my-reports` — My reports (protected: FISHERMAN)
- `GET /reports/:id` — Get report by ID (protected)
- `PATCH /reports/:id/status` — Update status (protected: SYSTEM_ADMIN)
- `DELETE /reports/:id` — Delete (protected: FISHERMAN owner or SYSTEM_ADMIN)

### 2. Illegal Case Review & Escalation
Investigate unauthorized fishing, simulate vessel tracking using Beeceptor external API. Escalate the case to a specific officer.

#### Endpoints

- `POST /api/illegal-cases/reports/:reportId/review` - New illegal case review record
- `GET /api/illegal-cases` - List of all records
- `GET /api/illegal-cases/:caseId` - Record details
- `PATCH /api/illegal-cases/:caseId` - Update record
- `DELETE /api/illegal-cases/:caseId` - Delete record
- `POST /api/illegal-cases/:caseId/track` - Fetch vessel data
- `GET /api/illegal-cases/officers` - Get all officers
- `POST /api/illegal-cases/:caseId/escalate` - escalate to a specific officer
- `POST /api/illegal-cases/:caseId/notes` - Add a reference note


### 3. Legal Enforcement & Risk Scoring
Enforcement actions, fines, risk scoring. Integrates with Google Gemini API.

#### Endpoints
- `POST /enforcements` — New enforcement (protected: OFFICER)
- `GET /enforcements` — List enforcements
- `POST /enforcements/:id/risk-score` — AI risk score
- `POST /enforcements/:id/actions` — Log action
- `PATCH /enforcements/:id` — Update enforcement
- `DELETE /enforcements/:id/actions/:actionId` — Remove action

### 4. Hazard & Marine Safety Management
Environmental hazards, SOS, restricted zones. Integrates with Open-Meteo Marine API.

#### Endpoints
- `GET /hazards` — List hazards (protected: HAZARD_ADMIN)
- `GET /hazards/:id/weather` — Live sea conditions
- `PATCH /hazards/:id` — Update hazard
- `POST /zones` — Create restricted zone
- `GET /zones` — List active zones
- `PATCH /zones/:id` — Update zone
- `DELETE /zones/:id` — Delete zone

---



## Environment Variables
See `.env.template` for all required variables:

   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret

---


## Contributing
- Fork and clone the repo
- Create a new branch for your feature/component
- Commit and push your changes
- Open a pull request

---


## License
MIT

---


## External APIs Used
- Mapbox Reverse Geocoding
- Beeceptor API (for simulating vessel tracking)
- Google Gemini API
- Open-Meteo Marine API

## Notes
- Do NOT commit `.env` or `.env.local` files.
- DO commit `.env.template` for onboarding new developers.
- See API docs above for endpoint details and required roles.

## Deployment

### Backend Deployment
- Deploy the RESTful API using a cloud platform (e.g., Render, Railway)
- Set environment variables in the deployment dashboard
- Obtain and share the live API URL

### Frontend Deployment
- Deploy the React frontend using Vercel, Netlify, or Firebase Hosting
- Set environment variables (API URL)
- Obtain and share the live frontend URL

### Deployment Evidence
- Add screenshots of successful deployment (dashboard, live app, API response)

## Testing Instructions

### Unit Testing
- Backend: Use Jest or Mocha for unit tests in `backend/tests/`
- Frontend: Use React Testing Library/Jest

### Integration Testing
- Test API endpoints using Postman or automated scripts
- Ensure controllers, services, and DB interact correctly

### Performance Testing
- Use Artillery.io for backend load testing

### Testing Environment
- Use `.env.test` for test-specific variables
- Mock external APIs as needed

## Best Practices
- Use a single `.gitignore` at the root; do NOT commit `.env` or `.env.local`
- Commit `.env.template` for onboarding
- Use meaningful commit messages and regular pushes
- Follow clean architecture: controllers, services, models, routes, utils
- Validate and sanitize all inputs
- Handle errors and edge cases gracefully
