#!/bin/bash
# Code Quality Check Script
# Runs various checks to identify code quality issues

set -e

echo "🔍 Running Code Quality Checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# 1. Check for unused dependencies
echo -e "${YELLOW}1. Checking for unused dependencies...${NC}"
if command -v npx &> /dev/null; then
    npx depcheck --ignores="@react-native/*,@babel/*,@types/*,husky,patch-package,prettier,eslint,typescript" 2>&1 || true
else
    echo "  ⚠️  npx not found, skipping dependency check"
fi
echo ""

# 2. Run ESLint
echo -e "${YELLOW}2. Running ESLint...${NC}"
if command -v npx &> /dev/null; then
    npx eslint src/ --format compact --max-warnings 50 2>&1 | head -50 || true
else
    echo "  ⚠️  eslint not found"
fi
echo ""

# 3. Check for large files
echo -e "${YELLOW}3. Checking for large files (>100KB)...${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -size +100k -exec ls -lh {} \; 2>/dev/null || echo "  ✅ No large files found"
echo ""

# 4. Check for duplicate file names
echo -e "${YELLOW}4. Checking for duplicate file names...${NC}"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | awk -F'/' '{print $NF}' | sort | uniq -d | while read filename; do
    if [ ! -z "$filename" ]; then
        echo "  ⚠️  Duplicate: $filename"
        find src -name "$filename" -type f
    fi
done || echo "  ✅ No duplicate filenames found"
echo ""

# 5. Check for TODO/FIXME comments
echo -e "${YELLOW}5. Checking for TODO/FIXME comments...${NC}"
grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -20 || echo "  ✅ No TODOs found"
echo ""

# 6. Check for console.log statements
echo -e "${YELLOW}6. Checking for console.log statements...${NC}"
grep -r "console\.log" src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs echo "  Found console.log statements:"
echo ""

# 7. Check TypeScript compilation
echo -e "${YELLOW}7. Checking TypeScript compilation...${NC}"
if command -v npx &> /dev/null; then
    npx tsc --noEmit 2>&1 | head -30 || true
else
    echo "  ⚠️  tsc not found"
fi
echo ""

echo -e "${GREEN}✅ Code quality check complete!${NC}"
echo ""
echo "💡 Tips:"
echo "  - Review duplicate filenames for consolidation opportunities"
echo "  - Remove or comment out console.log statements before production"
echo "  - Address TODO/FIXME comments when possible"
echo "  - Keep file sizes manageable (<100KB)"

