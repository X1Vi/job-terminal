import { useMemo, useState, useCallback, useDeferredValue } from 'react'
import { loadJobsSnapshot, refreshJobsSnapshot } from '../api/snapshot'
import { useSnapshot } from '../hooks/useSnapshot'
import { parseQuery, matchJob, jobMatchesFilters, compareJobs, formatAge, daysAgo } from '../engine/filter'

function formatSalary(min, max, currency = 'USD') {
  if (!min && !max) return ''
  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n))
  const sym = { USD: '$', EUR: '\u20ac', GBP: '\u00a3' }[currency] || `${currency} `
  if (min && max) return `${sym}${fmt(min)}-${fmt(max)}`
  if (min) return `${sym}${fmt(min)}+`
  return `${sym}up to ${fmt(max)}`
}

function safe(v, fb = '') { return v ?? fb }

const REMOTE_OPTIONS = ['Remote', 'Hybrid', 'On-site', 'Unknown']
const TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other']
const EXP_OPTIONS = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Unknown']
const SALARY_OPTIONS = [
  ['50000', '$50k+'], ['100000', '$100k+'], ['150000', '$150k+'], ['200000', '$200k+'], ['250000', '$250k+'],
]
const AGE_OPTIONS = [
  ['1', 'Last 24h'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['14', 'Last 14 days'], ['30', 'Last 30 days'],
]
const SORT_OPTIONS = [
  ['date', 'Newest'], ['relevance', 'Relevance'], ['oldest', 'Oldest'], ['salary', 'Salary'],
  ['company', 'Company'], ['title', 'Title'], ['source', 'Source'],
]
const DEFAULTS = { location: '', source: 'all', category: 'all', remote: 'all', type: 'all', exp: 'all', salary: 'any', age: 'any', sort: 'date' }
const EMPTY = []

function freqSorted(items, key) {
  const m = new Map()
  for (const i of items) {
    const v = i[key]
    if (v) m.set(v, (m.get(v) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
}

export default function Jobs({ searchQuery }) {
  const { data: snapshot, loading, error: loadError, refreshing } = useSnapshot(loadJobsSnapshot, refreshJobsSnapshot)
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState(DEFAULTS)
  const filterKey = JSON.stringify([filters, keyword, searchQuery])
  const [pageState, setPageState] = useState({ key: filterKey, size: 60 })
  const paginated = pageState.key === filterKey ? pageState.size : 60

  const items = snapshot?.items || EMPTY
  const meta = snapshot?.meta

  const sourceOptions = useMemo(() => freqSorted(items, 'source'), [items])
  const categoryOptions = useMemo(() => freqSorted(items, 'category'), [items])

  const rawQuery = [keyword, searchQuery].filter(Boolean).join(' ')
  const deferredQuery = useDeferredValue(rawQuery)
  const query = useMemo(() => parseQuery(deferredQuery), [deferredQuery])

  const filtered = useMemo(() => {
    if (!items.length) return []
    const scored = []
    for (const job of items) {
      if (!jobMatchesFilters(job, filters)) continue
      const score = matchJob(job, query)
      if (score < 0) continue
      scored.push({ job, score })
    }
    scored.sort((a, b) => compareJobs(a.job, b.job, filters.sort, a.score, b.score))
    return scored.map(s => s.job)
  }, [items, filters, query])

  const displayJobs = useMemo(() => filtered.slice(0, paginated), [filtered, paginated])
  const loadMore = useCallback(() => {
    setPageState(prev => ({ key: filterKey, size: (prev.key === filterKey ? prev.size : 60) + 60 }))
  }, [filterKey])

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const activeCount = Object.keys(DEFAULTS).filter(k => filters[k] !== DEFAULTS[k]).length + (keyword || searchQuery ? 1 : 0)

  return (
    <div>
      <div className="jobs-toolbar">
        <input
          type="text" placeholder="keyword... (try: react remote -senior &quot;full stack&quot;)"
          value={keyword} onChange={e => setKeyword(e.target.value)}
          className="filter-input"
        />

        <input
          type="text" placeholder="location..."
          value={filters.location} onChange={e => setFilter('location', e.target.value)}
          className="filter-input"
        />

        <select value={filters.source} onChange={e => setFilter('source', e.target.value)}>
          <option value="all">All Sources</option>
          {sourceOptions.map(s => <option key={s.name} value={s.name}>{s.name} ({s.count})</option>)}
        </select>

        <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          <option value="all">All Categories</option>
          {categoryOptions.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
        </select>

        <select value={filters.remote} onChange={e => setFilter('remote', e.target.value)}>
          <option value="all">All Modes</option>
          {REMOTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={filters.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filters.exp} onChange={e => setFilter('exp', e.target.value)}>
          <option value="all">All Levels</option>
          {EXP_OPTIONS.map(x => <option key={x} value={x}>{x}</option>)}
        </select>

        <select value={filters.salary} onChange={e => setFilter('salary', e.target.value)}>
          <option value="any">Any Salary</option>
          {SALARY_OPTIONS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
        </select>

        <select value={filters.age} onChange={e => setFilter('age', e.target.value)}>
          <option value="any">Any Date</option>
          {AGE_OPTIONS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
        </select>

        <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
          {SORT_OPTIONS.map(([v, n]) => <option key={v} value={v}>Sort: {n}</option>)}
        </select>

        {activeCount > 0 && (
          <button className="filter-reset" onClick={() => { setFilters(DEFAULTS); setKeyword('') }}>
            RESET ({activeCount})
          </button>
        )}

        <div className="jobs-count">
          {loading ? 'loading...' : `${displayJobs.length} / ${filtered.length}${filtered.length !== items.length ? ` of ${items.length}` : ''}`}
        </div>
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          Loading data snapshot...
        </div>
      )}

      {!loading && loadError && (
        <div className="jobs-dedup-info" style={{borderStyle:'solid', borderColor:'#b85050'}}>
          <strong>ERR:</strong> {loadError}
        </div>
      )}

      {!loading && meta && (
        <div className="jobs-dedup-info">
          <strong>{meta.mode === 'live' ? 'LIVE:' : 'SNAPSHOT:'}</strong>{' '}
          {meta.mode === 'live' ? 'fetched straight from sources' : `${formatAge(meta.generatedAt)} · ${meta.rawCount} fetched`}
          {' · '}{meta.dupesRemoved} duplicate{meta.dupesRemoved !== 1 ? 's' : ''} removed · {meta.sourceCounts ? Object.keys(meta.sourceCounts).length : 0} sources
          {meta.errors?.length > 0 && <span style={{color:'#b85050'}}> · {meta.errors.length} source(s) failed</span>}
          {refreshing && <span className="refreshing"> · refreshing live…</span>}
        </div>
      )}

      {displayJobs.map((job, i) => {
        const age = daysAgo(job.datePosted)
        const isNew = age <= 2
        return (
          <a href={safe(job.url)} key={`${job.source}-${job.title}-${i}`} target="_blank" rel="noopener noreferrer"
            style={{display:'block', textDecoration:'none', color:'inherit'}}>
            <div className="card">
              <div className="card-title">{safe(job.title, 'Untitled')}</div>
              <div className="card-meta">
                <span>{safe(job.company)}</span>
                <span>{safe(job.location)}</span>
                <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
              </div>
              {job.description && job.description.length > 10 && (
                <div className="card-desc">
                  {safe(job.description).slice(0, 200)}
                </div>
              )}
              <div className="card-meta" style={{marginTop:'0.3rem'}}>
                {isNew && <span className="card-tag green">NEW</span>}
                <span className={`card-tag ${safe(job.remote) === 'Remote' ? 'green' : safe(job.remote) === 'Hybrid' ? 'amber' : safe(job.remote) === 'On-site' ? 'blue' : ''}`}>
                  {safe(job.remote, 'Remote')}
                </span>
                <span className="card-tag">{safe(job.jobType, 'Full-time')}</span>
                <span className="card-tag">{safe(job.experienceLevel, 'Mid')}</span>
                <span className="card-tag">{safe(job.category)}</span>
                <span className="card-tag">{safe(job.source)}</span>
                <span style={{marginLeft:'auto', fontSize:'0.7rem'}}>
                  {safe(job.datePosted)} {age !== Infinity && <span style={{opacity:0.6}}>({formatAge(job.datePosted)})</span>}
                </span>
              </div>
            </div>
          </a>
        )
      })}

      {!loading && !loadError && displayJobs.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No jobs match your filters.
          {activeCount > 0 && (
            <div style={{marginTop:'0.6rem'}}>
              <button className="filter-reset" onClick={() => { setFilters(DEFAULTS); setKeyword('') }}>CLEAR FILTERS</button>
            </div>
          )}
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
