# Business Requirements Document (BRD)
## DroneCare — AI-Powered Drone Fleet Health & Maintenance Platform

**Document Version:** 1.0
**Status:** Draft

---

## 1. Purpose

This document defines the business requirements for redesigning DroneCare from its current Streamlit prototype into a complete, production-oriented, full-stack web application. It captures the business need, objectives, scope, users, and high-level requirements. It does not define technical implementation details (see the separate technical specification for architecture, database, and API design).

## 2. Business Problem

DroneCare currently exists as a Streamlit prototype used to demonstrate an ANN-based failure-prediction model. In its current form it:
- Is not a persistent, multi-user system
- Has no authentication or account management
- Has no database to store drones, flights, predictions, or maintenance history
- Has no notification or reminder capability
- Cannot be deployed as a real product for drone operators or organizations

Drone operators need a reliable, always-available platform to track drone health, anticipate failures before they happen, and manage maintenance — rather than a local demo tool.

## 3. Business Objectives

- Convert the ML prototype into a deployable, production-grade web platform
- Enable drone operators to manage multiple drones and their full operational history
- Provide AI-driven failure-risk predictions using only data available at prediction time
- Reduce drone downtime and failures through proactive maintenance and alerts
- Establish a foundation that can scale to multiple users, organizations, and roles

## 4. Scope

**In Scope (MVP):**
- User authentication and account management
- Drone management (add/edit/view/deactivate)
- Flight and telemetry record keeping
- AI failure-risk prediction (using the existing ANN model as the prediction engine)
- Prediction history
- Fleet health dashboard
- Notifications for high-risk predictions and maintenance events
- Maintenance record management and reminders

**Out of Scope (Future Phases):**
- Live/real-time telemetry ingestion or IoT integration
- SHAP/explainable-AI feature importance
- Email/SMS delivery of notifications
- Multi-organization support and advanced role-based access control
- Mobile application
- Automatic model retraining or multiple competing ML models

**Explicitly Not Part of This Phase:**
- No changes to the existing Streamlit app
- No changes to the current ANN model, scaler, or encoders
- No code implementation — this phase is planning/specification only

## 5. Target Users

| Role | Description | Included in MVP? |
|---|---|---|
| Drone Operator | Primary user; manages own drones, flights, predictions, maintenance | Yes |
| Administrator | Manages system-level settings | Future |
| Maintenance Technician | Performs and logs maintenance | Future |
| Organization Manager | Oversees multiple operators/drones | Future |

## 6. Business Requirements

| ID | Requirement |
|---|---|
| BR-01 | Users must be able to create an account and log in securely |
| BR-02 | Users must be able to manage (add, view, edit, deactivate) multiple drones |
| BR-03 | Users must be able to record flight and telemetry data per drone |
| BR-04 | The system must generate an AI-based failure-risk prediction using only data available at the time of prediction (not post-flight data such as flight duration) |
| BR-05 | Each prediction must display a failure probability, a risk level (LOW/MEDIUM/HIGH), and be traceable to a specific drone and timestamp |
| BR-06 | Predictions and their history must be permanently stored and viewable per drone |
| BR-07 | High-risk predictions must be capable of generating an alert/notification |
| BR-08 | Users must be able to create, schedule, update, and complete maintenance records per drone |
| BR-09 | The system must notify users of upcoming and overdue maintenance |
| BR-10 | Users must have a dashboard summarizing fleet health, active drones, high-risk drones, and upcoming maintenance |
| BR-11 | Each drone must have an overall health status (Healthy / Warning / Critical / Maintenance) based on documented rules |
| BR-12 | The system must protect all user data behind authentication and authorization |
| BR-13 | The system must be deployable as an independent, persistent web application (not a local prototype) |

## 7. Assumptions

- The existing ANN model, scaler, and encoders are usable as the initial prediction engine, pending validation
- The final prediction feature set may change once the ML pipeline is finalized; the system must not hardcode it
- Users have internet access and a modern web browser
- Initial rollout is single-user/single-organization; multi-tenant support comes later

## 8. Constraints

- Prediction inputs must only use data operationally available before/at the time of prediction — not data only known after a flight completes (e.g., flight duration)
- The current ML artifacts (model, scaler, encoders) must not be modified or replaced during this phase
- The current Streamlit application must remain untouched during this phase
- No production deployment, commit, or push is authorized as part of this phase

## 9. Success Criteria

- A documented specification exists that fully defines the target system before any code is written
- The MVP feature set (auth, drone management, flight records, predictions, dashboard, notifications, maintenance) is clearly defined and agreed upon
- Stakeholders have explicitly confirmed all open decisions before implementation begins
- The resulting system, once built, is a deployable, persistent, multi-page web application — not a Streamlit demo

## 10. Open Decisions (Require Confirmation Before Implementation)

- Final confirmed feature set/order for the ANN model's inputs
- Whether the current ANN model/artifacts are approved for production use or require retraining
- Exact risk-level thresholds (LOW/MEDIUM/HIGH) for failure probability
- Choice of hosting/deployment environment for frontend, backend, and database
- Whether email notifications are required for MVP or deferred to a future phase
- Initial user role scope (single role vs. introducing Admin/Technician roles at MVP)

## 11. Related Documents

- `DRONECARE_SYSTEM_SPECIFICATION.md` — full technical specification covering architecture, database design, API design, and development phases (separate document)
