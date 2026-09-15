"""
Request/response schemas for Flight Management & Telemetry (SRS §3.3,
FR-FLIGHT-01/02; Data Dictionary `flights` table).

No FlightUpdate schema exists: neither the Data Dictionary (no `updated_at`
column on `flights`) nor the System Specification's API table (§11 — only
`/flights` GET/POST and `/flights/{id}` GET are listed, no PUT/DELETE)
document any way to edit or remove a recorded flight. Flights are treated as
an immutable historical record once logged, matching FR-FLIGHT-01 ("log a
completed flight").

Units: altitude (m), flight_duration (minutes), battery_remaining (%),
gps_accuracy (m), actual_carry_weight (kg) are unambiguous in the Data
Dictionary. distance_flown and wind_speed have their units explicitly marked
"TBD" there — this schema does not invent a unit for them (see Phase 4
report, Provisional Decisions).

`drone_id` is client-supplied on create (a flight must reference a specific
drone), but is never trusted as an ownership claim by itself — the API layer
verifies the referenced drone actually belongs to the authenticated user
before any flight is created (see app/api/v1/flights.py).
"""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class FlightStatus(str, Enum):
    completed = "completed"
    aborted = "aborted"
    incident = "incident"


class FlightCreate(BaseModel):
    drone_id: uuid.UUID
    flight_datetime: datetime
    flight_status: FlightStatus
    application: str | None = Field(default=None, max_length=50)
    altitude: float | None = Field(default=None, ge=0)
    flight_duration: float | None = Field(default=None, ge=0)
    distance_flown: float | None = Field(default=None, ge=0)
    battery_remaining: float | None = Field(default=None, ge=0, le=100)
    gps_accuracy: float | None = Field(default=None, ge=0)
    wind_speed: float | None = Field(default=None, ge=0)
    obstacles_encountered: bool | None = None
    payload_type: str | None = Field(default=None, max_length=50)
    actual_carry_weight: float | None = Field(default=None, ge=0)


class FlightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_id: uuid.UUID
    flight_datetime: datetime
    flight_status: str
    application: str | None
    altitude: float | None
    flight_duration: float | None
    distance_flown: float | None
    battery_remaining: float | None
    gps_accuracy: float | None
    wind_speed: float | None
    obstacles_encountered: bool | None
    payload_type: str | None
    actual_carry_weight: float | None
    created_at: datetime


class FlightListResponse(BaseModel):
    """SRS FR-FLIGHT-02 requires pagination for large histories; `total` lets
    the frontend render page controls without a second request."""

    items: list[FlightRead]
    total: int
