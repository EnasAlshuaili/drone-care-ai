"""
Dashboard & Analytics aggregation queries (SRS §3.5 FR-DASH-01, §3.8
FR-ANLY-01; System Specification §27 Phases 8, 10).

Every query here is scoped directly to the requesting user's own drones
(Drone.user_id == owner_id) — there is no client-supplied resource id to
check ownership against, unlike flights/predictions, so there is no
ensure_owner() call here (see app/services/authorization.py); scoping
happens inside the query itself, the same pattern prediction_service's
list_predictions_for_user / flight_service's list_flights_for_user already
use.

"Current risk" for a drone is the risk_level of its most recent Prediction
row, if any. This is a deliberately simple, transparent definition — not
the full Drone Health Model (System Specification §18), whose scoring rules
remain an explicit open decision (§29) and are out of scope for this phase;
Drone.health_status itself is untouched.

Phase 10: get_dashboard_summary() recomputes overdue maintenance status
first (maintenance_service.recompute_overdue_for_user) so
upcoming_maintenance_count never counts a record that has actually already
lapsed into Overdue.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models.drone import Drone
from app.models.flight import Flight
from app.models.maintenance_record import MaintenanceRecord
from app.models.prediction import Prediction
from app.services import maintenance_service, prediction_service

RECENT_PREDICTIONS_LIMIT = 5
DEFAULT_VOLUME_DAYS = 30


def _latest_risk_subquery():
    """One row per drone_id: the risk_level of that drone's most recent
    prediction (rn == 1 after ordering each drone's predictions newest
    first)."""
    ranked = select(
        Prediction.drone_id,
        Prediction.risk_level,
        func.row_number()
        .over(partition_by=Prediction.drone_id, order_by=Prediction.created_at.desc())
        .label("rn"),
    ).subquery()
    return select(ranked.c.drone_id, ranked.c.risk_level).where(ranked.c.rn == 1).subquery()


def get_dashboard_summary(db: Session, owner_id: uuid.UUID) -> dict:
    maintenance_service.recompute_overdue_for_user(db, owner_id)

    drones = list(db.scalars(select(Drone).where(Drone.user_id == owner_id)).all())
    total_drones = len(drones)
    active_drones = sum(1 for d in drones if d.status == "active")

    latest_risk = _latest_risk_subquery()
    risk_rows = db.execute(
        select(Drone.id, latest_risk.c.risk_level)
        .select_from(Drone)
        .join(latest_risk, latest_risk.c.drone_id == Drone.id, isouter=True)
        .where(Drone.user_id == owner_id)
    ).all()
    risk_by_drone_id = {drone_id: risk_level for drone_id, risk_level in risk_rows}

    high_risk_drones = sum(1 for r in risk_by_drone_id.values() if r == "HIGH")
    drones_requiring_attention = sum(
        1
        for d in drones
        if d.status == "active" and risk_by_drone_id.get(d.id) in ("HIGH", "MEDIUM")
    )

    total_flights = (
        db.scalar(
            select(func.count())
            .select_from(Flight)
            .join(Drone, Flight.drone_id == Drone.id)
            .where(Drone.user_id == owner_id)
        )
        or 0
    )

    total_predictions = (
        db.scalar(
            select(func.count())
            .select_from(Prediction)
            .join(Drone, Prediction.drone_id == Drone.id)
            .where(Drone.user_id == owner_id)
        )
        or 0
    )

    recent_predictions, _ = prediction_service.list_predictions_for_user(
        db, owner_id, limit=RECENT_PREDICTIONS_LIMIT, offset=0
    )

    upcoming_maintenance_count = (
        db.scalar(
            select(func.count())
            .select_from(MaintenanceRecord)
            .join(Drone, MaintenanceRecord.drone_id == Drone.id)
            .where(Drone.user_id == owner_id, MaintenanceRecord.status.in_(maintenance_service.OPEN_STATUSES))
        )
        or 0
    )

    return {
        "total_drones": total_drones,
        "active_drones": active_drones,
        "drones_requiring_attention": drones_requiring_attention,
        "high_risk_drones": high_risk_drones,
        "total_flights": total_flights,
        "total_predictions": total_predictions,
        "upcoming_maintenance_count": upcoming_maintenance_count,
        "recent_predictions": recent_predictions,
    }


def get_risk_distribution(db: Session, owner_id: uuid.UUID) -> list[dict]:
    latest_risk = _latest_risk_subquery()
    rows = db.execute(
        select(latest_risk.c.risk_level, func.count(Drone.id))
        .select_from(Drone)
        .join(latest_risk, latest_risk.c.drone_id == Drone.id, isouter=True)
        .where(Drone.user_id == owner_id)
        .group_by(latest_risk.c.risk_level)
    ).all()
    return [{"risk_level": risk_level or "NONE", "drone_count": count} for risk_level, count in rows]


def get_prediction_volume(db: Session, owner_id: uuid.UUID, days: int = DEFAULT_VOLUME_DAYS) -> list[dict]:
    day_col = cast(Prediction.created_at, Date)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(day_col, func.count())
        .select_from(Prediction)
        .join(Drone, Prediction.drone_id == Drone.id)
        .where(Drone.user_id == owner_id, Prediction.created_at >= cutoff)
        .group_by(day_col)
        .order_by(day_col)
    )
    rows = db.execute(stmt).all()
    return [{"date": day, "count": count} for day, count in rows]


def get_maintenance_stats(db: Session, owner_id: uuid.UUID) -> dict:
    """FR-ANLY-01 "maintenance completion rate" (Phase 10)."""
    maintenance_service.recompute_overdue_for_user(db, owner_id)

    rows = db.execute(
        select(MaintenanceRecord.status, func.count())
        .select_from(MaintenanceRecord)
        .join(Drone, MaintenanceRecord.drone_id == Drone.id)
        .where(Drone.user_id == owner_id)
        .group_by(MaintenanceRecord.status)
    ).all()
    counts = {status: count for status, count in rows}

    completed = counts.get("Completed", 0)
    cancelled = counts.get("Cancelled", 0)
    scheduled = counts.get("Scheduled", 0)
    in_progress = counts.get("In Progress", 0)
    overdue = counts.get("Overdue", 0)
    total = completed + cancelled + scheduled + in_progress + overdue

    completion_rate = round(100 * completed / total, 1) if total > 0 else None

    return {
        "total": total,
        "completed": completed,
        "cancelled": cancelled,
        "scheduled": scheduled,
        "in_progress": in_progress,
        "overdue": overdue,
        "completion_rate": completion_rate,
    }
