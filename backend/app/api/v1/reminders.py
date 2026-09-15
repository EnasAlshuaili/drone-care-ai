"""
Reminder endpoints (SRS §3.7 FR-REM-01; System Specification §11
`/reminders` GET; §27 Phase 10).

Reminders have a direct drone_id (not user_id) column, so — unlike
notifications/analytics, which scope straight by user_id — listing joins
through Drone to scope to the current user's own drones, the same pattern
flights/predictions/maintenance use. There is no create/update/delete
endpoint: reminders are entirely server-generated (see
app/services/reminder_service.py) and the API table lists only GET.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.reminder import ReminderListResponse
from app.services import reminder_service
from app.services.reminder_service import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=ReminderListResponse)
def list_reminders(
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder_service.generate_due_reminders_for_user(db, current_user.id)
    items, total = reminder_service.list_active_reminders_for_user(db, current_user.id, limit, offset)
    return ReminderListResponse(items=items, total=total)
