# Software Requirements Specification (SRS)
## DroneCare System

**Version:** 1.0
**Status:** Draft — bridges the BRD (business needs) and the System Specification (architecture) into testable functional/non-functional requirements.

---

## 1. Introduction

### 1.1 Purpose
This SRS defines detailed, testable functional and non-functional requirements for the DroneCare platform, derived from `DRONECARE_BRD.md` (business needs) and `DRONECARE_SYSTEM_SPECIFICATION.md` (architecture). It is intended for developers and QA to build and verify the system against.

### 1.2 Scope
Covers MVP functionality: authentication, drone management, flight records, AI failure prediction, dashboard, notifications, maintenance, and reminders. Future-phase features (Section 26 of the System Specification) are out of scope for this SRS version.

### 1.3 References
- `DRONECARE_BRD.md`
- `DRONECARE_SYSTEM_SPECIFICATION.md`

---

## 2. Overall Description

### 2.1 Product Perspective
DroneCare is a new full-stack replacement for an existing Streamlit ML prototype. The prototype's ANN model, scaler, and encoders are reused as the prediction engine.

### 2.2 User Classes
- **Drone Operator** (MVP): owns and manages their own drones, flights, predictions, and maintenance.
- Future: Administrator, Maintenance Technician, Organization Manager.

### 2.3 Operating Environment
- Frontend: modern web browsers (desktop and responsive mobile view)
- Backend: server environment supporting FastAPI/Python
- Database: PostgreSQL

### 2.4 Assumptions & Dependencies
- Existing ANN model/scaler/encoders are usable pending validation (see Open Decisions in System Specification).
- Final prediction feature set may change; requirements below assume a configurable feature list, not a fixed one.

---

## 3. Functional Requirements

Each requirement has a unique ID, a description, and acceptance criteria.

### 3.1 Authentication

**FR-AUTH-01: User Registration**
- Description: A visitor can create an account with Full Name, Email, Password, Confirm Password.
- Acceptance Criteria:
  - Email must be unique and valid format.
  - Password must meet a minimum complexity policy (length/character rules — TBD).
  - Passwords must match Confirm Password before submission succeeds.
  - Password is stored only as a hash, never plaintext.
  - On success, user is redirected to login or auto-logged in (TBD — see Open Decisions).

**FR-AUTH-02: Login**
- Description: A registered user can log in with email + password.
- Acceptance Criteria:
  - Invalid credentials return a generic error (no indication of which field is wrong).
  - Successful login issues an auth token/session.
  - Account lockout or rate limiting after repeated failed attempts (threshold TBD).

**FR-AUTH-03: Logout**
- Acceptance Criteria: Logout invalidates the current token/session; protected pages become inaccessible immediately after.

**FR-AUTH-04: Forgot / Reset Password**
- Acceptance Criteria:
  - User requests reset via email; a time-limited reset token/link is generated.
  - Reset token is single-use and expires after a defined window (TBD, e.g., 30–60 minutes).
  - Successful reset invalidates all existing sessions for that user.

**FR-AUTH-05: Protected Routes**
- Acceptance Criteria: Any request to a non-auth endpoint without a valid token returns 401 Unauthorized; frontend redirects unauthenticated users to Login.

### 3.2 Drone Management

**FR-DRONE-01: Add Drone**
- Acceptance Criteria: User can submit drone identity/technical info (name, serial number, manufacturer, model, size, propeller count, max carry weight, purchase date). Serial number is unique per user at minimum.

**FR-DRONE-02: View/List Drones**
- Acceptance Criteria: User sees only their own drones; list supports search (by name/serial) and filter (by status).

**FR-DRONE-03: Edit Drone**
- Acceptance Criteria: User can update any editable drone field; changes are timestamped (`updated_at`).

**FR-DRONE-04: Deactivate/Delete Drone**
- Acceptance Criteria: Deactivating a drone hides it from active lists but preserves historical flights/predictions/maintenance for audit purposes (soft delete, not hard delete).

**FR-DRONE-05: Drone Details Page**
- Acceptance Criteria: Displays basic info, current health status, recent predictions, flight history, maintenance history, and related alerts in one view.

### 3.3 Flight & Telemetry

**FR-FLIGHT-01: Record Flight**
- Acceptance Criteria: User can log a completed flight including fields only known post-flight (e.g., flight duration), distinct from prediction-input fields.

**FR-FLIGHT-02: View Flight History**
- Acceptance Criteria: Flights are listed per drone, sorted by date descending by default, with pagination for large histories.

### 3.4 AI Prediction

**FR-PRED-01: Submit Prediction Request**
- Acceptance Criteria:
  - Only fields available at prediction time are required inputs (excludes flight duration and other post-flight-only data).
  - Backend validates all required fields are present and within expected ranges/types before invoking the model.
  - Feature list and order are read from a central config, not hardcoded in frontend or backend business logic.

**FR-PRED-02: Generate Prediction**
- Acceptance Criteria:
  - Backend applies the correct scaler/encoders matching the active model version.
  - Model returns a failure probability between 0 and 1 (or 0–100%).
  - Risk level is derived from probability using configurable thresholds (LOW/MEDIUM/HIGH).

**FR-PRED-03: Store & Display Prediction**
- Acceptance Criteria:
  - Prediction is stored with: drone ID, input snapshot (JSON), probability, risk level, model version, timestamp.
  - Result is displayed to the user immediately after submission with drone name, probability, risk level, and a recommendation message.

**FR-PRED-04: High-Risk Alert Trigger**
- Acceptance Criteria: When risk level = HIGH, a notification record is automatically created for the drone's owner.

**FR-PRED-05: Prediction History**
- Acceptance Criteria: All predictions for a drone are viewable in chronological order from the drone's details page and a global Predictions page.

### 3.5 Dashboard

**FR-DASH-01: Fleet Overview**
- Acceptance Criteria: Dashboard shows total drones, active drones, drones requiring attention, high-risk drones, upcoming maintenance count, recent predictions, and recent alerts — using live data, refreshed on load.

### 3.6 Notifications

**FR-NOTIF-01: Notification Creation**
- Acceptance Criteria: Notifications are created automatically for: high-risk prediction, maintenance due, maintenance overdue, drone status change.

**FR-NOTIF-02: Notification Center**
- Acceptance Criteria: User can view all notifications, mark individually or all as read, filter (e.g., unread only), and see timestamps. Clicking a notification navigates to the related record.

### 3.7 Maintenance & Reminders

**FR-MAINT-01: Create/Edit Maintenance Record**
- Acceptance Criteria: Record includes drone, type, date, status, description, technician, cost, notes. Status transitions follow: Scheduled → In Progress → Completed, or → Cancelled; overdue is computed automatically based on date + status.

**FR-MAINT-02: Complete Maintenance**
- Acceptance Criteria: Marking complete sets `completed_date`, updates status, and can update the related drone's health status.

**FR-REM-01: Reminder Generation**
- Acceptance Criteria: System automatically generates reminders at defined intervals before a scheduled maintenance date (e.g., 7 days, 1 day) and flags overdue maintenance without requiring the user to check manually.

### 3.8 Analytics

**FR-ANLY-01: Fleet & Flight Statistics**
- Acceptance Criteria: Analytics page displays at minimum: risk distribution across the fleet, prediction volume over time, and maintenance completion rate, using only real stored data (no placeholder/mock data in production).

### 3.9 Profile & Account

**FR-PROF-01: View/Edit Profile**
- Acceptance Criteria: User can view and update full name and change password (with current-password confirmation).

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | All passwords hashed with a strong algorithm (e.g., bcrypt/argon2); never logged or returned in API responses |
| NFR-02 | Security | All non-auth endpoints require a valid token; users can only access their own data |
| NFR-03 | Security | Secrets/credentials stored only in environment variables, never committed to source control |
| NFR-04 | Availability | Backend must load the ANN model once at startup and reuse it, not reload per request |
| NFR-05 | Performance | Prediction requests should return a result within a few seconds under normal load (exact SLA TBD) |
| NFR-06 | Usability | All data-driven views must handle loading, empty, and error states explicitly (no blank/broken screens) |
| NFR-07 | Data Integrity | Deleting/deactivating a drone must not delete its historical flights, predictions, or maintenance records |
| NFR-08 | Maintainability | The ML feature list/order must be defined in one central, versioned location, not duplicated across frontend/backend |
| NFR-09 | Portability | Frontend, backend, and database must be deployable and runnable independently (e.g., via Docker) |
| NFR-10 | Auditability | Key actions (login, drone changes, predictions, maintenance completion) must be recorded in the activity log |
| NFR-11 | Honesty in Claims | The system must not present features as "real-time" or "explainable AI" unless actually implemented |

---

## 5. Traceability (BRD → SRS)

| BRD Requirement | Related SRS Requirement(s) |
|---|---|
| BR-01 (secure account/login) | FR-AUTH-01 to FR-AUTH-05 |
| BR-02 (manage drones) | FR-DRONE-01 to FR-DRONE-05 |
| BR-03 (flight/telemetry records) | FR-FLIGHT-01, FR-FLIGHT-02 |
| BR-04, BR-05 (AI prediction) | FR-PRED-01 to FR-PRED-05 |
| BR-06 (prediction history) | FR-PRED-05 |
| BR-07 (high-risk alerts) | FR-PRED-04, FR-NOTIF-01 |
| BR-08, BR-09 (maintenance) | FR-MAINT-01, FR-MAINT-02, FR-REM-01 |
| BR-10 (dashboard) | FR-DASH-01 |
| BR-11 (drone health status) | FR-DRONE-05, FR-MAINT-02 |
| BR-12 (data protection) | NFR-01 to NFR-03 |
| BR-13 (deployable system) | NFR-04, NFR-09 |

---

## 6. Open Items Carried Forward

These remain unresolved and must be confirmed before development (see also System Specification, Section 29):
- Exact password complexity rules and reset-token expiry window
- ~~Exact HIGH/MEDIUM/LOW probability thresholds~~ — resolved for Phase 6:
  MEDIUM at probability > 0.5, HIGH at probability > 0.7 (or battery ≤ 5%
  regardless of probability), carried over unchanged from the existing
  DRONE_CARE_ANN_APP.py reference behavior. See `app/core/ml_config.py`.
  Revisit if the business sets different thresholds.
- Whether registration auto-logs the user in or requires a separate login step
- Failed-login lockout/rate-limit thresholds
- Prediction response-time SLA
