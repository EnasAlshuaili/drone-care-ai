"""
Reminder generation (SRS §3.7 FR-REM-01; Data Dictionary `reminders` table;
System Specification §15, §27 Phase 10).

This project has no background job runner (no Celery/APScheduler/cron) —
adding one is explicitly out of scope ("do not expand into unrelated
scheduling infrastructure"). generate_due_reminders_for_user() is the
request-time stand-in for System Specification §15's "backend scheduler
process": it is called at the top of the reminders/maintenance/analytics-
summary endpoints (see app/api/v1/reminders.py, app/api/v1/maintenance.py,
app/services/analytics_service.py) so reminders and their paired
notifications are always caught up by the time a user looks at them,
without an actual background process.

Rules (System Specification §15 — "Maintenance due in 7 days", "due
tomorrow", "overdue"): each open (Scheduled/In Progress/Overdue)
maintenance record with a scheduled_date is checked once per call:
  - 0-7 days out (inclusive) -> ensure a 'maintenance_due_7d' reminder exists
  - 0-1 days out (inclusive) -> ensure a 'maintenance_due_1d' reminder exists
  - already past due            -> ensure a 'maintenance_overdue' reminder exists
A record can accumulate more than one of these over its lifetime (a
due-in-7-days reminder and a later due-tomorrow reminder are two genuinely
different alerts) but never the same (maintenance_id, reminder_type) pair
twice — enforced first by an existence check here, and backstopped by the
DB unique constraint on Reminder (see app/models/reminder.py). Each newly
created reminder immediately gets a paired Notification (System
Specification §15: reminders are "surfaced through the Notification
Center") via notification_service, and is marked 'sent' at that point —
this project has no separate delivery step, so creation and delivery are
the same instant.

`inspection_reminder` (battery/motor/general — System Specification §15)
is intentionally NOT generated here: no rule anywhere in the SRS, BRD, or
Data Dictionary defines what triggers it (unlike the three maintenance-tied
types above, which have explicit day thresholds), so inventing one would
be scope creep beyond what Phase 10 actually specifies.
"""

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.drone import Drone
from app.models.maintenance_record import MaintenanceRecord
from app.models.reminder import Reminder
from app.services import maintenance_service, notification_service

DEFAULT_LIMIT = 50
MAX_LIMIT = 200

REMINDER_DUE_7D = "maintenance_due_7d"
REMINDER_DUE_1D = "maintenance_due_1d"
REMINDER_OVERDUE = "maintenance_overdue"

DUE_SOON_WINDOW_DAYS = 7
DUE_TOMORROW_WINDOW_DAYS = 1


def _reminder_exists(db: Session, maintenance_id: uuid.UUID, reminder_type: str) -> bool:
    return (
        db.scalar(
            select(Reminder.id).where(
                Reminder.maintenance_id == maintenance_id, Reminder.reminder_type == reminder_type
            )
        )
        is not None
    )


def _create_reminder_and_notify(
    db: Session, drone: Drone, maintenance: MaintenanceRecord, reminder_type: str, days_until: int
) -> Reminder:
    reminder = Reminder(
        drone_id=drone.id,
        maintenance_id=maintenance.id,
        reminder_type=reminder_type,
        due_date=maintenance.scheduled_date,
        status="pending",
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    if reminder_type == REMINDER_OVERDUE:
        notification_service.notify_maintenance_overdue(db, drone, maintenance)
    else:
        notification_service.notify_maintenance_due(db, drone, maintenance, days_until)

    reminder.status = "sent"
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


def generate_due_reminders_for_user(db: Session, owner_id: uuid.UUID) -> list[Reminder]:
    """Recomputes overdue status first (so a record that just crossed its
    scheduled_date is reminded as overdue, not merely "due"), then creates
    any reminders that are now due and haven't been created before.
    Returns the reminders newly created by this call."""
    maintenance_service.recompute_overdue_for_user(db, owner_id)

    today = date.today()
    stmt = (
        select(MaintenanceRecord, Drone)
        .join(Drone, MaintenanceRecord.drone_id == Drone.id)
        .where(
            Drone.user_id == owner_id,
            MaintenanceRecord.status.in_(
                (*maintenance_service.OPEN_STATUSES, maintenance_service.STATUS_OVERDUE)
            ),
            MaintenanceRecord.scheduled_date.is_not(None),
        )
    )

    created: list[Reminder] = []
    for record, drone in db.execute(stmt).all():
        days_until = (record.scheduled_date - today).days

        if days_until < 0 and not _reminder_exists(db, record.id, REMINDER_OVERDUE):
            created.append(_create_reminder_and_notify(db, drone, record, REMINDER_OVERDUE, days_until))
            continue

        if 0 <= days_until <= DUE_TOMORROW_WINDOW_DAYS and not _reminder_exists(db, record.id, REMINDER_DUE_1D):
            created.append(_create_reminder_and_notify(db, drone, record, REMINDER_DUE_1D, days_until))

        if 0 <= days_until <= DUE_SOON_WINDOW_DAYS and not _reminder_exists(db, record.id, REMINDER_DUE_7D):
            created.append(_create_reminder_and_notify(db, drone, record, REMINDER_DUE_7D, days_until))

    return created


def list_active_reminders_for_user(
    db: Session, owner_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[Reminder], int]:
    """'Active' (System Specification §11: "List active reminders") means
    not yet dismissed — a reminder is dismissed automatically when its
    maintenance record is completed or cancelled (see
    maintenance_service._dismiss_reminders_for_maintenance)."""
    base = (
        select(Reminder)
        .join(Drone, Reminder.drone_id == Drone.id)
        .where(Drone.user_id == owner_id, Reminder.status != "dismissed")
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(Reminder.due_date.asc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total or 0
