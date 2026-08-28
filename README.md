# JOB TERMINAL

Multi-source job & opportunity aggregator with a terminal-themed UI.

**Live:** https://X1Vi.github.io/job-terminal/

## Features

- **Live job sources** — fetched straight from the browser (no key, CORS-friendly APIs):
  RemoteOK, Remotive, Arbeitnow, Jobicy, HN Who is Hiring
- **Live opportunity sources** — parsed from RSS feeds via a CORS proxy fallback:
  Scholars4Dev, Opportunity Desk, AfterSchool Africa, Opportunities For Youth, NSF Funding
- **More sources listed, not yet live** — Greenhouse, Lever, Ashby, LinkedIn, Indeed,
  Adzuna, USAJobs, etc. are documented in the About page but need API keys, scrapers,
  or a backend and are not currently wired in
- **Dedup engine** — Multi-level client-side deduplication (org+title fingerprint + Jaccard description similarity)
- **Dashboard** — Stats + charts for jobs and opportunities with relevancy sorting
- **Clickable charts** — Expand any chart into a full-size overlay
- **6 themes** — Matrix, Amber, Cyber, Mono, Retro, Soft — easy on the eyes
- **100% client-side** — No backend, hostable on GitHub Pages

## Usage

```
npm install
npm run dev      # Development server
npm run build    # Production build
npm run deploy   # Deploy to GitHub Pages
```

## Tech

React, React Router, Recharts, Vite
