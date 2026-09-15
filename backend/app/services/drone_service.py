"""
Drone Management data-access and business logic (SRS §3.2, FR-DRONE-01..05).

Ownership is never decided here — every function that needs it takes the
already-authenticated owning user_id (create) or expects the caller to run
ensure_owner() on the returned Drone before mutating it (get/update/delete),
exactly as documented in app/services/authorization.py.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.drone import Drone
from app.schemas.drone import DroneCreate, DroneUpdate


def create_drone(db: Session, owner_id: uuid.UUID, drone_in: DroneCreate) -> Drone:
    duplicate = db.scalar(
        select(Drone).where(
            Drone.user_id == owner_id, Drone.serial_number == drone_in.serial_number
        )
    )
    if duplicate is not None:
        raise ConflictError(
            f"You already have a drone with serial number '{drone_in.serial_number}'."
        )

    drone = Drone(user_id=owner_id, **drone_in.model_dump())
    db.add(drone)
    db.commit()
    db.refresh(drone)
    return drone


def list_drones(
    db: Session,
    owner_id: uuid.UUID,
    search: str | None = None,
    status: str | None = None,
) -> list[Drone]:
    stmt = select(Drone).where(Drone.user_id == owner_id)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(Drone.name.ilike(pattern) | Drone.serial_number.ilike(pattern))

    if status:
        stmt = stmt.where(Drone.status == status)

    stmt = stmt.order_by(Drone.created_at.desc())
    return list(db.scalars(stmt).all())


def get_drone_or_404(db: Session, drone_id: uuid.UUID) -> Drone:
    drone = db.get(Drone, drone_id)
    if drone is None:
        raise NotFoundError("Drone not found.")
    return drone


def update_drone(db: Session, drone: Drone, drone_in: DroneUpdate) -> Drone:
    updates = drone_in.model_dump(exclude_unset=True)

    new_serial = updates.get("serial_number")
    if new_serial is not None and new_serial != drone.serial_number:
        duplicate = db.scalar(
            select(Drone).where(
                Drone.user_id == drone.user_id,
                Drone.serial_number == new_serial,
                Drone.id != drone.id,
            )
        )
        if duplicate is not None:
            raise ConflictError(f"You already have a drone with serial number '{new_serial}'.")

    for field, value in updates.items():
        setattr(drone, field, value.value if hasattr(value, "value") else value)

    db.add(drone)
    db.commit()
    db.refresh(drone)
    return drone


def deactivate_drone(db: Session, drone: Drone) -> Drone:
    """Soft-delete: sets status to 'inactive' and preserves the row (and every
    related flights/predictions/maintenance_records/reminders row) intact —
    per FR-DRONE-04 / NFR-07. Idempotent if already inactive."""
    if drone.status != "inactive":
        drone.status = "inactive"
        db.add(drone)
        db.commit()
        db.refresh(drone)
    return drone
