<p align="center">
  <img src="public/branding/sfc-wordmark.png" alt="SFC-Monitor" width="420" />
</p>

# SFC-Monitor

Real-time global intelligence, markets, infrastructure, and AI decision-support dashboard.

<p align="center">
  <a href="https://sfc-monitor.vercel.app"><strong>Live App</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Frank-Opus/SFC-Monitor"><strong>GitHub</strong></a>
  &nbsp;·&nbsp;
  <a href="./docs"><strong>Docs</strong></a>
  &nbsp;·&nbsp;
  <a href="./handoff/2026-03-31-codex-migration/QUICKSTART.md"><strong>Ops Quickstart</strong></a>
</p>

## Overview

SFC-Monitor is the SFC-branded operating dashboard for real-time situational awareness. It combines world and regional news, AI summaries and forecasts, finance and commodity monitoring, aviation and maritime tracking, climate and infrastructure signals, and map-based overlays in a single Vite + Preact application.

Core capabilities:

- Global and regional news panels for world, US, Europe, Middle East, Africa, Latin America, and Asia-Pacific
- SFC-Agent AI panels for insights, strategic posture, forecasts, predictions, and market implications
- Interactive map with geopolitical, maritime, infrastructure, finance, climate, and tech layers
- Crypto, macro, commodity, and market data panels with live API-backed refresh
- 60+ Vercel Edge API endpoints and shared server handlers for caching, rate limiting, and source normalization
- Tauri desktop shell with Node.js sidecar support

## Live Surfaces

- Web: `https://sfc-monitor.vercel.app`
- Repository: `https://github.com/Frank-Opus/SFC-Monitor`
- Variants: `full`, `tech`, `finance`, `commodity`, `happy`

## Quick Start

```bash
git clone https://github.com/Frank-Opus/SFC-Monitor.git
cd SFC-Monitor
npm install
npm run dev
```

Open `http://localhost:5173`.

Useful commands:

```bash
npm run dev:tech
npm run dev:finance
npm run dev:commodity
npm run dev:happy
npm run typecheck
npm run typecheck:api
npm run test:data
npm run test:sidecar
npm run test:e2e
```

Operational handoff and environment setup:

- [Quickstart](./handoff/2026-03-31-codex-migration/QUICKSTART.md)
- [Current status](./handoff/2026-03-31-codex-migration/CURRENT_STATUS.md)
- [Secrets and env](./handoff/2026-03-31-codex-migration/SECRETS_AND_ENV.md)

## Architecture

```text
src/          Browser SPA, panel system, services, workers
api/          Vercel Edge Functions
server/       Shared server handlers and gateway code
proto/        Protobuf service contracts
src-tauri/    Tauri desktop shell and sidecar
tests/        Node test runner coverage
e2e/          Playwright end-to-end tests
docs/         Project documentation site
```

Key implementation characteristics:

- TypeScript SPA built with Vite and Preact
- Class-based panel architecture with variant-aware defaults
- Redis-backed caching and bootstrap hydration for unstable third-party APIs
- Edge-safe API layer with strict runtime boundaries
- Shared protobuf contract flow for generated clients and handlers

## Data Coverage

SFC-Monitor aggregates and visualizes data across:

- Geopolitics and breaking news
- AI, technology, startups, and cloud infrastructure
- Equities, macro, bonds, commodities, and crypto
- Aviation, shipping, maritime chokepoints, and undersea cables
- Climate, disasters, outages, cyber incidents, and infrastructure risk

## Deployment

- Web frontend and Edge APIs: Vercel
- Relay and scheduled data services: Railway
- Desktop packaging: Tauri via GitHub Actions

## Contributing

Development and codebase conventions are documented in:

- [AGENTS.md](./AGENTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

This repository currently includes the upstream AGPL-3.0 license text. See [LICENSE](./LICENSE).
