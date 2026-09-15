"""
Drone Management endpoints (SRS §3.2, System Specification §11 API table).

Every endpoint requires authentication (get_current_user) and, for anything
addressing a specific drone by id, enforces ownership via ensure_owner()
before the resource is read or mutated — never trusting a client-supplied
user_id. This is the same pattern documented in app/services/authorization.py.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.drone import DroneCreate, DroneRead, DroneStatus, DroneUpdate
from app.services import drone_service
from app.services.authorization import ensure_owner

router = APIRouter(prefix="/drones", tags=["drones"])


@router.post("", response_model=DroneRead, status_code=201)
def create_drone(
    drone_in: DroneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return drone_service.create_drone(db, current_user.id, drone_in)


@router.get("", response_model=list[DroneRead])
def list_drones(
    search: str | None = Query(default=None, max_length=100),
    status: DroneStatus | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return drone_service.list_drones(
        db, current_user.id, search=search, status=status.value if status else None
    )


@router.get("/{drone_id}", response_model=DroneRead)
def get_drone(
    drone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, drone_id)
    ensure_owner(drone.user_id, current_user)
    return drone


@router.put("/{drone_id}", response_model=DroneRead)
def update_drone(
    drone_id: uuid.UUID,
    drone_in: DroneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, drone_id)
    ensure_owner(drone.user_id, current_user)
    return drone_service.update_drone(db, drone, drone_in)


@router.delete("/{drone_id}", response_model=DroneRead)
def deactivate_drone(
    drone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, drone_id)
    ensure_owner(drone.user_id, current_user)
    return drone_service.deactivate_drone(db, drone)
