"""`reminders` table — see DRONECARE_DATA_DICTIONARY.md."""

import uuid
from datetime import date, datetime

from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.drone import Drone
    from app.models.maintenance_record import MaintenanceRecord


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    drone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drones.id"), nullable=False, index=True
    )
    maintenance_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("maintenance_records.id"), nullable=True, index=True
    )
    reminder_type: Mapped[str] = mapped_column(String(50), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    drone: Mapped["Drone"] = relationship(back_populates="reminders")
    maintenance_record: Mapped["MaintenanceRecord | None"] = relationship(
        back_populates="reminders"
    )
