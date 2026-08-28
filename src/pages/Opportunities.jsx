import { useMemo, useState, useEffect } from 'react'
import { OPP_TYPES, OPP_FIELDS, OPP_REGIONS } from '../data/sources'
import { deduplicateOpportunities } from '../engine/dedup'
import { fetchAllOpportunities } from '../api/oppFetchers'

function safe(v, fb = '') { return v ?? fb }

export default function Opportunities({ searchQuery }) {
  const [allOpps, setAllOpps] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchErrors, setFetchErrors] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [fieldFilter, setFieldFilter] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [showDedup, setShowDedup] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAllOpportunities().then(({ opportunities, errors }) => {
      if (!cancelled) {
        setAllOpps(opportunities || [])
        setFetchErrors(errors || [])
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setAllOpps([])
        setFetchErrors(['Fetch failed'])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const { unique, totalBefore, totalAfter, dupCount } = useMemo(() => {
    try {
      if (!showDedup || !allOpps.length) return { unique: allOpps, duplicates: [], totalBefore: allOpps.length, totalAfter: allOpps.length, dupCount: 0 }
      const r = deduplicateOpportunities(allOpps)
      return r
    } catch {
      return { unique: allOpps, duplicates: [], totalBefore: allOpps.length, totalAfter: allOpps.length, dupCount: 0 }
    }
  }, [allOpps, showDedup])

  const filtered = useMemo(() => {
    try {
      let items = showDedup ? unique : allOpps
      if (!items || !items.length) return []

      if (typeFilter !== 'all') items = items.filter(o => o?.opportunityType === typeFilter)
      if (regionFilter !== 'all') items = items.filter(o => o?.region === regionFilter)
      if (fieldFilter !== 'all') items = items.filter(o => o?.field === fieldFilter)

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        items = items.filter(o =>
          (o?.title || '').toLowerCase().includes(q) ||
          (o?.organization || '').toLowerCase().includes(q)
        )
      }

      if (sortBy === 'deadline') {
        items = [...items].sort((a, b) => {
          if (a?.deadline === 'Rolling') return -1
          if (b?.deadline === 'Rolling') return 1
          return (a?.deadline || '').localeCompare(b?.deadline || '')
        })
      } else if (sortBy === 'title') {
        items = [...items].sort((a, b) => (a?.title || '').localeCompare(b?.title || ''))
      }
      return items
    } catch {
      return []
    }
  }, [typeFilter, regionFilter, fieldFilter, sortBy, searchQuery, showDedup, unique, allOpps])

  return (
    <div>
      <div className="jobs-toolbar">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {OPP_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="all">All Regions</option>
          {OPP_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}>
          <option value="all">All Fields</option>
          {OPP_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="deadline">Sort: Deadline</option>
          <option value="title">Sort: Title</option>
          <option value="source">Sort: Source</option>
        </select>

        <label style={{fontSize:'0.75rem', color:'var(--fg-dim)', display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer'}}>
          <input type="checkbox" checked={showDedup} onChange={e => setShowDedup(e.target.checked)}
            style={{accentColor:'var(--fg)'}} />
          Dedup
        </label>

        <div className="jobs-count">
          {loading ? 'fetching...' : `${filtered.length} / ${showDedup ? totalAfter : allOpps.length}`}
        </div>
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          <div>Fetching from Scholars4Dev, OpportunityDesk, NSF, etc...</div>
        </div>
      )}

      {!loading && fetchErrors.length > 0 && (
        <div className="jobs-dedup-info" style={{borderStyle:'solid', borderColor:'#b85050'}}>
          <strong>WARN:</strong> {fetchErrors.length} RSS feed(s) failed. {allOpps.length} items loaded from remaining.
        </div>
      )}

      {showDedup && dupCount > 0 && (
        <div className="jobs-dedup-info">
          <strong>DEDUP:</strong> {dupCount} duplicate{dupCount !== 1 ? 's' : ''} removed ({totalAfter} unique)
        </div>
      )}

      {filtered.map((opp, i) => {
        const type = safe(opp?.opportunityType, 'other')
        const tagColor = type === 'scholarship' ? 'green' : type === 'fellowship' ? 'amber' : type === 'grant' ? 'blue' : 'red'
        return (
          <a href={safe(opp?.url)} key={`${opp?.source || i}-${i}`} target="_blank" rel="noopener noreferrer"
            style={{display:'block', textDecoration:'none', color:'inherit'}}>
            <div className="card">
              <div className="card-title">{safe(opp?.title, 'Untitled')}</div>
              <div className="card-meta">
                <span>{safe(opp?.organization || opp?.source)}</span>
              </div>
              <div className="card-meta" style={{marginTop:'0.3rem'}}>
                <span className={`card-tag ${tagColor}`}>{type}</span>
                <span className="card-tag">{safe(opp?.region)}</span>
                <span className="card-tag">{safe(opp?.field)}</span>
                <span className="card-tag">{safe(opp?.source)}</span>
                <span style={{marginLeft:'auto', fontSize:'0.7rem', color:'var(--fg-bright)'}}>
                  {opp?.deadline === 'Rolling' ? 'Rolling' : safe(opp?.deadline) ? `Deadline: ${opp.deadline}` : ''}
                </span>
              </div>
            </div>
          </a>
        )
      })}

      {!loading && filtered.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No opportunities match your filters.
        </div>
      )}
    </div>
  )
}
