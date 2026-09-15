"""
Flight Management endpoints (SRS §3.3, System Specification §11 API table:
`/flights` GET/POST, `/flights/{id}` GET — no PUT/DELETE is documented).

Ownership chain: User -> owns Drone -> owns Flight. Every endpoint resolves
the relevant drone and calls the existing ensure_owner() before touching any
flight data — never trusting a client-supplied drone_id or flight_id as
proof of ownership by itself.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.flight import FlightCreate, FlightListResponse, FlightRead
from app.services import drone_service, flight_service
from app.services.authorization import ensure_owner
from app.services.flight_service import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/flights", tags=["flights"])


@router.post("", response_model=FlightRead, status_code=201)
def create_flight(
    flight_in: FlightCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, flight_in.drone_id)
    ensure_owner(drone.user_id, current_user)
    return flight_service.create_flight(db, drone.id, flight_in)


@router.get("", response_model=FlightListResponse)
def list_flights(
    drone_id: uuid.UUID | None = None,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if drone_id is not None:
        drone = drone_service.get_drone_or_404(db, drone_id)
        ensure_owner(drone.user_id, current_user)
        items, total = flight_service.list_flights_for_drone(db, drone_id, limit, offset)
    else:
        items, total = flight_service.list_flights_for_user(db, current_user.id, limit, offset)
    return FlightListResponse(items=items, total=total)


@router.get("/{flight_id}", response_model=FlightRead)
def get_flight(
    flight_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    flight = flight_service.get_flight_or_404(db, flight_id)
    drone = drone_service.get_drone_or_404(db, flight.drone_id)
    ensure_owner(drone.user_id, current_user)
    return flight
