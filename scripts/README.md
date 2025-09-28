# JewgoApp Development Scripts

This directory contains scripts to easily manage the JewgoApp development environment.

## 🚀 Quick Start

### Start Development Environment
```bash
./scripts/start-dev.sh
```

This single command will:
- ✅ Start Docker services (PostgreSQL, Redis, Mailhog)
- ✅ Start backend API server
- ✅ Start Metro bundler  
- ✅ Build and launch iOS app

### Stop Development Environment
```bash
./scripts/stop-dev.sh
```

This will stop all development services.

## 📋 Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-dev.sh` | Start all development services | `./scripts/start-dev.sh` |
| `stop-dev.sh` | Stop all development services | `./scripts/stop-dev.sh` |

## 🔧 What Each Script Does

### start-dev.sh
1. **Checks Prerequisites**: Verifies Docker, Node.js, npm are installed
2. **Starts Docker**: Launches PostgreSQL, Redis, and Mailhog containers
3. **Installs Dependencies**: Runs `npm install` for both frontend and backend
4. **Starts Backend**: Launches the API server on port 3001
5. **Starts Metro**: Launches the React Native bundler on port 8081
6. **Builds iOS App**: Compiles and launches the app on iOS Simulator

### stop-dev.sh
1. **Stops Backend**: Kills the API server process
2. **Stops Metro**: Kills the Metro bundler process
3. **Stops Docker**: Shuts down all Docker containers
4. **Cleans Up**: Removes PID files and log cleanup

## 📊 Services and Ports

When running, the following services will be available:

| Service | URL/Port | Purpose |
|---------|----------|---------|
| Backend API | http://localhost:3001 | Main API server |
| Metro Bundler | http://localhost:8081 | React Native bundler |
| PostgreSQL | localhost:5433 | Database |
| Redis | localhost:6379 | Caching/sessions |
| Mailhog | http://localhost:8025 | Email testing UI |

## 📝 Logs

All service logs are stored in the `logs/` directory:
- `logs/backend.log` - Backend server output
- `logs/metro.log` - Metro bundler output
- `logs/backend.pid` - Backend process ID
- `logs/metro.pid` - Metro process ID

## 🐛 Troubleshooting

### Script Won't Run
```bash
# Make sure scripts are executable
chmod +x scripts/*.sh
```

### Services Won't Start
1. Check if ports are already in use: `lsof -i :3001`
2. Ensure Docker is running: `docker info`
3. Check logs: `tail -f logs/backend.log`

### iOS Build Fails
1. Make sure Xcode is installed
2. Install iOS dependencies: `cd ios && pod install`
3. Clean build: `cd ios && xcodebuild clean`

## 📚 More Information

For detailed setup instructions and troubleshooting, see:
- [Development Setup Guide](../docs/developer/DEVELOPMENT_SETUP.md)
- [Troubleshooting Guide](../docs/support/troubleshooting-guide.md)

---

**Need help?** Check the logs in the `logs/` directory or review the troubleshooting section in the development setup guide.
