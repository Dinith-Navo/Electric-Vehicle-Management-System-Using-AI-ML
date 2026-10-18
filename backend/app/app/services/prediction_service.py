from pathlib import Path
import json
import joblib
import pandas as pd

from xgboost import XGBRegressor

from app.config.settings import MODEL_DIR


# =========================================================
# COMMON FEATURES
# =========================================================

EXPECTED_FEATURES = [
    "current_soh",
    "avg_voltage",
    "avg_current",
    "avg_temperature",
    "avg_soc_change",
    "avg_charge_duration",
    "charging_sessions"
]


# =========================================================
# 3M PATHS
# =========================================================

MODEL_3M_JSON_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_3m.json"
)

MODEL_3M_JOBLIB_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_3m.joblib"
)

METADATA_3M_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_3m_metadata.json"
)


# =========================================================
# 6M PATHS
# =========================================================

MODEL_6M_JSON_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_6m.json"
)

MODEL_6M_JOBLIB_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_6m.joblib"
)

METADATA_6M_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_6m_metadata.json"
)


# =========================================================
# 12M PATHS
# =========================================================

MODEL_12M_JSON_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_12m.json"
)

MODEL_12M_JOBLIB_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_12m.joblib"
)

METADATA_12M_PATH = (
    Path(MODEL_DIR)
    / "best_degradation_12m_metadata.json"
)


# =========================================================
# MODEL CACHE
# =========================================================

_model_3m = None
_metadata_3m = None

_model_6m = None
_metadata_6m = None

_model_12m = None
_metadata_12m = None


# =========================================================
# HELPERS
# =========================================================

def _convert_to_dict(data):

    if hasattr(data, "model_dump"):
        return data.model_dump()

    if isinstance(data, dict):
        return data

    raise TypeError(
        "Prediction input must be a dictionary "
        "or Pydantic model."
    )


def _create_model_input(
    input_data,
    features
):

    missing_features = [
        feature
        for feature in features
        if feature not in input_data
    ]

    if missing_features:

        raise ValueError(
            "Missing required features: "
            + ", ".join(missing_features)
        )

    model_input = pd.DataFrame([
        {
            feature: float(
                input_data[feature]
            )
            for feature in features
        }
    ])

    return model_input[features]


def _load_metadata(
    metadata_path
):

    if not metadata_path.exists():

        raise FileNotFoundError(
            f"Metadata file not found: "
            f"{metadata_path}"
        )

    with open(
        metadata_path,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def _get_model_name(
    metadata
):

    model_name = metadata.get(
        "model_name",
        metadata.get(
            "model",
            metadata.get(
                "best_model",
                "Unknown Model"
            )
        )
    )

    return str(model_name)


def _load_model(
    json_path,
    joblib_path,
    metadata
):

    model_name = (
        _get_model_name(metadata)
        .lower()
    )

    # -----------------------------------------------------
    # XGBOOST
    # -----------------------------------------------------

    if "xgboost" in model_name:

        if not json_path.exists():

            raise FileNotFoundError(
                f"XGBoost model expected, "
                f"but file not found: "
                f"{json_path}"
            )

        model = XGBRegressor()

        model.load_model(
            str(json_path)
        )

        return model

    # -----------------------------------------------------
    # RANDOM FOREST
    # -----------------------------------------------------

    if (
        "random forest" in model_name
        or
        "randomforest" in model_name
    ):

        if not joblib_path.exists():

            raise FileNotFoundError(
                f"Random Forest model expected, "
                f"but file not found: "
                f"{joblib_path}"
            )

        return joblib.load(
            joblib_path
        )

    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    if json_path.exists() and not joblib_path.exists():

        model = XGBRegressor()

        model.load_model(
            str(json_path)
        )

        return model

    if joblib_path.exists() and not json_path.exists():

        return joblib.load(
            joblib_path
        )

    if json_path.exists() and joblib_path.exists():

        raise ValueError(
            "Both JSON and JOBLIB best-model files exist, "
            "but metadata does not identify the model type."
        )

    raise FileNotFoundError(
        f"Model file not found: "
        f"{json_path.name} or "
        f"{joblib_path.name}"
    )


# =========================================================
# MODEL AVAILABILITY
# =========================================================

def is_3m_model_available():

    model_exists = (
        MODEL_3M_JSON_PATH.exists()
        or
        MODEL_3M_JOBLIB_PATH.exists()
    )

    return (
        model_exists
        and
        METADATA_3M_PATH.exists()
    )


def is_6m_model_available():

    model_exists = (
        MODEL_6M_JSON_PATH.exists()
        or
        MODEL_6M_JOBLIB_PATH.exists()
    )

    return (
        model_exists
        and
        METADATA_6M_PATH.exists()
    )


def is_12m_model_available():

    model_exists = (
        MODEL_12M_JSON_PATH.exists()
        or
        MODEL_12M_JOBLIB_PATH.exists()
    )

    return (
        model_exists
        and
        METADATA_12M_PATH.exists()
    )


def models_available():

    return {
        "3m": is_3m_model_available(),
        "6m": is_6m_model_available(),
        "12m": is_12m_model_available()
    }


# =========================================================
# LOAD 3M MODEL
# =========================================================

def load_3m_model():

    global _model_3m
    global _metadata_3m

    if _metadata_3m is None:

        _metadata_3m = _load_metadata(
            METADATA_3M_PATH
        )

    if _model_3m is None:

        _model_3m = _load_model(
            MODEL_3M_JSON_PATH,
            MODEL_3M_JOBLIB_PATH,
            _metadata_3m
        )

    return (
        _model_3m,
        _metadata_3m
    )


# =========================================================
# LOAD 6M MODEL
# =========================================================

def load_6m_model():

    global _model_6m
    global _metadata_6m

    if _metadata_6m is None:

        _metadata_6m = _load_metadata(
            METADATA_6M_PATH
        )

    if _model_6m is None:

        _model_6m = _load_model(
            MODEL_6M_JSON_PATH,
            MODEL_6M_JOBLIB_PATH,
            _metadata_6m
        )

    return (
        _model_6m,
        _metadata_6m
    )


# =========================================================
# LOAD 12M MODEL
# =========================================================

def load_12m_model():

    global _model_12m
    global _metadata_12m

    if _metadata_12m is None:

        _metadata_12m = _load_metadata(
            METADATA_12M_PATH
        )

    if _model_12m is None:

        _model_12m = _load_model(
            MODEL_12M_JSON_PATH,
            MODEL_12M_JOBLIB_PATH,
            _metadata_12m
        )

    return (
        _model_12m,
        _metadata_12m
    )


# =========================================================
# GENERIC DEGRADATION PREDICTION
# =========================================================

def _predict_degradation(
    data,
    model,
    metadata
):

    input_data = _convert_to_dict(
        data
    )

    features = metadata.get(
        "features",
        EXPECTED_FEATURES
    )

    model_input = _create_model_input(
        input_data,
        features
    )

    # -----------------------------------------------------
    # MODEL PREDICTS DEGRADATION
    # -----------------------------------------------------

    predicted_degradation = float(
        model.predict(
            model_input
        )[0]
    )

    # No negative battery degradation
    predicted_degradation = max(
        0.0,
        predicted_degradation
    )

    # -----------------------------------------------------
    # CURRENT SOH
    # -----------------------------------------------------

    current_soh = float(
        input_data[
            "current_soh"
        ]
    )

    # -----------------------------------------------------
    # FUTURE SOH
    # -----------------------------------------------------

    predicted_soh = (
        current_soh
        -
        predicted_degradation
    )

    # Future SOH cannot exceed current SOH
    predicted_soh = min(
        current_soh,
        predicted_soh
    )

    # Valid SOH range
    predicted_soh = max(
        0.0,
        min(
            100.0,
            predicted_soh
        )
    )

    model_name = _get_model_name(
        metadata
    )

    return {
        "current_soh":
            current_soh,

        "predicted_soh":
            predicted_soh,

        "degradation":
            predicted_degradation,

        "model":
            model_name,

        "feature_count":
            len(features)
    }


# =========================================================
# 3M PREDICTION
# =========================================================

def predict_soh_3m(data):

    model, metadata = (
        load_3m_model()
    )

    result = _predict_degradation(
        data,
        model,
        metadata
    )

    return {

        "current_soh":
            round(
                result[
                    "current_soh"
                ],
                2
            ),

        "predicted_soh_3m":
            round(
                result[
                    "predicted_soh"
                ],
                2
            ),

        # 4 DECIMAL PLACES
        "estimated_degradation_3m":
            round(
                result[
                    "degradation"
                ],
                4
            ),

        "forecast_horizon":
            "3 months",

        "model":
            result[
                "model"
            ],

        "prediction_target":
            "degradation_3m",

        "feature_count":
            result[
                "feature_count"
            ]
    }


# =========================================================
# 6M PREDICTION
# =========================================================

def predict_soh_6m(data):

    model, metadata = (
        load_6m_model()
    )

    result = _predict_degradation(
        data,
        model,
        metadata
    )

    return {

        "current_soh":
            round(
                result[
                    "current_soh"
                ],
                2
            ),

        "predicted_soh_6m":
            round(
                result[
                    "predicted_soh"
                ],
                2
            ),

        # 4 DECIMAL PLACES
        "estimated_degradation_6m":
            round(
                result[
                    "degradation"
                ],
                4
            ),

        "forecast_horizon":
            "6 months",

        "model":
            result[
                "model"
            ],

        "prediction_target":
            "degradation_6m",

        "feature_count":
            result[
                "feature_count"
            ]
    }


# =========================================================
# 12M PREDICTION
# =========================================================

def predict_soh_12m(data):

    model, metadata = (
        load_12m_model()
    )

    result = _predict_degradation(
        data,
        model,
        metadata
    )

    return {

        "current_soh":
            round(
                result[
                    "current_soh"
                ],
                2
            ),

        "predicted_soh_12m":
            round(
                result[
                    "predicted_soh"
                ],
                2
            ),

        # 4 DECIMAL PLACES
        "estimated_degradation_12m":
            round(
                result[
                    "degradation"
                ],
                4
            ),

        "forecast_horizon":
            "12 months",

        "model":
            result[
                "model"
            ],

        "prediction_target":
            "degradation_12m",

        "feature_count":
            result[
                "feature_count"
            ]
    }


# =========================================================
# COMBINED PREDICTION
# =========================================================

def predict_battery_soh(data):

    input_data = _convert_to_dict(
        data
    )

    result = {

        "current_soh":
            round(
                float(
                    input_data[
                        "current_soh"
                    ]
                ),
                2
            ),

        "soh_3m":
            None,

        "soh_6m":
            None,

        "soh_12m":
            None,

        "degradation_3m":
            None,

        "degradation_6m":
            None,

        "degradation_12m":
            None,

        "model_3m":
            None,

        "model_6m":
            None,

        "model_12m":
            None
    }


    # -----------------------------------------------------
    # 3M
    # -----------------------------------------------------

    if is_3m_model_available():

        result_3m = predict_soh_3m(
            data
        )

        result[
            "soh_3m"
        ] = result_3m[
            "predicted_soh_3m"
        ]

        result[
            "degradation_3m"
        ] = result_3m[
            "estimated_degradation_3m"
        ]

        result[
            "model_3m"
        ] = result_3m[
            "model"
        ]


    # -----------------------------------------------------
    # 6M
    # -----------------------------------------------------

    if is_6m_model_available():

        result_6m = predict_soh_6m(
            data
        )

        result[
            "soh_6m"
        ] = result_6m[
            "predicted_soh_6m"
        ]

        result[
            "degradation_6m"
        ] = result_6m[
            "estimated_degradation_6m"
        ]

        result[
            "model_6m"
        ] = result_6m[
            "model"
        ]


    # -----------------------------------------------------
    # 12M
    # -----------------------------------------------------

    if is_12m_model_available():

        result_12m = predict_soh_12m(
            data
        )

        result[
            "soh_12m"
        ] = result_12m[
            "predicted_soh_12m"
        ]

        result[
            "degradation_12m"
        ] = result_12m[
            "estimated_degradation_12m"
        ]

        result[
            "model_12m"
        ] = result_12m[
            "model"
        ]


    return result