#!/bin/bash

# PennyScan Database Setup Script
# This script handles database migrations and seeding

set -e

echo "🗄️  PennyScan Database Setup"
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "   Please add your PostgreSQL connection string to .env.local"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "   → Edit .env.local with your actual values"
fi

echo ""
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  npm run dev          - Start the app"
echo "  npm run prisma:seed  - Seed sample data"
echo ""
echo "Test the app at: http://localhost:3000"
