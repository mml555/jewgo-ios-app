#!/bin/bash

# Database Dashboard Setup Script
# This script helps you set up and test the Database Dashboard

echo "🚀 Setting up Database Dashboard..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start database services
echo "🗄️ Starting database services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Database services failed to start. Check docker-compose logs."
    exit 1
fi

echo "✅ Database services started"

# Install backend dependencies if needed
if [ -d "backend" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ..
fi

# Start backend server in background
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Test the dashboard
echo "🧪 Testing dashboard functionality..."
node scripts/test-dashboard-simple.js

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database Dashboard setup complete!"
    echo ""
    echo "📱 To access the dashboard:"
    echo "1. Open the Jewgo app"
    echo "2. Navigate to Profile tab"
    echo "3. Tap 'Database Dashboard'"
    echo ""
    echo "🔧 Backend is running on http://localhost:3001"
    echo "📊 Dashboard provides real-time database management"
    echo ""
    echo "🛑 To stop the backend server, run: kill $BACKEND_PID"
else
    echo ""
    echo "⚠️ Some tests failed. Please check:"
    echo "- Database is running: docker-compose ps"
    echo "- Backend is running: curl http://localhost:3001/health"
    echo "- Check logs for errors"
fi
