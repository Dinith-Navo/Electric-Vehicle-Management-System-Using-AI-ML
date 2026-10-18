from fastapi import (
    APIRouter,
    HTTPException,
    Query
)

from app.services.history_service import (
    get_prediction_history,
    get_prediction_by_id,
    delete_prediction_history
)


router = APIRouter(
    prefix="/api/history",
    tags=["Prediction History"]
)


# =========================================================
# GET ALL HISTORY
# =========================================================

@router.get("")
def get_all_history(
    limit: int = Query(
        default=50,
        ge=1,
        le=200
    )
):

    try:

        history = get_prediction_history(
            limit=limit
        )

        return {
            "status": "success",
            "count": len(history),
            "history": history
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# GET SINGLE PREDICTION
# =========================================================

@router.get(
    "/prediction/{prediction_id}"
)
def get_single_prediction(
    prediction_id: str
):

    try:

        result = get_prediction_by_id(
            prediction_id
        )

        if result is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Prediction history "
                    "not found."
                )
            )

        return {
            "status": "success",
            "prediction": result
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# DELETE SINGLE HISTORY RECORD
# =========================================================

@router.delete(
    "/prediction/{prediction_id}"
)
def delete_prediction(
    prediction_id: str
):

    try:

        deleted = delete_prediction_history(
            prediction_id
        )

        if not deleted:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Prediction history "
                    "not found."
                )
            )

        return {
            "status": "success",
            "message":
                "Prediction history deleted."
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
