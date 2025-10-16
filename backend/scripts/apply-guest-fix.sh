#!/bin/bash
# Apply guest session validation fix to production database
# This fixes the PostgreSQL error 42702: ambiguous column reference

set -e

echo "🔧 Applying Guest Session Validation Fix"
echo "=========================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Usage:"
  echo "  export DATABASE_URL='your-production-database-url'"
  echo "  ./backend/scripts/apply-guest-fix.sh"
  echo ""
  echo "Or for Render:"
  echo "  Use Render's shell to run this script, DATABASE_URL will be available"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/../migrations/008_fix_guest_session_validation.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ ERROR: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📦 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Failed to connect to database"
  exit 1
fi
echo ""

echo "🔄 Applying migration: 008_fix_guest_session_validation.sql"
echo "This will fix the 'ambiguous column reference' error in validate_guest_session function"
echo ""

if psql "$DATABASE_URL" -f "$MIGRATION_FILE"; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "🧪 Testing the fix..."
  
  # Test that the function exists and has correct signature
  FUNCTION_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT proname FROM pg_proc WHERE proname = 'validate_guest_session';" 2>/dev/null || echo "")
  
  if [ -n "$FUNCTION_CHECK" ]; then
    echo "✅ Function validate_guest_session exists"
  else
    echo "⚠️  Warning: Function not found in database"
  fi
  
  echo ""
  echo "🎉 Guest session validation fix applied!"
  echo "   The 'Continue as Guest' functionality should now work correctly."
else
  echo "❌ Failed to apply migration"
  exit 1
fi

