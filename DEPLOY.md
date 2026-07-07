# PennyScan - Quick Deployment Guide

## 🚀 Deploy to Vercel (Fastest Way)

### Step 1: Connect Your Repository
1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Search for `website` (your repo)
4. Click "Import"

### Step 2: Add Environment Variables
In the "Environment Variables" section, add:

```
DATABASE_URL = postgresql://user:password@your-host/db
GOOGLE_MAPS_API_KEY = your_api_key_here
NEXTAUTH_SECRET = any_random_string_here
```

**How to get these:**

**DATABASE_URL:**
- Neon: https://neon.tech → Create project → Copy connection string
- Supabase: https://supabase.com → Create project → Settings → Database → Connection string
- Railway: https://railway.app → Create PostgreSQL → Copy DATABASE_URL

**GOOGLE_MAPS_API_KEY:**
- Google Cloud Console: https://console.cloud.google.com
- Create project → Enable "Maps JavaScript API" → Create API key

**NEXTAUTH_SECRET:**
- Any random string, e.g., `super-secret-key-12345`

### Step 3: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a live URL like: `https://your-site.vercel.app`

### Step 4: Test on Phone
1. Copy the Vercel URL
2. Open on your phone's browser
3. Try entering ZIP code `62701` to see demo stores

---

## 🏠 Deploy to Railway (Also Free)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign in with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `cueadd-lgtm/website`

### Step 3: Add Services
1. Add PostgreSQL service (Railway will create one automatically)
2. Add Node.js service from your repo

### Step 4: Set Environment Variables
In Railway dashboard → Variables:
```
DATABASE_URL = (auto-generated from PostgreSQL)
GOOGLE_MAPS_API_KEY = your_key
NEXTAUTH_SECRET = random_string
```

### Step 5: Deploy
Railway will auto-deploy. Get your URL from the project dashboard.

---

## 💻 Run Locally

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed locally OR
- PostgreSQL running on your machine

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.example .env.local

# 3. Edit .env.local with your DATABASE_URL
# Example: postgresql://postgres:password@localhost:5432/pennyscan

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Start the app
npm run dev
```

### Access from Phone
Find your computer's local IP:

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
```

**On Windows:**
```bash
ipconfig
```

Then on your phone, go to: `http://<YOUR_IP>:3000`

---

## ✅ Testing Checklist

- [ ] Home page loads
- [ ] Can enter ZIP code
- [ ] Click "Search Deals" → goes to results page
- [ ] Results show 2 sample stores (Walmart + Target)
- [ ] Each store shows sample penny deals
- [ ] Can filter by chain
- [ ] Can filter by discount %
- [ ] Can search items
- [ ] Aisle information displays
- [ ] Mobile responsive on phone

---

## 🆘 Troubleshooting

**"Cannot find module"**
→ Run `npm install`

**"DATABASE_URL is required"**
→ Add DATABASE_URL to environment variables

**"Prisma migration failed"**
→ Run `npx prisma migrate reset` (will reset database)

**"Can't connect to localhost from phone"**
→ Make sure phone is on same WiFi network as computer

---

## 📱 Share Your App

Once deployed, you can share:
- Vercel URL: Automatically public
- Railway URL: Check project settings for public domain
- Local: Share your computer's IP with others on same network

🎉 You're ready to go!
