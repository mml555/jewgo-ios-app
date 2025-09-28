#!/bin/bash

# Simplified JewgoApp Development Environment Startup Script
# This script starts all necessary services for development and testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the absolute project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
print_status "Project root: $PROJECT_ROOT"

# Change to project root
cd "$PROJECT_ROOT"

# Function to check if Docker is running
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker is not running. Starting Docker..."
        open -a Docker
        
        # Wait for Docker to start
        print_status "Waiting for Docker to start..."
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker info >/dev/null 2>&1; then
                print_success "Docker is running!"
                break
            fi
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_error "Docker failed to start. Please start Docker Desktop manually."
            exit 1
        fi
    else
        print_success "Docker is already running"
    fi
}

# Function to start Docker services
start_docker_services() {
    print_status "Starting Docker services (PostgreSQL, Redis, Mailhog)..."
    
    # Remove the version line from docker-compose.yml to avoid warnings
    if grep -q "^version:" docker-compose.yml; then
        print_status "Removing obsolete version line from docker-compose.yml..."
        sed -i '' '/^version:/d' docker-compose.yml
    fi
    
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    while ! nc -z localhost 5433 2>/dev/null; do
        echo -n "."
        sleep 1
    done
    print_success "PostgreSQL is ready!"
    
    print_status "Waiting for Redis to be ready..."
    while ! nc -z localhost 6379 2>/dev/null; do
        echo -n "."
        sleep 1
    done
    print_success "Redis is ready!"
    
    print_status "Waiting for Mailhog to be ready..."
    while ! nc -z localhost 8025 2>/dev/null; do
        echo -n "."
        sleep 1
    done
    print_success "Mailhog is ready!"
    
    print_success "All Docker services are running!"
    echo "  - PostgreSQL: localhost:5433"
    echo "  - Redis: localhost:6379"
    echo "  - Mailhog Web UI: http://localhost:8025"
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Check if backend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Ensure logs directory exists
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Start backend server in background
    print_status "Starting backend server on port 3001..."
    npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Save PID for cleanup
    echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
    
    # Wait for backend to be ready
    print_status "Waiting for Backend API to be ready..."
    while ! nc -z localhost 3001 2>/dev/null; do
        echo -n "."
        sleep 1
    done
    print_success "Backend API is ready!"
    
    print_success "Backend server is running!"
    echo "  - API: http://localhost:3001"
    echo "  - Health Check: http://localhost:3001/health"
    echo "  - API Docs: http://localhost:3001/api/v5"
}

# Function to start Metro bundler
start_metro() {
    print_status "Starting Metro bundler..."
    
    cd "$PROJECT_ROOT"
    
    # Check if frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Ensure logs directory exists
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Start Metro bundler in background
    print_status "Starting Metro bundler on port 8081..."
    npx react-native start > "$PROJECT_ROOT/logs/metro.log" 2>&1 &
    METRO_PID=$!
    
    # Save PID for cleanup
    echo $METRO_PID > "$PROJECT_ROOT/logs/metro.pid"
    
    # Wait for Metro to be ready
    print_status "Waiting for Metro Bundler to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost 8081 2>/dev/null; then
            print_success "Metro Bundler is ready!"
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Metro Bundler failed to start after $max_attempts attempts"
        print_status "Check logs: tail -f $PROJECT_ROOT/logs/metro.log"
        return 1
    fi
    
    print_success "Metro bundler is running!"
    echo "  - Metro: http://localhost:8081"
}

# Function to build and run iOS app
run_ios_app() {
    print_status "Building and running iOS app..."
    
    cd "$PROJECT_ROOT"
    
    # Check if iOS dependencies are installed
    if [ ! -d "ios/Pods" ]; then
        print_status "Installing iOS dependencies..."
        cd ios && pod install && cd "$PROJECT_ROOT"
    fi
    
    print_status "Building and launching iOS app..."
    npx react-native run-ios --simulator="iPhone 17 Pro"
    
    print_success "iOS app launched successfully!"
}

# Function to show status
show_status() {
    echo ""
    print_success "🚀 JewgoApp Development Environment is Ready!"
    echo ""
    echo "Services running:"
    echo "  ✅ Docker Services (PostgreSQL, Redis, Mailhog)"
    echo "  ✅ Backend API Server"
    echo "  ✅ Metro Bundler"
    echo "  ✅ iOS App (Simulator)"
    echo ""
    echo "Access points:"
    echo "  📱 iOS Simulator: Already launched"
    echo "  🔗 Backend API: http://localhost:3001"
    echo "  📊 Metro Bundler: http://localhost:8081"
    echo "  🐘 PostgreSQL: localhost:5433"
    echo "  📧 Mailhog: http://localhost:8025"
    echo ""
    echo "Logs:"
    echo "  📝 Backend: $PROJECT_ROOT/logs/backend.log"
    echo "  📝 Metro: $PROJECT_ROOT/logs/metro.log"
    echo ""
    print_warning "To stop all services, run: ./scripts/stop-dev.sh"
}

# Main execution
main() {
    echo "🚀 Starting JewgoApp Development Environment..."
    echo "================================================"
    
    # Check prerequisites
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Start services in order
    check_docker
    start_docker_services
    start_backend
    start_metro
    run_ios_app
    
    # Show final status
    show_status
}

# Trap to handle cleanup on script exit
cleanup() {
    print_warning "Cleaning up on exit..."
    # Note: We don't kill processes here as they should keep running
    # Use stop-dev.sh to properly stop all services
}

trap cleanup EXIT

# Run main function
main "$@"
