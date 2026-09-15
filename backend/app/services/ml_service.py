"""
Wraps the existing ANN model/scaler/encoders as an internal prediction
service (SRS FR-PRED-01/02; System Specification §27 Phase 6).

Per the BRD ("AI Layer"): the existing model, scaler, and encoders are the
AI foundation of this system and are integrated as-is, not retrained or
redesigned here — this module only wraps DRONE_CARE_ANN_APP.py's inference
logic (load -> encode -> scale -> predict) as a reusable backend service.

Artifacts are loaded once per process (see get_ml_assets) rather than per
request, since loading a Keras model and unpickling a scaler/encoder set on
every prediction would be wasteful and is unnecessary — none of the three
change while the process is running.
"""

import os
import pickle
from functools import lru_cache

import numpy as np
import tensorflow as tf

from app.core.config import get_settings
from app.core.exceptions import ServiceUnavailableError
from app.core.ml_config import CATEGORICAL_ENCODING, get_ordered_feature_names


class MLAssets:
    def __init__(self, model, scaler, encoders: dict | None):
        self.model = model
        self.scaler = scaler
        self.encoders = encoders


@lru_cache
def get_ml_assets() -> MLAssets:
    settings = get_settings()
    try:
        model = tf.keras.models.load_model(settings.ML_MODEL_PATH, compile=False)
        with open(settings.ML_SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)

        encoders = None
        if os.path.exists(settings.ML_ENCODERS_PATH):
            with open(settings.ML_ENCODERS_PATH, "rb") as f:
                encoders = pickle.load(f)
    except Exception as exc:  # noqa: BLE001 - deliberately broad: any load
        # failure (missing file, corrupt pickle, incompatible model format)
        # must surface as the same "model unavailable" condition, matching
        # DRONE_CARE_ANN_APP.py's own load_ai_assets() error handling.
        raise ServiceUnavailableError(
            f"Failed to load ML artifacts: {exc}"
        ) from exc

    return MLAssets(model=model, scaler=scaler, encoders=encoders)


def get_model_version() -> str:
    """Identifies the exact model/scaler/encoder file set in effect, so every
    stored prediction stays traceable to it (Data Dictionary `model_version`)
    without hand-maintaining a separate version string that could drift out
    of sync with ML_MODEL_PATH/ML_SCALER_PATH/ML_ENCODERS_PATH.

    Truncated to fit Prediction.model_version (String(50)): the default
    production filenames (~38 chars joined) fit comfortably, but this stays
    safe even if longer paths are swapped in via env vars (e.g. the
    "_corrected" artifact set)."""
    settings = get_settings()
    names = (
        os.path.basename(settings.ML_MODEL_PATH),
        os.path.basename(settings.ML_SCALER_PATH),
        os.path.basename(settings.ML_ENCODERS_PATH),
    )
    return "|".join(names)[:50]


def encode_categorical(feature_name: str, value: str) -> int:
    """Mirrors DRONE_CARE_ANN_APP.py's encode_value(): prefer the loaded
    encoder, fall back to the hardcoded catalog on any failure (unknown
    category, or — as is currently always the case for the production
    encoders.pkl — an encoder whose classes_ don't match real category
    strings; see app/core/ml_config.py's CATEGORICAL_ENCODING docstring)."""
    assets = get_ml_assets()
    if assets.encoders and feature_name in assets.encoders:
        try:
            return int(assets.encoders[feature_name].transform([value])[0])
        except Exception:  # noqa: BLE001 - any encoder failure falls back
            pass
    return CATEGORICAL_ENCODING[feature_name].get(value, 0)


def build_feature_vector(
    *,
    obstacles_encountered: bool,
    battery_remaining: float,
    wind_speed: float,
    gps_accuracy: float,
    actual_carry_weight: float,
    max_carry_weight: float,
    propeller_count: int,
    drone_size: str,
    distance_flown: float,
    drone_model: str,
    payload_type: str,
    application: str,
    altitude: float,
) -> list[float]:
    """Builds the 13-value feature vector in the exact order
    app/core/ml_config.PREDICTION_FEATURES defines (must match
    get_ordered_feature_names() position-for-position — the model has no
    awareness of feature names, only position)."""
    vector = [
        1 if obstacles_encountered else 0,
        battery_remaining,
        wind_speed,
        gps_accuracy,
        actual_carry_weight,
        max_carry_weight,
        propeller_count,
        encode_categorical("Drone Size", drone_size),
        distance_flown,
        encode_categorical("Drone Model", drone_model),
        encode_categorical("Payload Type", payload_type),
        encode_categorical("Application", application),
        altitude,
    ]
    assert len(vector) == len(get_ordered_feature_names())
    return vector


def predict_failure_probability(feature_vector: list[float]) -> float:
    """Scales the raw feature vector and runs the ANN forward pass, returning
    the probability of 'Landed Unexpectedly' (the model's single sigmoid
    output) as a plain Python float."""
    assets = get_ml_assets()
    scaled = assets.scaler.transform(np.array([feature_vector]))
    probability = assets.model.predict(scaled, verbose=0)[0][0]
    return float(probability)
