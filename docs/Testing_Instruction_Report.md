# Testing Instruction Report

This report provides detailed instructions and configuration details for executing the full testing suite of the BlueShield platform, covering Unit, Integration, and Performance testing as required by the SLIIT SE-3040 Application Frameworks assignment.

---

## 1. Unit Testing

### Backend Unit Tests
- **Framework**: Jest
- **Location**: `backend/tests/unit/`
- **Scope**: Individual business logic, validation schemas, and middleware.
- **How to Run**:
  ```bash
  cd backend
  npm run test:unit
  ```

### Frontend Unit Tests
- **Framework**: Vitest + React Testing Library
- **Location**: `frontend/src/test/`
- **Scope**: Reusable UI components, context providers, and hooks.
- **How to Run**:
  ```bash
  cd frontend
  npm test
  ```

---

## 2. Integration Testing

- **Framework**: Supertest + Jest (using a dedicated MongoDB Memory Server or Test Cluster)
- **Location**: `backend/tests/integration/`
- **Scope**: Entire API request/response cycles, verifying the interaction between controllers, services, and the database.
- **How to Run**:
  ```bash
  cd backend
  npm run test:integration
  ```
- **Validation**: Ensures standard HTTP status codes (200, 201, 400, 401, 404, 500) are returned correctly for both success and error scenarios.

---

## 3. Performance Testing

- **Tool**: Artillery.io
- **Location**: `backend/tests/performance/load-test.yml`
- **Scope**: Evaluating API stability and latency under sustained load (simulating concurrent user sessions).
- **Setup**:
  1. Ensure the backend server is running locally (`npm run dev`).
  2. Install Artillery: `npm install -g artillery` (optional if using local script).
- **How to Run**:
  ```bash
  cd backend
  npm run test:performance
  ```
- **Scenarios**:
  - **Warm-up phase**: 60 seconds (5 to 20 virtual users).
  - **Sustained load**: 120 seconds (20 virtual users).
  - **Flows**: Simulates user login -> report browsing -> incident submission.

---

## 4. Testing Environment Configuration

- **Environment File**: The backend uses `NODE_ENV=test` to switch between configurations.
- **Database Isolation**: It is recommended to use a separate MongoDB database (e.g., `blueshield_test`) to prevent data corruption during integration tests.
- **API Mocking**: Frontend tests use `vitest.mock` to intercept network calls to `authAPI` and `enforcementAPI`, ensuring tests are fast and deterministic.
- **Cross-Env**: The `cross-env` package is used across all test scripts to ensure compatibility between Windows and Unix-based systems.
