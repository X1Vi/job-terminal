import { useMemo, useState, useEffect, useCallback } from 'react'
import { deduplicateJobs } from '../engine/dedup'
import { fetchAllJobs } from '../api/jobFetchers'

function formatSalary(min, max, currency) {
  if (!min && !max) return ''
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)
  const sym = { USD: '$', EUR: '\u20ac', GBP: '\u00a3' }[currency] || (currency + ' ')
  if (min && max) return `${sym}${fmt(min)}-${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  return `${sym}up to ${fmt(max)}`
}

function safe(v, fallback = '') { return v ?? fallback }

export default function Jobs({ searchQuery }) {
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchErrors, setFetchErrors] = useState([])
  const [category, setCategory] = useState('all')
  const [remote, setRemote] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [showDedup, setShowDedup] = useState(true)
  const [paginated, setPaginated] = useState(50)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAllJobs().then(({ jobs, errors }) => {
      if (!cancelled) {
        setAllJobs(jobs)
        setFetchErrors(errors)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const loadMore = useCallback(() => setPaginated(p => p + 50), [])

  const { unique, duplicates, totalBefore, totalAfter, dupCount } = useMemo(
    () => showDedup ? deduplicateJobs(allJobs)
      : { unique: allJobs, duplicates: [], totalBefore: allJobs.length, totalAfter: allJobs.length, dupCount: 0 },
    [allJobs, showDedup]
  )

  const categories = useMemo(() => {
    const s = new Set()
    for (const j of (showDedup ? unique : allJobs)) {
      if (j.category) s.add(j.category)
    }
    return ['all', ...s]
  }, [allJobs, showDedup, unique])

  const filtered = useMemo(() => {
    let jobs = showDedup ? unique : allJobs
    if (category !== 'all') jobs = jobs.filter(j => j.category === category)
    if (remote !== 'all') jobs = jobs.filter(j => (j.remote || '').toLowerCase() === remote)

    const k = (keyword || searchQuery || '').toLowerCase()
    if (k) {
      jobs = jobs.filter(j =>
        (j.title || '').toLowerCase().includes(k) ||
        (j.company || '').toLowerCase().includes(k) ||
        (j.description || '').toLowerCase().includes(k) ||
        (j.location || '').toLowerCase().includes(k)
      )
    }
    return jobs
  }, [category, remote, keyword, searchQuery, showDedup, unique, allJobs])

  const displayJobs = useMemo(() => filtered.slice(0, paginated), [filtered, paginated])

  return (
    <div>
      <div className="jobs-toolbar">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>

        <select value={remote} onChange={e => setRemote(e.target.value)}>
          <option value="all">All Modes</option>
          <option value="remote">Remote</option>
          <option value="on-site">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <input
          type="text" placeholder="engineering, design, react..."
          value={keyword} onChange={e => setKeyword(e.target.value)}
          style={{background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'3px',
            color:'var(--fg)', padding:'0.3rem 0.45rem', fontFamily:'inherit', fontSize:'0.78rem',
            outline:'none', minWidth:'140px'}}
        />

        <label style={{fontSize:'0.75rem', color:'var(--fg-dim)', display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer'}}>
          <input type="checkbox" checked={showDedup} onChange={e => setShowDedup(e.target.checked)}
            style={{accentColor:'var(--fg)'}} />
          Dedup
        </label>

        <div className="jobs-count">
          {loading ? 'fetching...' : `${displayJobs.length} / ${showDedup ? totalAfter : allJobs.length}`}
        </div>
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          <div>Fetching from RemoteOK, Remotive, Arbeitnow, Jobicy, HN...</div>
        </div>
      )}

      {!loading && fetchErrors.length > 0 && (
        <div className="jobs-dedup-info" style={{borderStyle:'solid', borderColor:'#b85050'}}>
          <strong>WARN:</strong> {fetchErrors.length} source(s) failed. Refresh to retry.
        </div>
      )}

      {showDedup && dupCount > 0 && (
        <div className="jobs-dedup-info">
          <strong>DEDUP:</strong> {dupCount} duplicate{dupCount !== 1 ? 's' : ''} removed &rarr; {totalAfter} unique
        </div>
      )}

      {displayJobs.map((job, i) => (
        <a href={safe(job.url)} key={`${job.source}-${i}`} target="_blank" rel="noopener noreferrer"
          style={{display:'block', textDecoration:'none', color:'inherit'}}>
          <div className="card">
            <div className="card-title">{safe(job.title, 'Untitled')}</div>
            <div className="card-meta">
              <span>{safe(job.company)}</span>
              <span>{safe(job.location)}</span>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
            </div>
            {job.description && job.description.length > 10 && (
              <div style={{fontSize:'0.7rem', color:'var(--fg-dim)', marginTop:'0.25rem', lineHeight:'1.3', opacity:0.7, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                {safe(job.description).slice(0, 200)}
              </div>
            )}
            <div className="card-meta" style={{marginTop:'0.3rem'}}>
              <span className={`card-tag ${safe(job.remote) === 'Remote' ? 'green' : safe(job.remote) === 'Hybrid' ? 'amber' : 'blue'}`}>
                {safe(job.remote, 'Remote')}
              </span>
              <span className="card-tag">{safe(job.jobType, 'Full-time')}</span>
              <span className="card-tag">{safe(job.experienceLevel, 'Mid')}</span>
              <span className="card-tag">{safe(job.source)}</span>
              <span style={{marginLeft:'auto', fontSize:'0.7rem'}}>{safe(job.datePosted)}</span>
            </div>
          </div>
        </a>
      ))}

      {!loading && displayJobs.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No jobs match your filters.
        </div>
      )}

      {!loading && paginated < filtered.length && (
        <div style={{textAlign:'center', padding:'1rem'}}>
          <button onClick={loadMore} className="theme-btn" style={{padding:'0.4rem 1.2rem'}}>
            LOAD MORE ({filtered.length - paginated} left)
          </button>
        </div>
      )}
    </div>
  )
}
