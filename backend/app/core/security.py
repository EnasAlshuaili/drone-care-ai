"""
Password hashing and JWT issuance/verification.

Password hashing choice: bcrypt (via the `bcrypt` package directly, not
passlib — passlib is effectively unmaintained and has had compatibility
breaks with recent bcrypt releases). bcrypt is a purpose-built, widely
audited password hashing algorithm with a built-in per-password salt and a
tunable cost factor, satisfying SRS NFR-01 ("strong algorithm e.g.
bcrypt/argon2"). Argon2 is the more modern alternative; bcrypt was chosen
here for its simpler dependency footprint and long track record — this can
be revisited without a data migration by adding a second verification path
if the hash prefix changes.

bcrypt has a hard 72-byte input limit (rejected, not silently truncated, as
of bcrypt>=4.0). Rather than pre-hashing to dodge the limit (added
complexity not required for MVP), UserCreate/ResetPassword schemas cap
password length at 72 characters — see app/schemas/user.py.

JWT strategy: access tokens are short-lived, stateless JWTs delivered via an
HttpOnly cookie (see app/api/v1/auth.py) rather than returned in the response
body — see that module's docstring for the full rationale. Password-reset
tokens are also JWTs (type="password_reset") so no additional database
columns are needed on `users` to support FR-AUTH-04; a reset token embeds a
hash of the user's *current* password_hash, so it is automatically
invalidated the moment the password actually changes.
"""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
import jwt

from app.core.config import get_settings

ACCESS_TOKEN_TYPE = "access"
PASSWORD_RESET_TOKEN_TYPE = "password_reset"


def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def _encode(payload: dict[str, Any]) -> str:
    settings = get_settings()
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def create_access_token(user_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return _encode(payload)


def decode_access_token(token: str) -> UUID | None:
    """Returns the user id encoded in a valid, non-expired access token, else None."""
    try:
        payload = _decode(token)
    except jwt.PyJWTError:
        return None
    if payload.get("type") != ACCESS_TOKEN_TYPE:
        return None
    try:
        return UUID(payload["sub"])
    except (KeyError, ValueError):
        return None


def _password_fingerprint(password_hash: str) -> str:
    """Short, non-reversible fingerprint of the current password hash, embedded in
    reset tokens so a token minted before a password change is rejected after one."""
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]


def create_password_reset_token(user_id: UUID, current_password_hash: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": PASSWORD_RESET_TOKEN_TYPE,
        "pwfp": _password_fingerprint(current_password_hash),
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_RESET_TOKEN_EXPIRE_MINUTES),
    }
    return _encode(payload)


def get_token_subject(token: str) -> UUID | None:
    """Decodes any validly-signed, unexpired token and returns its subject user id,
    without checking token type or password-hash fingerprint. Used only to identify
    which user a password-reset token claims to belong to, before the full
    verify_password_reset_token() check (which needs that user's password hash
    loaded first) can run."""
    try:
        payload = _decode(token)
    except jwt.PyJWTError:
        return None
    try:
        return UUID(payload["sub"])
    except (KeyError, ValueError):
        return None


def verify_password_reset_token(token: str, current_password_hash: str) -> UUID | None:
    """Returns the user id if the token is valid, unexpired, and still matches the
    user's current password hash, else None."""
    try:
        payload = _decode(token)
    except jwt.PyJWTError:
        return None
    if payload.get("type") != PASSWORD_RESET_TOKEN_TYPE:
        return None
    if payload.get("pwfp") != _password_fingerprint(current_password_hash):
        return None
    try:
        return UUID(payload["sub"])
    except (KeyError, ValueError):
        return None
