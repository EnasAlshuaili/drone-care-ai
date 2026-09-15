# Database

PostgreSQL is provisioned via `docker-compose.yml` (service `db`) for local
development. The schema itself is **not** implemented in Phase 1 — this
directory is a placeholder for the next phase.

## Planned contents (next phase)

- `migrations/` — Alembic migration scripts for the 8 documented MVP entities:
  `users`, `drones`, `flights`, `predictions`, `maintenance_records`,
  `reminders`, `notifications`, `activity_log` (per `DRONECARE_DATA_DICTIONARY.md`).

No additional tables (e.g. separate `telemetry`, `roles`, or
`maintenance_schedules` tables) are created unless the open decisions in
`DRONECARE_SYSTEM_SPECIFICATION.md` (Section 29) are resolved in favor of
splitting them out.
