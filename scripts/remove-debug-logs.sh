#!/bin/bash
# Script to identify and help remove debugging console.log statements

echo "📊 Debugging Console.log Report"
echo "================================"
echo ""

# Count total console statements
total=$(grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
echo "Total console statements found: $total"
echo ""

# Group by file
echo "Files with console statements:"
grep -r "console\." src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn
echo ""

# Find debug logs (with emojis or DEBUG markers)
echo "Debug logs (with emojis or DEBUG):"
grep -r "console\.log.*[🎁🔍👤✅❌📊🎯🔄💾🚀]" src --include="*.ts" --include="*.tsx" | head -20
echo ""

# Find files that should use logger instead
echo "Files that should use logger utility instead of console:"
grep -r "console\." src/screens --include="*.ts" --include="*.tsx" -l | head -10
echo ""

echo "📝 Recommendation:"
echo "  1. Keep: src/utils/logger.ts (proper logging system)"
echo "  2. Keep: src/utils/analytics.ts (analytics tracking)"
echo "  3. Remove: Debug console.logs with emojis in screens"
echo "  4. Replace: console.error with logger.error()"
echo ""
echo "Run './scripts/remove-debug-logs.sh cleanup' to generate sed commands for removal"

