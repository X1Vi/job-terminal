# JOB TERMINAL

Multi-source job & opportunity aggregator with a terminal-themed UI. Data is
collected by a zero-dependency script into compact static JSON, then served
straight from the CDN edge — the site loads instantly and never scrapes in the
browser (unless the snapshot is missing).

**Live:** https://X1Vi.github.io/job-terminal/ — (or your own Cloudflare Pages URL after setup below)

## Architecture

```
scripts/collect.mjs            (runs on Cloudflare build or locally, ~8s, no deps)
  ├─ fetch all job APIs + RSS feeds in parallel (fetch, 20s timeout)
  ├─ merge with previous snapshot (source hiccups never wipe data)
  ├─ prune stale listings (jobs >45d, opps expired or >120d old)
  ├─ dedupe (company+title fingerprint, fuzzy title match, description sim)
  └─ write public/data/
       ├─ jobs.json        compact job feed (~130 KB gzipped)
       ├─ opps.json        compact opportunity feed
       ├─ job-stats.json   pre-computed chart-ready statistics
       └─ opp-stats.json   pre-computed opportunity statistics

vite build → dist/ (assets + JSON) → wrangler deploy → Cloudflare Workers static assets
Browser → loads JSON from /data/* (cached at edge, 5 min TTL) → filters locally
```

Statistics are computed **at collection time**, so the dashboard renders from a
few KB of JSON and the client does no aggregation work.

## Quick start

```bash
npm install
npm run collect   # fetch sources → public/data/*.json (needs network)
npm run dev       # develop
npm run build     # vite build only (reuses last snapshot)
npm run build:data  # collect + build (what CI runs)
```

> Without a snapshot the site still works — it falls back to live client-side
> fetching — but the snapshot path is much faster.

## Deploy to Cloudflare Workers (static assets)

The site is served by a Workers **static assets** deployment — `wrangler.toml`
points at `dist/`, so `wrangler deploy` uploads the built site plus the data
snapshot in one operation. `public/_headers` cache rules work on Workers too.

### Option A — Workers Builds (Git integration)

1. Cloudflare Dashboard → **Workers & Pages → Create application → Import a repository**.
2. Pick this repo. Set:
   - Build command: `npm run build:data`
   - Deploy command: `npx wrangler deploy` (default)
   - (Recommended) Build variable: `NODE_VERSION = 22` (Wrangler 4 requires Node 22+)
   - (Optional) Build variable: `SNAPSHOT_URL = https://<your-worker>.<subdomain>.workers.dev` —
     lets each build merge fresh data with the live snapshot so a source
     outage never drops listings between deploys.
3. Save and deploy. The Worker name in the dashboard must match `name` in
   `wrangler.toml` (`job-terminal`) — rename one of them if you prefer another.
4. Scheduled data refresh: add the repo secrets in the next section — the
   included workflow rebuilds + redeploys every 6 hours without any pushes.

### Option B — Deploy from your machine

```bash
npx wrangler login        # one time (needs Node 22+)
npm run deploy:cf         # collect + build + wrangler deploy
npm run dev:cf            # local preview through the Workers runtime
```

> Wrangler 4 requires **Node 22 or newer** for the `deploy:cf` / `dev:cf`
> commands. The collector itself only needs Node 18+.

### Scheduled refresh (GitHub → Workers)

`.github/workflows/refresh-data.yml` runs every 6 hours (and on demand from the
Actions tab): it collects fresh data, builds, and deploys with Wrangler. ~1–2
minutes of GitHub compute per run; nothing else is needed.

Set these repo secrets once (Settings → Secrets and variables → Actions):

| Secret / variable | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Workers Scripts (edit)** |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (Workers & Pages → Overview sidebar) |
| `SNAPSHOT_URL` *(optional variable)* | `https://job-terminal.<your-subdomain>.workers.dev` — enables merge-with-live-snapshot |

## Strong filtering

Both pages support a multi-token **AND** search with relevance ranking:

- `react aws` — jobs matching both tokens; title matches rank higher
- `"full stack"` — exact phrase inside quotes
- `-senior` — exclude matches

Jobs facets: source, category (auto-detected from title), work mode, job type,
experience level, salary floor ($50k+…$250k+), freshness (24h…30d), sort by
newest/oldest/relevance/salary/company/title/source.

Opportunities facets: type, region, field, deadline window (open, closing ≤14d,
≤30d, rolling, no deadline, expired), sort by deadline/relevance/newest/title/source.

## Sources

**Jobs:** RemoteOK, Remotive, Arbeitnow, Jobicy, HN Who is Hiring
**Opportunities:** Scholars4Dev, OpportunityDesk (fellowships / grants /
internships), AfterSchool Africa, Opportunities For Youth, NSF Funding

Everything else (Greenhouse, Lever, Adzuna, USAJobs, …) is listed on the About
page but not wired in — they need API keys or a scraper.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run collect` | Refresh `public/data/*.json` |
| `npm run build` | Vite production build (uses existing snapshot) |
| `npm run build:data` | Collect + build (CI entrypoint) |
| `npm run deploy:cf` | Collect + build + deploy to Cloudflare Pages |
| `npm run deploy` | Collect + build + deploy to GitHub Pages |
| `npm run lint` | oxlint |

## Tech

React 19, React Router, Recharts, Vite. Collector: plain Node 18+ (global
`fetch`), **zero dependencies** — fast installs, fast CI.
