#!/bin/bash

# Generate secure JWT secrets for Render deployment
echo "🔐 Generating JWT Secrets for Render Deployment"
echo "================================================"
echo ""

# Generate JWT_SECRET (64 characters)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "JWT_SECRET:"
echo "$JWT_SECRET"
echo ""

# Generate JWT_REFRESH_SECRET (64 characters)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "JWT_REFRESH_SECRET:"
echo "$JWT_REFRESH_SECRET"
echo ""

# Generate optional secrets
MAGIC_LINK_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "MAGIC_LINK_SECRET (optional):"
echo "$MAGIC_LINK_SECRET"
echo ""

echo "================================================"
echo "✅ Secrets generated successfully!"
echo ""
echo "📋 Copy these values to Render Environment Variables:"
echo "   1. Go to: https://dashboard.render.com"
echo "   2. Select your 'jewgo-backend' service"
echo "   3. Navigate to 'Environment' tab"
echo "   4. Add/Update the above variables"
echo ""
echo "⚠️  IMPORTANT: Keep these secrets secure!"
echo "   - Don't commit them to git"
echo "   - Store in password manager"
echo "   - Use same secrets across deploys"
echo ""

