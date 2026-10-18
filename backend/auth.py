import os
import hashlib
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

try:
    from passlib.context import CryptContext
    from jose import JWTError, jwt
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(password):
        return pwd_context.hash(password)

    def create_access_token(data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

except ImportError:
    # Lightweight standard library fallback
    def verify_password(plain_password, hashed_password):
        return get_password_hash(plain_password) == hashed_password

    def get_password_hash(password):
        return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

    def create_access_token(data: dict):
        import base64
        import json
        payload = {"data": data, "exp": (datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).isoformat()}
        return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
