#!/bin/bash

# Jewgo Database Setup Script
# This script sets up the complete database environment for the Jewgo application

set -e

echo "🚀 Setting up Jewgo Database Environment..."

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

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

print_success "All prerequisites are installed"

# Start Docker services
print_status "Starting Docker services..."
docker-compose up -d

# Wait for database to be ready
print_status "Waiting for database to initialize..."
sleep 10

# Check if database is ready
print_status "Checking database connection..."
for i in {1..30}; do
    if docker exec jewgo_postgres pg_isready -U jewgo_user -d jewgo_dev > /dev/null 2>&1; then
        print_success "Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Verify sample data
print_status "Verifying sample data..."
ENTITY_COUNT=$(docker exec jewgo_postgres psql -U jewgo_user -d jewgo_dev -t -c "SELECT COUNT(*) FROM entities;" 2>/dev/null | tr -d ' ')
if [ "$ENTITY_COUNT" -gt 0 ]; then
    print_success "Sample data loaded successfully ($ENTITY_COUNT entities)"
else
    print_warning "No sample data found in database"
fi

# Setup backend
print_status "Setting up backend API..."
cd backend

if [ ! -f package.json ]; then
    print_error "Backend package.json not found. Please run this script from the project root."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f ../.env.development ]; then
        cp ../.env.development .env
        print_success "Environment file copied to backend directory"
    else
        print_warning "No environment file found. Please create .env.development in project root."
    fi
fi

# Install dependencies
print_status "Installing backend dependencies..."
npm install

print_success "Backend dependencies installed"

# Test database connection from backend
print_status "Testing database connection from backend..."
if node -e "
const { query } = require('./src/database/connection');
query('SELECT 1 as test').then(result => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"; then
    print_success "Backend can connect to database"
else
    print_error "Backend cannot connect to database"
    exit 1
fi

# Start API server for testing
print_status "Testing API server..."
timeout 10s node src/server.js &
SERVER_PID=$!
sleep 3

# Test health endpoint
if curl -s http://localhost:3001/health > /dev/null; then
    print_success "API server is working"
    
    # Test entities endpoint
    ENTITY_RESPONSE=$(curl -s "http://localhost:3001/api/v5/entities?limit=1")
    if echo "$ENTITY_RESPONSE" | grep -q "success.*true"; then
        print_success "API endpoints are working correctly"
    else
        print_warning "API endpoints may not be working correctly"
    fi
else
    print_warning "API server test failed"
fi

# Stop test server
kill $SERVER_PID 2>/dev/null || true

cd ..

# Display summary
echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 Database Information:"
echo "   • Host: localhost"
echo "   • Port: 5433"
echo "   • Database: jewgo_dev"
echo "   • Username: jewgo_user"
echo "   • Password: jewgo_dev_password"
echo ""
echo "🌐 API Information:"
echo "   • URL: http://localhost:3001"
echo "   • Health Check: http://localhost:3001/health"
echo "   • Entities: http://localhost:3001/api/v5/entities"
echo ""
echo "🚀 To start the backend API:"
echo "   cd backend && npm start"
echo ""
echo "📖 For detailed documentation:"
echo "   See docs/database/DATABASE_SETUP.md"
echo ""
echo "🔧 Useful commands:"
echo "   • View database logs: docker logs jewgo_postgres"
echo "   • Connect to database: docker exec -it jewgo_postgres psql -U jewgo_user -d jewgo_dev"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo ""

print_success "Setup complete! 🎉"
