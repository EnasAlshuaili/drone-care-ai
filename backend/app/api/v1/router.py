"""
Aggregates all v1 API route modules into a single router mounted by main.py.

Future phases add their routers here (maintenance, reminders, notifications,
analytics) rather than mounting them individually in main.py.
"""

from fastapi import APIRouter

from app.api.v1 import auth, drones, flights, health, predictions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(drones.router)
api_router.include_router(flights.router)
api_router.include_router(predictions.router)
