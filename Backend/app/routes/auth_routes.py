from fastapi import APIRouter, Depends

from app.services.auth_service import (
    get_current_user
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "status": "success",
        "user": current_user
    }