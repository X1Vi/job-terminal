import { useMemo, useState, useEffect, useCallback } from 'react'
import { deduplicateJobs } from '../engine/dedup'
import { fetchAllJobs } from '../api/jobFetchers'

function formatSalary(min, max, currency) {
  if (!min && !max) return ''
  const fmt = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
    return String(n)
  }
  const sym = { USD: '$', EUR: '\u20ac', GBP: '\u00a3' }[currency] || currency + ' '
  if (min && max) return `${sym}${fmt(min)}-${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  return `${sym}up to ${fmt(max)}`
}

export default function Jobs({ searchQuery }) {
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchErrors, setFetchErrors] = useState([])
  const [category, setCategory] = useState('all')
  const [remote, setRemote] = useState('all')
  const [jobType, setJobType] = useState('all')
  const [expLevel, setExpLevel] = useState('all')
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
    () => showDedup ? deduplicateJobs(allJobs) : { unique: allJobs, duplicates: [], totalBefore: allJobs.length, totalAfter: allJobs.length, dupCount: 0 },
    [allJobs, showDedup]
  )

  const sourceList = useMemo(() => {
    const s = new Set(allJobs.map(j => j.source))
    return ['all', ...s]
  }, [allJobs])

  const filtered = useMemo(() => {
    let jobs = showDedup ? unique : allJobs
    if (category !== 'all') jobs = jobs.filter(j => j.category === category)
    if (remote !== 'all') jobs = jobs.filter(j => j.remote?.toLowerCase() === remote)
    if (jobType !== 'all') jobs = jobs.filter(j => j.jobType === jobType)
    if (expLevel !== 'all') jobs = jobs.filter(j => j.experienceLevel === expLevel)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      jobs = jobs.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      )
    }
    return jobs
  }, [category, remote, jobType, expLevel, searchQuery, showDedup, unique, allJobs])

  const displayJobs = useMemo(() => filtered.slice(0, paginated), [filtered, paginated])

  return (
    <div>
      <div className="jobs-toolbar">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="ATS Boards">ATS Boards</option>
          <option value="Remote Jobs">Remote Jobs</option>
          <option value="Tech Jobs">Tech Jobs</option>
        </select>

        <select value={remote} onChange={e => setRemote(e.target.value)}>
          <option value="all">All Modes</option>
          <option value="remote">Remote</option>
          <option value="on-site">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <select value={jobType} onChange={e => setJobType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Contract">Contract</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
        </select>

        <select value={expLevel} onChange={e => setExpLevel(e.target.value)}>
          <option value="all">All Levels</option>
          <option value="Entry">Entry</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>

        <label style={{fontSize:'0.75rem', color:'var(--fg-dim)', display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer'}}>
          <input type="checkbox" checked={showDedup} onChange={e => setShowDedup(e.target.checked)}
            style={{accentColor:'var(--fg)'}} />
          Dedup
        </label>

        <div className="jobs-count">
          {loading ? 'fetching...' : `${displayJobs.length} of ${showDedup ? totalAfter : allJobs.length}`}
        </div>
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          <div style={{marginBottom:'0.5rem'}}>Fetching live job data from RemoteOK, Remotive, Arbeitnow, Jobicy, HN...</div>
          <div style={{fontSize:'0.7rem', opacity:0.5}}>Some sources may take a moment through CORS proxy</div>
        </div>
      )}

      {!loading && fetchErrors.length > 0 && (
        <div className="jobs-dedup-info" style={{borderStyle:'solid', borderColor:'#b85050'}}>
          <strong>WARN:</strong> {fetchErrors.length} source(s) failed to respond. Try refreshing.
        </div>
      )}

      {showDedup && dupCount > 0 && (
        <div className="jobs-dedup-info">
          <strong>DEDUP:</strong> {dupCount} duplicate{dupCount > 1 ? 's' : ''} removed &rarr; {totalAfter} unique
        </div>
      )}

      {displayJobs.map((job, i) => (
        <a href={job.url} key={`${job.source}-${i}`} target="_blank" rel="noopener noreferrer"
          style={{display:'block', textDecoration:'none', color:'inherit'}}>
          <div className="card">
            <div className="card-title">{job.title}</div>
            <div className="card-meta">
              <span>{job.company}</span>
              <span>{job.location}</span>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
            </div>
            <div className="card-meta" style={{marginTop:'0.3rem'}}>
              <span className={`card-tag ${job.remote === 'Remote' ? 'green' : job.remote === 'Hybrid' ? 'amber' : 'blue'}`}>
                {job.remote || 'Remote'}
              </span>
              <span className="card-tag">{job.jobType || 'Full-time'}</span>
              <span className="card-tag">{job.experienceLevel || 'Mid'}</span>
              <span className="card-tag">{job.source}</span>
              <span style={{marginLeft:'auto', fontSize:'0.7rem'}}>{job.datePosted}</span>
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
            LOAD MORE ({filtered.length - paginated} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
