# Attntion

An AI-powered LinkedIn content platform. Every week, Attntion studies what content format is
winning in a client's niche, asks them one targeted question, transcribes their 2-3 minute voice
note reply, reformats it into a LinkedIn post in their own voice, and publishes it once approved.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (DB, Auth, Storage) ·
Anthropic Claude · OpenAI Whisper · Firecrawl · Apify · Blotato

## Setup

See [SETUP.md](SETUP.md) for the full walkthrough (Supabase project, API keys, running locally,
deploying to Vercel).

```bash
npm install
npm run dev
```

## Structure

- `src/app` — pages and API routes (App Router)
- `src/components` — UI, onboarding, session, and dashboard components
- `src/lib` — Supabase clients and third-party API integrations (Anthropic, OpenAI, Firecrawl, Apify, Blotato)
- `src/proxy.ts` — auth/session gating (Next.js 16's replacement for `middleware.ts`)
- `supabase/schema.sql` — full database schema and RLS policies to run in the Supabase SQL editor
