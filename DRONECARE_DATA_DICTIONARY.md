# DroneCare Data Dictionary

**Version:** 1.0
**Status:** Draft — field-level definitions for the schema introduced in `DRONECARE_SYSTEM_SPECIFICATION.md`. Types are proposed (PostgreSQL-oriented) and may be refined during implementation.

---

## Table: `users`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique user identifier |
| full_name | VARCHAR(150) | Yes | User's full name |
| email | VARCHAR(255) | Yes, unique | Login identifier; must be a valid email format |
| password_hash | VARCHAR(255) | Yes | Hashed password (never plaintext) |
| role | VARCHAR(30) | Yes | MVP default: `drone_operator`; future values: `admin`, `technician`, `org_manager` |
| created_at | TIMESTAMP | Yes | Account creation time |
| updated_at | TIMESTAMP | Yes | Last profile update time |

---

## Table: `drones`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique drone identifier |
| user_id | UUID (FK → users.id) | Yes | Owning user |
| name | VARCHAR(100) | Yes | Display name for the drone |
| serial_number | VARCHAR(100) | Yes, unique per user | Manufacturer serial number / asset tag |
| manufacturer | VARCHAR(100) | No | e.g., DJI, Autel |
| model | VARCHAR(100) | No | Drone model name |
| drone_size | VARCHAR(30) | No | e.g., Small, Medium, Large — exact category list TBD |
| propeller_count | INTEGER | No | Number of propellers |
| max_carry_weight | FLOAT (kg) | No | Maximum rated payload capacity |
| purchase_date | DATE | No | Date drone was acquired |
| status | VARCHAR(20) | Yes | `active`, `inactive`, `maintenance`, `retired` |
| health_status | VARCHAR(20) | Yes | `Healthy`, `Warning`, `Critical`, `Maintenance` (derived, see health rules) |
| created_at | TIMESTAMP | Yes | Record creation time |
| updated_at | TIMESTAMP | Yes | Last update time |

---

## Table: `flights`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique flight record identifier |
| drone_id | UUID (FK → drones.id) | Yes | Drone that performed the flight |
| flight_datetime | TIMESTAMP | Yes | Date/time the flight occurred |
| application | VARCHAR(50) | No | Use case, e.g., Survey, Delivery, Inspection |
| altitude | FLOAT (m) | No | Flight altitude |
| flight_duration | FLOAT (minutes) | No | **Known only after flight** — historical field only, never a prediction input |
| distance_flown | FLOAT (m or km — unit TBD) | No | Total distance covered |
| battery_remaining | FLOAT (%) | No | Battery remaining, 0–100 |
| gps_accuracy | FLOAT (m) | No | GPS positional accuracy |
| wind_speed | FLOAT (km/h or m/s — unit TBD) | No | Recorded wind speed during flight |
| obstacles_encountered | BOOLEAN | No | Whether obstacles were encountered |
| payload_type | VARCHAR(50) | No | Type of payload carried |
| actual_carry_weight | FLOAT (kg) | No | Actual payload weight carried |
| flight_status | VARCHAR(20) | Yes | `completed`, `aborted`, `incident` |
| created_at | TIMESTAMP | Yes | Record creation time |

---

## Table: `predictions`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique prediction identifier |
| drone_id | UUID (FK → drones.id) | Yes | Drone the prediction relates to |
| flight_id | UUID (FK → flights.id) | No | Optional link if the prediction relates to a specific logged flight |
| input_features | JSONB | Yes | Snapshot of exact feature values submitted (for historical traceability) |
| failure_probability | FLOAT (0–1) | Yes | Raw model output probability |
| risk_level | VARCHAR(10) | Yes | `LOW`, `MEDIUM`, `HIGH` — derived via configurable thresholds |
| model_version | VARCHAR(50) | Yes | Identifier tying prediction to exact model/scaler/encoder version |
| created_at | TIMESTAMP | Yes | Prediction timestamp |

**Prediction input features (provisional — pending pipeline confirmation):**
Propeller Count, Max Carry Weight, Drone Size, Altitude, Battery Remaining, Payload Type, Application, Actual Carry Weight, GPS Accuracy, Drone Model, Distance Flown, Wind Speed, Obstacles Encountered.
*(Flight Duration is explicitly excluded as a required prediction input since it is only known post-flight.)*

---

## Table: `maintenance_records`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique maintenance record identifier |
| drone_id | UUID (FK → drones.id) | Yes | Drone being maintained |
| maintenance_type | VARCHAR(50) | Yes | e.g., Battery inspection, Motor service, General inspection |
| scheduled_date | DATE | No | Planned maintenance date |
| completed_date | DATE | No | Actual completion date |
| status | VARCHAR(20) | Yes | `Scheduled`, `In Progress`, `Completed`, `Overdue`, `Cancelled` |
| technician | VARCHAR(100) | No | Name/identifier of technician performing work |
| cost | DECIMAL(10,2) | No | Cost of maintenance |
| notes | TEXT | No | Free-text notes |
| created_at | TIMESTAMP | Yes | Record creation time |
| updated_at | TIMESTAMP | Yes | Last update time |

---

## Table: `reminders`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique reminder identifier |
| drone_id | UUID (FK → drones.id) | Yes | Related drone |
| maintenance_id | UUID (FK → maintenance_records.id) | No | Related maintenance record, if applicable |
| reminder_type | VARCHAR(50) | Yes | e.g., `maintenance_due_7d`, `maintenance_due_1d`, `maintenance_overdue`, `inspection_reminder` |
| due_date | DATE | Yes | Date the reminder pertains to |
| status | VARCHAR(20) | Yes | `pending`, `sent`, `dismissed` |
| created_at | TIMESTAMP | Yes | Reminder creation time |

---

## Table: `notifications`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique notification identifier |
| user_id | UUID (FK → users.id) | Yes | Recipient |
| type | VARCHAR(50) | Yes | e.g., `high_risk_prediction`, `maintenance_due`, `maintenance_overdue`, `status_change` |
| title | VARCHAR(150) | Yes | Short notification headline |
| message | TEXT | Yes | Full notification message |
| is_read | BOOLEAN | Yes | Default `false` |
| related_entity_id | UUID | No | ID of the related drone/prediction/maintenance record |
| related_entity_type | VARCHAR(30) | No | `drone`, `prediction`, `maintenance` |
| created_at | TIMESTAMP | Yes | Notification creation time |

---

## Table: `activity_log`

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID (PK) | Yes | Unique log entry identifier |
| user_id | UUID (FK → users.id) | Yes | User who performed the action |
| action | VARCHAR(100) | Yes | e.g., `user_login`, `drone_created`, `prediction_generated`, `maintenance_completed` |
| metadata | JSONB | No | Additional structured context about the action |
| created_at | TIMESTAMP | Yes | Time the action occurred |

---

## Notes on Units & Conventions

- All timestamps stored in UTC.
- All monetary values use `DECIMAL` (never floating point) to avoid rounding errors.
- Percentage fields (e.g., `battery_remaining`, `failure_probability`) — confirm consistently whether stored as 0–1 or 0–100 before implementation (currently mixed conventions across tables; **flagged as an open decision**).
- Units for `distance_flown` and `wind_speed` (metric vs. imperial) are not yet finalized — **open decision**.

## Open Decisions Carried Forward

- Standardize probability/percentage representation (0–1 vs 0–100) across `battery_remaining` and `failure_probability`.
- Finalize units for distance and wind speed (metric vs. imperial).
- Confirm categorical value lists for `drone_size`, `payload_type`, `application`, and `maintenance_type` (enums vs. free text vs. lookup tables).
- Confirm whether `telemetry` should be split into its own table for future raw/high-frequency data, separate from `flights`.
