#!/bin/bash

# JewgoApp Development Environment Startup Script
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to check if Docker is running
check_docker() {
    if ! command_exists docker; then
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
    
    # Get the project root directory
    local script_dir="$(dirname "$0")"
    local project_root="$(cd "$script_dir/.." && pwd)"
    cd "$project_root" || { print_error "Failed to change to project root: $project_root"; return 1; }
    print_status "Changed to project root: $project_root"
    
    # Remove the version line from docker-compose.yml to avoid warnings
    if grep -q "^version:" docker-compose.yml; then
        print_status "Removing obsolete version line from docker-compose.yml..."
        sed -i '' '/^version:/d' docker-compose.yml
    fi
    
    docker-compose up -d
    
    # Wait for services to be ready
    wait_for_service "localhost" "5433" "PostgreSQL"
    wait_for_service "localhost" "6379" "Redis"
    wait_for_service "localhost" "8025" "Mailhog"
    
    print_success "All Docker services are running!"
    echo "  - PostgreSQL: localhost:5433"
    echo "  - Redis: localhost:6379"
    echo "  - Mailhog Web UI: http://localhost:8025"
}

# Function to start backend server
start_backend() {
    print_status "Starting backend server..."
    
    cd "$(dirname "$0")/../backend"
    
    # Check if backend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Ensure logs directory exists
    mkdir -p ../logs
    
    # Start backend server in background
    print_status "Starting backend server on port 3001..."
    npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Save PID for cleanup
    echo $BACKEND_PID > ../logs/backend.pid
    
    # Wait for backend to be ready
    wait_for_service "localhost" "3001" "Backend API"
    
    print_success "Backend server is running!"
    echo "  - API: http://localhost:3001"
    echo "  - Health Check: http://localhost:3001/health"
    echo "  - API Docs: http://localhost:3001/api/v5"
}

# Function to start Metro bundler
start_metro() {
    print_status "Starting Metro bundler..."
    
    # Get the project root directory
    local script_dir="$(dirname "$0")"
    local project_root="$(cd "$script_dir/.." && pwd)"
    cd "$project_root" || { print_error "Failed to change to project root: $project_root"; return 1; }
    print_status "Changed to project root: $project_root"
    
    # Check if frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Ensure logs directory exists
    mkdir -p logs
    
    # Start Metro bundler in background
    print_status "Starting Metro bundler on port 8081..."
    npx react-native start > logs/metro.log 2>&1 &
    METRO_PID=$!
    
    # Save PID for cleanup
    echo $METRO_PID > logs/metro.pid
    
    # Wait for Metro to be ready
    wait_for_service "localhost" "8081" "Metro Bundler"
    
    print_success "Metro bundler is running!"
    echo "  - Metro: http://localhost:8081"
}

# Function to build and run iOS app
run_ios_app() {
    print_status "Building and running iOS app..."
    
    # Get the project root directory
    local script_dir="$(dirname "$0")"
    local project_root="$(cd "$script_dir/.." && pwd)"
    cd "$project_root" || { print_error "Failed to change to project root: $project_root"; return 1; }
    print_status "Changed to project root: $project_root"
    
    # Check if iOS dependencies are installed
    if [ ! -d "ios/Pods" ]; then
        print_status "Installing iOS dependencies..."
        cd ios && pod install && cd ..
    fi
    
    print_status "Building and launching iOS app..."
    npx react-native run-ios --simulator="iPhone 17 Pro"
    
    print_success "iOS app launched successfully!"
}

# Function to create logs directory
create_logs_directory() {
    mkdir -p "$(dirname "$0")/../logs"
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
    echo "  📝 Backend: logs/backend.log"
    echo "  📝 Metro: logs/metro.log"
    echo ""
    print_warning "To stop all services, run: ./scripts/stop-dev.sh"
}

# Main execution
main() {
    echo "🚀 Starting JewgoApp Development Environment..."
    echo "================================================"
    
    # Create logs directory
    create_logs_directory
    
    # Check prerequisites
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi
    
    if ! command_exists npm; then
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
