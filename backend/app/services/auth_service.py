"""
Authentication business logic: credential verification and password-reset
token handling. Endpoint wiring lives in app/api/v1/auth.py.
"""

import logging

from sqlalchemy.orm import Session

from app.core.security import (
    create_password_reset_token,
    get_token_subject,
    hash_password,
    verify_password,
    verify_password_reset_token,
)
from app.models.user import User
from app.services.user_service import get_user_by_email, get_user_by_id, update_password

logger = logging.getLogger("dronecare.auth")


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def request_password_reset(db: Session, email: str) -> None:
    """
    Generates a reset token for the given email, if it belongs to an account.

    PROVISIONAL: email delivery is out of scope for this phase (BRD §4 marks
    email notifications as a future decision). No email is sent. For local
    development/testing only, the token is written to the server log instead
    of being delivered — it is never returned in the API response, since a
    real deployment must not expose it that way. The response is identical
    whether or not the email exists, so this endpoint cannot be used to
    enumerate registered accounts.
    """
    user = get_user_by_email(db, email)
    if user is None:
        return
    token = create_password_reset_token(user.id, user.password_hash)
    logger.info(
        "PROVISIONAL dev-only password reset token (no email service configured) "
        "for user_id=%s: %s",
        user.id,
        token,
    )


def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Returns True if the token was valid and the password was updated."""
    # The subject claim only identifies which user's password_hash to check the
    # token's fingerprint against — it is not trusted until that check passes.
    claimed_user_id = get_token_subject(token)
    if claimed_user_id is None:
        return False

    user = get_user_by_id(db, claimed_user_id)
    if user is None:
        return False

    verified_id = verify_password_reset_token(token, user.password_hash)
    if verified_id is None or verified_id != user.id:
        return False

    update_password(db, user, hash_password(new_password))
    return True
