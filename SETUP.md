# Setup

## 1. Supabase

- Go to [supabase.com](https://supabase.com) → New Project → name: "attntion", region: Singapore
- Settings → API Keys → copy the **Project URL**, **publishable key**, and **secret key** → paste into
  `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
  `SUPABASE_SECRET_KEY` (newer Supabase projects use publishable/secret keys instead of the older
  anon/service_role naming — functionally equivalent, just renamed)
- SQL Editor → New Query → paste the contents of `supabase/schema.sql` → Run
  (this also creates the `session-files` storage bucket and all RLS policies)

## 2. Get API keys and paste into `.env.local`

- Anthropic: console.anthropic.com → API Keys
- OpenAI: platform.openai.com → API Keys
- Firecrawl: firecrawl.dev → Sign up → API Keys (free tier: 500 pages)
- Apify: apify.com → Sign up → Settings → Integrations → API token
- Blotato: blotato.com → Sign up ($29/mo) → connect your LinkedIn → Settings → API key

## 3. Blotato LinkedIn Profile ID

- In Blotato dashboard → Social Profiles → your LinkedIn profile → copy the Profile ID
- In Supabase dashboard → Table Editor → `users` → find your row → paste as `blotato_linkedin_profile_id`

## 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 → sign up with your email → check inbox for magic link → complete onboarding.

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all `.env.local` values as Environment Variables in the Vercel dashboard → Redeploy.

## Notes on this build

- This project was scaffolded with Next.js 16 (App Router) and React 19. Next.js 16 renamed the
  `middleware.ts` convention to `proxy.ts` — that's why auth/session gating lives in
  [src/proxy.ts](src/proxy.ts) instead of a `middleware.ts` file. Functionally it's identical to the
  middleware described in the original build brief.
- Styling uses Tailwind CSS v4, which is CSS-config-first — brand colors and fonts are defined as
  `@theme` tokens in [src/app/globals.css](src/app/globals.css) rather than a `tailwind.config.ts`.
- The `session-files` Supabase Storage bucket is private (per `supabase/schema.sql`), so photo URLs
  are signed URLs (`createSignedUrl`), not public URLs.
- `niche_intelligence` is shared across every user in a niche rather than owned by one user, so its
  RLS policies only grant writes to the service role. [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts)
  is a service-role client (using `SUPABASE_SECRET_KEY`) used only by
  [src/app/api/intelligence/run/route.ts](src/app/api/intelligence/run/route.ts) to read/write that
  table — every other route uses the normal user-scoped client so RLS still applies to user data.
