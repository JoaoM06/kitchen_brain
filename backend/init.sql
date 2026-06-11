-- Inicialização do banco de dados KitchenBrain
-- Este script é executado automaticamente pelo PostgreSQL na criação do container

-- Habilitar extensão pg_trgm para busca por similaridade (trigram)
-- REQUISITO DE PRODUÇÃO: a busca de produtos genéricos (barcode/voice) depende
-- desta extensão. Sem ela o backend recusa subir em staging/prod (ver
-- app/main.py:_verify_pg_trgm). Exige privilégio CREATE EXTENSION no Postgres.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Habilitar extensão unaccent para normalização de texto
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Configurar locale brasileiro (opcional, caso precise)
-- SET lc_time = 'pt_BR.UTF-8';
