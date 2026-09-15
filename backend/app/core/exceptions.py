"""
Base application exception types and their shared JSON error shape.

Domain-specific exceptions (e.g. InvalidCredentials, DroneNotFound) will
subclass AppError in later phases; the handler registered in main.py already
knows how to render any AppError consistently, so new error types never need
new handler wiring.
"""

from fastapi import status


class AppError(Exception):
    """Base class for application errors that should reach the client as JSON."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "The requested resource was not found."


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication is required."


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "You do not have access to this resource."


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    detail = "The resource already exists."


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "A required service is currently unavailable."
