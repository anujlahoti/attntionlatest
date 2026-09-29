// "Before you post": spots things in a draft that could embarrass the author or
// breach a confidence. Pure and synchronous so it runs in the browser and on the
// server. Each flag carries an offline replacement for one-click anonymise.

export type SafetyKind = 'person' | 'health' | 'company' | 'figures' | 'competitor' | 'advice' | 'profanity'

export interface SafetyFlag {
  kind: SafetyKind
  severity: 'high' | 'medium' | 'low'
  match: string // exact text in the post
  label: string // short reason shown to the user
  replacement?: string // offline anonymised version of `match`
  append?: string // line to add before the hashtags instead of replacing
}

const HONORIFIC_NAME = /\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g
// A full name straight after a role word or "called"/"named": "the founder Rajesh Agarwal".
const ROLE_NAME = /\b(founder|ceo|md|client|patient|customer|boss|manager|named|called)\s+((?:[A-Z][a-z]+)(?:\s+[A-Z][a-z]+)+)/g
const COMPANY = /\b[A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&]+)*\s+(?:Textiles|Industries|Pvt\.?(?:\s+Ltd\.?)?|Ltd\.?|Limited|Inc\.?|Corp\.?|Group|Enterprises|Foods|Motors|Pharma|Labs|Technologies|Solutions|Hospital|Clinic)\b/g
const CONDITION = /\b(?:stage \d\s+\w+|diabet\w*|cancer|hiv|depress\w*|diagnos\w*|pregnan\w*|dementia|schizophren\w*|bipolar)\b/gi
const TREATMENT = /\b(?:dialysis|chemo\w*|surgery|radiotherapy|transplant)\b/gi
const FIGURE = /(?:₹|\$|rs\.?\s?|inr\s?)?\d[\d,.]*\s?(?:crore|cr|lakh|lakhs|million|mn|billion|bn|k)\b/gi
const BIG_FIRMS = /\b(Deloitte|McKinsey|BCG|Bain|Accenture|KPMG|PwC|EY|Ernst & Young|Infosys|TCS|Wipro|Google|Amazon|Microsoft|Meta|Apple|Flipkart|Reliance|Tata|Salesforce|HubSpot|Oracle|SAP)\b/g
const NEGATIVE_CONTEXT = /\b(lost|beat|against|competitor|worse|fired|deal|pitch|chose|switched|instead of)\b/i
const ADVICE = /\b(?:you should (?:invest|buy|sell|take|stop)|index funds?|mutual funds?|guaranteed returns?|retire \d+ years? earlier|tax[- ]saving|fixed deposits?|dosage|stop taking)\b/i
const PROFANITY = /\b(f+u+c+k\w*|shit\w*|bullshit|damn|crap|bastard\w*|asshole\w*)\b/gi

// Stateless test for the global regexes above (their .test() would move lastIndex).
const has = (re: RegExp, s: string) => new RegExp(re.source, re.flags.replace('g', '')).test(s)

// Split into sentences without breaking after "Mr.", "Dr." etc.
function sentencesOf(post: string) {
  return post.split(/(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|St|Rs|vs|etc|no)\.)(?<=[.!?])\s+|\n+/i).filter(Boolean)
}

function mask(word: string) {
  return word[0] + '*'.repeat(Math.max(2, word.length - 1))
}

export function checkPost(post: string): SafetyFlag[] {
  const flags: SafetyFlag[] = []
  const seen = new Set<string>()
  const add = (flag: SafetyFlag) => {
    const key = `${flag.kind}:${flag.match}`
    if (!seen.has(key)) {
      seen.add(key)
      flags.push(flag)
    }
  }

  for (const sentence of sentencesOf(post)) {
    const lower = sentence.toLowerCase()
    const aboutPatient = /\bpatient\b/.test(lower)
    const aboutClient = /\b(client|customer|founder)\b/.test(lower)

    for (const m of sentence.matchAll(HONORIFIC_NAME)) {
      // "a patient called Mr. X" → drop " called Mr. X"; a bare "Mr. X" → a role word.
      const lead = sentence.slice(0, m.index).match(/\s(?:called|named)\s+$/)
      add({
        kind: 'person',
        severity: 'high',
        match: lead ? lead[0].trimEnd() + ' ' + m[0] : m[0],
        label: aboutPatient ? 'Names a patient' : 'Names a private person',
        replacement: lead ? '' : aboutPatient ? 'one of our patients' : 'someone',
      })
    }
    for (const m of sentence.matchAll(ROLE_NAME)) {
      if (/^(Mr|Mrs|Ms|Dr)\b/.test(m[2])) continue // handled above
      // Keep a role word, drop the name: "The founder Rajesh Agarwal refused" → "The founder refused";
      // "a client named John Smith said" → "a client said".
      const called = /^(called|named)$/i.test(m[1])
      add({
        kind: 'person',
        severity: 'high',
        match: called ? `${m[1]} ${m[2]}` : m[2],
        label: 'Names a private person',
        replacement: '',
      })
    }
    for (const m of sentence.matchAll(COMPANY)) {
      add({ kind: 'company', severity: 'high', match: m[0], label: 'Names a client or company', replacement: 'a client' })
    }
    if (aboutPatient || has(HONORIFIC_NAME, sentence)) {
      for (const m of sentence.matchAll(CONDITION)) {
        add({ kind: 'health', severity: 'high', match: m[0], label: 'Shares health details', replacement: 'a serious condition' })
      }
      for (const m of sentence.matchAll(TREATMENT)) {
        add({ kind: 'health', severity: 'high', match: m[0], label: 'Shares health details', replacement: 'treatment' })
      }
    }
    if (/\b(revenue|turnover|sales|margin|salary|valuation|their|client)\b/i.test(sentence) && (aboutClient || has(COMPANY, sentence))) {
      for (const m of sentence.matchAll(FIGURE)) {
        add({ kind: 'figures', severity: 'high', match: m[0], label: "Shares someone else's financial figures", replacement: 'a significant amount' })
      }
    }
    if (has(NEGATIVE_CONTEXT, sentence)) {
      for (const m of sentence.matchAll(BIG_FIRMS)) {
        add({ kind: 'competitor', severity: 'medium', match: m[0], label: `Names ${m[0]} in a competitive context`, replacement: 'a big-name firm' })
      }
    }
  }

  const advice = post.match(ADVICE)
  if (advice) {
    add({
      kind: 'advice',
      severity: 'medium',
      match: advice[0],
      label: 'Reads like financial or medical advice',
      append: 'This is my experience, not financial or medical advice.',
    })
  }
  for (const m of post.matchAll(PROFANITY)) {
    add({ kind: 'profanity', severity: 'low', match: m[0], label: 'Strong language', replacement: mask(m[0]) })
  }
  return flags
}

// Offline anonymise: apply every flag's replacement, and add disclaimers above the hashtags.
export function anonymize(post: string, flags: SafetyFlag[] = checkPost(post)): string {
  let out = post
  for (const f of flags) {
    if (f.replacement !== undefined) out = out.split(f.match).join(f.replacement)
  }
  out = out.replace(/ {2,}/g, ' ').replace(/ ,/g, ',').replace(/ \./g, '.')
  const appends = [...new Set(flags.map((f) => f.append).filter(Boolean))] as string[]
  if (appends.length) {
    const lines = out.split('\n')
    const tagLine = lines.findLastIndex((l) => /^(#\w+\s*)+$/.test(l.trim()))
    const insertAt = tagLine >= 0 ? tagLine : lines.length
    lines.splice(insertAt, 0, ...appends.flatMap((a) => [a, '']))
    out = lines.join('\n')
  }
  return out
}
