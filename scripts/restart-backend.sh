#!/bin/bash

echo "🔄 Restarting backend server to load new dashboard routes..."

# Kill any existing backend processes
echo "🛑 Stopping existing backend processes..."
pkill -f "node.*server.js" || true
pkill -f "npm start" || true

# Wait a moment for processes to stop
sleep 2

# Start the backend server
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the server
echo "🧪 Testing server..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running!"
    echo "📊 Testing dashboard endpoints..."
    
    # Test dashboard endpoints
    echo "Testing stats endpoint..."
    curl -s http://localhost:3001/api/v5/dashboard/entities/stats | head -c 100
    echo ""
    
    echo "Testing recent entities endpoint..."
    curl -s http://localhost:3001/api/v5/dashboard/entities/recent?limit=3 | head -c 100
    echo ""
    
    echo "🎉 Dashboard endpoints are working!"
    echo ""
    echo "📱 To access the dashboard:"
    echo "1. Open the Jewgo app"
    echo "2. Go to Profile tab"
    echo "3. Tap 'Database Dashboard'"
    echo ""
    echo "🛑 To stop the backend server, run: kill $BACKEND_PID"
else
    echo "❌ Backend server failed to start"
    echo "Check the logs for errors"
fi
