#!/bin/bash

# Setup Job Seekers Database Script
# This script creates the job_seekers table and populates it with sample data

set -e # Exit on error

echo "🔧 Setting up Job Seekers database..."

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
echo "🔄 Running Job Seekers Schema Migration..."
run_sql_file "$PROJECT_ROOT/database/migrations/016_job_seekers_schema.sql" "Job seekers table creation"

# Insert sample data
echo ""
echo "📦 Inserting Sample Job Seekers Data..."
run_sql_file "$PROJECT_ROOT/database/migrations/017_job_seekers_sample_data.sql" "Sample job seekers data insertion"

echo ""
echo "✨ Job Seekers database setup complete!"
echo ""
echo "📊 Verifying setup..."

# Verify the setup
JOB_SEEKER_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM job_seekers WHERE is_active = true;")
echo "✅ Active job seekers in database: $JOB_SEEKER_COUNT"

# Show sample job seekers
echo ""
echo "📋 Sample job seekers:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT 
    full_name,
    title,
    experience_years,
    experience_level,
    city,
    state,
    availability
  FROM job_seekers
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 5;
"

echo ""
echo "🎉 All done! You can now start using the job seekers feature."
echo ""
echo "Next steps:"
echo "1. Restart the backend server: cd backend && npm start"
echo "2. Navigate to the Jobs tab in the app"
echo "3. Toggle to 'Job Seekers' mode to view candidates"
echo ""
