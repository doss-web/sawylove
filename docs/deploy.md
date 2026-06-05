# Paper Boyfriend — Deployment Guide

## Prerequisites

1. [Vercel account](https://vercel.com) (free tier works)
2. [Supabase account](https://supabase.com) (free tier) or Vercel Postgres
3. [Google Cloud Console](https://console.cloud.google.com) — OAuth credentials
4. [GitHub OAuth Apps](https://github.com/settings/developers) — OAuth credentials
5. [Stripe account](https://stripe.com) — payment processing
6. LLM API key (OpenAI, DeepSeek, or any OpenAI-compatible provider)

## Step 1: Database Setup

### Option A: Vercel Postgres
1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the DATABASE_URL

### Option B: Supabase (recommended for free tier)
1. Create a new project at supabase.com
2. Go to Settings → Database → Connection string
3. Copy the "Session pooler" connection string
4. Replace `[YOUR-PASSWORD]` with your database password

## Step 2: OAuth Setup

### Google OAuth
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google`
4. Copy GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Register a new application
3. Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github`
   - `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET

## Step 3: Stripe Setup
1. Create a Stripe account
2. Create a subscription product with a monthly price ($4.99-$6.99)
3. Copy STRIPE_SECRET_KEY and STRIPE_PRICE_ID
4. For webhook (after deploy):
   - Go to Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy STRIPE_WEBHOOK_SECRET

## Step 4: Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

## Step 5: Deploy to Vercel

```bash
cd paper-boyfriend

# Install Vercel CLI if not installed
npm i -g vercel

# Link project
vercel link

# Set all environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add LLM_API_KEY
vercel env add LLM_BASE_URL
vercel env add LLM_MODEL
vercel env add TTS_API_KEY
vercel env add TTS_BASE_URL
vercel env add TTS_MODEL
vercel env add TTS_VOICE
vercel env add NEXT_PUBLIC_APP_URL
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_ID

# Push database schema
npx prisma db push

# Deploy to production
vercel --prod

# Seed the database (after first deploy)
npx prisma db seed
```

## Step 6: Verify Deployment
1. Visit your Vercel URL
2. Test Google/GitHub sign-in
3. Select a character and send a message
4. Verify TTS audio plays
5. Test language switch
6. Run: `curl https://your-domain.vercel.app/api/characters`
