#!/bin/bash

# Setup Jobs Database Script
# This script creates the jobs table and populates it with sample data

set -e # Exit on error

echo "🔧 Setting up Jobs database..."

# Determine script directory and project root first
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
  export $(cat "$PROJECT_ROOT/backend/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/.env" ]; then
  export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-jewgo_dev}"
DB_USER="${DB_USER:-jewgo_user}"
export PGPASSWORD="${DB_PASSWORD:-jewgo_dev_password}"

echo "📊 Database: $DB_NAME"
echo "🏠 Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Function to run SQL file
run_sql_file() {
  local file=$1
  local description=$2
  
  echo "📝 $description..."
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
    echo "✅ $description completed"
  else
    echo "❌ Failed to execute $description"
    exit 1
  fi
}

echo "📁 Project root: $PROJECT_ROOT"

# Run migrations
echo ""
echo "🔄 Running Jobs Schema Migration..."
run_sql_file "$PROJECT_ROOT/database/migrations/014_jobs_schema.sql" "Jobs table creation"

# Insert sample data
echo ""
echo "📦 Inserting Sample Jobs Data..."
run_sql_file "$PROJECT_ROOT/database/init/04_jobs_sample_data.sql" "Sample jobs data insertion"

echo ""
echo "✨ Jobs database setup complete!"
echo ""
echo "📊 Verifying setup..."

# Verify the setup
JOB_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM jobs WHERE is_active = true;")
echo "✅ Active jobs in database: $JOB_COUNT"

# Show sample jobs
echo ""
echo "📋 Sample jobs:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT 
    title,
    job_type,
    location_type,
    compensation_display,
    city,
    state
  FROM jobs
  WHERE is_active = true
  ORDER BY posted_date DESC
  LIMIT 5;
"

echo ""
echo "🎉 All done! You can now start using the jobs feature."
echo ""
echo "Next steps:"
echo "1. Restart the backend server: cd backend && npm start"
echo "2. Navigate to the Jobs tab in the app"
echo "3. View and interact with job listings"
echo ""
