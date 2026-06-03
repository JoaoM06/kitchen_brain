import json
import logging
from io import StringIO

from pythonjsonlogger import jsonlogger

from app.core.logging import _SensitiveDataFilter


def _make_capture_handler() -> tuple[logging.StreamHandler, StringIO]:
    """Returns a handler that writes JSON logs to a StringIO buffer."""
    stream = StringIO()
    handler = logging.StreamHandler(stream)
    handler.addFilter(_SensitiveDataFilter())
    handler.setFormatter(jsonlogger.JsonFormatter(fmt="%(levelname)s %(message)s"))
    return handler, stream


def _setup_capture(name: str, log_level: str = "DEBUG") -> tuple[logging.Logger, StringIO]:
    root = logging.getLogger()
    root.setLevel(log_level.upper())
    root.handlers.clear()

    handler, stream = _make_capture_handler()
    root.addHandler(handler)

    return logging.getLogger(name), stream


def test_exception_log_has_required_fields():
    """logger.exception deve produzir JSON com level ERROR e stack trace."""
    logger, stream = _setup_capture("test.exc")

    try:
        raise ValueError("boom")
    except ValueError:
        logger.exception("something went wrong")

    output = stream.getvalue().strip()
    assert output, "Nenhum log produzido"

    record = json.loads(output)
    assert record.get("levelname") == "ERROR"
    assert "something went wrong" in json.dumps(record)
    # Stack trace deve aparecer como exc_info ou embutido na mensagem
    assert "ValueError" in json.dumps(record)


def test_sensitive_field_redacted():
    """Campos sensíveis em extra= não devem aparecer com valor real no log."""
    logger, stream = _setup_capture("test.redact")

    logger.info("login attempt", extra={"password": "s3cr3t", "user": "alice"})

    output = stream.getvalue().strip()
    assert output, "Nenhum log produzido"

    record = json.loads(output)
    assert record.get("password") == "***REDACTED***", "password deveria ser redactado"
    assert record.get("user") == "alice", "campos não-sensíveis não devem ser alterados"
    assert "s3cr3t" not in output, "valor real da senha não deve aparecer no log"
