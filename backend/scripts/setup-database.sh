#!/bin/bash
# Setup database for production deployment
# Usage: ./scripts/setup-database.sh [database-url]

set -e

echo "🗄️  Jewgo Database Setup Script"
echo "================================"
echo ""

# Check if database URL is provided
if [ -z "$1" ]; then
  echo "❌ Error: Database URL required"
  echo "Usage: ./scripts/setup-database.sh [database-url]"
  echo ""
  echo "Example:"
  echo "  ./scripts/setup-database.sh postgresql://user:pass@host:5432/dbname"
  echo ""
  echo "Or use Railway CLI:"
  echo "  railway run ./scripts/setup-database.sh \$DATABASE_URL"
  exit 1
fi

DATABASE_URL=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATABASE_DIR="$PROJECT_ROOT/database"

echo "📍 Project root: $PROJECT_ROOT"
echo "📁 Database scripts: $DATABASE_DIR"
echo ""

# Function to run SQL file
run_sql() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo "⏳ Running: $description"
    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
      echo "✅ Success: $description"
    else
      echo "⚠️  Warning: $description (may have already been applied)"
    fi
  else
    echo "⚠️  Skipping: $file (not found)"
  fi
  echo ""
}

# Test database connection
echo "🔌 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Failed to connect to database"
  exit 1
fi
echo ""

# Run migrations in order
echo "🚀 Running database migrations..."
echo ""

# Core schema
run_sql "$DATABASE_DIR/init/01_schema.sql" "Core schema"

# Sample data
run_sql "$DATABASE_DIR/init/02_sample_data.sql" "Sample data"

# Specials
run_sql "$DATABASE_DIR/init/03_specials_sample_data.sql" "Specials data"

# Events
run_sql "$DATABASE_DIR/init/04_events_sample_data.sql" "Events data"

# Jobs
run_sql "$DATABASE_DIR/init/04_jobs_sample_data.sql" "Jobs data"

# Job seeker profiles
run_sql "$DATABASE_DIR/init/05_job_seeker_profiles_sample_data.sql" "Job seeker profiles"

# Run backend migrations
echo "🔧 Running backend migrations..."
echo ""

for migration in "$PROJECT_ROOT/backend/migrations"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    run_sql "$migration" "Backend migration: $filename"
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Database setup complete!"
echo ""
echo "📊 Verify your database:"
echo "  psql $DATABASE_URL -c 'SELECT COUNT(*) FROM entities;'"
echo ""
echo "🏥 Test your backend health endpoint:"
echo "  curl https://your-app-url.railway.app/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

