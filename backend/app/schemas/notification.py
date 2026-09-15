"""
Response schemas for the Notification Center (SRS §3.6 FR-NOTIF-01/02;
Data Dictionary `notifications` table; System Specification §11
`/notifications*`, §27 Phase 9).

There is no client-writable create schema: per System Specification §9
("Notifications and reminders are backend-driven, not client-computed") and
§11's API table (only GET /notifications, PUT .../read, PUT .../read-all —
no POST), notifications are only ever created server-side by
notification_service, never via a request body.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    title: str
    message: str
    is_read: bool
    related_entity_id: uuid.UUID | None
    related_entity_type: str | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
