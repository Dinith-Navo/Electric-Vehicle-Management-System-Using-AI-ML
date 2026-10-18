from fastapi import APIRouter
from firebase_admin import firestore

from app.services.firebase_service import get_database


router = APIRouter(
    prefix="/api/debug",
    tags=["Debug"]
)


@router.post("/frontend-form")
def save_frontend_form(data: dict):

    db = get_database()

    if db is None:
        return {
            "status": "failed",
            "message": "Firebase is not connected."
        }

    doc_ref = db.collection(
        "frontend_form_tests"
    ).document()

    doc_ref.set({
        "form_data": data,
        "created_at": firestore.SERVER_TIMESTAMP
    })

    return {
        "status": "success",
        "message": "Frontend form data saved to Firestore.",
        "document_id": doc_ref.id
    }