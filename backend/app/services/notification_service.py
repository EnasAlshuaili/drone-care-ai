"""
Notification Center data-access and business logic (SRS §3.6 FR-NOTIF-01/02,
FR-PRED-04, FR-REM-01, BR-07, BR-09; System Specification §27 Phases 9-10).

Notifications have a direct user_id column (unlike flights/predictions,
which are owned transitively through a drone) — every function here that
lists/mutates a user's notifications scopes directly by user_id, the same
pattern app/services/analytics_service.py already uses. A caller addressing
one notification by id must still resolve it and run ensure_owner() itself,
exactly like the flights/predictions pattern (see app/api/v1/notifications.py).

Triggers (all four from FR-NOTIF-01's acceptance criteria are now covered):
  - high-risk prediction     (FR-PRED-04, BR-07)  — notify_high_risk_prediction()
  - drone status change      (FR-NOTIF-01)         — notify_drone_status_change()
  - maintenance due          (FR-NOTIF-01, BR-09)  — notify_maintenance_due()      [Phase 10]
  - maintenance overdue      (FR-NOTIF-01, BR-09)  — notify_maintenance_overdue()  [Phase 10]

The two maintenance triggers are called only from
app/services/reminder_service.py, and only at the moment a new Reminder row
is first created — reminder_service's own existence check (backed by the DB
unique constraint on (maintenance_id, reminder_type), see
app/models/reminder.py) is what prevents a duplicate notification for a
maintenance event that was already reminded about; this module does not
re-implement that check. This is still one notification system (System
Specification §27 Phase 10, Step 8: "do NOT create a second notification
system") — reminder_service is a caller, not a fork, of this module.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.drone import Drone
from app.models.maintenance_record import MaintenanceRecord
from app.models.notification import Notification
from app.models.prediction import Prediction

DEFAULT_LIMIT = 50
MAX_LIMIT = 200

TYPE_HIGH_RISK_PREDICTION = "high_risk_prediction"
TYPE_STATUS_CHANGE = "status_change"
TYPE_MAINTENANCE_DUE = "maintenance_due"
TYPE_MAINTENANCE_OVERDUE = "maintenance_overdue"


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    type_: str,
    title: str,
    message: str,
    related_entity_id: uuid.UUID | None = None,
    related_entity_type: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        message=message,
        related_entity_id=related_entity_id,
        related_entity_type=related_entity_type,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_high_risk_prediction(db: Session, drone: Drone, prediction: Prediction) -> Notification | None:
    """FR-PRED-04 / BR-07: fires once per HIGH-risk Prediction row — each
    submitted prediction is its own real event (a new telemetry snapshot was
    evaluated), so one notification per HIGH-risk prediction is correct, not
    a duplicate, even if the drone was already HIGH-risk before. Callers
    only invoke this when prediction.risk_level == "HIGH" (see
    app/api/v1/predictions.py); this function does not re-check the risk
    level itself, so it never duplicates the ANN/risk-classification logic
    in app/core/ml_config.classify_risk.
    """
    return create_notification(
        db,
        user_id=drone.user_id,
        type_=TYPE_HIGH_RISK_PREDICTION,
        title=f"High risk prediction: {drone.name}",
        message=(
            f"{drone.name} was assessed as HIGH risk "
            f"({prediction.failure_probability:.1%} failure probability). Review before the next flight."
        ),
        related_entity_id=prediction.id,
        related_entity_type="prediction",
    )


def notify_drone_status_change(
    db: Session, drone: Drone, old_status: str, new_status: str
) -> Notification | None:
    """FR-NOTIF-01: fires only when the status actually changes — callers
    (drone_service.update_drone / deactivate_drone) only invoke this after
    confirming old_status != new_status, which is what prevents a duplicate
    notification when the same status is set again (e.g. deactivating an
    already-inactive drone, a no-op update that resubmits the current
    status)."""
    return create_notification(
        db,
        user_id=drone.user_id,
        type_=TYPE_STATUS_CHANGE,
        title=f"Drone status changed: {drone.name}",
        message=f"{drone.name} status changed from '{old_status}' to '{new_status}'.",
        related_entity_id=drone.id,
        related_entity_type="drone",
    )


def notify_maintenance_due(
    db: Session, drone: Drone, maintenance: MaintenanceRecord, days_until: int
) -> Notification | None:
    """FR-NOTIF-01 / BR-09: fires when reminder_service first creates a
    'maintenance_due_7d' or 'maintenance_due_1d' reminder for this
    maintenance record — never called directly from the API layer, so it
    inherits reminder_service's own duplicate-prevention."""
    when = "tomorrow" if days_until <= 1 else f"in {days_until} days"
    return create_notification(
        db,
        user_id=drone.user_id,
        type_=TYPE_MAINTENANCE_DUE,
        title=f"Maintenance due: {drone.name}",
        message=f"{drone.name}'s {maintenance.maintenance_type} is scheduled {when} ({maintenance.scheduled_date}).",
        related_entity_id=maintenance.id,
        related_entity_type="maintenance",
    )


def notify_maintenance_overdue(db: Session, drone: Drone, maintenance: MaintenanceRecord) -> Notification | None:
    """FR-NOTIF-01 / BR-09: fires when reminder_service first creates a
    'maintenance_overdue' reminder for this maintenance record."""
    return create_notification(
        db,
        user_id=drone.user_id,
        type_=TYPE_MAINTENANCE_OVERDUE,
        title=f"Maintenance overdue: {drone.name}",
        message=f"{drone.name}'s {maintenance.maintenance_type} was due {maintenance.scheduled_date} and is now overdue.",
        related_entity_id=maintenance.id,
        related_entity_type="maintenance",
    )


def list_notifications_for_user(
    db: Session,
    user_id: uuid.UUID,
    unread_only: bool = False,
    limit: int = DEFAULT_LIMIT,
    offset: int = 0,
) -> tuple[list[Notification], int, int]:
    base = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        base = base.where(Notification.is_read.is_(False))

    total = db.scalar(select(func.count()).select_from(base.subquery()))
    unread_count = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )

    stmt = base.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total or 0, unread_count or 0


def get_notification_or_404(db: Session, notification_id: uuid.UUID) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None:
        raise NotFoundError("Notification not found.")
    return notification


def mark_read(db: Session, notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        db.add(notification)
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
    """Returns the number of notifications actually flipped to read."""
    unread = list(
        db.scalars(
            select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
        ).all()
    )
    for notification in unread:
        notification.is_read = True
        db.add(notification)
    db.commit()
    return len(unread)
