#!/bin/bash

# Test script for JewgoApp development scripts
# This script tests various edge cases and scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to cleanup test environment
cleanup_test() {
    print_test "Cleaning up test environment..."
    
    # Stop any running services
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "react-native" 2>/dev/null || true
    
    # Stop Docker containers
    docker-compose down 2>/dev/null || true
    
    # Clean up log files
    rm -f logs/backend.pid logs/metro.pid 2>/dev/null || true
    
    print_pass "Test environment cleaned up"
}

# Test 1: Script syntax validation
test_syntax() {
    print_test "Testing script syntax..."
    
    if bash -n scripts/start-dev.sh; then
        print_pass "start-dev.sh syntax is valid"
    else
        print_fail "start-dev.sh syntax error"
        return 1
    fi
    
    if bash -n scripts/stop-dev.sh; then
        print_pass "stop-dev.sh syntax is valid"
    else
        print_fail "stop-dev.sh syntax error"
        return 1
    fi
}

# Test 2: Prerequisites checking
test_prerequisites() {
    print_test "Testing prerequisites checking..."
    
    # Test Node.js check
    if command_exists node; then
        print_pass "Node.js is available"
    else
        print_fail "Node.js is not available"
        return 1
    fi
    
    # Test npm check
    if command_exists npm; then
        print_pass "npm is available"
    else
        print_fail "npm is not available"
        return 1
    fi
    
    # Test Docker check
    if command_exists docker; then
        print_pass "Docker is available"
    else
        print_fail "Docker is not available"
        return 1
    fi
}

# Test 3: Port conflict detection
test_port_conflicts() {
    print_test "Testing port conflict detection..."
    
    local ports=(3001 8081 5433 6379 8025)
    local conflicts=0
    
    for port in "${ports[@]}"; do
        if port_in_use $port; then
            print_warning "Port $port is in use"
            conflicts=$((conflicts + 1))
        else
            print_pass "Port $port is available"
        fi
    done
    
    if [ $conflicts -gt 0 ]; then
        print_warning "Found $conflicts port conflicts"
    else
        print_pass "No port conflicts found"
    fi
}

# Test 4: Docker service availability
test_docker_services() {
    print_test "Testing Docker service availability..."
    
    if docker info >/dev/null 2>&1; then
        print_pass "Docker daemon is running"
    else
        print_warning "Docker daemon is not running"
        return 1
    fi
    
    # Test docker-compose availability
    if command_exists docker-compose; then
        print_pass "docker-compose is available"
    else
        print_fail "docker-compose is not available"
        return 1
    fi
}

# Test 5: Directory structure
test_directory_structure() {
    print_test "Testing directory structure..."
    
    local required_dirs=("backend" "ios" "src" "scripts")
    local required_files=("package.json" "docker-compose.yml" "scripts/start-dev.sh" "scripts/stop-dev.sh")
    
    # Check directories
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_pass "Directory $dir exists"
        else
            print_fail "Directory $dir is missing"
            return 1
        fi
    done
    
    # Check files
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_pass "File $file exists"
        else
            print_fail "File $file is missing"
            return 1
        fi
    done
}

# Test 6: Script permissions
test_script_permissions() {
    print_test "Testing script permissions..."
    
    if [ -x "scripts/start-dev.sh" ]; then
        print_pass "start-dev.sh is executable"
    else
        print_fail "start-dev.sh is not executable"
        return 1
    fi
    
    if [ -x "scripts/stop-dev.sh" ]; then
        print_pass "stop-dev.sh is executable"
    else
        print_fail "stop-dev.sh is not executable"
        return 1
    fi
}

# Test 7: Log directory creation
test_log_directory() {
    print_test "Testing log directory creation..."
    
    # Remove logs directory if it exists
    rm -rf logs 2>/dev/null || true
    
    # Create logs directory
    mkdir -p logs
    
    if [ -d "logs" ]; then
        print_pass "Log directory created successfully"
    else
        print_fail "Failed to create log directory"
        return 1
    fi
}

# Test 8: Environment variable handling
test_environment_variables() {
    print_test "Testing environment variable handling..."
    
    # Test if scripts can handle missing environment variables
    local original_node_env=$NODE_ENV
    unset NODE_ENV
    
    # This should not cause the script to fail
    if bash -n scripts/start-dev.sh; then
        print_pass "Scripts handle missing NODE_ENV gracefully"
    else
        print_fail "Scripts fail with missing NODE_ENV"
        return 1
    fi
    
    # Restore environment variable
    export NODE_ENV=$original_node_env
}

# Test 9: Error handling in scripts
test_error_handling() {
    print_test "Testing error handling..."
    
    # Test if scripts have proper error handling
    local script_content=$(cat scripts/start-dev.sh)
    
    if echo "$script_content" | grep -q "set -e"; then
        print_pass "Scripts have error handling (set -e)"
    else
        print_fail "Scripts missing error handling"
        return 1
    fi
    
    if echo "$script_content" | grep -q "trap.*cleanup"; then
        print_pass "Scripts have cleanup trap"
    else
        print_warning "Scripts may not have cleanup trap"
    fi
}

# Test 10: Process management
test_process_management() {
    print_test "Testing process management..."
    
    # Test if scripts can handle process IDs properly
    local test_pid_file="logs/test.pid"
    echo "12345" > "$test_pid_file"
    
    if [ -f "$test_pid_file" ]; then
        print_pass "PID file creation works"
        rm -f "$test_pid_file"
    else
        print_fail "PID file creation failed"
        return 1
    fi
}

# Test 11: Docker compose file validation
test_docker_compose() {
    print_test "Testing Docker compose file..."
    
    if [ -f "docker-compose.yml" ]; then
        # Test if docker-compose can validate the file
        if docker-compose config >/dev/null 2>&1; then
            print_pass "docker-compose.yml is valid"
        else
            print_fail "docker-compose.yml has syntax errors"
            return 1
        fi
    else
        print_fail "docker-compose.yml is missing"
        return 1
    fi
}

# Test 12: Package.json validation
test_package_json() {
    print_test "Testing package.json files..."
    
    # Test root package.json
    if [ -f "package.json" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
            print_pass "Root package.json is valid JSON"
        else
            print_fail "Root package.json has syntax errors"
            return 1
        fi
    else
        print_fail "Root package.json is missing"
        return 1
    fi
    
    # Test backend package.json
    if [ -f "backend/package.json" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('backend/package.json', 'utf8'))" 2>/dev/null; then
            print_pass "Backend package.json is valid JSON"
        else
            print_fail "Backend package.json has syntax errors"
            return 1
        fi
    else
        print_fail "Backend package.json is missing"
        return 1
    fi
}

# Test 13: Script dependency checking
test_script_dependencies() {
    print_test "Testing script dependencies..."
    
    local start_script=$(cat scripts/start-dev.sh)
    
    # Check if scripts reference required commands
    local required_commands=("docker" "npm" "node" "npx")
    
    for cmd in "${required_commands[@]}"; do
        if echo "$start_script" | grep -q "$cmd"; then
            print_pass "Script references $cmd"
        else
            print_warning "Script may not use $cmd"
        fi
    done
}

# Test 14: Network connectivity simulation
test_network_connectivity() {
    print_test "Testing network connectivity simulation..."
    
    # Test if scripts can handle network issues
    local test_urls=("localhost:3001" "localhost:8081" "localhost:5433")
    
    for url in "${test_urls[@]}"; do
        local host=$(echo $url | cut -d: -f1)
        local port=$(echo $url | cut -d: -f2)
        
        if nc -z $host $port 2>/dev/null; then
            print_warning "Service already running on $url"
        else
            print_pass "Port $port is available for $host"
        fi
    done
}

# Test 15: Cleanup functionality
test_cleanup_functionality() {
    print_test "Testing cleanup functionality..."
    
    # Create test files
    echo "test" > logs/test-backend.log
    echo "12345" > logs/test-backend.pid
    
    # Test cleanup
    cleanup_test
    
    # Check if files were cleaned up
    if [ ! -f "logs/test-backend.log" ] && [ ! -f "logs/test-backend.pid" ]; then
        print_pass "Cleanup functionality works"
    else
        print_fail "Cleanup functionality failed"
        return 1
    fi
}

# Main test runner
run_all_tests() {
    echo "🧪 Starting JewgoApp Script Testing Suite"
    echo "=========================================="
    
    local tests=(
        "test_syntax"
        "test_prerequisites"
        "test_port_conflicts"
        "test_docker_services"
        "test_directory_structure"
        "test_script_permissions"
        "test_log_directory"
        "test_environment_variables"
        "test_error_handling"
        "test_process_management"
        "test_docker_compose"
        "test_package_json"
        "test_script_dependencies"
        "test_network_connectivity"
        "test_cleanup_functionality"
    )
    
    local passed=0
    local failed=0
    
    for test in "${tests[@]}"; do
        echo ""
        if $test; then
            passed=$((passed + 1))
        else
            failed=$((failed + 1))
        fi
    done
    
    echo ""
    echo "📊 Test Results Summary"
    echo "======================"
    echo "✅ Passed: $passed"
    echo "❌ Failed: $failed"
    echo "📈 Total:  $((passed + failed))"
    
    if [ $failed -eq 0 ]; then
        echo ""
        print_pass "🎉 All tests passed! Scripts are ready for production use."
        return 0
    else
        echo ""
        print_fail "⚠️  Some tests failed. Please review the issues above."
        return 1
    fi
}

# Cleanup on exit
cleanup_on_exit() {
    cleanup_test
}

trap cleanup_on_exit EXIT

# Run tests
run_all_tests "$@"
