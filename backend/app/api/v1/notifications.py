"""
Notification Center endpoints (SRS §3.6 FR-NOTIF-01/02; System Specification
§11 `/notifications`, `/notifications/{id}/read`, `/notifications/read-all`;
§27 Phase 9).

Notifications have a direct user_id column, so — like analytics, and unlike
flights/predictions' owning-drone chain — listing is scoped straight to
current_user.id inside the query. Addressing a single notification by id
still resolves it and calls ensure_owner() first, exactly like
flights/predictions, so one user can never read or mark another user's
notification as read.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationRead
from app.services import notification_service
from app.services.authorization import ensure_owner
from app.services.notification_service import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total, unread_count = notification_service.list_notifications_for_user(
        db, current_user.id, unread_only=unread_only, limit=limit, offset=offset
    )
    return NotificationListResponse(items=items, total=total, unread_count=unread_count)


@router.put("/read-all", response_model=NotificationListResponse)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification_service.mark_all_read(db, current_user.id)
    items, total, unread_count = notification_service.list_notifications_for_user(db, current_user.id)
    return NotificationListResponse(items=items, total=total, unread_count=unread_count)


@router.put("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = notification_service.get_notification_or_404(db, notification_id)
    ensure_owner(notification.user_id, current_user)
    return notification_service.mark_read(db, notification)
