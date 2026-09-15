import logging
import sys

import structlog

from app.config import settings

REQUEST_ID_HEADER = "X-Request-ID"


def configure_logging() -> None:
    """JSON logs in every environment; pretty console when debugging locally."""
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    renderer = (
        structlog.dev.ConsoleRenderer()
        if settings.debug
        else structlog.processors.JSONRenderer()
    )

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)


log = structlog.get_logger()


def get_request_id() -> str:
    return str(structlog.contextvars.get_contextvars().get("request_id", "req_unknown"))
