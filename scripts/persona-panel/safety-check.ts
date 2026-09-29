// Quick check of the "Before you post" rules on the persona cases that need them.
// Run: npx tsx scripts/persona-panel/safety-check.ts
import { anonymize, checkPost } from '../../src/lib/safety'

const cases: Record<string, string> = {
  P17: 'Yesterday a patient called Mr. Suresh Pillai, 67, with stage 3 diabetes, missed his dialysis because our booking app crashed.\n\nWe need to design healthcare apps for 67 year olds.',
  P05: 'I just finished a project with Agarwal Textiles in Surat, their revenue is about 180 crore.\n\nThe founder Rajesh Agarwal refused to let his son see the financials.',
  P24: 'We lost a 2 crore deal to Deloitte last month.',
  P27: 'I moved one client into a mix of index funds and he will retire 6 years earlier.\n\n#finance',
  CLIENT: 'Last week a client named John Smith said the pilot saved them time.',
  P29: 'I quit my job at Google last Friday to build a learning app.', // should not flag
  P15: 'My first employee Ramesh packed boxes with me in 2019.', // should not flag
}

for (const [id, text] of Object.entries(cases)) {
  const flags = checkPost(text)
  console.log(`${id}: ${flags.map((f) => `${f.kind}:"${f.match}"`).join(' | ') || 'no flags'}`)
  if (flags.some((f) => f.replacement !== undefined || f.append)) console.log(`   → ${anonymize(text, flags).replace(/\n+/g, ' / ')}`)
}
