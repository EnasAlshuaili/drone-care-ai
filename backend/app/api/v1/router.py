"""
Aggregates all v1 API route modules into a single router mounted by main.py.
"""

from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    auth,
    drones,
    flights,
    health,
    maintenance,
    notifications,
    predictions,
    reminders,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(drones.router)
api_router.include_router(flights.router)
api_router.include_router(predictions.router)
api_router.include_router(analytics.router)
api_router.include_router(notifications.router)
api_router.include_router(maintenance.router)
api_router.include_router(reminders.router)
