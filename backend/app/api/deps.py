"""
Shared FastAPI dependencies used across API versions.

get_current_user reads the JWT from the HttpOnly cookie set at login (see
app/api/v1/auth.py for why a cookie was chosen over a bearer token in the
response body) rather than an Authorization header, so there is exactly one
auth transport mechanism in the system.
"""

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.services.user_service import get_user_by_id


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    settings = get_settings()
    token = request.cookies.get(settings.JWT_COOKIE_NAME)
    if not token:
        raise UnauthorizedError("Not authenticated.")

    user_id = decode_access_token(token)
    if user_id is None:
        raise UnauthorizedError("Invalid or expired session.")

    user = get_user_by_id(db, user_id)
    if user is None:
        raise UnauthorizedError("Invalid or expired session.")

    return user
