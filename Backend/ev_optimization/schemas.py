from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Generic, TypeVar

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "Operation successful"

# --- Charging Station Schemas ---
class ChargerPortSchema(BaseModel):
    type: str = Field(..., example="CCS2")  # CCS2, CHAdeMO, Type 2, Tesla Supercharger
    powerKw: float = Field(..., example=150.0)
    total: int = Field(default=2, example=4)
    available: int = Field(default=2, example=2)
    pricePerKWh: float = Field(default=0.35, example=0.35)

class StationLocationSchema(BaseModel):
    address: str = Field(..., example="Galle Road, Colombo 03")
    city: str = Field(default="Colombo", example="Colombo")
    latitude: float = Field(..., example=6.9271)
    longitude: float = Field(..., example=79.8612)

class ChargingStationSchema(BaseModel):
    id: Optional[str] = None
    stationId: str = Field(..., example="CS-CMB-001")
    name: str = Field(..., example="Colombo Central Fast Charger Hub")
    operator: str = Field(default="ChargeNet", example="ChargeNet")
    location: StationLocationSchema
    ports: List[ChargerPortSchema] = Field(default_factory=list)
    rating: float = Field(default=4.5, ge=0.0, le=5.0, example=4.8)
    totalReviews: int = Field(default=28, example=42)
    isOperational: bool = Field(default=True)
    amenities: List[str] = Field(default_factory=lambda: ["Restroom", "Cafe", "WiFi"])
    distanceKm: Optional[float] = None
    suitabilityScore: Optional[float] = None
    estimatedWaitMinutes: Optional[int] = None
    queueLength: Optional[int] = None

class StationFilterParams(BaseModel):
    maxDistanceKm: Optional[float] = None
    minPowerKw: Optional[float] = None
    maxPricePerKWh: Optional[float] = None
    connectorType: Optional[str] = None
    minRating: Optional[float] = None
    onlyAvailable: Optional[bool] = False
    userLat: Optional[float] = 6.9271
    userLon: Optional[float] = 79.8612
    sortBy: Optional[str] = "recommended"  # recommended, distance, price, speed, rating

# --- Range Prediction Schemas ---
class RangePredictRequest(BaseModel):
    soc: float = Field(..., ge=0.0, le=100.0, example=75.0)
    batteryCapacityKWh: float = Field(default=60.0, gt=0, example=64.0)
    speedKmH: float = Field(default=60.0, ge=0, example=65.0)
    temperatureC: float = Field(default=28.0, example=30.0)
    energyConsumptionKWhPer100Km: Optional[float] = Field(default=15.0, example=14.5)
    acOn: Optional[bool] = Field(default=False, example=True)
    drivingMode: Optional[str] = Field(default="Normal", example="Eco")
    vehicleModel: Optional[str] = Field(default="Hyundai Kona Electric", example="Hyundai Kona Electric")

class RangePredictResult(BaseModel):
    remainingRangeKm: float
    confidenceScore: float
    source: str  # 'mock' or 'trained-model'
    modelName: str
    factors: Dict[str, Any]
    timestamp: str

# --- Queue Prediction Schemas ---
class QueuePredictRequest(BaseModel):
    stationId: str = Field(..., example="CS-CMB-001")
    totalChargers: Optional[int] = Field(default=4, ge=1)
    currentlyOccupied: Optional[int] = Field(default=2, ge=0)
    arrivalHour: Optional[int] = Field(default=17, ge=0, le=23)
    dayOfWeek: Optional[int] = Field(default=3, ge=0, le=6)
    chargingSpeedKw: Optional[float] = Field(default=50.0, gt=0)

class QueuePredictResult(BaseModel):
    stationId: str
    predictedQueueLength: int
    estimatedWaitMinutes: int
    availableChargersNow: int
    congestionLevel: str
    source: str
    modelName: str
    hourlyForecast: List[Dict[str, Any]]
    timestamp: str

# --- Route Optimization Schemas ---
class RouteOptimizeRequest(BaseModel):
    originLat: float = Field(..., example=6.9271)
    originLon: float = Field(..., example=79.8612)
    originName: Optional[str] = Field(default="Colombo", example="Colombo Fort")
    destLat: float = Field(..., example=6.0535)
    destLon: float = Field(..., example=80.2210)
    destName: Optional[str] = Field(default="Galle", example="Galle Dutch Fort")
    currentSoc: float = Field(default=60.0, ge=0, le=100)
    batteryCapacityKWh: float = Field(default=60.0, gt=0)
    consumptionKWhPer100Km: float = Field(default=15.0, gt=0)

class RouteWaypoint(BaseModel):
    name: str
    latitude: float
    longitude: float
    distanceFromOriginKm: float
    remainingSocEstimated: float

class RecommendedChargingStop(BaseModel):
    stationId: str
    name: str
    latitude: float
    longitude: float
    distanceFromOriginKm: float
    arrivalSocEstimated: float
    recommendedChargeToSoc: float
    estimatedChargeTimeMinutes: int
    estimatedCost: float
    chargerSpeedKw: float
    connectorType: str

class RouteOptimizeResult(BaseModel):
    origin: str
    destination: str
    totalDistanceKm: float
    estimatedDriveTimeMinutes: int
    isChargingRequired: bool
    currentEstimatedRangeKm: float
    remainingRangeAtDestinationKm: float
    waypoints: List[RouteWaypoint]
    recommendedChargingStops: List[RecommendedChargingStop]
    totalTripDurationMinutes: int
    totalEstimatedTripCost: float
    energyRequiredKWh: float

# --- Charging Estimator Schemas ---
class ChargingEstimateRequest(BaseModel):
    batteryCapacityKWh: float = Field(..., gt=0, example=64.0)
    currentSoc: float = Field(..., ge=0, le=100, example=20.0)
    targetSoc: float = Field(..., ge=0, le=100, example=80.0)
    chargerPowerKw: float = Field(..., gt=0, example=50.0)
    efficiency: Optional[float] = Field(default=0.90, ge=0.5, le=1.0, example=0.92)

class ChargingEstimateResult(BaseModel):
    energyRequiredKWh: float
    effectiveChargingPowerKw: float
    chargingDurationMinutes: int
    chargingDurationFormatted: str
    recommendedMaxSoc: float
    curveAdjustmentFactor: float

# --- Cost Analysis Schemas ---
class CostEstimateRequest(BaseModel):
    energyKWh: float = Field(..., gt=0, example=35.0)
    pricePerKWh: Optional[float] = Field(default=0.35, gt=0, example=0.35)
    taxRate: Optional[float] = Field(default=0.08, ge=0, example=0.08)
    serviceFee: Optional[float] = Field(default=1.50, ge=0, example=1.50)

class CostEstimateResult(BaseModel):
    baseEnergyCost: float
    taxAmount: float
    serviceFee: float
    totalSessionCost: float
    currency: str = "USD"
    pricePerKWh: float

class MonthlyCostSummary(BaseModel):
    month: str
    year: int
    totalSessions: int
    totalEnergyKWh: float
    totalCost: float
    avgCostPerSession: float
    avgCostPerKWh: float
    savingsVsPetrol: float
    recentSessions: List[Dict[str, Any]]

# --- Dashboard Schemas ---
class DashboardOverviewData(BaseModel):
    vehicle: Dict[str, Any]
    currentSoc: float
    estimatedRangeKm: float
    rangeConfidence: float
    rangeSource: str
    nearbyStationsCount: int
    recommendedStation: Optional[ChargingStationSchema]
    recentChargingSessionsCount: int
    monthlyCostToDate: float
    quickStats: Dict[str, Any]
