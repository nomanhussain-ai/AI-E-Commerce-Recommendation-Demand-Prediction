import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.config import settings

_hasher = PasswordHasher(
    time_cost=settings.argon2_time_cost,
    memory_cost=settings.argon2_memory_cost_kib,
    parallelism=settings.argon2_parallelism,
)

TokenType = Literal["access", "refresh"]


# ── passwords ────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _hasher.verify(hashed, plain)
        return True
    except VerifyMismatchError:
        return False


def needs_rehash(hashed: str) -> bool:
    return _hasher.check_needs_rehash(hashed)


# ── opaque token hashing (refresh + reset tokens stored only as sha256) ───────
def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_otp() -> str:
    """6-digit numeric code for email verification, stored only as a sha256 hash."""
    return f"{secrets.randbelow(1_000_000):06d}"


# ── JWT ──────────────────────────────────────────────────────────────────────
def _now() -> datetime:
    return datetime.now(UTC)


def create_token(
    subject: str,
    token_type: TokenType,
    *,
    extra: dict[str, Any] | None = None,
) -> tuple[str, str, datetime]:
    """Return (encoded_jwt, jti, expires_at)."""
    jti = uuid.uuid4().hex
    if token_type == "access":
        expires = _now() + timedelta(minutes=settings.jwt_access_ttl_min)
    else:
        expires = _now() + timedelta(days=settings.jwt_refresh_ttl_days)

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": jti,
        "iat": int(_now().timestamp()),
        "exp": int(expires.timestamp()),
    }
    if extra:
        payload.update(extra)

    encoded = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded, jti, expires


def decode_token(token: str, *, expected_type: TokenType | None = None) -> dict[str, Any]:
    """Raise ``jwt.PyJWTError`` on any problem (expired, bad signature, wrong type)."""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if expected_type is not None and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"expected {expected_type} token")
    return payload
