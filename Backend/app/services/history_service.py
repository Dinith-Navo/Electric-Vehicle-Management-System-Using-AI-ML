from typing import Any, Dict, List, Optional

from firebase_admin import firestore


# =========================================================
# EXISTING FIRESTORE COLLECTION
# =========================================================
# Your Firebase screenshot already contains this collection.
# New prediction history will be appended here.
COLLECTION_NAME = "frontend_form_tests"


# =========================================================
# FIRESTORE CLIENT
# =========================================================

def _get_db():
    return firestore.client()


# =========================================================
# JSON SERIALIZATION HELPER
# =========================================================

def _serialize_value(value: Any) -> Any:

    if hasattr(value, "isoformat"):
        return value.isoformat()

    if isinstance(value, dict):
        return {
            key: _serialize_value(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [
            _serialize_value(item)
            for item in value
        ]

    return value


# =========================================================
# SAVE SUCCESSFUL PREDICTION
# =========================================================

def save_prediction_history(
    input_data: Dict[str, Any],
    prediction_data: Dict[str, Any]
) -> str:

    db = _get_db()

    doc_ref = (
        db.collection(COLLECTION_NAME)
        .document()
    )

    history_data = {
        "prediction_id": doc_ref.id,
        "created_at": firestore.SERVER_TIMESTAMP,

        # Keep a name similar to your old Firebase documents
        "form_data": input_data,

        # New field containing ML output + recommendations
        "prediction_data": prediction_data,
    }

    doc_ref.set(history_data)

    return doc_ref.id


# =========================================================
# GET ALL HISTORY
# =========================================================

def get_prediction_history(
    limit: int = 50
) -> List[Dict[str, Any]]:

    db = _get_db()

    safe_limit = max(
        1,
        min(int(limit), 200)
    )

    docs = (
        db.collection(COLLECTION_NAME)
        .order_by(
            "created_at",
            direction=firestore.Query.DESCENDING
        )
        .limit(safe_limit)
        .stream()
    )

    history: List[Dict[str, Any]] = []

    for doc in docs:

        data = doc.to_dict() or {}

        data["prediction_id"] = doc.id

        history.append(
            _serialize_value(data)
        )

    return history


# =========================================================
# GET SINGLE HISTORY RECORD
# =========================================================

def get_prediction_by_id(
    prediction_id: str
) -> Optional[Dict[str, Any]]:

    db = _get_db()

    doc = (
        db.collection(COLLECTION_NAME)
        .document(prediction_id)
        .get()
    )

    if not doc.exists:
        return None

    data = doc.to_dict() or {}

    data["prediction_id"] = doc.id

    return _serialize_value(data)


# =========================================================
# DELETE SINGLE HISTORY RECORD
# =========================================================

def delete_prediction_history(
    prediction_id: str
) -> bool:

    db = _get_db()

    doc_ref = (
        db.collection(COLLECTION_NAME)
        .document(prediction_id)
    )

    doc = doc_ref.get()

    if not doc.exists:
        return False

    doc_ref.delete()

    return True
