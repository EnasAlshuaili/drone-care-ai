"""
Response schemas for Dashboard & Analytics aggregation (SRS §3.5 FR-DASH-01,
§3.8 FR-ANLY-01; System Specification §11 `/analytics/*`, §27 Phases 8, 10).

Scope note (updated for Phase 10): FR-DASH-01's acceptance criteria also
lists "recent alerts" and FR-ANLY-01 the broader "maintenance ... insights"
— "recent alerts" needs the Notification Center's own UI surface, not a
Dashboard field, and stays out of scope here per Phase 10's Step 9 (only
maintenance-related deferred fields are in scope for this phase). The two
maintenance fields Step 9 explicitly names — "upcoming maintenance count"
and "maintenance completion rate" — are implemented below now that
Phase 10's Maintenance module provides real data for them, closing the gap
this module documented as provisional in Phase 8.
"""

from datetime import date as date_

from pydantic import BaseModel

from app.schemas.prediction import PredictionRead


class DashboardSummary(BaseModel):
    total_drones: int
    active_drones: int
    drones_requiring_attention: int
    high_risk_drones: int
    total_flights: int
    total_predictions: int
    upcoming_maintenance_count: int
    recent_predictions: list[PredictionRead]


class MaintenanceStatsResponse(BaseModel):
    """FR-ANLY-01's "maintenance completion rate" — `completion_rate` is a
    0-100 percentage (Completed / all non-open-ended records), null when
    the user has no maintenance records at all (a rate isn't meaningful yet,
    never fabricated as 0)."""

    total: int
    completed: int
    cancelled: int
    scheduled: int
    in_progress: int
    overdue: int
    completion_rate: float | None


class DroneRiskCount(BaseModel):
    # "NONE" covers a drone with no prediction yet — never silently dropped
    # from the distribution, since that would misrepresent fleet coverage.
    risk_level: str
    drone_count: int


class RiskDistributionResponse(BaseModel):
    items: list[DroneRiskCount]


class PredictionVolumePoint(BaseModel):
    date: date_
    count: int


class PredictionVolumeResponse(BaseModel):
    items: list[PredictionVolumePoint]
