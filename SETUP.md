# PennyScan Environment Setup Guide

## Required Environment Variables

You need to set up the following environment variables for the app to work:

### 1. **DATABASE_URL** (Required)
PostgreSQL connection string

**Options:**
- **Neon (Free & Recommended)**: https://neon.tech
  - Sign up, create a project
  - Copy the connection string
  - Example: `postgresql://user:password@ep-xxxx.us-east-1.neon.tech/dbname?sslmode=require`

- **Supabase (Free)**: https://supabase.com
  - Create a project
  - Get connection string from Project Settings → Database

- **Railway (Free tier)**: https://railway.app
  - Create PostgreSQL service
  - Copy the DATABASE_URL

- **Local PostgreSQL**:
  - Install PostgreSQL locally
  - Example: `postgresql://postgres:password@localhost:5432/pennyscan`

### 2. **GOOGLE_MAPS_API_KEY** (Optional but Recommended)
For geocoding and location features

**Get it:**
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable "Maps JavaScript API" and "Geocoding API"
4. Create an API key in Credentials
5. Copy the key

**Free tier:** 1,000 requests/month

### 3. **NEXTAUTH_SECRET** (Required)
Random secret for session encryption

**Generate one:**
```bash
openssl rand -base64 32
```

Or just use any random string like: `your-super-secret-key-12345-xyz`

## Quick Start

### Option A: Deploy on Vercel (Recommended)

1. **Push to GitHub** (already done ✓)

2. **Go to Vercel**: https://vercel.com/new

3. **Import your GitHub repo**: `cueadd-lgtm/website`

4. **Set Environment Variables** in the Vercel dashboard:
   ```
   DATABASE_URL=your_postgres_url_here
   GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   NEXTAUTH_SECRET=your_random_secret_here
   ```

5. **Deploy** - Vercel will automatically run migrations

6. **Get your live URL** and test on phone!

### Option B: Run Locally

1. **Set up `.env.local`**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your values to `.env.local`**:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/pennyscan"
   GOOGLE_MAPS_API_KEY="your_key_here"
   NEXTAUTH_SECRET="your_secret_here"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the app**:
   ```bash
   npm run dev
   ```

6. **Open in browser**: http://localhost:3000

7. **Access from phone** on same network:
   ```
   http://<YOUR_COMPUTER_IP>:3000
   ```

## Testing the App

Once deployed/running:

1. **Home Page**: Enter ZIP code `62701` (Springfield, IL)
2. **Results**: Should show 2 stores (Walmart + Target) with mock deals
3. **Features to test**:
   - ✅ ZIP code search
   - ✅ Store filtering by chain
   - ✅ Discount percentage filters
   - ✅ Item search
   - ✅ Aisle location display
   - ✅ Mobile responsive design

## Troubleshooting

### "Error: DATABASE_URL not set"
→ Add the DATABASE_URL to your environment variables

### "Connection refused"
→ Make sure your PostgreSQL server is running and connection string is correct

### "Prisma migration fails"
→ Run: `npx prisma migrate reset` (this will drop and recreate the database)

### "App won't start"
→ Try: `npm install`, then `npm run dev`

## Next Steps

Once the app is running:

1. ✅ Test basic functionality
2. ✅ Integrate real retailer APIs (Walmart, Target, etc.)
3. ✅ Set up background jobs for scanning deals
4. ✅ Add authentication
5. ✅ Deploy to production

## Getting Help

If you hit any issues, let me know and I can:
- Help debug
- Add more example configurations
- Set up a different deployment method

Ready to deploy? 🚀
