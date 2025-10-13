#!/bin/bash

# Neon Database Setup Script for Jewgo App
# This script runs all necessary migrations on your Neon database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Jewgo App - Neon Database Setup${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set!${NC}"
    echo ""
    echo "Please set it with your Neon connection string:"
    echo "  export DATABASE_URL=\"postgresql://user:pass@host/db?sslmode=require\""
    echo ""
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: psql is not installed!${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Get to the database directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DB_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Database directory: $DB_DIR${NC}"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful!${NC}"
else
    echo -e "${RED}❌ Failed to connect to database${NC}"
    exit 1
fi
echo ""

# Ask about sample data
echo -e "${YELLOW}Do you want to include sample data? (recommended for development)${NC}"
echo "  y = Include sample data"
echo "  n = Schema only (recommended for production)"
read -p "Choice [y/n]: " -n 1 -r
echo ""
INCLUDE_SAMPLE_DATA=$REPLY

# Function to run a SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Skipping: $file (not found)${NC}"
        return
    fi
    
    echo -e "${YELLOW}Running: $description...${NC}"
    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Success: $description${NC}"
    else
        echo -e "${RED}❌ Failed: $description${NC}"
        echo -e "${YELLOW}   Continue anyway? [y/n]:${NC}"
        read -p "" -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Run initial schema
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Step 1: Initial Schema${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

run_sql_file "$DB_DIR/init/01_schema_enhanced.sql" "Core schema (enhanced)"

# Run sample data if requested
if [[ $INCLUDE_SAMPLE_DATA =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}Step 2: Sample Data${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    
    run_sql_file "$DB_DIR/init/02_sample_data_enhanced.sql" "Sample entities data"
    run_sql_file "$DB_DIR/init/03_specials_sample_data.sql" "Sample specials data"
    run_sql_file "$DB_DIR/init/04_events_sample_data.sql" "Sample events data"
    run_sql_file "$DB_DIR/init/04_jobs_sample_data.sql" "Sample jobs data"
    run_sql_file "$DB_DIR/init/05_job_seeker_profiles_sample_data.sql" "Sample job seeker profiles"
fi

# Run migrations
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Step 3: Migrations${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Array of migrations in order
migrations=(
    "008_enhanced_schema_migration.sql:Enhanced schema features"
    "009_enhanced_specials_schema.sql:Specials system"
    "010_specials_performance_optimizations_corrected.sql:Performance optimizations"
    "011_shtetl_stores_schema.sql:Marketplace stores"
    "012_add_category_to_shtetl_stores.sql:Store categories"
    "012_mikvah_synagogue_schema.sql:Religious facilities"
    "013_add_missing_mikvah_synagogue_fields.sql:Additional facility fields"
    "014_jobs_schema.sql:Jobs board"
    "015_normalize_entity_architecture.sql:Entity normalization"
    "016_add_postgis_optimization.sql:Spatial indexing"
    "016_job_seekers_schema.sql:Job seeker profiles"
    "017_simplified_spatial_optimization.sql:Spatial performance"
    "018_enhanced_jobs_schema.sql:Enhanced jobs features"
    "020_complete_jobs_system.sql:Complete jobs system"
    "021_complete_events_system.sql:Events system"
    "021_fix_jobs_table_schema.sql:Jobs table fixes"
    "022_complete_claiming_system.sql:Business claiming"
    "022_events_schema_enhancements.sql:Event enhancements"
    "023_complete_admin_system.sql:Admin dashboard"
)

for migration in "${migrations[@]}"; do
    IFS=':' read -r filename description <<< "$migration"
    run_sql_file "$DB_DIR/migrations/$filename" "$description"
done

# Verification
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Verification${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${YELLOW}Checking tables...${NC}"
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $TABLE_COUNT tables${NC}"
    echo ""
    echo "Key tables:"
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('entities', 'users', 'jwt_keys', 'sessions', 'events', 'jobs', 'reviews') ORDER BY table_name"
else
    echo -e "${RED}❌ No tables found!${NC}"
    exit 1
fi

# Check auth system tables
echo ""
echo -e "${YELLOW}Checking auth system tables...${NC}"
AUTH_TABLES=("jwt_keys" "users" "sessions" "refresh_tokens" "roles" "permissions")
MISSING_AUTH_TABLES=()

for table in "${AUTH_TABLES[@]}"; do
    if psql "$DATABASE_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table'" | grep -q 1; then
        echo -e "${GREEN}✅ $table${NC}"
    else
        echo -e "${RED}❌ $table (missing)${NC}"
        MISSING_AUTH_TABLES+=("$table")
    fi
done

if [ ${#MISSING_AUTH_TABLES[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Warning: Some auth tables are missing!${NC}"
    echo "   Missing: ${MISSING_AUTH_TABLES[*]}"
    echo "   The auth system may not work correctly."
    echo ""
fi

# Final summary
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure DATABASE_URL in Render dashboard"
echo "2. Deploy your backend to Render"
echo "3. Test health endpoint: https://jewgo-app-oyoh.onrender.com/health"
echo ""
echo -e "${GREEN}Database is ready for use! 🎉${NC}"

