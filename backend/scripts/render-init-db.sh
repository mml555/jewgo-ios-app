#!/bin/bash
set -e

echo "🔧 Initializing Render database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📦 Connected to database"

# Path to SQL files (adjust based on where script is run from)
if [ -d "../database/init" ]; then
  SQL_DIR="../database/init"
elif [ -d "./database/init" ]; then
  SQL_DIR="./database/init"
else
  echo "❌ ERROR: Cannot find database/init directory"
  exit 1
fi

echo "📂 Using SQL files from: $SQL_DIR"

# Run initialization scripts in order
echo "1️⃣ Creating extensions..."
psql $DATABASE_URL -f "$SQL_DIR/01-create-extensions.sql" -v ON_ERROR_STOP=1

echo "2️⃣ Creating tables..."
psql $DATABASE_URL -f "$SQL_DIR/02-create-tables.sql" -v ON_ERROR_STOP=1

echo "3️⃣ Creating indexes..."
psql $DATABASE_URL -f "$SQL_DIR/03-create-indexes.sql" -v ON_ERROR_STOP=1

echo "4️⃣ Setting up RBAC..."
psql $DATABASE_URL -f "$SQL_DIR/04-create-rbac.sql" -v ON_ERROR_STOP=1

echo "5️⃣ Setting up guest system..."
psql $DATABASE_URL -f "$SQL_DIR/05-create-guest-system.sql" -v ON_ERROR_STOP=1

echo "6️⃣ Seeding initial data..."
psql $DATABASE_URL -f "$SQL_DIR/06-seed-data.sql" -v ON_ERROR_STOP=1

# Optional: Run migrations if they exist
if [ -d "../database/migrations" ]; then
  echo "7️⃣ Running migrations..."
  for migration in ../database/migrations/*.sql; do
    if [ -f "$migration" ]; then
      echo "   Running: $(basename $migration)"
      psql $DATABASE_URL -f "$migration" || echo "   ⚠️ Migration already applied or failed (continuing...)"
    fi
  done
fi

# Verify setup
echo "✅ Checking database setup..."
ENTITY_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM entities;" 2>/dev/null || echo "0")
USER_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
TABLE_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

echo "📊 Database Statistics:"
echo "   Tables created: $(echo $TABLE_COUNT | xargs)"
echo "   Users: $(echo $USER_COUNT | xargs)"
echo "   Entities: $(echo $ENTITY_COUNT | xargs)"

echo ""
echo "✅ Database initialization complete!"
echo "🎉 Your Render database is ready for use"

