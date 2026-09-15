"""
Single import point that pulls in every model so Base.metadata is fully
populated before Alembic's autogenerate compares it against the database.
Import this module (not app.db.base_class directly) from alembic/env.py.
"""

from app.db.base_class import Base
from app.models import (  # noqa: F401
    ActivityLog,
    Drone,
    Flight,
    MaintenanceRecord,
    Notification,
    Prediction,
    Reminder,
    User,
)

__all__ = ["Base"]
