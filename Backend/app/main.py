from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# =========================================================
# ROUTERS
# =========================================================

from app.routes.prediction_routes import (
    router as prediction_router
)

from app.routes.history_routes import (
    router as history_router
)

# Authentication can be enabled later
# from app.routes.auth_routes import (
#     router as auth_router
# )

# Temporary development/debug routes
from app.routes.debug_routes import (
    router as debug_router
)


# =========================================================
# FIREBASE
# =========================================================

from app.services.firebase_service import (
    initialize_firebase,
    get_database
)


# =========================================================
# ML MODEL STATUS
# =========================================================

from app.services.prediction_service import (
    models_available
)


# =========================================================
# GLOBAL ERROR HANDLERS
# =========================================================

from app.core.error_handlers import (
    register_exception_handlers
)


# =========================================================
# APPLICATION LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # -----------------------------------------------------
    # Initialize Firebase when backend starts
    # -----------------------------------------------------

    print(
        "========================================="
    )

    print(
        "Starting EV Battery Health Backend..."
    )

    print(
        "========================================="
    )


    try:

        initialize_firebase()

        print(
            "✅ Firebase initialization completed"
        )

    except Exception as error:

        # Do not hide the startup error
        print(
            "❌ Firebase initialization error:"
        )

        print(
            str(error)
        )


    # -----------------------------------------------------
    # Display ML model status
    # -----------------------------------------------------

    try:

        model_statuses = models_available()

        print(
            "ML Model Status:"
        )

        print(
            f"  3M  : "
            f"{'✅ Ready' if model_statuses.get('3m') else '❌ Missing'}"
        )

        print(
            f"  6M  : "
            f"{'✅ Ready' if model_statuses.get('6m') else '❌ Missing'}"
        )

        print(
            f"  12M : "
            f"{'✅ Ready' if model_statuses.get('12m') else '❌ Missing'}"
        )


    except Exception as error:

        print(
            "⚠️ Unable to check ML model status:"
        )

        print(
            str(error)
        )


    print(
        "========================================="
    )


    # FastAPI application runs here
    yield


    # -----------------------------------------------------
    # Shutdown
    # -----------------------------------------------------

    print(
        "EV Battery Health Backend shutting down..."
    )


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(

    title=(
        "EV Battery Health Backend"
    ),

    description=(
        "Backend API for EV battery state-of-health "
        "prediction, personalized recommendations, "
        "Firebase storage and prediction history."
    ),

    version="1.0.0",

    lifespan=lifespan
)


# =========================================================
# CORS
# =========================================================
#
# Expo Web:
# http://localhost:8081
#
# Backend:
# http://127.0.0.1:8000
#
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# =========================================================
# GLOBAL EXCEPTION HANDLING
# =========================================================

register_exception_handlers(
    app
)


# =========================================================
# ROUTES
# =========================================================

# Battery prediction
#
# Includes:
# /api/battery/status
# /api/battery/model-status-3m
# /api/battery/model-status-6m
# /api/battery/model-status-12m
# /api/battery/predict-3m
# /api/battery/predict-6m
# /api/battery/predict-12m
# /api/battery/predict

app.include_router(
    prediction_router
)


# Prediction history / Firebase history routes
app.include_router(
    history_router
)


# Authentication - enable later
# app.include_router(
#     auth_router
# )


# Development/debug routes
#
# IMPORTANT:
# Remove this router before final production submission
# if it is no longer required.

app.include_router(
    debug_router
)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():

    return {

        "status":
            "running",

        "service":
            "EV Battery Health Backend",

        "version":
            "1.0.0",

        "docs":
            "/docs"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    # -----------------------------------------------------
    # Firebase
    # -----------------------------------------------------

    firebase_db = get_database()

    firebase_connected = (
        firebase_db is not None
    )


    # -----------------------------------------------------
    # ML models
    # -----------------------------------------------------

    model_statuses = models_available()


    model_3m_ready = bool(
        model_statuses.get(
            "3m",
            False
        )
    )

    model_6m_ready = bool(
        model_statuses.get(
            "6m",
            False
        )
    )

    model_12m_ready = bool(
        model_statuses.get(
            "12m",
            False
        )
    )


    # -----------------------------------------------------
    # Overall ML status
    # -----------------------------------------------------

    if (
        model_3m_ready
        and
        model_6m_ready
        and
        model_12m_ready
    ):

        ml_status = "ready"

    elif (
        model_3m_ready
        or
        model_6m_ready
        or
        model_12m_ready
    ):

        ml_status = "partial"

    else:

        ml_status = "pending"


    # -----------------------------------------------------
    # Overall backend status
    # -----------------------------------------------------

    overall_status = (
        "healthy"
        if firebase_connected
        else "degraded"
    )


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "status":
            overall_status,

        "api":
            "running",

        "firebase":
            (
                "connected"
                if firebase_connected
                else "unavailable"
            ),

        "ml_model":
            ml_status,

        "models": {

            "3m":
                model_3m_ready,

            "6m":
                model_6m_ready,

            "12m":
                model_12m_ready
        }
    }