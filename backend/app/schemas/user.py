"""
Request/response schemas for user registration and profile data.

UserRead deliberately excludes password_hash — it is never serialized back
to a client under any circumstance.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

# bcrypt has a hard 72-byte input limit (see core/security.py); capping here
# avoids a runtime hashing error rather than silently truncating.
# Minimum length is a provisional complexity rule (SRS FR-AUTH-01 leaves the
# exact policy TBD) — see Phase 2 report, Provisional Decisions.
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    password_confirm: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)

    @model_validator(mode="after")
    def passwords_match(self) -> "UserCreate":
        if self.password != self.password_confirm:
            raise ValueError("password and password_confirm do not match")
        return self


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime
    updated_at: datetime
