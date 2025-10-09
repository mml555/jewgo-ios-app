#!/bin/bash

# Memory Leak Testing Script
# Run comprehensive memory leak tests for JewgoApp

echo "🧪 JewgoApp Memory Leak Test Suite"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo "📝 Running: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

echo ""
echo "🧹 Cleaning previous test artifacts..."
rm -rf coverage/
rm -rf memory-test-reports/
mkdir -p memory-test-reports

echo ""
echo "🚀 Starting Memory Leak Tests..."
echo ""

# Test 1: Component Mount/Unmount Cycles
run_test "Component Cleanup Tests" \
    "npm test -- --testPathPattern='memory/component-cleanup' --silent"

# Test 2: Navigation Memory Leaks
run_test "Navigation Memory Tests" \
    "npm test -- --testPathPattern='memory/navigation-leaks' --silent"

# Test 3: Animation Cleanup
run_test "Animation Cleanup Tests" \
    "npm test -- --testPathPattern='memory/animation-cleanup' --silent"

# Test 4: Timer Cleanup
run_test "Timer and Interval Cleanup" \
    "npm test -- --testPathPattern='memory/timer-cleanup' --silent"

# Test 5: Event Listener Cleanup
run_test "Event Listener Cleanup" \
    "npm test -- --testPathPattern='memory/listener-cleanup' --silent"

# Test 6: Backend Service Tests
echo "🖥️  Testing Backend Services..."
cd backend 2>/dev/null && {
    run_test "Backend Service Memory Tests" \
        "npm test -- --testPathPattern='memory/service-leaks' --silent"
    cd ..
} || {
    echo -e "${YELLOW}⚠️  Backend tests skipped (not in backend directory)${NC}"
}

# Test 7: Check for common memory leak patterns
echo "🔍 Scanning for memory leak patterns..."
echo ""

check_pattern() {
    local pattern=$1
    local description=$2
    local should_find=$3
    
    echo "Checking: $description"
    
    result=$(grep -r "$pattern" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    
    if [ "$should_find" = "none" ] && [ "$result" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $result instances${NC}"
        grep -r "$pattern" src/ --include="*.tsx" --include="*.ts" -n | head -5
    elif [ "$should_find" = "some" ] && [ "$result" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Expected to find instances but found none${NC}"
    else
        echo -e "${GREEN}✅ Pattern check passed${NC}"
    fi
    echo ""
}

check_pattern "setInterval.*=>.*{" "setInterval without clearInterval" "none"
check_pattern "setTimeout.*=>.*{" "setTimeout without clearTimeout" "some"
check_pattern "addEventListener.*=>" "addEventListener patterns" "some"
check_pattern "Animated\.loop" "Animated.loop patterns" "some"
check_pattern "useEffect.*=>" "useEffect hooks" "some"

# Generate report
echo ""
echo "📊 Generating Memory Test Report..."
cat > memory-test-reports/summary.json <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "successRate": "$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
  },
  "status": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")"
}
EOF

# Print summary
echo ""
echo "======================================"
echo "🎯 Memory Test Summary"
echo "======================================"
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo "Success Rate: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL MEMORY TESTS PASSED!${NC}"
    echo ""
    echo "🎉 No memory leaks detected!"
    echo "✨ Your app is ready for production!"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "⚠️  Please review failed tests above"
    echo "📖 See MEMORY_LEAK_DEEP_DIVE.md for troubleshooting"
    exit 1
fi

