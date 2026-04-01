# SFC-Monitor

<p align="center">
  <img src="public/branding/sfc-wordmark.png" alt="SFC" width="420" />
</p>

<p align="center">
  Real-time global intelligence dashboard for geopolitics, markets, infrastructure, climate, cyber, maritime, and aviation monitoring.
</p>

<p align="center">
  <a href="https://github.com/Frank-Opus/SFC-Monitor"><strong>GitHub</strong></a>
  &nbsp;·&nbsp;
  <a href="https://sfc-monitor.vercel.app"><strong>Live App</strong></a>
  &nbsp;·&nbsp;
  <a href="./docs"><strong>Docs</strong></a>
</p>

![SFC-Monitor Dashboard](docs/images/worldmonitor-7-mar-2026.jpg)

## Overview

SFC-Monitor is a TypeScript-based situational awareness platform that combines live news, AI synthesis, maps, market data, infrastructure monitoring, and cross-domain signal tracking in a single dashboard. The repository ships the web app, Vercel Edge APIs, Tauri desktop shell, and supporting server-side handlers used by the production deployment.

Core capabilities:

- Real-time news aggregation across global, regional, sector, and intelligence feeds
- AI panels for insights, forecasts, strategic posture, and prediction synthesis
- Interactive global map with military, maritime, energy, commodity, cyber, and infrastructure layers
- Markets coverage across equities, macro, commodities, crypto, and economic indicators
- Aviation, shipping, climate, disaster, and sanctions monitoring
- Multi-variant app configuration from one codebase: `full`, `tech`, `finance`, `commodity`, `happy`

## Production

- Web: `https://sfc-monitor.vercel.app`
- Repository: `https://github.com/Frank-Opus/SFC-Monitor`

## Repository Structure

```text
.
├── src/             # Vite + Preact SPA
├── api/             # Vercel Edge Functions
├── server/          # Server handlers bundled into edge routes
├── proto/           # Protobuf service contracts
├── src-tauri/       # Tauri desktop shell + sidecar
├── shared/          # Shared data/config
├── scripts/         # Build, seed, and maintenance scripts
├── tests/           # Unit and integration tests
├── e2e/             # Playwright tests
└── docs/            # Documentation content
```

## Quick Start

```bash
git clone https://github.com/Frank-Opus/SFC-Monitor.git
cd SFC-Monitor
npm install
npm run dev
```

Open `http://localhost:5173`.

Variant-specific development:

```bash
npm run dev:tech
npm run dev:finance
npm run dev:commodity
npm run dev:happy
```

## Common Commands

```bash
npm run dev
npm run typecheck
npm run typecheck:api
npm run test:data
npm run test:sidecar
npm run test:e2e
make generate
```

## Stack

- Frontend: TypeScript, Vite, Preact, deck.gl, MapLibre GL, globe.gl
- API: Vercel Edge Functions
- Server: TypeScript handlers with Redis-backed caching
- Desktop: Tauri 2 with Node.js sidecar
- Contracts: Protocol Buffers + generated stubs
- Deployment: Vercel, Railway, GitHub Actions

## Architecture Notes

- Dependency direction: `types -> config -> services -> components -> app -> App.ts`
- Edge functions in `api/` must remain self-contained JS
- Shared server logic lives under `server/`
- New APIs should be wired through proto contracts, generated stubs, handlers, and bootstrap hydration

See [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [CONTRIBUTING.md](CONTRIBUTING.md) for project-specific conventions.

## Data Domains

SFC-Monitor aggregates and visualizes data across:

- Geopolitics and regional news
- Military activity and escalation indicators
- Maritime traffic and chokepoints
- Aviation and aircraft movement
- Finance, macro, commodities, and crypto
- Climate, disasters, and infrastructure outages
- Cyber and technology signals

## Contributing

```bash
npm run typecheck
npm run test:data
```

Project conventions and guardrails are documented in [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

## License

This repository remains subject to the license terms in [LICENSE](LICENSE).
