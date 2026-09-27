import { createClient } from '@/lib/supabase/server'
import { publishToLinkedIn } from '@/lib/blotato'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // `markPosted` is sent after the user copied the post and published it on LinkedIn themselves.
  const { sessionId, finalPost, photoPath, markPosted } = await request.json()

  if (markPosted) {
    await supabase.from('weekly_sessions').update({
      final_post: finalPost,
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', sessionId)
    return NextResponse.json({ success: true, manual: true })
  }

  const { data: profile } = await supabase.from('users')
    .select('blotato_linkedin_profile_id')
    .eq('id', user.id)
    .single()

  if (!process.env.BLOTATO_API_KEY || !profile?.blotato_linkedin_profile_id) {
    // Fallback: save the post for manual publishing
    await supabase.from('weekly_sessions').update({
      final_post: finalPost,
      status: 'drafted',
    }).eq('id', sessionId)
    return NextResponse.json({
      success: false,
      manual: true,
      message: 'Auto-posting is not connected yet. Copy your post and publish it on LinkedIn.',
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

  try {
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
  } catch (err) {
    console.error('Blotato publish failed', err)
    await supabase.from('weekly_sessions').update({ final_post: finalPost }).eq('id', sessionId)
    return NextResponse.json({
      success: false,
      manual: true,
      message: 'Auto-posting failed. Your post is saved. Copy it and publish on LinkedIn.',
    })
  }
}
