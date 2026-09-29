import { PhotoRecommendation } from '@/types'

type Shot = PhotoRecommendation['shot_options'][number]

interface Theme {
  test: RegExp
  recommendation: string
  why: string
  shot: Shot
}

// Rule-based photo ideas for when the AI is unavailable: read the draft for
// cues and suggest matching real-life shots, then fill with role-appropriate ones.
const THEMES: Theme[] = [
  {
    test: /\b(teams?|hir(e|ed|ing)|colleagues?|we built|together|culture|employees?|warehouse)\b/i,
    recommendation: 'A candid photo of you with your team, mid-conversation.',
    why: 'Your post is about people, so showing the people behind it makes the story feel real.',
    shot: {
      type: 'With your team',
      description: 'Gather two or three teammates around a laptop or whiteboard and have someone snap you talking, not posing.',
      tip: 'Shoot from slightly above eye level and catch a genuine laugh rather than a posed smile.',
    },
  },
  {
    test: /\b(customers?|clients?|calls?|called|deals?|sales|buyers?|users?|waitlist|pitch)\b/i,
    recommendation: 'You at your desk, mid-call or reviewing notes, looking focused.',
    why: 'The post is about a customer moment, and a working shot puts the reader right in that moment.',
    shot: {
      type: 'On a call',
      description: 'Sit at your desk with headphones or phone in hand, notes visible, looking slightly off camera.',
      tip: 'Blur or turn away any screen with client names on it.',
    },
  },
  {
    test: /\b(stage|events?|conferences?|summit|talks?|spoke|speaking|panels?|travel|city|flights?|village|site)\b/i,
    recommendation: 'A photo of you at the place where this happened, or a similar setting.',
    why: 'Location photos add context and make readers feel they were there with you.',
    shot: {
      type: 'On location',
      description: 'Stand where the story happened (or somewhere similar), half-body framing with the setting behind you.',
      tip: 'Put the light source in front of you, not behind, so your face is not in shadow.',
    },
  },
  {
    test: /\b(launch(ed)?|shipped|product|prototype|app|feature|built|demo)\b/i,
    recommendation: 'You holding or showing the thing you built.',
    why: 'Readers trust a story more when they can see the product in your hands.',
    shot: {
      type: 'With the product',
      description: 'Hold the product, a prototype or your phone showing the app, angled toward the camera, your face in frame.',
      tip: 'Clean the background and wipe the screen; small details read as care.',
    },
  },
  {
    test: /\b(closed|raised|series [a-e]|milestone|anniversary|award|won|renewed|record|first (customer|sale|hire))\b/i,
    recommendation: 'A warm, understated celebration shot, not a trophy pose.',
    why: 'Milestone posts land better when they feel grateful rather than boastful.',
    shot: {
      type: 'Quiet celebration',
      description: 'A candid moment with the people who made it happen, coffee or cake in hand, everyone relaxed.',
      tip: 'Skip the thumbs-up; a real smile mid-conversation reads as humble.',
    },
  },
  {
    test: /\b(learn(ed|ing)?|course|book|study|read|mentor|taught|lesson)\b/i,
    recommendation: 'You with the notebook, book or notes where the lesson lives.',
    why: 'A learning post feels authentic when readers can see the scribbles behind it.',
    shot: {
      type: 'Notebook moment',
      description: 'Sit with an open notebook or marked-up book, pen in hand, looking up at the camera mid-thought.',
      tip: 'Shoot near a window and keep the page slightly out of focus if it holds anything private.',
    },
  },
  {
    test: /(\d+%|\$\d|₹|\b\d{2,}\b|revenue|numbers?|metric|data|growth|mrr|margin)/i,
    recommendation: 'You beside your laptop or notebook showing the work behind the numbers.',
    why: 'Pairing numbers with a human face keeps a data post from feeling cold.',
    shot: {
      type: 'At your workspace',
      description: 'Sit at your workspace with a notebook or chart in view (no sensitive data), turned toward the camera.',
      tip: 'Window light from the side looks professional without a ring light.',
    },
  },
  {
    test: /\b(family|parents?|daughter|son|kids?|home|quit|garage)\b/i,
    recommendation: 'A personal, informal photo that matches the life moment in your story.',
    why: 'Personal stories earn trust when the photo feels like your life, not a studio.',
    shot: {
      type: 'Personal moment',
      description: 'An everyday photo at home or somewhere meaningful to the story, relaxed clothes, natural expression.',
      tip: 'Ask first before including family members, and keep children\'s faces out of frame.',
    },
  },
]

const ROLE_SHOTS: Record<string, Shot[]> = {
  founder: [
    { type: 'At the workspace', description: 'Stand in your office, studio or warehouse with the work visible behind you, sleeves-up energy.', tip: 'Wide enough to show the place, close enough to see your face.' },
    { type: 'Walking and talking', description: 'Have someone film a short burst of you walking and talking to a teammate, then pick the most natural frame.', tip: 'Open shade avoids squinting and harsh shadows.' },
  ],
  executive: [
    { type: 'In the meeting room', description: 'Seated at the head or side of a table mid-discussion, whiteboard or screen behind you.', tip: 'Shoot at eye level; from below reads as posed.' },
    { type: 'Office portrait', description: 'A relaxed half-body portrait by a window, jacket optional, looking just off camera.', tip: 'Soft window light on one side, plain background.' },
  ],
  professional: [
    { type: 'At your desk', description: 'Sit at your desk, laptop open, looking toward the camera with a relaxed expression.', tip: 'Window light from the side looks professional without a ring light.' },
    { type: 'Whiteboard moment', description: 'Standing at a whiteboard or screen, pointing at the idea from your post.', tip: 'Make sure the board holds nothing confidential.' },
  ],
  freelancer: [
    { type: 'Your working corner', description: 'Wherever you actually work (café, home desk, co-working), laptop and coffee in frame.', tip: 'Keep it real; clients hire the person, not the set.' },
    { type: 'With a client (with permission)', description: 'A candid of you in a workshop or session, taken with the client\'s OK.', tip: 'Ask before posting anyone else\'s face.' },
  ],
  earlycareer: [
    { type: 'Campus or first-desk shot', description: 'At your desk, lab or campus spot, natural and a little proud.', tip: 'Avoid mirror selfies; ask a friend to take it.' },
    { type: 'Mid-project', description: 'Working on the thing from your story: laptop, sketches or notes around you.', tip: 'Tidy just the frame, not the whole room.' },
  ],
}

const DEFAULT_SHOTS: Shot[] = ROLE_SHOTS.professional

export function fallbackPhotoRecommendation(post: string, profileType?: string | null): PhotoRecommendation {
  const matches = THEMES.filter((t) => t.test.test(post))
  const primary = matches[0]
  const roleShots = ROLE_SHOTS[profileType ?? ''] ?? DEFAULT_SHOTS
  const seen = new Set<string>()
  const shots = [...matches.map((m) => m.shot), ...roleShots].filter((s) => (seen.has(s.type) ? false : (seen.add(s.type), true))).slice(0, 3)
  return {
    recommendation: primary?.recommendation ?? 'A natural, well-lit photo of you where you actually work.',
    why: primary?.why ?? 'A real photo of you builds trust and makes the post feel personal, not generated.',
    shot_options: shots,
  }
}
