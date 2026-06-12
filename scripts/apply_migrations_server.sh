#!/bin/bash
# Executa este script NO SERVIDOR onde o Supabase está rodando
# Usage: bash apply_migrations_server.sh
#
# Encontra o container postgres do Supabase e aplica as migrations.

set -e

DB_PASS="vX2680eDloYFj9wgYasierkxzeNtq9Oj"
DB_USER="postgres"
DB_NAME="postgres"

echo "=== Med Fit — Aplicando Migrations ==="
echo ""

# Encontrar o container postgres do Supabase
CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "supabase.*db|supabase-db|postgres" | head -1)
if [ -z "$CONTAINER" ]; then
  echo "Container postgres não encontrado. Listando containers:"
  docker ps --format "{{.Names}}"
  exit 1
fi
echo "Container postgres encontrado: $CONTAINER"
echo ""

# Função para executar SQL
run_sql() {
  local label="$1"
  local sql="$2"
  echo "Executando: $label"
  echo "$sql" | docker exec -i "$CONTAINER" \
    psql -U "$DB_USER" -d "$DB_NAME" --no-password \
    -v ON_ERROR_STOP=0 2>&1 | tail -5
  echo ""
}

run_file() {
  local label="$1"
  local file="$2"
  echo "Executando arquivo: $label"
  docker exec -i "$CONTAINER" \
    psql -U "$DB_USER" -d "$DB_NAME" --no-password \
    -v ON_ERROR_STOP=0 < "$file" 2>&1 | tail -10
  echo ""
}

# Aplicar migrations
echo "--- Migration 1: Schema ---"
run_file "0001_schema.sql" "/data/medfit/supabase/migrations/0001_schema.sql"

echo "--- Migration 2: RLS ---"
run_file "0002_rls.sql" "/data/medfit/supabase/migrations/0002_rls.sql"

echo "--- Migration 3: pgvector ---"
run_file "0003_vector.sql" "/data/medfit/supabase/migrations/0003_vector.sql"

echo "--- Migration 4: Storage ---"
run_file "0004_storage.sql" "/data/medfit/supabase/migrations/0004_storage.sql"

echo "--- Seed ---"
run_file "seed.sql" "/data/medfit/supabase/seed.sql"

echo "=== Concluído! ==="
