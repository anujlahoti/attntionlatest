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

### Go-live checklist

1. **Vercel env vars**: every key from `.env.local`, with `NEXT_PUBLIC_APP_URL` set to the production
   URL and a fresh random `CRON_SECRET` (Vercel sends it to `/api/cron/weekly` automatically).
2. **Supabase → Authentication → URL Configuration**: set Site URL to the production URL and add
   `https://<your-domain>/api/auth/callback` to Redirect URLs, or magic links will point at localhost.
3. **Supabase → Authentication → Emails → SMTP**: plug in a real sender (Resend, Postmark, SES…).
   The built-in sender only allows a few emails per hour, which is fine for testing but not for users.
4. **AI**: add credits to OpenAI or set `ANTHROPIC_API_KEY` (`sk-ant-…`). Until then posts are
   "sketch mode" drafts assembled from the user's own words.
5. **Auto-posting (optional)**: set `BLOTATO_API_KEY`; each user pastes their Blotato LinkedIn
   profile ID in Settings → Auto-posting.

The weekly cron (`vercel.json`) runs Sunday 22:00 UTC (Monday 06:00 SGT): it prepares every user's
question (one Apify scrape per niche, shared) and refreshes post analytics.

## Running with limited keys

Only Supabase is required. Every other integration has a fallback, and the dashboard's
"palette" panel shows which ones are live:

| Missing | What happens instead |
| --- | --- |
| AI (Anthropic / OpenAI, or out of credits) | Fallback question bank + a "preview writer" that arranges the user's own words into a post |
| Whisper | Browser speech recognition (Chrome/Edge/Safari) during recording, or type the answer |
| Firecrawl | Fetches the homepage directly and lets the AI read it |
| Apify | Curated sample posts per niche (with Apify but no AI, the real posts are analysed heuristically) |
| Blotato | "Copy & open LinkedIn" + "I've posted it" |

`ANTHROPIC_API_KEY` must start with `sk-ant-` to be used; Claude is preferred over OpenAI when both are set.

`/demo` runs the whole flow with no account (nothing is saved), which is handy when Supabase's
built-in email sender hits its rate limit on magic links.

If you ran `schema.sql` before these were added, also run the patches (each is safe to re-run):

- `supabase/patch-001-photo-upsert.sql`: lets users replace their weekly photo.
- `supabase/patch-002-deep-profile.sql`: the v2 deep-profile columns (onboarding step 4) and
  `niche_intelligence.insight_summary`. Until it runs, the quiz shows a message asking for it and the
  status panel flags it; everything else keeps working.

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
