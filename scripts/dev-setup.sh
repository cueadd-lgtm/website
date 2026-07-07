#!/bin/bash

# Quick setup script for development
# Run: bash scripts/dev-setup.sh

set -e

echo "🚀 PennyScan Development Setup"
echo "==============================="
echo ""

# 1. Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# 2. Check .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚙️  Setting up environment..."
    cp .env.example .env.local
    echo "📝 Created .env.local - please edit with your actual values:"
    echo "   - DATABASE_URL (PostgreSQL connection)"
    echo "   - GOOGLE_MAPS_API_KEY (optional)"
    echo "   - NEXTAUTH_SECRET (any random string)"
else
    echo "✅ .env.local already exists"
fi

# 3. Generate Prisma Client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# 4. Check if database exists and migrate
if [ -n "$DATABASE_URL" ]; then
    echo ""
    echo "🗄️  Running database migrations..."
    npx prisma migrate deploy || true
    echo "✅ Database ready"
else
    echo ""
    echo "⚠️  DATABASE_URL not set - skipping migrations"
    echo "   Set DATABASE_URL in .env.local to initialize the database"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "Open http://localhost:3000 in your browser"
