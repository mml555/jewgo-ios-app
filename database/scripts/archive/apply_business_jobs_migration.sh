#!/bin/bash

# Apply Business Jobs Migration
# This script adds business entity linkage to job listings

set -e

echo "========================================"
echo "Business Jobs Migration"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your database connection string:"
    echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

echo "✅ Database connection found"
echo ""

# Get the migration file path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/../migrations/024_add_business_entity_to_jobs.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Confirm before running
read -p "Do you want to apply this migration? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Run the migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Changes made:"
    echo "  • Added business_entity_id column to job_listings table"
    echo "  • Added index for efficient querying by business"
    echo "  • Updated job_listing_stats view to include business info"
    echo "  • Created business_hiring_summary view for analytics"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your backend server"
    echo "  2. Test job creation with businessEntityId parameter"
    echo "  3. Test fetching jobs for a business using business_id filter"
    echo "  4. Visit a business listing page to see the 'I'm Hiring' section"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi

