"""
Request/response schemas for Maintenance Records (SRS §3.7 FR-MAINT-01/02;
Data Dictionary `maintenance_records` table; System Specification §16, §27
Phase 10).

Field set matches the Data Dictionary exactly: `maintenance_type`,
`scheduled_date`, `completed_date`, `status`, `technician`, `cost`, `notes`.
System Specification §16 additionally lists a "Description" field, but the
Data Dictionary — the authoritative column list — has no separate
description column, only `notes` (TEXT); `notes` is treated as covering
that need rather than inventing an undocumented column (provisional
resolution, documented here rather than silently expanding the schema).

`status` IS enum-validated (the Data Dictionary documents its exact values)
except that "Overdue" is deliberately excluded from the client-writable
enum: it is computed automatically from scheduled_date + status by
maintenance_service.recompute_overdue_for_user, never set directly by a
client (System Specification §16: "System automatically calculates
upcoming/overdue status based on dates").
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MaintenanceStatus(str, Enum):
    scheduled = "Scheduled"
    in_progress = "In Progress"
    completed = "Completed"
    cancelled = "Cancelled"
    # "Overdue" intentionally omitted — system-computed only, never
    # client-writable (see module docstring).


class MaintenanceCreate(BaseModel):
    drone_id: uuid.UUID
    maintenance_type: str = Field(min_length=1, max_length=50)
    scheduled_date: date | None = None
    completed_date: date | None = None
    status: MaintenanceStatus = MaintenanceStatus.scheduled
    technician: str | None = Field(default=None, max_length=100)
    cost: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def check_completed_has_date(self) -> "MaintenanceCreate":
        if self.status == MaintenanceStatus.completed and self.completed_date is None:
            raise ValueError("completed_date is required when status is 'Completed'.")
        return self


class MaintenanceUpdate(BaseModel):
    """All fields optional — only fields actually provided are changed
    (see maintenance_service.update_maintenance_record, applied via
    exclude_unset, mirroring drone_service.update_drone)."""

    maintenance_type: str | None = Field(default=None, min_length=1, max_length=50)
    scheduled_date: date | None = None
    completed_date: date | None = None
    status: MaintenanceStatus | None = None
    technician: str | None = Field(default=None, max_length=100)
    cost: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None


class MaintenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_id: uuid.UUID
    maintenance_type: str
    scheduled_date: date | None
    completed_date: date | None
    status: str
    technician: str | None
    cost: Decimal | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class MaintenanceListResponse(BaseModel):
    items: list[MaintenanceRead]
    total: int
