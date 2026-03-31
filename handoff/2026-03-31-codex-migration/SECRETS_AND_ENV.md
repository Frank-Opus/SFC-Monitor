# Secrets And Env

## Local file
Secrets are stored locally in:
- `worldmonitor/.env.local`

This file now includes:
- GitHub token
- Vercel token
- Primary AI provider (`LLM_API_KEY`, `LLM_API_URL`, `LLM_MODEL`)
- Finnhub / FRED / EIA / CoinGecko
- NASA FIRMS / WTO primary+secondary / ACLED / ICAO / AviationStack
- Upstash / Redis credentials

## User intent on AI provider
User explicitly said:
- stop using Groq
- use AI Agent endpoint instead
- latest active AI settings are:
  - `LLM_API_URL=https://ai.soruxgpt.com`
  - `LLM_MODEL=gemini-3-flash-preview`
  - key stored in `.env.local`

## Vercel env sync already done
Verified-good envs were already synced into the Vercel production project earlier in the session, including Redis and multiple data API keys.
A `CRON_SECRET` was also created in Vercel production env.

## Important caution
Do not put raw secrets into git-tracked handoff notes.
Use `.env.local` as the authoritative local snapshot for migration.
