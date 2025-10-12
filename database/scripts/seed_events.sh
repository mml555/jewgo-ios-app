#!/bin/bash

# Events Sample Data Seeding Script
# This script populates the events system with sample data

set -e  # Exit on error

echo "========================================="
echo "Events Sample Data Seeding Script"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f "$(dirname "$0")/../../backend/.env" ]; then
    echo "Error: .env file not found. Please create backend/.env with database credentials."
    exit 1
fi

# Load environment variables
source "$(dirname "$0")/../../backend/.env" || {
    echo "Error: Could not load environment variables from backend/.env"
    exit 1
}

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-jewgo}"
DB_USER="${DB_USER:-postgres}"

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if database is accessible
echo "Checking database connection..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || {
    echo "Error: Cannot connect to database. Please check your credentials."
    exit 1
}
echo "✓ Database connection successful"
echo ""

# Run migrations first (if not already run)
echo "Checking if events schema exists..."
EVENTS_TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events');")

if [ "$EVENTS_TABLE_EXISTS" = " f" ]; then
    echo "Events table not found. Running events migration first..."
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../migrations/021_complete_events_system.sql"
    echo "✓ Events migration completed"
fi

# Check if enhancement migration has been run
ENHANCEMENT_VIEW_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'v_events_enhanced');")

if [ "$ENHANCEMENT_VIEW_EXISTS" = " f" ]; then
    echo "Enhancement views not found. Running enhancement migration..."
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../migrations/022_events_schema_enhancements.sql"
    echo "✓ Events enhancement migration completed"
fi
echo ""

# Check if sample data already exists
EVENTS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM events;")
EVENTS_COUNT=$(echo $EVENTS_COUNT | tr -d ' ')

if [ "$EVENTS_COUNT" -gt "0" ]; then
    echo "Warning: Database already contains $EVENTS_COUNT events."
    read -p "Do you want to add more sample events? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Seeding cancelled."
        exit 0
    fi
fi

# Run the sample data script
echo "Seeding events sample data..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../init/04_events_sample_data.sql"

echo ""
echo "========================================="
echo "✓ Events sample data seeded successfully!"
echo "========================================="
echo ""

# Show summary
echo "Summary:"
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE event_date > NOW()) as upcoming_events,
    COUNT(*) FILTER (WHERE is_paid = false) as free_events,
    COUNT(*) FILTER (WHERE is_paid = true) as paid_events
FROM events;
"

echo ""
echo "You can now view events in the app!"
echo ""
