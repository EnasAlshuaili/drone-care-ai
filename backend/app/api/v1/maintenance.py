"""
Maintenance Record endpoints (SRS §3.7 FR-MAINT-01/02, System Specification
§11 API table: `/maintenance` GET/POST, `/maintenance/{id}` PUT; §27 Phase 10).

Ownership chain: User -> owns Drone -> owns MaintenanceRecord. Every
endpoint resolves the relevant drone and calls the existing ensure_owner()
before touching any maintenance data — never trusting a client-supplied
drone_id or maintenance_id as proof of ownership by itself (same pattern as
app/api/v1/flights.py and app/api/v1/predictions.py).

GET /maintenance and GET /maintenance/{id} both first call
reminder_service.generate_due_reminders_for_user(), the request-time
"scheduler" stand-in (see app/services/reminder_service.py) — this is what
keeps a record's status current (Scheduled/In Progress -> Overdue) and
fires any newly-due reminders/notifications before the response is built,
without a background job.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceListResponse,
    MaintenanceRead,
    MaintenanceUpdate,
)
from app.services import drone_service, maintenance_service, reminder_service
from app.services.authorization import ensure_owner
from app.services.maintenance_service import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.post("", response_model=MaintenanceRead, status_code=201)
def create_maintenance(
    maintenance_in: MaintenanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, maintenance_in.drone_id)
    ensure_owner(drone.user_id, current_user)
    return maintenance_service.create_maintenance_record(db, drone.id, maintenance_in)


@router.get("", response_model=MaintenanceListResponse)
def list_maintenance(
    drone_id: uuid.UUID | None = None,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder_service.generate_due_reminders_for_user(db, current_user.id)
    if drone_id is not None:
        drone = drone_service.get_drone_or_404(db, drone_id)
        ensure_owner(drone.user_id, current_user)
        items, total = maintenance_service.list_maintenance_for_drone(db, drone_id, limit, offset)
    else:
        items, total = maintenance_service.list_maintenance_for_user(db, current_user.id, limit, offset)
    return MaintenanceListResponse(items=items, total=total)


@router.get("/{maintenance_id}", response_model=MaintenanceRead)
def get_maintenance(
    maintenance_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = maintenance_service.get_maintenance_or_404(db, maintenance_id)
    drone = drone_service.get_drone_or_404(db, record.drone_id)
    ensure_owner(drone.user_id, current_user)
    reminder_service.generate_due_reminders_for_user(db, current_user.id)
    db.refresh(record)
    return record


@router.put("/{maintenance_id}", response_model=MaintenanceRead)
def update_maintenance(
    maintenance_id: uuid.UUID,
    maintenance_in: MaintenanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = maintenance_service.get_maintenance_or_404(db, maintenance_id)
    drone = drone_service.get_drone_or_404(db, record.drone_id)
    ensure_owner(drone.user_id, current_user)
    return maintenance_service.update_maintenance_record(db, record, drone, maintenance_in)
