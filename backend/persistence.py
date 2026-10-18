import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Set

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / ".data"
DATA_DIR.mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / "users.json"
VEHICLES_FILE = DATA_DIR / "vehicles.json"
TELEMETRY_FILE = DATA_DIR / "telemetry.json"
STATIONS_FILE = DATA_DIR / "stations.json"
REVOKED_TOKENS_FILE = DATA_DIR / "revoked_tokens.json"

def save_json(filepath: Path, data: Any) -> None:
    """Safely persist in-memory fallback state to local disk storage."""
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.warning(f"Failed to save fallback persistence file {filepath}: {e}")

def load_json(filepath: Path, default_val: Any) -> Any:
    """Load persisted fallback state across service restarts."""
    if not filepath.exists():
        return default_val
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load fallback persistence file {filepath}: {e}")
        return default_val

# User persistence
def load_persisted_users() -> Dict[str, Any]:
    return load_json(USERS_FILE, {})

def persist_user(user_id: str, user_dict: Dict[str, Any]) -> None:
    users = load_persisted_users()
    users[user_id] = user_dict
    save_json(USERS_FILE, users)

# Vehicle persistence
def load_persisted_vehicles() -> List[Dict[str, Any]]:
    return load_json(VEHICLES_FILE, [])

def persist_vehicle(vehicle_dict: Dict[str, Any]) -> None:
    vehicles = load_persisted_vehicles()
    vehicles.append(vehicle_dict)
    save_json(VEHICLES_FILE, vehicles)

# Telemetry persistence
def load_persisted_telemetry() -> List[Dict[str, Any]]:
    return load_json(TELEMETRY_FILE, [])

def persist_telemetry(telemetry_dict: Dict[str, Any]) -> None:
    telemetry = load_persisted_telemetry()
    telemetry.append(telemetry_dict)
    if len(telemetry) > 200:
        telemetry.pop(0)
    save_json(TELEMETRY_FILE, telemetry)

# Station updates persistence
def load_persisted_stations() -> Dict[str, Any]:
    return load_json(STATIONS_FILE, {})

def persist_station(station_id: str, station_dict: Dict[str, Any]) -> None:
    stations = load_persisted_stations()
    stations[station_id] = station_dict
    save_json(STATIONS_FILE, stations)

# Revoked tokens persistence
def load_persisted_revoked_tokens() -> Set[str]:
    tokens_list = load_json(REVOKED_TOKENS_FILE, [])
    return set(tokens_list)

def persist_revoked_token_file(token: str) -> None:
    tokens = load_persisted_revoked_tokens()
    tokens.add(token)
    save_json(REVOKED_TOKENS_FILE, list(tokens))
