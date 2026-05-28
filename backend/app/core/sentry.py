"""
Integração com o Sentry (error tracking).

O `before_send` é mantido em nível de módulo, sem importar o `sentry_sdk`,
para ser testável de forma isolada e para que o módulo carregue mesmo quando o
pacote não está instalado. A inicialização real importa o SDK sob demanda.
"""
from typing import Any, Optional

from app.core.config import settings

# Chaves cujo valor nunca deve sair do processo para o Sentry.
SENSITIVE_KEYS = {
    "password",
    "senha",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "secret_key",
    "authorization",
    "cookie",
    "set-cookie",
}

REDACTED = "[Filtered]"


def _scrub(value: Any) -> Any:
    """Substitui recursivamente valores de chaves sensíveis por [Filtered]."""
    if isinstance(value, dict):
        return {
            k: (REDACTED if str(k).lower() in SENSITIVE_KEYS else _scrub(v))
            for k, v in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_scrub(v) for v in value]
    return value


def before_send(event: dict, hint: Optional[dict]) -> Optional[dict]:
    """
    Filtra eventos antes de enviar ao Sentry:
    - Descarta exceções HTTP 4xx (são erros tratados/esperados; só 5xx e
      crashes reais interessam).
    - Remove PII (Authorization, cookies, senha, token) de qualquer parte do
      evento.
    """
    exc = None
    if hint and "exc_info" in hint:
        exc = hint["exc_info"][1]

    status = getattr(exc, "status_code", None)
    if isinstance(status, int) and 400 <= status < 500:
        return None

    if isinstance(event, dict):
        return _scrub(event)
    return event


def init_sentry() -> bool:
    """
    Inicializa o Sentry se SENTRY_DSN estiver configurado.
    Retorna True se inicializou, False caso contrário.
    """
    if not settings.SENTRY_DSN:
        return False

    try:
        import sentry_sdk
    except ImportError:
        return False

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        release=settings.SENTRY_RELEASE or None,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        # Não envia headers/cookies/corpo por padrão; o before_send é defesa extra.
        send_default_pii=False,
        before_send=before_send,
    )
    return True
