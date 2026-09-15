"""
Dashboard & Analytics endpoints (SRS §3.5 FR-DASH-01, §3.8 FR-ANLY-01;
System Specification §11 `/analytics/*`, §27 Phases 8, 10).

Every endpoint here is scoped to the current user's own drones directly in
the underlying query (see app/services/analytics_service.py) — there is no
client-supplied drone_id/prediction_id to check ownership against, so
there's no ensure_owner() call to make here, unlike flights/predictions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import (
    DashboardSummary,
    MaintenanceStatsResponse,
    PredictionVolumeResponse,
    RiskDistributionResponse,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics_service.get_dashboard_summary(db, current_user.id)


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
def get_risk_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = analytics_service.get_risk_distribution(db, current_user.id)
    return RiskDistributionResponse(items=items)


@router.get("/prediction-volume", response_model=PredictionVolumeResponse)
def get_prediction_volume(
    days: int = Query(default=analytics_service.DEFAULT_VOLUME_DAYS, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = analytics_service.get_prediction_volume(db, current_user.id, days=days)
    return PredictionVolumeResponse(items=items)


@router.get("/maintenance-stats", response_model=MaintenanceStatsResponse)
def get_maintenance_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics_service.get_maintenance_stats(db, current_user.id)
