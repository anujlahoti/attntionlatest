# Persona panel

30 synthetic personas (founders, executives, professionals, freelancers, early career across 12 industries),
each with a quiz profile and a realistic voice-note answer. `run-panel.mjs` pushes every persona through the
demo endpoints (question → draft → photo recommendation) and scores each draft against the post rules.

```bash
npm run build && npx next start -p 3200   # in one terminal
node scripts/persona-panel/run-panel.mjs   # in another; BASE=http://localhost:3200 by default
```

Results are written to `scripts/persona-panel/panel-results.json`. Each run triggers one Apify scrape per
profession/niche (about 12), so it costs a few cents of Apify credit.
