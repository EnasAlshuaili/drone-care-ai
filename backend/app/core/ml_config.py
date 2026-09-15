"""
Central ML feature schema — the single authoritative source for the ANN
model's input feature list, order, and type.

This module does NOT load the model, scaler, or encoders (that happens in
the AI integration phase). It exists now so that no other part of the
system — backend validation, prediction request schemas, or the frontend
prediction form — ever hardcodes its own copy of this list. Every future
consumer must import PREDICTION_FEATURES from here.

The order below is fixed by the existing trained model
(see DRONE_CARE_ANN_APP.py, "Feature vector construction" — the model was
trained on vectors in exactly this order) and must not be changed without
retraining. Changing this list's order or membership silently breaks
predictions, since the model has no awareness of feature names — only
position.
"""

from dataclasses import dataclass
from enum import Enum


class FeatureType(str, Enum):
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"


@dataclass(frozen=True)
class FeatureSpec:
    order: int
    name: str
    feature_type: FeatureType


# Authoritative, ordered prediction input feature list.
# Position in this list == position in the vector passed to the model.
PREDICTION_FEATURES: tuple[FeatureSpec, ...] = (
    FeatureSpec(1, "Obstacles Encountered", FeatureType.NUMERIC),
    FeatureSpec(2, "Battery Remaining", FeatureType.NUMERIC),
    FeatureSpec(3, "Wind Speed", FeatureType.NUMERIC),
    FeatureSpec(4, "GPS Accuracy", FeatureType.NUMERIC),
    FeatureSpec(5, "Actual Carry Weight", FeatureType.NUMERIC),
    FeatureSpec(6, "Max Carry Weight", FeatureType.NUMERIC),
    FeatureSpec(7, "Propeller Count", FeatureType.NUMERIC),
    FeatureSpec(8, "Drone Size", FeatureType.CATEGORICAL),
    FeatureSpec(9, "Distance Flown", FeatureType.NUMERIC),
    FeatureSpec(10, "Drone Model", FeatureType.CATEGORICAL),
    FeatureSpec(11, "Payload Type", FeatureType.CATEGORICAL),
    FeatureSpec(12, "Application", FeatureType.CATEGORICAL),
    FeatureSpec(13, "Altitude", FeatureType.NUMERIC),
)

# Flight Duration is deliberately excluded: it is only known after a flight
# completes and must never be a required prediction input (BRD Constraints,
# SRS FR-PRED-01).
EXCLUDED_POST_FLIGHT_FEATURE = "Flight Duration"


def get_ordered_feature_names() -> list[str]:
    """Feature names in the exact order the model expects."""
    return [f.name for f in sorted(PREDICTION_FEATURES, key=lambda f: f.order)]


# ---------------------------------------------------------------------------
# Categorical value catalog and fallback integer encoding
# ---------------------------------------------------------------------------
# `encoders.pkl` (the production encoder set — see ML_ENCODERS_PATH) does NOT
# contain usable encoders for these categories: inspection showed its
# LabelEncoder.classes_ are stringified integers (e.g. '0', '1', '2', ...)
# rather than the real category names ('Small', 'SkyLens', ...), so calling
# .transform() on a real category string always raises ValueError. This is
# not a new problem introduced here — DRONE_CARE_ANN_APP.py's encode_value()
# already has a try/except around every encoder call for exactly this
# reason, falling back to a hardcoded MAPS dict. That fallback path is, in
# practice, the ONLY path that has ever successfully encoded a real
# prediction for the production model, so it is reproduced verbatim here as
# the authoritative catalog. If `encoders.pkl` is ever replaced with a
# correctly-fit encoder set (see encoders_corrected.pkl, which does have
# correct classes_), the same try/except-with-fallback strategy in
# app/services/ml_service.py will transparently prefer it — no code change
# needed here.
CATEGORICAL_ENCODING: dict[str, dict[str, int]] = {
    "Application": {
        "Package Delivery": 11, "Aerial Photography": 0, "Agricultural Spraying": 1,
        "Infrastructure Inspection": 10, "Power Line Inspection": 13, "Film Production": 23,
        "Wind Turbine Inspection": 9, "Environmental Monitoring": 7, "Event Coverage": 20,
        "Traffic Monitoring": 8, "Surveillance": 19, "Surveying": 18, "Search and Rescue": 17,
        "Warehouse Inventory": 3, "Construction Site Survey": 12, "Delivery to Remote Area": 5,
        "Precision Agriculture": 21, "Wildlife Monitoring": 22, "Emergency Response": 6,
        "Pipeline Inspection": 15, "Product Photography": 14, "Real Estate Photography": 4,
        "Bridge Inspection": 2, "Crop Monitoring": 16,
    },
    "Payload Type": {
        "Camera": 0, "Package": 10, "Liquid Tank": 9, "Sensor": 13, "Camera, Sensor": 3,
        "Camera, GPS": 2, "LiDAR System": 8, "First Aid Kit": 6, "Scanner": 12,
        "Camera, Beacon": 1, "Camera, Speaker": 4, "GPS": 7, "Speaker": 14,
        "RFID Reader": 11, "Communication Device": 5,
    },
    "Drone Model": {
        "SnapShot Mini": 17, "CropMaster": 4, "ViewMax 500": 22, "FlyHigh 300": 8,
        "SwiftWing": 20, "VoltGuard": 23, "BladeChecker": 2, "CineDrone X": 3,
        "AirProbe 1": 1, "TrafficEye": 21, "EventFlyer": 5, "Watcher Pro": 13,
        "Guardian SR": 24, "FarmPilot": 9, "MapMaker Z": 12, "SiteScan": 18,
        "StockChecker": 11, "FirstResponder": 15, "NatureWatch": 19, "LongHaul 400": 7,
        "PipePatrol": 14, "StudioShot": 6, "SkyLens": 0, "Agri Scout": 16, "Inspecta X": 10,
    },
    "Drone Size": {"Small": 2, "Medium": 1, "Large": 0},
}


def get_categorical_values(feature_name: str) -> list[str]:
    """Valid category strings for a categorical feature, in a stable order —
    used to build API request-schema enums so the backend rejects category
    values the model has no encoding for."""
    return list(CATEGORICAL_ENCODING[feature_name].keys())


# ---------------------------------------------------------------------------
# Risk-level thresholds
# ---------------------------------------------------------------------------
# SRS §6 "Open Items Carried Forward" lists the exact HIGH/MEDIUM/LOW
# probability thresholds as unresolved pending business confirmation.
# Resolving that for this integration: the values below (0.5 / 0.7) are not
# invented here — they are the two breakpoints DRONE_CARE_ANN_APP.py's
# Manual Input page already uses (prob <= 0.5 -> "Completed"; prob > 0.7 ->
# displayed as high risk vs. a plain warning between 0.5 and 0.7), so this
# carries the existing AI foundation's behavior forward unchanged rather than
# picking new numbers. Revisit if the business explicitly sets different
# thresholds.
RISK_THRESHOLD_MEDIUM = 0.5
RISK_THRESHOLD_HIGH = 0.7

# Reference-app safety override (Manual Input page): a battery level at or
# below this percentage is always treated as HIGH risk regardless of what
# the model predicts, since flying on a near-empty battery is unsafe on its
# own. The raw model probability is still stored unmodified in
# `failure_probability` for traceability; only `risk_level` is overridden.
CRITICAL_BATTERY_PERCENT = 5


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


def classify_risk(failure_probability: float, battery_remaining: float) -> RiskLevel:
    if battery_remaining <= CRITICAL_BATTERY_PERCENT:
        return RiskLevel.HIGH
    if failure_probability > RISK_THRESHOLD_HIGH:
        return RiskLevel.HIGH
    if failure_probability > RISK_THRESHOLD_MEDIUM:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW
