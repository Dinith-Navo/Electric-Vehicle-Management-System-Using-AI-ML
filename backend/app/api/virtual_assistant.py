from typing import Literal

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/assistant", tags=["Virtual Assistant"])

MAX_AUDIO_BYTES = 25 * 1024 * 1024
SYSTEM_PROMPT = """You are a professional and friendly Electric Vehicle (EV) expert assistant.
Answer clearly and naturally using the supplied context when relevant. Do not mention
documents or context as the source of your expertise. Only answer questions about EVs,
including EV technology, batteries, charging, models, range, performance, environmental
impact, policy, maintenance, buying advice, comparisons with combustion vehicles,
autonomous driving, and EV market trends.
For unrelated questions, respond exactly: "I'm sorry, but your question does not appear
to be related to electric vehicles. I can only assist with EV-related queries. Please
ask me anything about electric vehicles!"
If you lack enough information about an EV topic, say so and ask the user to rephrase.
Be conversational, warm, and professional, and refer to prior conversation when useful."""


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    history: list[ConversationMessage] = Field(default_factory=list, max_length=20)


def _require_settings(*names: str) -> None:
    missing = [name for name in names if not getattr(settings, name)]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Virtual assistant is not configured. Set these backend environment variables: {', '.join(missing)}.",
        )


def _raise_provider_error(provider: str, error: httpx.HTTPError) -> None:
    status = error.response.status_code if isinstance(error, httpx.HTTPStatusError) else "unavailable"
    logger.error("Virtual assistant %s request failed: %s", provider, error)
    raise HTTPException(
        status_code=502,
        detail=f"The {provider} service request failed (status {status}).",
    ) from error


@router.get("/health")
async def virtual_assistant_health():
    chat_configured = all(
        (
            settings.OPENROUTER_API_KEY,
            settings.PINECONE_API_KEY,
            settings.PINECONE_HOST,
        )
    )
    voice_configured = bool(settings.GROQ_API_KEY)
    return {
        "service": "SmartEV Virtual Assistant",
        "status": "configured" if chat_configured and voice_configured else "needs_configuration",
        "chatConfigured": chat_configured,
        "voiceConfigured": voice_configured,
    }


@router.post("/chat")
async def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be blank.")

    _require_settings("OPENROUTER_API_KEY", "PINECONE_API_KEY", "PINECONE_HOST")

    headers = {
        "Api-Key": settings.PINECONE_API_KEY,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            embedding_response = await client.post(
                "https://api.pinecone.io/embed",
                headers={
                    **headers,
                    "X-Pinecone-API-Version": "2024-10",
                },
                json={
                    "model": settings.PINECONE_EMBED_MODEL,
                    "inputs": [{"text": question}],
                    "parameters": {"input_type": "query", "truncate": "END"},
                },
            )
            embedding_response.raise_for_status()
            embedding_data = embedding_response.json()
            vector = embedding_data["data"][0]["values"]
        except httpx.HTTPError as error:
            _raise_provider_error("Pinecone embedding", error)
        except (KeyError, IndexError, TypeError, ValueError) as error:
            logger.error("Pinecone returned an invalid embedding response: %s", error)
            raise HTTPException(
                status_code=502,
                detail="Pinecone returned an invalid embedding response.",
            ) from error

        try:
            query_response = await client.post(
                f"{settings.PINECONE_HOST.rstrip('/')}/query",
                headers=headers,
                json={"vector": vector, "topK": 5, "includeMetadata": True},
            )
            query_response.raise_for_status()
            matches = query_response.json().get("matches", [])
            if not isinstance(matches, list) or any(
                not isinstance(match, dict) for match in matches
            ):
                raise TypeError("matches must be a list of objects")
        except httpx.HTTPError as error:
            _raise_provider_error("Pinecone search", error)
        except (AttributeError, TypeError, ValueError) as error:
            logger.error("Pinecone returned an invalid search response: %s", error)
            raise HTTPException(
                status_code=502,
                detail="Pinecone returned an invalid search response.",
            ) from error

        context_parts = []
        for match in matches:
            metadata = match.get("metadata", {})
            if not isinstance(metadata, dict):
                raise HTTPException(
                    status_code=502,
                    detail="Pinecone returned invalid match metadata.",
                )
            text = metadata.get("text", "")
            if not isinstance(text, str):
                raise HTTPException(
                    status_code=502,
                    detail="Pinecone returned invalid match text.",
                )
            if text:
                context_parts.append(text)
        context = "\n\n".join(context_parts) or "No relevant context found."
        history_text = "\n".join(
            f"{'Human' if message.role == 'user' else 'AI'}: {message.content}"
            for message in request.history
        )
        user_content = (
            f"Context information:\n{context}\n\n"
            f"Conversation History:\n{history_text}\n\n"
            f"Current Question: {question}"
        )
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[message.model_dump() for message in request.history],
            {"role": "user", "content": user_content},
        ]
        completion_headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "X-Title": settings.OPENROUTER_SITE_NAME,
        }
        if settings.OPENROUTER_SITE_URL:
            completion_headers["HTTP-Referer"] = settings.OPENROUTER_SITE_URL

        try:
            completion_response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=completion_headers,
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )
            completion_response.raise_for_status()
            completion_data = completion_response.json()
            answer = completion_data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPError as error:
            _raise_provider_error("OpenRouter", error)
        except (KeyError, IndexError, TypeError, AttributeError, ValueError) as error:
            logger.error("OpenRouter returned an invalid completion response: %s", error)
            raise HTTPException(
                status_code=502,
                detail="OpenRouter returned an invalid completion response.",
            ) from error

    return {"answer": answer, "sourceCount": len(matches)}


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    _require_settings("GROQ_API_KEY")
    if file.content_type and not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="Uploaded file must be audio.")

    audio_data = await file.read(MAX_AUDIO_BYTES + 1)
    if len(audio_data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file must be 25 MB or smaller.")
    if not audio_data:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                data={"model": "whisper-large-v3", "language": "en"},
                files={
                    "file": (
                        file.filename or "voice.m4a",
                        audio_data,
                        file.content_type or "application/octet-stream",
                    )
                },
            )
            response.raise_for_status()
            transcription = response.json()["text"].strip()
    except httpx.HTTPError as error:
        _raise_provider_error("Groq transcription", error)
    except (KeyError, TypeError, ValueError) as error:
        logger.error("Groq returned an invalid transcription response: %s", error)
        raise HTTPException(
            status_code=502,
            detail="Groq returned an invalid transcription response.",
        ) from error

    return {"text": transcription}
