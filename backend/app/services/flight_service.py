"""
Flight Management data-access and business logic (SRS §3.3, FR-FLIGHT-01/02).

Flights have no direct user_id column — ownership is transitive through the
owning drone (Flight.drone_id -> Drone.user_id). Every function that needs
ownership enforced expects the caller to have already resolved and checked
the drone via drone_service.get_drone_or_404() + ensure_owner(), exactly as
app/services/authorization.py documents; this module never re-implements
that check itself.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.drone import Drone
from app.models.flight import Flight
from app.schemas.flight import FlightCreate

DEFAULT_LIMIT = 50
MAX_LIMIT = 200


def create_flight(db: Session, drone_id: uuid.UUID, flight_in: FlightCreate) -> Flight:
    data = flight_in.model_dump(exclude={"drone_id"})
    data["flight_status"] = data["flight_status"].value
    flight = Flight(drone_id=drone_id, **data)
    db.add(flight)
    db.commit()
    db.refresh(flight)
    return flight


def list_flights_for_drone(
    db: Session, drone_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[Flight], int]:
    """Caller must already have verified the drone belongs to the current user."""
    base = select(Flight).where(Flight.drone_id == drone_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(Flight.flight_datetime.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def list_flights_for_user(
    db: Session, owner_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[Flight], int]:
    """All flights across every drone owned by the current user."""
    base = select(Flight).join(Drone, Flight.drone_id == Drone.id).where(Drone.user_id == owner_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(Flight.flight_datetime.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def get_flight_or_404(db: Session, flight_id: uuid.UUID) -> Flight:
    flight = db.get(Flight, flight_id)
    if flight is None:
        raise NotFoundError("Flight not found.")
    return flight
