import { PhotoRecommendation } from '@/types'

type Shot = PhotoRecommendation['shot_options'][number]

// Rule-based photo ideas for when the AI is unavailable: read the draft for
// cues (team, customers, stage, numbers) and suggest matching real-life shots.
const THEMES: { test: RegExp; recommendation: string; why: string; shot: Shot }[] = [
  {
    test: /\b(teams?|hir(e|ed|ing)|colleagues?|we built|together|culture)\b/i,
    recommendation: 'A candid photo of you with your team, mid-conversation.',
    why: 'Your post is about people, so showing the people behind it makes the story feel real.',
    shot: {
      type: 'With your team',
      description: 'Gather two or three teammates around a laptop or whiteboard and have someone snap you talking, not posing.',
      tip: 'Shoot from slightly above eye level and catch a genuine laugh rather than a posed smile.',
    },
  },
  {
    test: /\b(customers?|clients?|calls?|called|deals?|sales|buyers?|users?|waitlist)\b/i,
    recommendation: 'You at your desk, mid-call or reviewing notes, looking focused.',
    why: 'The post is about a customer moment, and a working shot puts the reader right in that moment.',
    shot: {
      type: 'On a call',
      description: 'Sit at your desk with headphones or phone in hand, notes visible, looking slightly off camera.',
      tip: 'Blur or turn away any screen with client names on it.',
    },
  },
  {
    test: /\b(stage|events?|conferences?|talks?|spoke|speaking|panels?|travel|city|flights?)\b/i,
    recommendation: 'A photo of you at the place where this happened, or a similar setting.',
    why: 'Location photos add context and make readers feel they were there with you.',
    shot: {
      type: 'On location',
      description: 'Stand where the story happened (or somewhere similar), half-body framing with the setting behind you.',
      tip: 'Put the light source in front of you, not behind, so your face is not in shadow.',
    },
  },
  {
    test: /(\d+%|\$\d|\b\d{2,}\b|revenue|numbers?|metric|data|growth)/i,
    recommendation: 'You beside your laptop or notebook showing the work behind the numbers.',
    why: 'Pairing numbers with a human face keeps a data post from feeling cold.',
    shot: {
      type: 'At your workspace',
      description: 'Sit at your workspace with a notebook or screen in view (no sensitive data), turned toward the camera.',
      tip: 'Window light from the side looks professional without a ring light.',
    },
  },
]

const DEFAULT_SHOTS: Shot[] = [
  {
    type: 'At your desk',
    description: 'Sit at your workspace, laptop open, and look toward the camera with a relaxed expression.',
    tip: 'Window light from the side looks professional without a ring light.',
  },
  {
    type: 'Walking outside',
    description: 'Have someone film a short burst of you walking toward the camera, then pick the most natural frame.',
    tip: 'Shoot in open shade to avoid squinting and harsh shadows.',
  },
]

export function fallbackPhotoRecommendation(post: string): PhotoRecommendation {
  const matches = THEMES.filter((t) => t.test.test(post))
  const primary = matches[0]
  const shots = [...matches.map((m) => m.shot), ...DEFAULT_SHOTS].slice(0, 3)
  return {
    recommendation: primary?.recommendation ?? 'A natural, well-lit photo of you at your workspace.',
    why: primary?.why ?? 'A real photo of you builds trust and makes the post feel personal, not generated.',
    shot_options: shots,
  }
}
