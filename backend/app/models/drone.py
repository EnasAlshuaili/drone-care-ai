"""
`drones` table — see DRONECARE_DATA_DICTIONARY.md.

serial_number is unique per owning user (composite unique constraint), not
globally unique, per the data dictionary ("unique per user").
"""

import uuid
from datetime import date, datetime

from typing import TYPE_CHECKING

from sqlalchemy import Date, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.flight import Flight
    from app.models.maintenance_record import MaintenanceRecord
    from app.models.prediction import Prediction
    from app.models.reminder import Reminder
    from app.models.user import User


class Drone(Base):
    __tablename__ = "drones"
    __table_args__ = (
        UniqueConstraint("user_id", "serial_number", name="uq_drones_user_serial"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    drone_size: Mapped[str | None] = mapped_column(String(30), nullable=True)
    propeller_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_carry_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    health_status: Mapped[str] = mapped_column(String(20), nullable=False, default="Healthy")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="drones")
    flights: Mapped[list["Flight"]] = relationship(back_populates="drone")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="drone")
    maintenance_records: Mapped[list["MaintenanceRecord"]] = relationship(back_populates="drone")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="drone")
