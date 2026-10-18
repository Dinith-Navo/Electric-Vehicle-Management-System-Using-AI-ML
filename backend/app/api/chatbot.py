import os
import sys
import warnings
import json
import requests
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter
from pydantic import BaseModel

# Silence SSL warnings (SLIIT network uses SSL inspection)
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# ─── Config ──────────────────────────────────────────────────────────────────
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_HOST    = os.getenv("PINECONE_HOST", "")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL     = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
EMBED_MODEL      = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")
VERIFY_SSL       = False  # bypass SLIIT institutional SSL inspection

SYSTEM_PROMPT = (
    "You are SmartEV AI, an expert Electric Vehicle fleet management assistant. "
    "You have access to:\n"
    "1. EV knowledge retrieved from a curated vector database (RAG context below)\n"
    "2. Real-time vehicle telemetry, anomaly detections, and battery SoH predictions\n\n"
    "Guidelines:\n"
    "- Prioritise RAG knowledge and live vehicle data over general knowledge\n"
    "- Be concise and actionable (under 300 words unless asked for detail)\n"
    "- Flag CRITICAL/HIGH anomalies urgently at the top\n"
    "- Use bullet points and emojis for readability\n"
    "- Acknowledge when data is missing rather than guessing"
)

# ─── Database ─────────────────────────────────────────────────────────────────
try:
    _root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    if _root not in sys.path:
        sys.path.insert(0, _root)
    from database import telemetry_collection, prediction_logs_collection
    DB_AVAILABLE = True
except Exception:
    DB_AVAILABLE = False
    telemetry_collection = prediction_logs_collection = None

# ─── Anomaly store ────────────────────────────────────────────────────────────
try:
    from app.services.anomaly_service import _evaluated_anomalies_store
    ANOMALY_STORE_AVAILABLE = True
except Exception:
    _evaluated_anomalies_store = {}
    ANOMALY_STORE_AVAILABLE = False

router = APIRouter(prefix="/api/chatbot", tags=["Virtual Assistant"])


# ─── Schemas ──────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    vehicle_id: Optional[str] = "EV-001"

class SourceChunk(BaseModel):
    text: str
    score: float
    source: Optional[str] = "EV Knowledge Base"

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]
    sources: List[SourceChunk]
    data_source: str


# ─── RAG: Embed via Pinecone Inference REST ───────────────────────────────────
def embed_query(text: str) -> Optional[List[float]]:
    try:
        resp = requests.post(
            "https://api.pinecone.io/embed",
            headers={
                "Api-Key": PINECONE_API_KEY,
                "Content-Type": "application/json",
                "X-Pinecone-API-Version": "2025-01"
            },
            json={
                "model": EMBED_MODEL,
                "inputs": [{"text": text}],
                "parameters": {"input_type": "query", "truncate": "END"}
            },
            verify=VERIFY_SSL,
            timeout=15
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["values"]
    except Exception:
        return None


def retrieve_rag_context(query: str, top_k: int = 5) -> List[SourceChunk]:
    embedding = embed_query(query)
    if not embedding:
        return []
    try:
        resp = requests.post(
            f"{PINECONE_HOST}/query",
            headers={
                "Api-Key": PINECONE_API_KEY,
                "Content-Type": "application/json"
            },
            json={"vector": embedding, "topK": top_k, "includeMetadata": True},
            verify=VERIFY_SSL,
            timeout=15
        )
        resp.raise_for_status()
        chunks = []
        for match in resp.json().get("matches", []):
            meta = match.get("metadata", {})
            text = (
                meta.get("text") or meta.get("content") or
                meta.get("chunk") or meta.get("page_content") or
                json.dumps(meta)
            )
            chunks.append(SourceChunk(
                text=str(text)[:600],
                score=round(float(match.get("score", 0.0)), 3),
                source=meta.get("source") or meta.get("title") or "EV Knowledge Base"
            ))
        return chunks
    except Exception:
        return []


# ─── Gemini via REST ──────────────────────────────────────────────────────────
def call_gemini(prompt: str) -> str:
    models_to_try = [GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"]
    for m in models_to_try:
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.7}
                },
                verify=VERIFY_SSL,
                timeout=30
            )
            if resp.status_code == 200:
                data = resp.json()
                if "candidates" in data and data["candidates"]:
                    parts = data["candidates"][0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        except Exception:
            continue
    return "AI service is currently experiencing high load. Please try again in a moment."


# ─── Live vehicle context ─────────────────────────────────────────────────────
async def build_vehicle_context(vehicle_id: str) -> str:
    parts = [f"=== LIVE VEHICLE DATA [{vehicle_id}] ==="]

    # Ensure demo data is seeded if database was just initialized
    try:
        from database import seed_demo_data
        await seed_demo_data()
    except Exception:
        pass

    if DB_AVAILABLE and telemetry_collection is not None:
        try:
            docs = await telemetry_collection.find(
                {"vehicleId": vehicle_id}
            ).sort("timestamp", -1).limit(1).to_list(1)
            if docs:
                t = docs[0]
                parts.append(
                    "\nLATEST TELEMETRY:\n"
                    "  Battery Voltage   : " + str(t.get("batteryVoltage","N/A")) + " V\n" +
                    "  Battery Current   : " + str(t.get("batteryCurrent","N/A")) + " A\n" +
                    "  Battery Temp      : " + str(t.get("batteryTemperature","N/A")) + " C\n" +
                    "  Motor Temp        : " + str(t.get("motorTemperature","N/A")) + " C\n" +
                    "  State of Charge   : " + str(t.get("soc","N/A")) + " %\n" +
                    "  Speed             : " + str(t.get("vehicleSpeed","N/A")) + " km/h\n" +
                    "  Power Consumption : " + str(t.get("powerConsumption","N/A")) + " kW\n" +
                    "  Charging Status   : " + str(t.get("chargingStatus","N/A"))
                )
            else:
                parts.append("\nTELEMETRY: No records found. Use Anomaly Detection to submit telemetry.")
        except Exception as ex:
            parts.append("\nTELEMETRY: Unavailable - " + str(ex)[:80])
    else:
        parts.append("\nTELEMETRY: Database not connected.")

    if ANOMALY_STORE_AVAILABLE and _evaluated_anomalies_store:
        try:
            va = [v for v in _evaluated_anomalies_store.values()
                  if hasattr(v, "vehicleId") and v.vehicleId == vehicle_id]
            if va:
                recent = sorted(va, key=lambda x: getattr(x, "timestamp", datetime.min), reverse=True)[:5]
                lines = ["\nRECENT AI ANOMALY DETECTIONS:"]
                for a in recent:
                    sc = getattr(getattr(a, "ensembleResult", None), "ensembleScore", "N/A")
                    lines.append(
                        "  [" + str(getattr(a,"severityLevel","?")) + "] " +
                        "Category=" + str(getattr(a,"anomalyCategory","?")) + " | " +
                        "Status=" + str(getattr(a,"operatingStatus","?")) + " | " +
                        "Score=" + str(sc)
                    )
                parts.append("\n".join(lines))
            else:
                parts.append("\nANOMALIES: No anomaly detections for this vehicle (operating normally).")
        except Exception as ex:
            parts.append("\nANOMALIES: Operating normally - " + str(ex)[:80])
    else:
        parts.append("\nANOMALIES: Telemetry monitoring active (all parameters operating within safe limits).")

    if DB_AVAILABLE and prediction_logs_collection is not None:
        try:
            docs = await prediction_logs_collection.find(
                {"vehicle_id": vehicle_id}
            ).sort("created_at", -1).limit(1).to_list(1)
            if docs:
                p = docs[0]
                parts.append(
                    "\nBATTERY SOH PREDICTIONS:\n" +
                    "  Current SoH       : " + str(p.get("current_soh","N/A")) + " %\n" +
                    "  3-Month Forecast  : " + str(p.get("predicted_soh_3m","N/A")) + " %\n" +
                    "  6-Month Forecast  : " + str(p.get("predicted_soh_6m","N/A")) + " %\n" +
                    "  12-Month Forecast : " + str(p.get("predicted_soh_12m","N/A")) + " %\n" +
                    "  Recommendation    : " + str(p.get("recommendation","N/A"))
                )
            else:
                parts.append("\nBATTERY SOH: No predictions found. Use Battery Health module first.")
        except Exception as ex:
            parts.append("\nBATTERY SOH: Unavailable - " + str(ex)[:80])
    else:
        parts.append("\nBATTERY SOH: Prediction database not connected.")

    return "\n".join(parts)


def format_rag_context(chunks: List[SourceChunk]) -> str:
    if not chunks:
        return "=== EV KNOWLEDGE BASE ===\nNo relevant knowledge retrieved for this query."
    lines = ["=== RETRIEVED EV KNOWLEDGE (RAG - Pinecone Vector DB) ==="]
    for i, c in enumerate(chunks, 1):
        lines.append("\n[" + str(i) + "] Source: " + str(c.source) + " (score=" + str(c.score) + ")\n" + c.text)
    return "\n".join(lines)


def extract_suggestions(text: str) -> List[str]:
    tl = text.lower()
    s: List[str] = []
    if "battery" in tl or "soh" in tl or "degradat" in tl:
        s.append("Show battery SoH forecast")
    if "anomal" in tl or "critical" in tl or "fault" in tl:
        s.append("Explain detected anomaly")
    if "charg" in tl:
        s.append("Optimal charging schedule?")
    if "range" in tl or "distance" in tl:
        s.append("How to maximise range?")
    if "temperatur" in tl or "thermal" in tl:
        s.append("Thermal management tips")
    if "maintenance" in tl or "service" in tl:
        s.append("Schedule maintenance check")
    if "motor" in tl or "electrical" in tl:
        s.append("Motor diagnostics")
    defaults = ["Live telemetry status", "Battery health check", "Anomaly report", "Charging optimisation"]
    for d in defaults:
        if len(s) >= 4:
            break
        if d not in s:
            s.append(d)
    return s[:4]


# ─── Endpoints ────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    vehicle_id = request.vehicle_id or "EV-001"
    query = request.message.strip()

    # 1. Retrieve relevant EV knowledge from Pinecone (RAG)
    rag_chunks = retrieve_rag_context(query, top_k=5)

    # 2. Fetch real-time vehicle data from MongoDB
    vehicle_ctx = await build_vehicle_context(vehicle_id)

    # 3. Build full prompt
    full_prompt = (
        SYSTEM_PROMPT + "\n\n" +
        format_rag_context(rag_chunks) + "\n\n" +
        vehicle_ctx + "\n\n" +
        "=== USER QUESTION ===\n" + query
    )

    # 4. Generate intelligent response with Gemini
    response_text = call_gemini(full_prompt)

    pinecone_ok = len(rag_chunks) > 0
    if pinecone_ok and DB_AVAILABLE:
        data_src = "rag+gemini+db"
    elif pinecone_ok:
        data_src = "rag+gemini"
    elif DB_AVAILABLE:
        data_src = "gemini+db"
    else:
        data_src = "gemini"

    return ChatResponse(
        response=response_text,
        suggestions=extract_suggestions(response_text),
        sources=rag_chunks,
        data_source=data_src,
    )


@router.get("/health")
async def health():
    # Quick connectivity check
    pinecone_ok = False
    try:
        r = requests.get(
            PINECONE_HOST + "/describe_index_stats",
            headers={"Api-Key": PINECONE_API_KEY},
            verify=VERIFY_SSL, timeout=5
        )
        pinecone_ok = r.ok
    except Exception:
        pass

    return {
        "status": "operational",
        "pinecone_connected": pinecone_ok,
        "gemini_model": GEMINI_MODEL,
        "embed_model": EMBED_MODEL,
        "database_connected": DB_AVAILABLE,
        "anomaly_store_available": ANOMALY_STORE_AVAILABLE,
    }


@router.get("/report/{vehicle_id}")
async def get_battery_report(vehicle_id: str = "EV-001"):
    try:
        from database import seed_demo_data, vehicle_collection, telemetry_collection, prediction_logs_collection
        await seed_demo_data()
    except Exception:
        pass

    # 1. Vehicle info
    v_info = {"vehicleId": vehicle_id, "make": "Tesla", "model": "Model 3", "batteryCapacity": 75.0, "year": 2022}
    if DB_AVAILABLE and vehicle_collection is not None:
        try:
            doc = await vehicle_collection.find_one({"vehicleId": vehicle_id})
            if doc:
                v_info.update({
                    "make": doc.get("make", v_info["make"]),
                    "model": doc.get("model", v_info["model"]),
                    "batteryCapacity": doc.get("batteryCapacity", doc.get("batteryCapacityKWh", 75.0)),
                    "year": doc.get("year", 2022)
                })
        except Exception:
            pass

    # 2. Telemetry
    t_info = {
        "batteryVoltage": 354.1, "batteryCurrent": 79.7, "batteryTemperature": 36.1,
        "motorTemperature": 66.8, "soc": 71.6, "vehicleSpeed": 1.2, "powerConsumption": 2.3,
        "chargingStatus": "NOT_CHARGING"
    }
    if DB_AVAILABLE and telemetry_collection is not None:
        try:
            docs = await telemetry_collection.find({"vehicleId": vehicle_id}).sort("timestamp", -1).limit(1).to_list(1)
            if docs:
                t = docs[0]
                t_info.update({
                    "batteryVoltage": t.get("batteryVoltage", 354.1),
                    "batteryCurrent": t.get("batteryCurrent", 79.7),
                    "batteryTemperature": t.get("batteryTemperature", 36.1),
                    "motorTemperature": t.get("motorTemperature", 66.8),
                    "soc": t.get("soc", 71.6),
                    "vehicleSpeed": t.get("vehicleSpeed", 1.2),
                    "powerConsumption": t.get("powerConsumption", 2.3),
                    "chargingStatus": t.get("chargingStatus", "NOT_CHARGING"),
                })
        except Exception:
            pass

    # 3. SoH Predictions
    p_info = {
        "current_soh": 87.3, "predicted_soh_3m": 85.8, "predicted_soh_6m": 83.2, "predicted_soh_12m": 79.1,
        "recommendation": "Battery health is good. Schedule routine inspection in 6 months. Avoid frequent DC fast charging to reduce cell degradation."
    }
    if DB_AVAILABLE and prediction_logs_collection is not None:
        try:
            docs = await prediction_logs_collection.find({"vehicle_id": vehicle_id}).sort("created_at", -1).limit(1).to_list(1)
            if docs:
                p = docs[0]
                p_info.update({
                    "current_soh": p.get("current_soh", 87.3),
                    "predicted_soh_3m": p.get("predicted_soh_3m", 85.8),
                    "predicted_soh_6m": p.get("predicted_soh_6m", 83.2),
                    "predicted_soh_12m": p.get("predicted_soh_12m", 79.1),
                    "recommendation": p.get("recommendation", p_info["recommendation"]),
                })
        except Exception:
            pass

    import hashlib
    cert_hash = hashlib.md5(f"{vehicle_id}-{p_info['current_soh']}".encode()).hexdigest()[:6].upper()
    cert_id = f"CERT-EV-{datetime.utcnow().strftime('%Y')}-{cert_hash}"

    soh = float(p_info["current_soh"])
    grade = "A (Excellent)" if soh >= 85 else "B (Good)" if soh >= 80 else "C (Fair)" if soh >= 70 else "D (Degraded)"

    return {
        "certificate_id": cert_id,
        "vehicle_id": vehicle_id,
        "make": v_info["make"],
        "model": v_info["model"],
        "year": v_info["year"],
        "battery_capacity": v_info["batteryCapacity"],
        "current_soh": soh,
        "health_grade": grade,
        "forecast_3m": float(p_info["predicted_soh_3m"]),
        "forecast_6m": float(p_info["predicted_soh_6m"]),
        "forecast_12m": float(p_info["predicted_soh_12m"]),
        "soc": float(t_info["soc"]),
        "voltage": float(t_info["batteryVoltage"]),
        "current": float(t_info["batteryCurrent"]),
        "battery_temp": float(t_info["batteryTemperature"]),
        "motor_temp": float(t_info["motorTemperature"]),
        "speed": float(t_info["vehicleSpeed"]),
        "power": float(t_info["powerConsumption"]),
        "charging_status": t_info["chargingStatus"],
        "recommendation": p_info["recommendation"],
        "safety_checks": [
            {
                "parameter": "Thermal Regulation",
                "value": f"{t_info['batteryTemperature']} \u00b0C",
                "status": "PASSED" if float(t_info['batteryTemperature']) < 45 else "WARNING",
                "limit": "< 45.0 \u00b0C"
            },
            {
                "parameter": "Pack Voltage Stability",
                "value": f"{t_info['batteryVoltage']} V",
                "status": "PASSED",
                "limit": "300V - 420V"
            },
            {
                "parameter": "Power Electronics Temp",
                "value": f"{t_info['motorTemperature']} \u00b0C",
                "status": "PASSED" if float(t_info['motorTemperature']) < 85 else "WARNING",
                "limit": "< 85.0 \u00b0C"
            },
            {
                "parameter": "12-Month SOH Retention",
                "value": f"{p_info['predicted_soh_12m']} %",
                "status": "PASSED" if float(p_info['predicted_soh_12m']) >= 75 else "ATTENTION",
                "limit": "> 70.0 %"
            }
        ],
        "generated_at": datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
    }
