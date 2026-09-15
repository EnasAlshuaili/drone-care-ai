"""
Reusable ownership check, shared by every future resource endpoint that
belongs to a user (directly, like `notifications`, or transitively through a
drone, like `flights`/`predictions`/`maintenance_records`/`reminders`).

Usage in a later phase, e.g. GET /drones/{id}:
    drone = drone_service.get_drone_or_404(db, drone_id)
    ensure_owner(drone.user_id, current_user)
    return drone
"""

import uuid

from app.core.exceptions import ForbiddenError
from app.models.user import User


def ensure_owner(resource_owner_id: uuid.UUID, current_user: User) -> None:
    """Raises ForbiddenError unless current_user owns the resource."""
    if resource_owner_id != current_user.id:
        raise ForbiddenError("You do not have access to this resource.")
