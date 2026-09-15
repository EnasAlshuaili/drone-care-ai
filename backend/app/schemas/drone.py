"""
Request/response schemas for Drone Management (SRS §3.2, FR-DRONE-01..05).

`health_status` is documented as *derived* (System Specification §18 — rules
are an explicit open decision, §29) and is therefore never a client-writable
field in this phase: it is read-only in DroneRead, defaults to "Healthy" at
creation, and is left untouched by updates. `user_id` is likewise never
client-writable — ownership is always taken from the authenticated session
(see app/api/v1/drones.py), never from the request body.

`drone_size` is intentionally NOT enum-validated: the Data Dictionary
explicitly flags its category list as unresolved ("exact category list TBD"
/ "open decision"), so it is kept as free text rather than inventing a
vocabulary the documentation doesn't commit to. `status` IS enum-validated,
since the Data Dictionary documents its exact values.
"""

import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DroneStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    retired = "retired"


class DroneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    serial_number: str = Field(min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    drone_size: str | None = Field(default=None, max_length=30)
    propeller_count: int | None = Field(default=None, ge=0)
    max_carry_weight: float | None = Field(default=None, gt=0)
    purchase_date: date | None = None


class DroneUpdate(BaseModel):
    """All fields optional — only fields actually provided are changed
    (see drone_service.update_drone, which applies this via exclude_unset)."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    serial_number: str | None = Field(default=None, min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    drone_size: str | None = Field(default=None, max_length=30)
    propeller_count: int | None = Field(default=None, ge=0)
    max_carry_weight: float | None = Field(default=None, gt=0)
    purchase_date: date | None = None
    status: DroneStatus | None = None


class DroneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    serial_number: str
    manufacturer: str | None
    model: str | None
    drone_size: str | None
    propeller_count: int | None
    max_carry_weight: float | None
    purchase_date: date | None
    status: str
    health_status: str
    created_at: datetime
    updated_at: datetime
