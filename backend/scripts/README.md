# Backend Deployment Scripts

Collection of scripts to help deploy and manage the Jewgo backend for iOS testing and production.

## Available Scripts

### 🔑 Generate Secrets

Generate secure JWT secrets and API keys.

```bash
node scripts/generate-secrets.js
```

**Output**: Secure random secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, etc.

**When to use**: Before deploying to any hosting platform.

---

### 🗄️ Setup Database

Initialize database with schema and sample data.

```bash
./scripts/setup-database.sh [database-url]
```

**Examples**:

```bash
# Using Railway CLI
railway run ./scripts/setup-database.sh $DATABASE_URL

# Direct connection
./scripts/setup-database.sh postgresql://user:pass@host:5432/dbname
```

**What it does**:

- Creates all database tables
- Runs migrations
- Loads sample data (entities, events, jobs, etc.)
- Sets up authentication schema

---

### 🚂 Quick Deploy (Railway)

One-command deploy to Railway.

```bash
./scripts/quick-deploy-railway.sh
```

**Prerequisites**:

- Railway account
- GitHub repository connected
- Railway CLI installed (script will install if missing)

**What it does**:

- Checks Railway CLI installation
- Authenticates with Railway
- Links to your project
- Deploys latest code

---

### 🏥 Health Check

Test if your deployed backend is working correctly.

```bash
./scripts/health-check.sh [backend-url]
```

**Examples**:

```bash
./scripts/health-check.sh https://jewgo-backend.up.railway.app

# Or set environment variable
BACKEND_URL=https://jewgo-backend.up.railway.app ./scripts/health-check.sh
```

**What it tests**:

- ✅ Health endpoint (`/health`)
- ✅ API endpoints (entities, events, etc.)
- ✅ Authentication flow
- ✅ Response times
- ✅ Error handling (404, 500, etc.)

---

### 📊 Monitor

Continuously monitor your backend health.

```bash
./scripts/monitor.sh [backend-url] [interval-seconds]
```

**Examples**:

```bash
# Check every 10 seconds (default)
./scripts/monitor.sh https://jewgo-backend.up.railway.app

# Check every 5 seconds
./scripts/monitor.sh https://jewgo-backend.up.railway.app 5
```

**Features**:

- Real-time health monitoring
- Failure tracking
- Alert on consecutive failures
- Timestamps for all checks
- Color-coded output

Press `Ctrl+C` to stop monitoring.

---

## Quick Start Workflow

### 1. First Time Deployment

```bash
# Step 1: Generate secrets
node scripts/generate-secrets.js

# Step 2: Deploy to Railway (follow prompts)
./scripts/quick-deploy-railway.sh

# Step 3: Setup database (after Railway deployment)
railway run ./scripts/setup-database.sh $DATABASE_URL

# Step 4: Verify deployment
./scripts/health-check.sh https://your-app.railway.app
```

### 2. Update Deployment

```bash
# Push changes
git add .
git commit -m "Update backend"
git push origin main

# Deploy (Railway auto-deploys from GitHub, or use CLI)
./scripts/quick-deploy-railway.sh

# Verify
./scripts/health-check.sh https://your-app.railway.app
```

### 3. Monitor in Production

```bash
# Continuous monitoring (useful in tmux/screen)
./scripts/monitor.sh https://your-app.railway.app 30
```

---

## Environment Setup

### Required Environment Variables

On your hosting platform (Railway, Render, Heroku), set:

```env
# Core
NODE_ENV=production
PORT=3001

# Database (auto-set by platform)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT (generate with scripts/generate-secrets.js)
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ISSUER=jewgo-auth
JWT_AUDIENCE=jewgo-api

# CORS
CORS_ORIGIN=*  # or specific domains

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

---

## Troubleshooting

### Scripts won't execute

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Database setup fails

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Run migrations one by one
psql $DATABASE_URL < ../database/init/01_schema.sql
psql $DATABASE_URL < ../database/init/02_sample_data.sql
# ... etc
```

### Health check fails

```bash
# Test basic connectivity
curl -v https://your-app.railway.app/health

# Check backend logs
railway logs  # or check your platform's dashboard
```

### Monitor shows failures

1. Check backend logs for errors
2. Verify database connection
3. Check environment variables
4. Test endpoints manually with curl

---

## Development vs Production

### Development (local)

```bash
# Use Docker Compose
docker-compose up

# Backend runs on http://localhost:3001
# iOS simulator uses http://127.0.0.1:3001
```

### Production (hosted)

```bash
# Deploy to Railway/Render/Heroku
./scripts/quick-deploy-railway.sh

# iOS app uses https://your-app.railway.app
# Set API_BASE_URL in .env.production
```

---

## Additional Resources

- [Railway Deployment Guide](../../docs/deployment/IOS_TESTING_SETUP.md)
- [Quick Start Guide](../../docs/deployment/QUICK_START.md)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

---

## Script Requirements

### Node.js Scripts

- Node.js 18+
- npm packages (installed with `npm install`)

### Bash Scripts

- Bash 4+
- curl (HTTP requests)
- psql (PostgreSQL client) - for database setup
- python3 (JSON parsing) - optional, improves output formatting

### Optional

- Railway CLI (`npm install -g @railway/cli`)
- jq (better JSON formatting)

---

## Contributing

When adding new scripts:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add error handling: `set -e`
3. Add usage instructions
4. Update this README
5. Test on clean environment

---

## Support

Questions? Issues?

- Check main documentation: `docs/deployment/`
- Review backend logs
- Test with health check script
- Verify environment variables
