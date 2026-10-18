import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.anomaly_detection.routes import router as anomaly_router
from app.modules.battery_health.routes import router as battery_router
from app.modules.intelligent_service.routes import router as intelligent_router
from app.modules.charging_queue.routes import router as charging_router
from app.core.config import settings, MODEL_DIR
from app.core.security import get_password_hash, verify_password, create_access_token

client = TestClient(app)


def test_core_security():
    hashed = get_password_hash("testpassword")
    assert verify_password("testpassword", hashed) is True
    assert verify_password("wrongpassword", hashed) is False
    token = create_access_token({"sub": "user123"})
    assert isinstance(token, str) and len(token) > 10


def test_core_config():
    assert settings.API_V1_STR == "/api/v1"
    assert "models" in MODEL_DIR


def test_all_four_modules_imported():
    assert anomaly_router is not None
    assert battery_router is not None
    assert intelligent_router is not None
    assert charging_router is not None


def test_root_endpoint_all_components():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    comps = data["components"]
    assert "component_1_anomaly_detection" in comps
    assert "component_2_battery_health" in comps
    assert "component_3_and_4_intelligent_charging" in comps
    assert "virtual_assistant" in comps


def test_system_health_all_components():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    comps = data["components"]
    assert "anomaly_detection" in comps
    assert "battery_health" in comps
    assert "intelligent_service" in comps
    assert "charging_optimization" in comps
    assert "virtual_assistant" in comps


def test_virtual_assistant_has_separate_health_endpoint():
    response = client.get("/api/v1/assistant/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "SmartEV Virtual Assistant"
    assert "chatConfigured" in data
    assert "voiceConfigured" in data


def test_virtual_assistant_rejects_blank_question():
    response = client.post(
        "/api/v1/assistant/chat",
        json={"question": "   ", "history": []},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Question must not be blank."


def test_virtual_assistant_chat_uses_backend_providers(monkeypatch):
    from app.api import virtual_assistant

    monkeypatch.setattr(virtual_assistant.settings, "OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr(virtual_assistant.settings, "PINECONE_API_KEY", "test-key")
    monkeypatch.setattr(
        virtual_assistant.settings,
        "PINECONE_HOST",
        "https://test-index.example",
    )

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def raise_for_status(self):
            pass

        def json(self):
            return self.payload

    class FakeAsyncClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            if url.endswith("/embed"):
                return FakeResponse({"data": [{"values": [0.1, 0.2]}]})
            if url.endswith("/query"):
                return FakeResponse(
                    {"matches": [{"metadata": {"text": "EV battery context"}}]}
                )
            return FakeResponse(
                {"choices": [{"message": {"content": "EV assistant answer"}}]}
            )

    monkeypatch.setattr(virtual_assistant.httpx, "AsyncClient", FakeAsyncClient)
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "question": "How does an EV battery work?",
            "history": [{"role": "user", "content": "Tell me about EVs."}],
        },
    )

    assert response.status_code == 200
    assert response.json() == {"answer": "EV assistant answer", "sourceCount": 1}


def test_virtual_assistant_transcribes_audio_on_backend(monkeypatch):
    from app.api import virtual_assistant

    monkeypatch.setattr(virtual_assistant.settings, "GROQ_API_KEY", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"text": "What is EV range?"}

    class FakeAsyncClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            assert url.endswith("/audio/transcriptions")
            assert kwargs["files"]["file"][1] == b"fake audio"
            return FakeResponse()

    monkeypatch.setattr(virtual_assistant.httpx, "AsyncClient", FakeAsyncClient)
    response = client.post(
        "/api/v1/assistant/transcribe",
        files={"file": ("voice.m4a", b"fake audio", "audio/m4a")},
    )

    assert response.status_code == 200
    assert response.json() == {"text": "What is EV range?"}
