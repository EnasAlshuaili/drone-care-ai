"""
AI Failure Prediction endpoints (SRS §3.4, System Specification §11 API
table: `/predictions` GET/POST, `/predictions/{id}` GET).

Ownership chain: User -> owns Drone -> owns Prediction. Every endpoint
resolves the relevant drone and calls the existing ensure_owner() before
touching any prediction data — never trusting a client-supplied drone_id or
prediction_id as proof of ownership by itself (same pattern as
app/api/v1/flights.py).

FR-PRED-04 / BR-07 (Phase 9): a HIGH-risk prediction triggers a notification
for the drone's owner. This reacts to the risk_level prediction_service
already computed via the validated ANN + app/core/ml_config.classify_risk —
it never recomputes or second-guesses that classification.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.ml_config import RiskLevel
from app.db.session import get_db
from app.models.user import User
from app.schemas.prediction import (
    PredictionCreate,
    PredictionListResponse,
    PredictionRead,
    PredictionSchemaResponse,
    build_prediction_schema,
)
from app.services import drone_service, notification_service, prediction_service
from app.services.authorization import ensure_owner
from app.services.prediction_service import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionRead, status_code=201)
def create_prediction(
    prediction_in: PredictionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drone = drone_service.get_drone_or_404(db, prediction_in.drone_id)
    ensure_owner(drone.user_id, current_user)
    prediction = prediction_service.create_prediction(db, drone.id, prediction_in)
    if prediction.risk_level == RiskLevel.HIGH.value:
        notification_service.notify_high_risk_prediction(db, drone, prediction)
    return prediction


@router.get("", response_model=PredictionListResponse)
def list_predictions(
    drone_id: uuid.UUID | None = None,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if drone_id is not None:
        drone = drone_service.get_drone_or_404(db, drone_id)
        ensure_owner(drone.user_id, current_user)
        items, total = prediction_service.list_predictions_for_drone(db, drone_id, limit, offset)
    else:
        items, total = prediction_service.list_predictions_for_user(db, current_user.id, limit, offset)
    return PredictionListResponse(items=items, total=total)


@router.get("/schema", response_model=PredictionSchemaResponse)
def get_prediction_schema(current_user: User = Depends(get_current_user)):
    """Registered before /{prediction_id} so "schema" is never parsed as a
    prediction UUID (System Specification §12 — see schemas/prediction.py)."""
    return build_prediction_schema()


@router.get("/{prediction_id}", response_model=PredictionRead)
def get_prediction(
    prediction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = prediction_service.get_prediction_or_404(db, prediction_id)
    drone = drone_service.get_drone_or_404(db, prediction.drone_id)
    ensure_owner(drone.user_id, current_user)
    return prediction
