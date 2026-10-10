import { useMemo, useState, useEffect, useCallback, useDeferredValue } from 'react'
import { loadOpportunitiesSnapshot } from '../api/snapshot'
import { parseQuery, matchOpp, oppMatchesFilters, compareOpps, deadlineState, formatDaysLeft, formatAge } from '../engine/filter'

function safe(v, fb = '') { return v ?? fb }

const TYPE_OPTIONS = [
  ['scholarship', 'Scholarships'], ['fellowship', 'Fellowships'], ['grant', 'Grants'],
  ['internship', 'Internships'], ['other', 'Other'],
]
const DEADLINE_OPTIONS = [
  ['open', 'Open now'], ['soon14', 'Closing \u226414d'], ['soon30', 'Closing \u226430d'],
  ['rolling', 'Rolling'], ['none', 'No deadline'], ['expired', 'Expired'],
]
const SORT_OPTIONS = [
  ['deadline', 'Deadline'], ['relevance', 'Relevance'], ['newest', 'Newest'], ['title', 'Title'], ['source', 'Source'],
]
const DEFAULTS = { type: 'all', region: 'all', field: 'all', deadline: 'all', sort: 'deadline' }
const EMPTY = []

function freqSorted(items, key) {
  const m = new Map()
  for (const i of items) {
    const v = i[key]
    if (v) m.set(v, (m.get(v) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
}

function typeTagColor(type) {
  return type === 'scholarship' ? 'green' : type === 'fellowship' ? 'amber' : type === 'grant' ? 'blue' : type === 'internship' ? 'red' : ''
}

export default function Opportunities({ searchQuery }) {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState(DEFAULTS)
  const [now] = useState(() => Date.now())
  const filterKey = JSON.stringify([filters, keyword, searchQuery])
  const [pageState, setPageState] = useState({ key: filterKey, size: 100 })
  const paginated = pageState.key === filterKey ? pageState.size : 100

  useEffect(() => {
    let cancelled = false
    loadOpportunitiesSnapshot()
      .then(snap => { if (!cancelled) { setSnapshot(snap); setLoading(false) } })
      .catch(err => { if (!cancelled) { setLoadError(err?.message || 'load failed'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const items = snapshot?.items || EMPTY
  const meta = snapshot?.meta

  const regionOptions = useMemo(() => freqSorted(items, 'region'), [items])
  const fieldOptions = useMemo(() => freqSorted(items, 'field'), [items])
  const sourceOptions = useMemo(() => freqSorted(items, 'source'), [items])

  const rawQuery = [keyword, searchQuery].filter(Boolean).join(' ')
  const deferredQuery = useDeferredValue(rawQuery)
  const query = useMemo(() => parseQuery(deferredQuery), [deferredQuery])

  const filtered = useMemo(() => {
    if (!items.length) return []
    const scored = []
    for (const opp of items) {
      if (!oppMatchesFilters(opp, filters, now)) continue
      const score = matchOpp(opp, query)
      if (score < 0) continue
      scored.push({ opp, score })
    }
    scored.sort((a, b) => compareOpps(a.opp, b.opp, filters.sort, a.score, b.score, now))
    return scored.map(s => s.opp)
  }, [items, filters, query, now])

  const displayOpps = useMemo(() => filtered.slice(0, paginated), [filtered, paginated])
  const loadMore = useCallback(() => {
    setPageState(prev => ({ key: filterKey, size: (prev.key === filterKey ? prev.size : 100) + 100 }))
  }, [filterKey])

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const activeCount = Object.keys(DEFAULTS).filter(k => filters[k] !== DEFAULTS[k]).length + (keyword || searchQuery ? 1 : 0)

  return (
    <div>
      <div className="jobs-toolbar">
        <input
          type="text" placeholder="keyword... (try: climate fellowship -expired)"
          value={keyword} onChange={e => setKeyword(e.target.value)}
          className="filter-input"
        />

        <select value={filters.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
        </select>

        <select value={filters.region} onChange={e => setFilter('region', e.target.value)}>
          <option value="all">All Regions</option>
          {regionOptions.map(r => <option key={r.name} value={r.name}>{r.name} ({r.count})</option>)}
        </select>

        <select value={filters.field} onChange={e => setFilter('field', e.target.value)}>
          <option value="all">All Fields</option>
          {fieldOptions.map(f => <option key={f.name} value={f.name}>{f.name} ({f.count})</option>)}
        </select>

        <select value={filters.deadline} onChange={e => setFilter('deadline', e.target.value)}>
          <option value="all">Any Deadline</option>
          {DEADLINE_OPTIONS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
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
          {loading ? 'loading...' : `${displayOpps.length} / ${filtered.length}${filtered.length !== items.length ? ` of ${items.length}` : ''}`}
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
          {meta.mode === 'live' ? 'fetched straight from feeds' : `${formatAge(meta.generatedAt)} · ${meta.rawCount} fetched`}
          {' · '}{meta.dupesRemoved} duplicate{meta.dupesRemoved !== 1 ? 's' : ''} removed · {sourceOptions.length} sources
          {meta.errors?.length > 0 && <span style={{color:'#b85050'}}> · {meta.errors.length} feed(s) failed</span>}
        </div>
      )}

      {displayOpps.map((opp, i) => {
        const st = deadlineState(opp)
        return (
          <a href={safe(opp.url)} key={`${opp.source}-${i}`} target="_blank" rel="noopener noreferrer"
            style={{display:'block', textDecoration:'none', color:'inherit'}}>
            <div className="card">
              <div className="card-title">{safe(opp.title, 'Untitled')}</div>
              <div className="card-meta">
                <span>{safe(opp.organization || opp.source)}</span>
              </div>
              {opp.description && opp.description.length > 10 && (
                <div className="card-desc">
                  {safe(opp.description).slice(0, 180)}
                </div>
              )}
              <div className="card-meta" style={{marginTop:'0.3rem'}}>
                <span className={`card-tag ${typeTagColor(safe(opp.opportunityType, 'other'))}`}>
                  {safe(opp.opportunityType, 'other')}
                </span>
                <span className="card-tag">{safe(opp.region)}</span>
                <span className="card-tag">{safe(opp.field)}</span>
                <span className="card-tag">{safe(opp.source)}</span>
                {st.expired && <span className="card-tag red">CLOSED</span>}
                {!st.expired && st.daysLeft != null && st.daysLeft <= 14 && (
                  <span className="card-tag amber">{formatDaysLeft(st.daysLeft)}</span>
                )}
                {!st.expired && st.rolling && <span className="card-tag green">ROLLING</span>}
                <span style={{marginLeft:'auto', fontSize:'0.7rem'}}>
                  {opp.deadline ? `Deadline: ${opp.deadline}` : ''}
                </span>
              </div>
            </div>
          </a>
        )
      })}

      {!loading && !loadError && displayOpps.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No opportunities match your filters.
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
