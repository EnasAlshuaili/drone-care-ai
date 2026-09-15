"""
`flights` table — see DRONECARE_DATA_DICTIONARY.md.

flight_duration is historical only (known post-flight) and must never be
treated as a prediction input — see app/core/ml_config.py.
"""

import uuid
from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.drone import Drone
    from app.models.prediction import Prediction


class Flight(Base):
    __tablename__ = "flights"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    drone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drones.id"), nullable=False, index=True
    )
    flight_datetime: Mapped[datetime] = mapped_column(nullable=False)
    application: Mapped[str | None] = mapped_column(String(50), nullable=True)
    altitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    flight_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_flown: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_remaining: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    obstacles_encountered: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    payload_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    actual_carry_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    flight_status: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    drone: Mapped["Drone"] = relationship(back_populates="flights")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="flight")
