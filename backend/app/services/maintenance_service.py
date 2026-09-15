"""
Maintenance Records data-access and business logic (SRS §3.7 FR-MAINT-01/02;
System Specification §16, §27 Phase 10).

Maintenance records have no direct user_id column — ownership is transitive
through the owning drone (MaintenanceRecord.drone_id -> Drone.user_id),
exactly like Flight/Prediction; callers must already have resolved and
checked the drone via drone_service.get_drone_or_404() + ensure_owner()
before calling into this module (see app/api/v1/maintenance.py).

Status transitions (System Specification §16): Scheduled -> In Progress ->
Completed, or -> Cancelled. Completed and Cancelled are terminal — neither
can be transitioned out of via update_maintenance_record. "Overdue" is
never client-settable (see app/schemas/maintenance.py); it is only reached
via recompute_overdue_for_user(), the request-time stand-in for the "scheduler"
System Specification §27 Phase 10 names, since this project has no
background job runner — see reminder_service.py for the same approach.

FR-MAINT-02: completing a record sets completed_date, and resets the
drone's health_status to "Healthy". This is a narrow, single-event action,
not a resolution of the full Drone Health Model (System Specification
§18/§29, still an open decision) — it does not compute health from any
other signal (predictions, other maintenance), only reacts to this one
completion event, which can only ever plausibly improve health.
"""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.drone import Drone
from app.models.maintenance_record import MaintenanceRecord
from app.models.reminder import Reminder
from app.schemas.maintenance import MaintenanceCreate, MaintenanceStatus, MaintenanceUpdate

DEFAULT_LIMIT = 50
MAX_LIMIT = 200

TERMINAL_STATUSES = {MaintenanceStatus.completed.value, MaintenanceStatus.cancelled.value}
OPEN_STATUSES = (MaintenanceStatus.scheduled.value, MaintenanceStatus.in_progress.value)
STATUS_OVERDUE = "Overdue"


def create_maintenance_record(db: Session, drone_id: uuid.UUID, data: MaintenanceCreate) -> MaintenanceRecord:
    fields = data.model_dump(exclude={"drone_id"})
    fields["status"] = fields["status"].value if hasattr(fields["status"], "value") else fields["status"]
    record = MaintenanceRecord(drone_id=drone_id, **fields)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_maintenance_for_drone(
    db: Session, drone_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[MaintenanceRecord], int]:
    """Caller must already have verified the drone belongs to the current user."""
    base = select(MaintenanceRecord).where(MaintenanceRecord.drone_id == drone_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(MaintenanceRecord.scheduled_date.desc().nulls_last()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def list_maintenance_for_user(
    db: Session, owner_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[MaintenanceRecord], int]:
    """All maintenance records across every drone owned by the current user."""
    base = (
        select(MaintenanceRecord)
        .join(Drone, MaintenanceRecord.drone_id == Drone.id)
        .where(Drone.user_id == owner_id)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(MaintenanceRecord.scheduled_date.desc().nulls_last()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def get_maintenance_or_404(db: Session, maintenance_id: uuid.UUID) -> MaintenanceRecord:
    record = db.get(MaintenanceRecord, maintenance_id)
    if record is None:
        raise NotFoundError("Maintenance record not found.")
    return record


def update_maintenance_record(
    db: Session, record: MaintenanceRecord, drone: Drone, data: MaintenanceUpdate
) -> MaintenanceRecord:
    if record.status in TERMINAL_STATUSES:
        raise ConflictError(f"Maintenance record is already '{record.status}' and cannot be changed.")

    updates = data.model_dump(exclude_unset=True)
    new_status = updates.get("status")
    if new_status is not None:
        new_status = new_status.value if hasattr(new_status, "value") else new_status
        updates["status"] = new_status

    if new_status == MaintenanceStatus.completed.value and updates.get("completed_date") is None and record.completed_date is None:
        updates["completed_date"] = date.today()

    for field, value in updates.items():
        setattr(record, field, value)

    db.add(record)
    db.commit()
    db.refresh(record)

    if new_status == MaintenanceStatus.completed.value:
        drone.health_status = "Healthy"
        db.add(drone)
        db.commit()
        db.refresh(drone)
        _dismiss_reminders_for_maintenance(db, record.id)
    elif new_status == MaintenanceStatus.cancelled.value:
        _dismiss_reminders_for_maintenance(db, record.id)

    return record


def _dismiss_reminders_for_maintenance(db: Session, maintenance_id: uuid.UUID) -> None:
    """Once a maintenance record is completed or cancelled, its due/overdue
    reminders are no longer relevant — dismiss them so the Notification
    Center / reminders list doesn't keep surfacing stale alerts."""
    pending = list(
        db.scalars(
            select(Reminder).where(
                Reminder.maintenance_id == maintenance_id, Reminder.status != "dismissed"
            )
        ).all()
    )
    for reminder in pending:
        reminder.status = "dismissed"
        db.add(reminder)
    if pending:
        db.commit()


def recompute_overdue_for_user(db: Session, owner_id: uuid.UUID) -> list[MaintenanceRecord]:
    """The request-time stand-in for System Specification §27 Phase 10's
    'scheduler' (see module docstring): flips any of this user's open
    (Scheduled/In Progress) records whose scheduled_date has passed to
    'Overdue'. Returns the records that were just flipped, so callers can
    feed them to reminder generation without a second query."""
    today = date.today()
    stmt = (
        select(MaintenanceRecord)
        .join(Drone, MaintenanceRecord.drone_id == Drone.id)
        .where(
            Drone.user_id == owner_id,
            MaintenanceRecord.status.in_(OPEN_STATUSES),
            MaintenanceRecord.scheduled_date.is_not(None),
            MaintenanceRecord.scheduled_date < today,
        )
    )
    newly_overdue = list(db.scalars(stmt).all())
    for record in newly_overdue:
        record.status = STATUS_OVERDUE
        db.add(record)
    if newly_overdue:
        db.commit()
        for record in newly_overdue:
            db.refresh(record)
    return newly_overdue
