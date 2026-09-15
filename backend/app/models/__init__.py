"""
SQLAlchemy models for the 8 documented MVP entities (DRONECARE_DATA_DICTIONARY.md).

No additional tables (roles, telemetry, maintenance_schedules) are defined —
those remain open decisions per System Specification §29.
"""

from app.models.activity_log import ActivityLog
from app.models.drone import Drone
from app.models.flight import Flight
from app.models.maintenance_record import MaintenanceRecord
from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.reminder import Reminder
from app.models.user import User

__all__ = [
    "ActivityLog",
    "Drone",
    "Flight",
    "MaintenanceRecord",
    "Notification",
    "Prediction",
    "Reminder",
    "User",
]
