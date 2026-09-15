"""
AI Failure Prediction data-access and business logic (SRS §3.4,
FR-PRED-01..05).

Predictions have no direct user_id column — ownership is transitive through
the owning drone (Prediction.drone_id -> Drone.user_id), exactly like
Flight; callers must already have resolved and checked the drone via
drone_service.get_drone_or_404() + ensure_owner() before calling into this
module (see app/api/v1/predictions.py).

High-risk notification creation (FR-PRED-04) is deliberately NOT implemented
here: it belongs to the Notifications phase, which is out of scope for this
ANN Model Integration phase.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.core.ml_config import classify_risk
from app.models.drone import Drone
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate
from app.services import ml_service

DEFAULT_LIMIT = 50
MAX_LIMIT = 200


def create_prediction(db: Session, drone_id: uuid.UUID, prediction_in: PredictionCreate) -> Prediction:
    feature_vector = ml_service.build_feature_vector(
        obstacles_encountered=prediction_in.obstacles_encountered,
        battery_remaining=prediction_in.battery_remaining,
        wind_speed=prediction_in.wind_speed,
        gps_accuracy=prediction_in.gps_accuracy,
        actual_carry_weight=prediction_in.actual_carry_weight,
        max_carry_weight=prediction_in.max_carry_weight,
        propeller_count=prediction_in.propeller_count,
        drone_size=prediction_in.drone_size,
        distance_flown=prediction_in.distance_flown,
        drone_model=prediction_in.drone_model,
        payload_type=prediction_in.payload_type,
        application=prediction_in.application,
        altitude=prediction_in.altitude,
    )
    failure_probability = ml_service.predict_failure_probability(feature_vector)
    risk_level = classify_risk(failure_probability, prediction_in.battery_remaining)

    input_features = prediction_in.model_dump(exclude={"drone_id", "flight_id"})

    prediction = Prediction(
        drone_id=drone_id,
        flight_id=prediction_in.flight_id,
        input_features=input_features,
        failure_probability=failure_probability,
        risk_level=risk_level.value,
        model_version=ml_service.get_model_version(),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def list_predictions_for_drone(
    db: Session, drone_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[Prediction], int]:
    """Caller must already have verified the drone belongs to the current user."""
    base = select(Prediction).where(Prediction.drone_id == drone_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(Prediction.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def list_predictions_for_user(
    db: Session, owner_id: uuid.UUID, limit: int = DEFAULT_LIMIT, offset: int = 0
) -> tuple[list[Prediction], int]:
    """All predictions across every drone owned by the current user."""
    base = (
        select(Prediction)
        .join(Drone, Prediction.drone_id == Drone.id)
        .where(Drone.user_id == owner_id)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(Prediction.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all()), total


def get_prediction_or_404(db: Session, prediction_id: uuid.UUID) -> Prediction:
    prediction = db.get(Prediction, prediction_id)
    if prediction is None:
        raise NotFoundError("Prediction not found.")
    return prediction
