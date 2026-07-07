# PennyScan 🔍

A production-ready web application that helps users find penny deals and deep-clearance items in nearby stores with exact aisle locations.

## Features

- ZIP Code Search: Enter your ZIP code or use browser geolocation
- Multi-Chain Support: Walmart, Target, Home Depot, Best Buy, Lowe's, CVS, Walgreens, Dollar General
- Real-Time Deals: Find penny items ($0.01) and deep clearance (70-90% off)
- Aisle Information: Know exactly where to find each deal
- Mobile-First: Fully responsive design
- Live Updates: Refresh deals with real-time data

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js (optional)

## Installation

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npm run dev
```
