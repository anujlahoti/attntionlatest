import { createClient } from '@/lib/supabase/server'
import { publishToLinkedIn } from '@/lib/blotato'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, finalPost, photoPath } = await request.json()
  const { data: profile } = await supabase.from('users')
    .select('blotato_linkedin_profile_id')
    .eq('id', user.id)
    .single()

  if (!profile?.blotato_linkedin_profile_id) {
    // Fallback: save the post for manual publishing
    await supabase.from('weekly_sessions').update({
      final_post: finalPost,
      status: 'drafted',
    }).eq('id', sessionId)
    return NextResponse.json({
      success: false,
      manual: true,
      message: 'LinkedIn not connected. Post saved — copy and publish manually.'
    })
  }

  let photoUrl: string | undefined
  if (photoPath) {
    // The session-files bucket is private, so Blotato needs a time-limited signed URL.
    const { data } = await supabase.storage
      .from('session-files')
      .createSignedUrl(photoPath, 60 * 60)
    photoUrl = data?.signedUrl
  }

  const result = await publishToLinkedIn({
    profileId: profile.blotato_linkedin_profile_id,
    text: finalPost,
    imageUrl: photoUrl,
  })

  await supabase.from('weekly_sessions').update({
    final_post: finalPost,
    status: 'published',
    published_at: new Date().toISOString(),
    linkedin_post_id: result.id,
  }).eq('id', sessionId)

  return NextResponse.json({ success: true, postId: result.id })
}
