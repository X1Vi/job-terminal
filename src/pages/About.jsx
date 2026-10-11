import { SOURCES, THEMES, OPP_SOURCES, OPP_TYPES, OPP_FIELDS, OPP_REGIONS } from '../data/sources'

export default function About() {
  const freeCount = SOURCES.filter(s => s.free).length
  const keyedCount = SOURCES.filter(s => !s.free).length
  const liveCount = SOURCES.filter(s => s.live).length
  const oppFreeCount = OPP_SOURCES.filter(s => s.free).length
  const oppLiveCount = OPP_SOURCES.filter(s => s.live).length

  return (
    <div className="about-container">
      <div className="about-box">
        <div className="about-box-header">
          {'>'} JOB TERMINAL <span style={{fontSize:'0.8rem', opacity:0.5}}>v2.0.0</span>
        </div>
        <div className="about-box-body">
          <div className="about-section">
            <div className="about-section-title">[ JOB SOURCES ]</div>
            {SOURCES.map(s => (
              <div className="about-source-line" key={s.id}>
                <span className="name">
                  {s.name}
                  {s.live && <span className="live-tag">LIVE</span>}
                </span>
                <span className="desc">
                  {s.free ? 'Free' : s.key || 'API Key'} — {s.type} — {s.category}
                  {s.companies ? ` (${s.companies}+ companies)` : ''}
                </span>
              </div>
            ))}
            <div style={{marginTop:'0.5rem', fontSize:'0.75rem', color:'var(--fg-dim)'}}>
              {liveCount} live · {freeCount} free · {keyedCount} keyed · {SOURCES.length} total job sources
            </div>
          </div>

          <div className="about-section">
            <div className="about-section-title">[ OPPORTUNITY SOURCES ]</div>
            {OPP_SOURCES.map(s => (
              <div className="about-source-line" key={s.id}>
                <span className="name">
                  {s.name}
                  {s.live && <span className="live-tag">LIVE</span>}
                </span>
                <span className="desc">
                  Free — {s.type} — {s.kind}
                </span>
              </div>
            ))}
            <div style={{marginTop:'0.5rem', fontSize:'0.75rem', color:'var(--fg-dim)'}}>
              {oppLiveCount} live · {oppFreeCount} free sources · {OPP_TYPES.length - 1} opportunity types
            </div>
          </div>

          <div className="about-section">
            <div className="about-section-title">[ OPPORTUNITY TYPES ]</div>
            {OPP_TYPES.filter(t => t.id !== 'all').map(t => (
              <div className="about-feature" key={t.id}>{t.name}</div>
            ))}
          </div>

          <div className="about-section">
            <div className="about-section-title">[ REGIONS ]</div>
            {OPP_REGIONS.map(r => (
              <div className="about-feature" key={r}>{r}</div>
            ))}
          </div>

          <div className="about-section">
            <div className="about-section-title">[ FIELDS ]</div>
            {OPP_FIELDS.map(f => (
              <div className="about-feature" key={f}>{f}</div>
            ))}
          </div>

          <div className="about-section">
            <div className="about-section-title">[ DATA PIPELINE ]</div>
            <div className="about-feature"><span className="about-key">npm run collect</span> — fetches every source in parallel, merges with the previous snapshot, prunes stale listings, dedupes and pre-computes all statistics</div>
            <div className="about-feature">Output is compact static JSON in <span className="about-key">/data/</span> (jobs, opportunities + stats) served directly from the CDN edge — page load is instant, no client-side scraping</div>
            <div className="about-feature">If a source is down, its previous items are retained automatically; the site never goes empty because a feed hiccuped</div>
            <div className="about-feature">Scheduled refresh runs 3 times a day and redeploys automatically (GitHub Actions → Cloudflare Workers)</div>
            <div className="about-feature">No snapshot available? The site falls back to fetching live in the browser</div>
            <div className="about-feature">Stale snapshot (older than 12h)? The page shows it instantly, then quietly refreshes itself from the sources in the background and caches the result for 6h — so it never gets stuck on old data even if the scheduled job is down</div>
          </div>

          <div className="about-section">
            <div className="about-section-title">[ FEATURES ]</div>
            <div className="about-feature">Job sources: RemoteOK, Remotive, Arbeitnow, Jobicy, HN Who is Hiring</div>
            <div className="about-feature">Opportunity sources: Scholars4Dev, OpportunityDesk (fellowships, grants, internships), AfterSchool Africa, Opportunities For Youth, NSF Funding</div>
            <div className="about-feature">Strong filtering: multi-token AND search with relevance ranking, phrase (&quot;quoted&quot;) and exclusion (-word) operators, auto-categorized jobs, salary floor, freshness window, work mode, type, level, source and category facets</div>
            <div className="about-feature">Opportunity filters: type, region, field, deadline window (closing soon / rolling / open / expired) and relevance sort</div>
            <div className="about-feature">Multi-level dedup engine (company + title fingerprint, fuzzy title token match, description similarity, best-item selection)</div>
            <div className="about-feature">Extended statistics: postings timeline, median salary overall & by category, top companies, most-mentioned skills, hiring locations, deadline timeline and closing-soon list</div>
            <div className="about-feature">6 terminal color themes (easy on the eyes)</div>
            <div className="about-feature">Deployable to Cloudflare Workers or any static host</div>
          </div>

          <div className="about-section">
            <div className="about-section-title">[ USAGE ]</div>
            <div className="about-feature"><span className="about-key">[DASHBOARD]</span> — Stats, graphs & relevancy metrics</div>
            <div className="about-feature"><span className="about-key">[JOBS]</span> — Browse aggregated jobs with dedup engine</div>
            <div className="about-feature"><span className="about-key">[OPPORTUNITIES]</span> — Browse scholarships, fellowships, grants & internships</div>
            <div className="about-feature"><span className="about-key">[ABOUT]</span> — This information</div>
            <div className="about-feature">Use the theme dropdown to switch between color schemes</div>
          </div>

          <div className="about-section">
            <div className="about-section-title">[ THEMES ]</div>
            {THEMES.map(t => (
              <div className="about-feature" key={t.id}>
                {t.name} — {t.desc}
              </div>
            ))}
          </div>

          <div className="about-section">
            <div className="about-section-title">[ LICENSE ]</div>
            <div className="about-feature">MIT License — Free and open source</div>
          </div>
        </div>
      </div>
    </div>
  )
}
