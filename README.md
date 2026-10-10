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

vite build → dist/ → Cloudflare Pages / any static host
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

## Deploy to Cloudflare Pages

### Option A — Git integration + scheduled refresh (recommended, minimal GitHub compute)

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
   pick this repo.
2. Settings → **Builds & deployments**:
   - Build command: `npm run build:data`
   - Build output directory: `dist`
   - (Recommended) Environment variable: `NODE_VERSION = 20`
   - (Optional) `SNAPSHOT_URL = https://<your-project>.pages.dev` — lets each
     build merge fresh data with the live snapshot, so a source outage never
     drops listings between deploys.
3. Settings → **Deploy hooks** → create a hook on `main`, copy the URL.
4. GitHub repo → Settings → Secrets and variables → Actions → add
   `CLOUDFLARE_DEPLOY_HOOK` = that URL.

Every 6 hours the GitHub workflow just `curl`s the deploy hook (~10 seconds of
GitHub Actions compute). The actual collection + build runs on Cloudflare's
builders for free. Manual refresh: run the workflow from the Actions tab.

### Option B — Direct upload from your machine

```bash
npx wrangler login        # one time
npm run deploy:cf         # collect + build + wrangler pages deploy
```

`wrangler.toml` already points at the `dist` output — rename the project there
if you like (or use any project name you created in the dashboard).

### Cache headers

`public/_headers` (Cloudflare Pages) sets `/data/*` to `max-age=300,
stale-while-revalidate=86400` and hashed assets to immutable, so repeat visits
barely touch the network.

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
