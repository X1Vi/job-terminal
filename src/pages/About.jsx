import { SOURCES, THEMES, SOURCE_CATEGORIES, OPP_SOURCES, OPP_TYPES, OPP_FIELDS, OPP_REGIONS } from '../data/sources'

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
          {'>'} JOB TERMINAL <span style={{fontSize:'0.8rem', opacity:0.5}}>v1.0.0</span>
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
            <div className="about-section-title">[ FEATURES ]</div>
            <div className="about-feature">Live job aggregation from CORS-friendly APIs (RemoteOK, Remotive, Arbeitnow, Jobicy, HN Who is Hiring)</div>
            <div className="about-feature">Live scholarship, fellowship & grant RSS feeds (Scholars4Dev, OpportunityDesk, AfterSchool Africa, Opportunities For Youth, NSF Funding)</div>
            <div className="about-feature">More sources planned (Greenhouse, Lever, Ashby, LinkedIn, Indeed, Adzuna, USAJobs...)</div>
            <div className="about-feature">Client-side deduplication engine (title + org fingerprint + Jaccard similarity)</div>
            <div className="about-feature">Real-time search & filtering by type, region, field, remote, experience</div>
            <div className="about-feature">Stats dashboard with relevancy & distribution charts</div>
            <div className="about-feature">6 terminal color themes (easy on the eyes)</div>
            <div className="about-feature">Zero backend — 100% client-side</div>
            <div className="about-feature">Hostable on GitHub Pages</div>
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
