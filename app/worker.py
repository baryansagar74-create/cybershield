"""
ProfileGuard – Celery worker configuration.

Uses Redis as both broker and result backend.
"""

from __future__ import annotations

from celery import Celery

from app.config import settings

celery_app = Celery(
    "profileguard",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone=settings.timezone,
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks in app packages
celery_app.autodiscover_tasks(["app"])
