import logging
import sys

from pythonjsonlogger import jsonlogger

SENSITIVE_FIELDS = frozenset({"senha", "password", "token", "access_token", "authorization"})


class _SensitiveDataFilter(logging.Filter):
    """Redacts sensitive field values added via logger.extra before formatting."""

    def filter(self, record: logging.LogRecord) -> bool:
        for field in SENSITIVE_FIELDS:
            if hasattr(record, field):
                setattr(record, field, "***REDACTED***")
        return True


class _JsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter that uses structlog-style key names (event/level/timestamp)."""

    def add_fields(self, log_record: dict, record: logging.LogRecord, message_dict: dict) -> None:
        super().add_fields(log_record, record, message_dict)
        if "levelname" in log_record:
            log_record["level"] = log_record.pop("levelname")
        if "asctime" in log_record:
            log_record["timestamp"] = log_record.pop("asctime")
        if "message" in log_record:
            log_record["event"] = log_record.pop("message")


def configure_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    root = logging.getLogger()
    root.setLevel(log_level.upper())
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_SensitiveDataFilter())

    if log_format == "json":
        handler.setFormatter(
            _JsonFormatter(
                fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
                datefmt="%Y-%m-%dT%H:%M:%SZ",
            )
        )
    else:
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%dT%H:%M:%SZ",
            )
        )

    root.addHandler(handler)
    logging.getLogger("uvicorn.access").propagate = False
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
