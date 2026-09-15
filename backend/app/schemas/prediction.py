"""
Request/response schemas for AI Failure Prediction (SRS §3.4, FR-PRED-01..05;
Data Dictionary `predictions` table; System Specification §27 Phase 6).

Only fields operationally available *before* a flight are accepted here —
`flight_duration` and other post-flight-only fields are never part of this
schema (FR-PRED-01, BR-03). `flight_id` is optional: a prediction can be run
speculatively before any flight is logged, or attached to an existing one.

Unlike Drone.drone_size (kept free-text in schemas/drone.py because the Data
Dictionary flags its category list as unresolved), the four categorical
fields below ARE enum-validated: they feed directly into the ANN's
categorical encoding (app/core/ml_config.CATEGORICAL_ENCODING), which only
has a known integer code for a fixed, closed set of values. A value outside
that set cannot be meaningfully encoded, so it is rejected at the API
boundary (422) rather than silently encoded as a fallback bucket.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.ml_config import PREDICTION_FEATURES, get_categorical_values

DroneSizeValue = Literal[*get_categorical_values("Drone Size")]
DroneModelValue = Literal[*get_categorical_values("Drone Model")]
PayloadTypeValue = Literal[*get_categorical_values("Payload Type")]
ApplicationValue = Literal[*get_categorical_values("Application")]


class PredictionCreate(BaseModel):
    drone_id: uuid.UUID
    flight_id: uuid.UUID | None = None

    obstacles_encountered: bool
    battery_remaining: float = Field(ge=0, le=100)
    wind_speed: float = Field(ge=0)
    gps_accuracy: float = Field(ge=0)
    actual_carry_weight: float = Field(ge=0)
    max_carry_weight: float = Field(gt=0)
    propeller_count: int = Field(ge=1)
    drone_size: DroneSizeValue
    distance_flown: float = Field(ge=0)
    drone_model: DroneModelValue
    payload_type: PayloadTypeValue
    application: ApplicationValue
    altitude: float = Field(ge=0)

    @model_validator(mode="after")
    def check_weight_within_capacity(self) -> "PredictionCreate":
        """Mirrors DRONE_CARE_ANN_APP.py's pre-submission safety check
        ("Cannot proceed: Weight exceeds drone capacity!")."""
        if self.actual_carry_weight > self.max_carry_weight:
            raise ValueError("actual_carry_weight cannot exceed max_carry_weight.")
        return self


class PredictionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_id: uuid.UUID
    flight_id: uuid.UUID | None
    input_features: dict
    failure_probability: float
    risk_level: str
    model_version: str
    created_at: datetime


class PredictionListResponse(BaseModel):
    items: list[PredictionRead]
    total: int


class PredictionFeatureSpec(BaseModel):
    order: int
    name: str
    feature_type: str
    values: list[str] | None = None


class PredictionSchemaResponse(BaseModel):
    """System Specification §12: "The ML feature list used in prediction
    forms is fetched from a backend-provided config/schema endpoint, not
    hardcoded in the frontend." Backed entirely by app/core/ml_config.py."""

    features: list[PredictionFeatureSpec]


def build_prediction_schema() -> PredictionSchemaResponse:
    features = [
        PredictionFeatureSpec(
            order=f.order,
            name=f.name,
            feature_type=f.feature_type.value,
            values=get_categorical_values(f.name) if f.name in (
                "Drone Size", "Drone Model", "Payload Type", "Application"
            ) else None,
        )
        for f in sorted(PREDICTION_FEATURES, key=lambda f: f.order)
    ]
    return PredictionSchemaResponse(features=features)
