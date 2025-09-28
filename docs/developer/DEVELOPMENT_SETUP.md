# JewgoApp Development Setup Guide

This guide provides comprehensive instructions for setting up and running the JewgoApp development environment for testing and development.

## 🚀 Quick Start

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker Desktop** (for database services)
- **Xcode** (for iOS development)
- **iOS Simulator** (comes with Xcode)

### One-Command Setup

```bash
# Make scripts executable
chmod +x scripts/start-dev.sh scripts/stop-dev.sh

# Start everything
./scripts/start-dev.sh
```

That's it! The script will:
1. ✅ Start Docker services (PostgreSQL, Redis, Mailhog)
2. ✅ Start the backend API server
3. ✅ Start Metro bundler
4. ✅ Build and launch the iOS app

### Stop Everything

```bash
./scripts/stop-dev.sh
```

## 📋 Manual Setup (Step by Step)

If you prefer to start services manually or need to troubleshoot:

### 1. Start Docker Services

```bash
# Start Docker Desktop first
open -a Docker

# Wait for Docker to start, then run:
docker-compose up -d
```

**Services started:**
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- Mailhog (Email testing): `http://localhost:8025`

### 2. Start Backend Server

```bash
cd backend
npm install  # First time only
npm start
```

**Backend running on:** `http://localhost:3001`
- Health check: `http://localhost:3001/health`
- API docs: `http://localhost:3001/api/v5`

### 3. Start Metro Bundler

```bash
cd ..  # Back to project root
npm install  # First time only
npx react-native start
```

**Metro running on:** `http://localhost:8081`

### 4. Build and Run iOS App

```bash
# Install iOS dependencies (first time only)
cd ios && pod install && cd ..

# Build and run
npx react-native run-ios
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   iOS Simulator │    │   Metro Bundler │    │  Backend API    │
│                 │◄───┤                 │◄───┤                 │
│  React Native   │    │   Port: 8081    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐            │
                       │   Docker        │            │
                       │   Services      │◄───────────┘
                       │                 │
                       │ PostgreSQL:5433 │
                       │ Redis:6379      │
                       │ Mailhog:8025    │
                       └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

The backend uses environment variables for configuration. Key variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=jewgo_dev
DB_USER=jewgo_user
DB_PASSWORD=jewgo_dev_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Frontend Configuration

The React Native app connects to the backend via `src/config/ConfigService.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:3001/api/v5';
```

## 📱 Testing the App

### 1. Guest Authentication
- The app automatically creates guest accounts
- No login required for basic functionality

### 2. API Endpoints
- **Entities**: `GET /api/v5/entities?entityType=mikvah`
- **Specials**: `GET /api/v5/specials/active`
- **Auth**: `GET /api/v5/auth/me`

### 3. Database Access
- **PostgreSQL**: Connect using any PostgreSQL client to `localhost:5433`
- **Credentials**: `jewgo_user` / `jewgo_dev_password`
- **Database**: `jewgo_dev`

### 4. Email Testing
- **Mailhog UI**: `http://localhost:8025`
- All emails sent by the app are captured here

## 🐛 Troubleshooting

### Common Issues

#### Docker Issues
```bash
# If Docker won't start
open -a Docker
# Wait 30 seconds, then try again

# If containers fail to start
docker-compose down
docker-compose up -d
```

#### Backend Issues
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs
tail -f logs/backend.log

# Restart backend
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

#### Metro Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Check Metro logs
tail -f logs/metro.log
```

#### iOS Build Issues
```bash
# Clean iOS build
cd ios
xcodebuild clean
cd ..

# Reinstall pods
cd ios && pod install && cd ..

# Reset iOS Simulator
xcrun simctl erase all
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3001  # Backend
lsof -i :8081  # Metro
lsof -i :5433  # PostgreSQL

# Kill processes if needed
kill -9 <PID>
```

### Log Files

All logs are stored in the `logs/` directory:
- `logs/backend.log` - Backend server logs
- `logs/metro.log` - Metro bundler logs
- `logs/backend.pid` - Backend process ID
- `logs/metro.pid` - Metro process ID

## 🔄 Development Workflow

### Making Changes

1. **Frontend Changes**: Metro will hot-reload automatically
2. **Backend Changes**: Restart backend server
3. **Database Changes**: Run migrations in `backend/src/database/`

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
npm test
```

### Database Migrations

```bash
cd backend
npm run migrate
```

## 📊 Monitoring

### Health Checks
- **Backend**: `http://localhost:3001/health`
- **Database**: Check Docker containers
- **Metro**: Check `http://localhost:8081/status`

### Performance Monitoring
- Use React Native DevTools for frontend debugging
- Check backend logs for API performance
- Monitor database queries in PostgreSQL logs

## 🚀 Production Deployment

This setup is for development only. For production deployment, see:
- `docs/deployment/deployment-checklist.md`
- `docs/deployment/AUTH_DEPLOYMENT_CHECKLIST.md`

## 📚 Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Authentication Guide](AUTHENTICATION_IMPLEMENTATION_GUIDE.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Troubleshooting Guide](../support/troubleshooting-guide.md)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review log files in the `logs/` directory
3. Ensure all prerequisites are installed
4. Try the one-command setup: `./scripts/start-dev.sh`

---

**Happy Coding! 🎉**
