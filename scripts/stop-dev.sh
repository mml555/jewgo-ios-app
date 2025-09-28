#!/bin/bash

# JewgoApp Development Environment Stop Script
# This script stops all development services

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

# Function to kill process by PID
kill_process() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_status "Stopping $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Force killing $name..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        print_success "$name stopped"
    else
        print_warning "$name is not running"
    fi
}

# Function to stop Docker services
stop_docker_services() {
    print_status "Stopping Docker services..."
    
    # Get the project root directory
    local script_dir="$(dirname "$0")"
    local project_root="$(cd "$script_dir/.." && pwd)"
    cd "$project_root" || { print_error "Failed to change to project root: $project_root"; return 1; }
    
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose down
        print_success "Docker services stopped"
    else
        print_warning "docker-compose not found, stopping containers manually..."
        
        # Stop containers by name
        docker stop jewgo_postgres jewgo_redis jewgo_mailhog 2>/dev/null || true
        docker rm jewgo_postgres jewgo_redis jewgo_mailhog 2>/dev/null || true
        
        print_success "Docker containers stopped"
    fi
}

# Function to stop backend server
stop_backend() {
    local pid_file="$(dirname "$0")/../logs/backend.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        kill_process "$pid" "Backend Server"
        rm -f "$pid_file"
    else
        print_warning "Backend PID file not found, trying to find and kill backend process..."
        
        # Try to find backend process by port
        local backend_pid=$(lsof -ti:3001 2>/dev/null || true)
        if [ -n "$backend_pid" ]; then
            kill_process "$backend_pid" "Backend Server"
        else
            print_warning "Backend server not found running on port 3001"
        fi
    fi
}

# Function to stop Metro bundler
stop_metro() {
    local pid_file="$(dirname "$0")/../logs/metro.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        kill_process "$pid" "Metro Bundler"
        rm -f "$pid_file"
    else
        print_warning "Metro PID file not found, trying to find and kill Metro process..."
        
        # Try to find Metro process by port
        local metro_pid=$(lsof -ti:8081 2>/dev/null || true)
        if [ -n "$metro_pid" ]; then
            kill_process "$metro_pid" "Metro Bundler"
        else
            print_warning "Metro bundler not found running on port 8081"
        fi
    fi
}

# Function to stop iOS simulator (optional)
stop_ios_simulator() {
    print_status "Stopping iOS Simulator..."
    
    # Kill iOS Simulator app
    pkill -f "Simulator" 2>/dev/null || true
    
    # Kill any React Native processes
    pkill -f "react-native" 2>/dev/null || true
    
    print_success "iOS Simulator stopped"
}

# Function to clean up logs
cleanup_logs() {
    local logs_dir="$(dirname "$0")/../logs"
    
    if [ -d "$logs_dir" ]; then
        print_status "Cleaning up log files..."
        rm -f "$logs_dir"/*.pid
        print_success "Log files cleaned up"
    fi
}

# Function to show final status
show_final_status() {
    echo ""
    print_success "🛑 JewgoApp Development Environment Stopped!"
    echo ""
    echo "Services stopped:"
    echo "  ✅ Docker Services (PostgreSQL, Redis, Mailhog)"
    echo "  ✅ Backend API Server"
    echo "  ✅ Metro Bundler"
    echo "  ✅ iOS Simulator"
    echo ""
    print_status "To start development environment again, run: ./scripts/start-dev.sh"
}

# Function to check if user wants to stop iOS simulator
confirm_stop_ios() {
    echo ""
    read -p "Do you want to stop the iOS Simulator as well? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    echo "🛑 Stopping JewgoApp Development Environment..."
    echo "================================================"
    
    # Stop services in reverse order
    stop_backend
    stop_metro
    
    # Ask about iOS simulator
    if confirm_stop_ios; then
        stop_ios_simulator
    else
        print_status "Keeping iOS Simulator running"
    fi
    
    stop_docker_services
    cleanup_logs
    
    # Show final status
    show_final_status
}

# Handle script interruption
cleanup_on_interrupt() {
    echo ""
    print_warning "Interrupted by user"
    print_status "Attempting to stop services..."
    main
}

trap cleanup_on_interrupt INT

# Run main function
main "$@"
