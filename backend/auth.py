import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300
REFRESH_TOKEN_EXPIRE_DAYS = 7

from persistence import (
    load_persisted_revoked_tokens,
    persist_revoked_token_file,
    load_persisted_users
)

# Persistent token revocation blacklist (synced with disk fallback & MongoDB)
_REVOKED_TOKENS = load_persisted_revoked_tokens()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

import uuid

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def revoke_token(token: str) -> None:
    _REVOKED_TOKENS.add(token)
    persist_revoked_token_file(token)

async def persist_revoked_token(token: str) -> None:
    """Add token to memory blacklist, persist to disk fallback, and write to MongoDB."""
    _REVOKED_TOKENS.add(token)
    persist_revoked_token_file(token)
    try:
        from database import database
        revoked_col = database.get_collection("revoked_tokens")
        await revoked_col.update_one(
            {"token": token},
            {"$set": {"token": token, "revokedAt": datetime.now(timezone.utc)}},
            upsert=True
        )
    except Exception:
        pass

async def load_revoked_tokens() -> None:
    """Hydrate in-memory token revocation blacklist from disk and database on server startup."""
    for t in load_persisted_revoked_tokens():
        _REVOKED_TOKENS.add(t)
    try:
        from database import database
        revoked_col = database.get_collection("revoked_tokens")
        cursor = revoked_col.find({}, {"token": 1})
        async for doc in cursor:
            if "token" in doc and doc["token"]:
                _REVOKED_TOKENS.add(doc["token"])
    except Exception:
        pass

def is_token_revoked(token: str) -> bool:
    return token in _REVOKED_TOKENS

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
import hashlib

# Reusable security scheme for Bearer token
security = HTTPBearer(auto_error=False)

# User store initialized from persistent disk storage
_MEMORY_USERS = load_persisted_users()

def decode_access_token(token: str) -> dict:
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

def decode_refresh_token(token: str) -> dict:
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type: expected refresh token"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try database first for persistent state
    try:
        from database import user_collection
        db_user = None
        if ObjectId.is_valid(user_id):
            db_user = await user_collection.find_one({"_id": ObjectId(user_id)})
        if not db_user:
            db_user = await user_collection.find_one({"_id": user_id})
        
        if db_user:
            db_user["id"] = str(db_user.get("_id", ""))
            _MEMORY_USERS[user_id] = db_user
            return db_user
    except Exception:
        pass

    # Check memory fallback if database is offline or user created during DB outage
    if user_id in _MEMORY_USERS:
        return _MEMORY_USERS[user_id]

    # If payload contains email and role, construct a session user
    email = payload.get("email")
    role = payload.get("role", "customer")
    if email:
        fallback_user = {"id": user_id, "_id": user_id, "email": email, "role": role, "name": payload.get("name", "User")}
        _MEMORY_USERS[user_id] = fallback_user
        return fallback_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_station_owner(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "station_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Station owner role required",
        )
    return current_user

def hash_secret(secret: str) -> str:
    """Securely hash an enrollment secret at rest using bcrypt with salt."""
    secret_bytes = secret.encode("utf-8")[:72]
    return bcrypt.hashpw(secret_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_secret(plain_secret: str, hashed_secret: str) -> bool:
    """Verify plain secret against stored bcrypt hash."""
    try:
        secret_bytes = plain_secret.encode("utf-8")[:72]
        return bcrypt.checkpw(secret_bytes, hashed_secret.encode("utf-8"))
    except Exception:
        return False

async def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    """Returns current user dict if valid Bearer token provided, otherwise None without raising 401."""
    if not credentials or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        # Try database first
        try:
            from database import user_collection
            db_user = None
            if ObjectId.is_valid(user_id):
                db_user = await user_collection.find_one({"_id": ObjectId(user_id)})
            if not db_user:
                db_user = await user_collection.find_one({"_id": user_id})
            if db_user:
                db_user["id"] = str(db_user.get("_id", ""))
                _MEMORY_USERS[user_id] = db_user
                return db_user
        except Exception:
            pass

        if user_id in _MEMORY_USERS:
            return _MEMORY_USERS[user_id]

        email = payload.get("email")
        if email:
            return {"id": user_id, "_id": user_id, "email": email, "role": payload.get("role", "customer"), "name": payload.get("name", "User")}
    except Exception:
        return None
    return None

