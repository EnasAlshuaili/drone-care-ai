"""
Authentication endpoints (SRS §3.1: FR-AUTH-01..05).

JWT storage strategy — HttpOnly cookie, not a token in the JSON response body:
the frontend is a React SPA, which makes it vulnerable to XSS; a token
readable by JavaScript (e.g. stored in localStorage or returned in a body
for the client to stash itself) can be exfiltrated by any injected script.
An HttpOnly cookie is invisible to JavaScript entirely, which is the
standard mitigation. The cookie is set with SameSite=Lax (frontend and
backend are same-site in both local dev and typical same-domain production
deployments) and Secure=settings.COOKIE_SECURE (True once served over
HTTPS). This is the *only* auth transport in the system — there is no
parallel Authorization-header/bearer-token path — per the "do not mix
multiple authentication strategies" instruction.

PROVISIONAL: registration does not auto-login (SRS §6 leaves this open) —
the client must call /login separately after /register. Logout, being
stateless JWT, simply clears the cookie; it does not revoke the token before
its natural expiry (no server-side blocklist yet — see Phase 2 report,
Provisional Decisions).
"""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, LoginRequest, MessageResponse, ResetPasswordRequest
from app.schemas.user import UserCreate, UserRead
from app.services import auth_service, user_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, user_id) -> None:
    settings = get_settings()
    token = create_access_token(user_id)
    response.set_cookie(
        key=settings.JWT_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register", response_model=UserRead, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> User:
    return user_service.create_user(db, user_in)


@router.post("/login", response_model=UserRead)
def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)
    if user is None:
        # Generic error — does not reveal whether the email or password was wrong.
        raise UnauthorizedError("Incorrect email or password.")
    _set_auth_cookie(response, user.id)
    return user


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> dict[str, str]:
    settings = get_settings()
    response.delete_cookie(key=settings.JWT_COOKIE_NAME, path="/")
    return {"message": "Logged out."}


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    auth_service.request_password_reset(db, payload.email)
    # Same response whether or not the email exists, to avoid account enumeration.
    return {"message": "If that email is registered, a password reset has been initiated."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    success = auth_service.reset_password(db, payload.token, payload.new_password)
    if not success:
        raise UnauthorizedError("Invalid or expired reset token.")
    return {"message": "Password has been reset."}
