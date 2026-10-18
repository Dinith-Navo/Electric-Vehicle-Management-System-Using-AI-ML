from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId
import uuid

from models import OwnerRegisterRequest, OwnerLoginRequest, Token, UserResponse
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_station_owner,
    _MEMORY_USERS
)
from database import user_collection
from ..schemas import (
    StandardResponse,
    StationAssignRequest,
    ConnectorStatusUpdateRequest,
    StationLocationUpdateRequest,
    OwnerStationAnalyticsResponse
)
from ..charging_stations.station_service import ChargingStationService

router = APIRouter(prefix="/owner", tags=["Station Owner Portal"])

@router.post("/register", response_model=StandardResponse[Token])
async def owner_register(data: OwnerRegisterRequest):
    # Check if email is already registered in DB
    existing_user = None
    try:
        existing_user = await user_collection.find_one({"email": data.email})
    except Exception:
        pass

    if not existing_user:
        # Check memory fallback
        for u in _MEMORY_USERS.values():
            if u.get("email") == data.email:
                existing_user = u
                break

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_pw = get_password_hash(data.password)
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hashed_pw,
        "role": "station_owner"
    }

    user_id = None
    try:
        res = await user_collection.insert_one(user_doc)
        user_id = str(res.inserted_id)
        user_doc["id"] = user_id
    except Exception:
        user_id = str(uuid.uuid4())
        user_doc["id"] = user_id
        user_doc["_id"] = user_id

    _MEMORY_USERS[user_id] = user_doc

    access_token = create_access_token(data={
        "sub": user_id,
        "email": data.email,
        "role": "station_owner",
        "name": data.name
    })

    user_resp = UserResponse(
        id=user_id,
        name=data.name,
        email=data.email,
        role="station_owner"
    )

    return StandardResponse(
        success=True,
        data=Token(
            access_token=access_token,
            token_type="bearer",
            role="station_owner",
            user=user_resp
        ),
        message="Owner registered successfully"
    )

@router.post("/login", response_model=StandardResponse[Token])
async def owner_login(data: OwnerLoginRequest):
    db_user = None
    try:
        db_user = await user_collection.find_one({"email": data.email})
        if db_user:
            db_user["id"] = str(db_user.get("_id", ""))
    except Exception:
        pass

    if not db_user:
        for u in _MEMORY_USERS.values():
            if u.get("email") == data.email:
                db_user = u
                break

    if not db_user or not verify_password(data.password, db_user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Enforce station_owner role
    if db_user.get("role") != "station_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Account is not registered as a station owner"
        )

    user_id = str(db_user.get("id") or db_user.get("_id", ""))
    access_token = create_access_token(data={
        "sub": user_id,
        "email": db_user.get("email"),
        "role": "station_owner",
        "name": db_user.get("name", "Station Owner")
    })

    user_resp = UserResponse(
        id=user_id,
        name=db_user.get("name", "Station Owner"),
        email=db_user.get("email"),
        role="station_owner"
    )

    return StandardResponse(
        success=True,
        data=Token(
            access_token=access_token,
            token_type="bearer",
            role="station_owner",
            user=user_resp
        ),
        message="Login successful"
    )

@router.get("/me", response_model=StandardResponse[UserResponse])
async def get_owner_profile(current_owner: dict = Depends(get_current_station_owner)):
    return StandardResponse(
        success=True,
        data=UserResponse(
            id=str(current_owner.get("id") or current_owner.get("_id", "")),
            name=current_owner.get("name", "Station Owner"),
            email=current_owner.get("email"),
            role=current_owner.get("role", "station_owner")
        ),
        message="Owner profile retrieved successfully"
    )

@router.get("/stations", response_model=StandardResponse[List[Dict[str, Any]]])
async def get_owner_stations(current_owner: dict = Depends(get_current_station_owner)):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    stations = await ChargingStationService.get_stations_by_owner(owner_id)
    return StandardResponse(
        success=True,
        data=stations,
        message=f"Retrieved {len(stations)} stations owned by you"
    )

@router.post("/stations/assign", response_model=StandardResponse[Dict[str, Any]])
async def assign_station(
    data: StationAssignRequest,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    station = await ChargingStationService.assign_station_to_owner(
        station_id=data.stationId,
        enrollment_secret=data.enrollmentSecret,
        owner_id=owner_id
    )
    return StandardResponse(
        success=True,
        data=station,
        message=f"Station '{data.stationId}' assigned to your account successfully"
    )

@router.delete("/stations/{station_id}/assign", response_model=StandardResponse[Dict[str, Any]])
async def unassign_station(
    station_id: str,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    station = await ChargingStationService.unassign_station(
        station_id=station_id,
        owner_id=owner_id
    )
    return StandardResponse(
        success=True,
        data=station,
        message=f"Station '{station_id}' unassigned successfully"
    )

@router.put("/stations/{station_id}/connectors/{connector_id}/status", response_model=StandardResponse[Dict[str, Any]])
async def update_connector_status(
    station_id: str,
    connector_id: str,
    data: ConnectorStatusUpdateRequest,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    res = await ChargingStationService.update_connector_status(
        station_id=station_id,
        connector_id=connector_id,
        new_status=data.status,
        owner_id=owner_id,
        power_kw=data.powerKw,
        price_per_kwh=data.pricePerKWh
    )
    return StandardResponse(
        success=True,
        data=res,
        message=res.get("message", "Connector status updated successfully")
    )

@router.put("/stations/{station_id}/connectors/{connector_id}", response_model=StandardResponse[Dict[str, Any]])
async def update_connector(
    station_id: str,
    connector_id: str,
    data: ConnectorStatusUpdateRequest,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    res = await ChargingStationService.update_connector_status(
        station_id=station_id,
        connector_id=connector_id,
        new_status=data.status,
        owner_id=owner_id,
        power_kw=data.powerKw,
        price_per_kwh=data.pricePerKWh
    )
    return StandardResponse(
        success=True,
        data=res,
        message=res.get("message", "Connector updated successfully")
    )

@router.put("/stations/{station_id}/location", response_model=StandardResponse[Dict[str, Any]])
async def update_station_location(
    station_id: str,
    data: StationLocationUpdateRequest,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    res = await ChargingStationService.update_station_location(
        station_id=station_id,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        city=data.city,
        owner_id=owner_id
    )
    return StandardResponse(
        success=True,
        data=res,
        message=f"Location for station '{station_id}' updated successfully"
    )

@router.get("/analytics", response_model=StandardResponse[OwnerStationAnalyticsResponse])
async def get_owner_analytics(current_owner: dict = Depends(get_current_station_owner)):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    analytics = await ChargingStationService.get_owner_station_analytics(owner_id)
    return StandardResponse(
        success=True,
        data=OwnerStationAnalyticsResponse(**analytics),
        message="Owner station utilization analytics and historical reports retrieved successfully"
    )

@router.get("/stations/{station_id}/analytics", response_model=StandardResponse[OwnerStationAnalyticsResponse])
async def get_station_analytics(
    station_id: str,
    current_owner: dict = Depends(get_current_station_owner)
):
    owner_id = str(current_owner.get("id") or current_owner.get("_id", ""))
    analytics = await ChargingStationService.get_owner_station_analytics(owner_id, station_id=station_id)
    return StandardResponse(
        success=True,
        data=OwnerStationAnalyticsResponse(**analytics),
        message=f"Station '{station_id}' utilization analytics and historical reports retrieved successfully"
    )

