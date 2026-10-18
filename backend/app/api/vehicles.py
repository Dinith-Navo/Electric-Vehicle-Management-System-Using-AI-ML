import uuid
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from dataclasses import asdict
from app.schemas.anomaly import StandardApiResponse
from app.ml.digital_twin import DigitalTwinRegistry

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

_vehicles_db: Dict[str, Dict[str, Any]] = {
    "SL-LEAF-7429": {
        "vehicleId": "SL-LEAF-7429",
        "licensePlate": "WP CBB-7429",
        "ownerId": "user_colombo_commuter",
        "vehicleName": "Nissan Leaf AZE0 (30kWh Air-Cooled)",
        "manufacturer": "Nissan",
        "model": "Leaf AZE0 Generation 2",
        "year": 2017,
        "batteryChemistry": "Lithium-Ion Pouch (Passive Air-Cooled)",
        "packCapacityKwh": 30.0,
        "sohHealthBars": "10 / 12 Bars (81% SoH)",
        "repackStatus": "Original Pack + 2 Reconditioned CALB Modules",
        "primaryCorridor": "A1 Colombo - Gampaha Coastal Route",
        "cebTariffPlan": "Domestic Time-of-Use (TOU)",
        "status": "ACTIVE",
        "climateVulnerability": "High Tropical Thermal Degradation (No active chiller)",
        "createdAt": "2026-08-28T10:00:00Z"
    },
    "SL-TUK-8812": {
        "vehicleId": "SL-TUK-8812",
        "licensePlate": "WP ABG-8812",
        "ownerId": "user_pettah_logistics",
        "vehicleName": "Vega / DIMO Electric Three-Wheeler",
        "manufacturer": "Vega Innovations / DIMO",
        "model": "E-Tuk Cargo Master Pro",
        "year": 2024,
        "batteryChemistry": "Lithium Iron Phosphate (LFP Prismatic)",
        "packCapacityKwh": 8.6,
        "sohHealthBars": "100% SOH (3,000 Cycle Life)",
        "repackStatus": "Factory Sri Lanka Assembled Pack",
        "primaryCorridor": "Colombo Pettah Market - Fort Commercial Hub",
        "cebTariffPlan": "Commercial Rate D-1",
        "status": "ACTIVE",
        "climateVulnerability": "Low-Speed High-Torque Stator Overload in Gridlock",
        "createdAt": "2026-08-28T11:00:00Z"
    },
    "SL-BYD-3045": {
        "vehicleId": "SL-BYD-3045",
        "licensePlate": "WP CBE-3045",
        "ownerId": "user_expressway_fleet",
        "vehicleName": "BYD Atto 3 Extended Range",
        "manufacturer": "BYD",
        "model": "Atto 3 (Blade Battery)",
        "year": 2025,
        "batteryChemistry": "LFP Blade Battery (Active Liquid Cooling)",
        "packCapacityKwh": 60.48,
        "sohHealthBars": "97% SoH",
        "repackStatus": "Factory Sealed OEM Pack",
        "primaryCorridor": "E01 Southern Expressway (Kottawa - Hambantota)",
        "cebTariffPlan": "General Purpose / DC Fast Chg",
        "status": "ACTIVE",
        "climateVulnerability": "High-Speed Saline Coastal Ingress at 100km/h",
        "createdAt": "2026-09-01T08:00:00Z"
    },
    "SL-BUS-1904": {
        "vehicleId": "SL-BUS-1904",
        "licensePlate": "CP NA-1904",
        "ownerId": "user_sl_transit_corp",
        "vehicleName": "Lanka Ashok Leyland Dipper e-Bus",
        "manufacturer": "Lanka Ashok Leyland / SLTB",
        "model": "Dipper EV Intercity Express",
        "year": 2024,
        "batteryChemistry": "Heavy-Duty LFP (Liquid Thermal Loop)",
        "packCapacityKwh": 160.0,
        "sohHealthBars": "94% SoH",
        "repackStatus": "Dual Pack 80kWh+80kWh Modular",
        "primaryCorridor": "A1 Colombo - Kandy (Kadugannawa Pass Incline)",
        "cebTariffPlan": "Industrial Heavy Demand TOU",
        "status": "ACTIVE",
        "climateVulnerability": "Kadugannawa Grade Overheat & Steep Regen Overvoltage",
        "createdAt": "2026-09-10T06:00:00Z"
    },
    "SL-HYU-4210": {
        "vehicleId": "SL-HYU-4210",
        "licensePlate": "WP CAD-4210",
        "ownerId": "user_upcountry_tour",
        "vehicleName": "Hyundai Ioniq Electric",
        "manufacturer": "Hyundai",
        "model": "Ioniq Electric (38.3kWh)",
        "year": 2020,
        "batteryChemistry": "NMC Pouch Cells (Air-Cooled)",
        "packCapacityKwh": 38.3,
        "sohHealthBars": "88% SoH",
        "repackStatus": "Original Pack",
        "primaryCorridor": "A5 Peradeniya - Nuwara Eliya Highlands",
        "cebTariffPlan": "Domestic TOU",
        "status": "ACTIVE",
        "climateVulnerability": "Thermal Shock (35°C Lowland -> 14°C Highland Shift)",
        "createdAt": "2026-09-15T09:00:00Z"
    }
}

@router.get("", response_model=StandardApiResponse)
async def list_vehicles():
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    return StandardApiResponse(
        success=True,
        data=list(_vehicles_db.values()),
        meta={"requestId": request_id}
    )

@router.get("/{vehicle_id}", response_model=StandardApiResponse)
async def get_vehicle(vehicle_id: str):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    if vehicle_id not in _vehicles_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": f"Vehicle '{vehicle_id}' not found."}
        )
    return StandardApiResponse(
        success=True,
        data=_vehicles_db[vehicle_id],
        meta={"requestId": request_id}
    )

@router.get("/{vehicle_id}/twin-profile", response_model=StandardApiResponse)
async def get_vehicle_digital_twin(vehicle_id: str):
    """Retrieve the learned digital twin behavioral profile for this specific EV."""
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    twin = DigitalTwinRegistry.get_or_create_twin(vehicle_id)
    return StandardApiResponse(
        success=True,
        data=asdict(twin),
        meta={"requestId": request_id}
    )
