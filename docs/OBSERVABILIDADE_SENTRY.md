# Observabilidade — Sentry

Captura automática de exceções não tratadas (backend) e crashes JS (frontend),
com filtragem de PII e amostragem de performance baixa.

## Como ativar

### Backend (FastAPI)
1. Criar projeto no Sentry (free tier basta) → copiar o DSN do projeto backend.
2. Definir no `.env` (nunca commitar):
   ```
   SENTRY_DSN=https://<chave>@<org>.ingest.sentry.io/<projeto>
   ENVIRONMENT=prod        # dev | staging | prod
   SENTRY_RELEASE=kitchenbrain@0.1.0   # opcional
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```
3. Sem `SENTRY_DSN`, a inicialização é no-op (`app/core/sentry.py:init_sentry`).

### Frontend (Expo / React Native)
1. Criar projeto mobile no Sentry → copiar o DSN.
2. Definir a variável de ambiente exposta pelo Expo:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://<chave>@<org>.ingest.sentry.io/<projeto-mobile>
   EXPO_PUBLIC_ENVIRONMENT=production
   ```
3. `npm install` (instala `@sentry/react-native`). Sem DSN, o app exporta o
   componente sem o wrapper do Sentry (no-op).

## O que é filtrado
- **Só 5xx e crashes**: erros HTTP 4xx são descartados pelo `before_send`.
- **PII**: `Authorization`, `Cookie`, `senha`, `password`, `token`, `secret`
  (em qualquer profundidade do evento) são substituídos por `[Filtered]`.
- `send_default_pii=False` em ambos os lados.

## Como testar
- **Backend (dev):** com `ENVIRONMENT=dev`, a rota `GET /dev/raise-error`
  dispara um erro proposital → deve aparecer no dashboard do Sentry com o
  caminho da request. Essa rota não é registrada fora de `dev`.
- **Frontend:** forçar `throw new Error("test")` numa tela → aparece no Sentry
  com breadcrumbs.

## Pendências (follow-up)
- **Source maps do app**: envio para o Sentry no build exige o config plugin do
  `@sentry/react-native` + `expo prebuild`. Não incluído aqui para não forçar
  mudança nativa não validada — abrir card dedicado.
- Performance monitoring detalhado (APM) fora de escopo.
