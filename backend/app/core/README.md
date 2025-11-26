# `backend/app/core`

Configurações e utilitários globais.

- `config.py` – Classe `Settings` (Pydantic) que lê variáveis de ambiente para banco, chaves secretas, integrações etc.
- `security.py` – Hash de senha, geração/validação de JWT, helpers OAuth2.

Sempre declare novas variáveis em `config.py` e importe a instância `settings` onde precisar.
