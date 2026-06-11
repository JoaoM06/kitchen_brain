# Auditoria de dependências (backend)

Card 8 — referência: `docs/AUDITORIA_DESENVOLVIMENTO.md`, seção 16.1.
Auditoria executada em 2026-06-11 com `pip-audit`.

## Validação das versões "data-like" (suspeita do card)

Todas as versões com formato de data/calver são **legítimas** (confirmado via
`pip index versions`) — não há typosquatting nem pacote falso:

| Pacote | Versão pinada | Latest (2026-06-11) | Observação |
|--------|---------------|---------------------|------------|
| certifi | 2025.10.5 → **2026.5.20** | 2026.5.20 | CalVer normal do certifi; atualizado para o bundle de CAs mais recente |
| numpy | 2.3.4 | 2.4.6 | Real; **mantido** (bump pode quebrar faster-whisper/onnxruntime) |
| protobuf | 6.33.0 → **6.33.5** | 7.35.0 | Real; patch aplicado por CVE (ver abaixo); major 7.x evitado |
| setuptools | 80.9.0 | 82.0.1 | Real; sem CVE — mantido |

## Correções de segurança aplicadas neste PR

`pip-audit` apontou 29 vulnerabilidades em 13 pacotes. Foram aplicados os
upgrades de **baixo risco** (patch/minor dentro do mesmo major, na stack
HTTP/cripto), validados com `pytest` (sem novas falhas) e `pip check` (sem
conflitos):

| Pacote | De | Para | Corrige |
|--------|----|----|---------|
| certifi | 2025.10.5 | 2026.5.20 | bundle de CAs |
| cryptography | 46.0.2 | 46.0.7 | PYSEC-2026-35/36, CVE-2026-26007 |
| ecdsa | 0.19.1 | 0.19.2 | CVE-2026-33936 |
| filelock | 3.20.0 | 3.20.3 | CVE-2025-68146, CVE-2026-22701 |
| idna | 3.11 | 3.15 | CVE-2026-45409 |
| protobuf | 6.33.0 | 6.33.5 | CVE-2026-0994 |
| pyasn1 | 0.6.1 | 0.6.3 | CVE-2026-23490, CVE-2026-30922 |
| python-dotenv | 1.1.1 | 1.2.2 | CVE-2026-28684 |
| python-multipart | 0.0.20 | 0.0.27 | CVE-2026-24486/40347/42561 |
| requests | 2.32.5 | 2.33.0 | CVE-2026-25645 |
| urllib3 | 2.5.0 | 2.7.0 | PYSEC-2026-141, CVE-2025-66418/66471, CVE-2026-21441 |

Resultado: de **29 → 8** vulnerabilidades.

## Vulnerabilidades conscientemente diferidas

Não atualizadas neste PR por risco de quebra — devem virar cards próprios
(política do card: "um por vez"):

| Pacote | ID | Fix | Motivo do adiamento |
|--------|----|----|---------------------|
| pytest | CVE-2025-71176 | 9.0.3 | Major bump; dependência apenas de teste |
| starlette | PYSEC-2026-161, CVE-2025-62727 | 0.49.1 / 1.0.1 | Acoplado ao fastapi 0.119 — exige validar compatibilidade |
| scrapy | PYSEC-2017-83, GHSA-cwxj-rr6w-m6w7 | 2.14.2 | Crawler; avaliar quebra antes de subir |

Esses IDs entram na allowlist do workflow de auditoria (abaixo) para o job
ficar verde e ainda assim capturar **novas** vulnerabilidades.

## Política de atualização

- `pip-audit` deve rodar semanalmente e em PRs que alterem
  `backend/requirements.txt`.
- Ao introduzir um CVE novo, o job falha e força triagem.

> **Pendência (ação humana):** o workflow abaixo não pôde ser commitado nesta
> branch porque a conta com permissão de push não tem o escopo `workflow` do
> GitHub. Adicione o arquivo como `.github/workflows/security-audit.yml` (o
> João/owner tem o escopo necessário).

```yaml
name: Security Audit

on:
  schedule:
    # Toda segunda-feira às 06:00 UTC (03:00 BRT)
    - cron: "0 6 * * 1"
  workflow_dispatch: {}
  pull_request:
    branches: [desenvolvimento, homologacao]
    paths:
      - "backend/requirements.txt"
      - ".github/workflows/security-audit.yml"

jobs:
  pip-audit:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Instalar pip-audit
        run: |
          python -m pip install --upgrade pip
          pip install pip-audit
      - name: Auditar dependências (pip-audit)
        run: |
          pip-audit -r requirements.txt --progress-spinner off \
            --ignore-vuln CVE-2025-71176 \
            --ignore-vuln PYSEC-2026-161 \
            --ignore-vuln CVE-2025-62727 \
            --ignore-vuln PYSEC-2017-83 \
            --ignore-vuln GHSA-cwxj-rr6w-m6w7
```
