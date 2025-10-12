#!/bin/bash
# Quick deploy to Railway
# Usage: ./scripts/quick-deploy-railway.sh

set -e

echo "🚂 Quick Deploy to Railway"
echo "=========================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  echo "⚠️  Railway CLI not found. Installing..."
  npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
  echo "🔐 Please log in to Railway..."
  railway login
fi

echo "✅ Logged in to Railway"
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
  echo "🔗 Linking to Railway project..."
  railway link
fi

echo "✅ Project linked"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment complete!"
echo ""
echo "📊 View your deployment:"
echo "  railway open"
echo ""
echo "📝 Check logs:"
echo "  railway logs"
echo ""
echo "🏥 Test health endpoint:"
echo "  curl \$(railway domain)/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

