import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scrapeLinkedInTopContent } from '@/lib/apify'
import { analyzeNichePosts, generateWeeklyQuestion } from '@/lib/anthropic'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const weekOf = new Date().toISOString().split('T')[0]
  const niche = profile.niche
  const nicheSlug = profile.linkedin_niche_slug

  // niche_intelligence is shared across every user in a niche, not owned by one
  // user, so RLS only grants it write access via the service role — use the
  // admin client for reads/writes here instead of the user-scoped client.
  const admin = createAdminClient()

  // Return cached intel if already exists this week
  const { data: existing } = await admin
    .from('niche_intelligence')
    .select('*')
    .eq('niche', niche)
    .eq('week_of', weekOf)
    .single()

  if (existing?.generated_question) {
    // Make sure user has a session for this week
    await supabase.from('weekly_sessions').upsert({
      user_id: user.id,
      week_of: weekOf,
      question: existing.generated_question,
      status: 'pending',
    }, { onConflict: 'user_id,week_of', ignoreDuplicates: true })
    return NextResponse.json({ intelligence: existing })
  }

  // Scrape, analyze, generate question
  const posts = await scrapeLinkedInTopContent(nicheSlug)
  const analysis = await analyzeNichePosts(posts, niche)
  const question = await generateWeeklyQuestion(analysis.winning_format, niche, profile.goals)

  const intelligence = {
    niche,
    week_of: weekOf,
    winning_format: analysis.winning_format,
    winning_hook: analysis.winning_hook,
    topic_clusters: analysis.topic_clusters,
    sample_posts: posts.slice(0, 5).map((p: string) => ({
      text: p, likes: 0, comments: 0, format: analysis.winning_format
    })),
    generated_question: question,
  }

  await admin.from('niche_intelligence').upsert(intelligence)
  await supabase.from('weekly_sessions').upsert({
    user_id: user.id,
    week_of: weekOf,
    question,
    status: 'pending',
  }, { onConflict: 'user_id,week_of', ignoreDuplicates: true })

  return NextResponse.json({ intelligence })
}
