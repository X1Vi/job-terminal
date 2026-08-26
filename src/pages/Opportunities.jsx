import { useMemo, useState } from 'react'
import { OPP_SOURCES, OPP_TYPES, OPP_FIELDS, OPP_REGIONS } from '../data/sources'
import { deduplicateOpportunities } from '../engine/dedup'

const SAMPLE_OPPS = [
  { title: 'NSF Graduate Research Fellowship Program', organization: 'National Science Foundation', provider: 'NSF', opportunityType: 'fellowship', region: 'US', field: 'STEM', deadline: 'October (annually)', amount: '$37,000/yr stipend + $12,000 education', url: 'https://www.nsfgrfp.org/', source: 'NSF GRFP', description: 'Fellowship for graduate students in STEM and social sciences pursuing research-based master\'s and doctoral degrees.' },
  { title: 'Fulbright Foreign Student Program', organization: 'U.S. Department of State', provider: 'IIE', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'Varies by country', amount: 'Full tuition + living stipend', url: 'https://foreign.fulbrightonline.org/', source: 'Fulbright Program', description: 'Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States.' },
  { title: 'Rhodes Scholarship', organization: 'Rhodes Trust', provider: 'Rhodes House', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'October (annually)', amount: 'Full tuition + stipend', url: 'https://www.rhodeshouse.ox.ac.uk/', source: 'Rhodes Scholarship', description: 'The Rhodes Scholarship is a fully funded postgraduate award enabling outstanding students from around the world to study at the University of Oxford.' },
  { title: 'Gates Cambridge Scholarship', organization: 'Gates Cambridge Trust', provider: 'University of Cambridge', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'October (annually)', amount: 'Full tuition + stipend', url: 'https://www.gatescambridge.org/', source: 'Gates Cambridge', description: 'Fully funded postgraduate scholarships for outstanding applicants from outside the UK to pursue a degree at the University of Cambridge.' },
  { title: 'Marshall Scholarship', organization: 'Marshall Commission', provider: 'UK Government', opportunityType: 'scholarship', region: 'US', field: 'All Fields', deadline: 'September (annually)', amount: 'Full tuition + living costs', url: 'https://www.marshallscholarship.org/', source: 'Marshall Scholarship', description: 'Fully funded scholarships for American students to study at any UK university for a graduate degree.' },
  { title: 'Chevening Scholarships', organization: 'UK Foreign Office', provider: 'UK Government', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'November (annually)', amount: 'Full tuition + living costs', url: 'https://www.chevening.org/', source: 'Chevening Scholarships', description: 'Chevening is the UK Government\'s global scholarship program for future leaders to study in the United Kingdom.' },
  { title: 'DAAD Scholarship', organization: 'DAAD', provider: 'German Government', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'Varies by program', amount: '€934/month + benefits', url: 'https://www.daad.de/', source: 'DAAD Scholarships', description: 'DAAD offers a wide range of scholarships for international students to study in Germany at all academic levels.' },
  { title: 'NSF CAREER Award', organization: 'National Science Foundation', provider: 'NSF', opportunityType: 'grant', region: 'US', field: 'STEM', deadline: 'July (annually)', amount: '$400,000-500,000 over 5 years', url: 'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=503214', source: 'NSF Funding', description: 'Early-career faculty development award for outstanding research and education integration.' },
  { title: 'Grants.gov Opportunities', organization: 'US Federal Government', provider: 'Grants.gov', opportunityType: 'grant', region: 'US', field: 'All Fields', deadline: 'Varies', amount: 'Varies', url: 'https://www.grants.gov/', source: 'Grants.gov', description: 'Federal grants across all agencies for research, education, and community development projects.' },
  { title: 'Erik Blei Memorial Grant', organization: 'Signal Foundation', provider: 'Signal', opportunityType: 'grant', region: 'Worldwide', field: 'Open Source & Privacy', deadline: 'Rolling', amount: '$5,000-10,000', url: 'https://signal.org/', source: 'Erik Blei Memorial Grant', description: 'Grant for open source projects focused on privacy and security tools.' },
  { title: 'Mozilla Open Source Grant', organization: 'Mozilla Foundation', provider: 'Mozilla', opportunityType: 'grant', region: 'Worldwide', field: 'Open Source', deadline: 'Rolling', amount: 'Up to $10,000', url: 'https://www.mozilla.org/', source: 'Mozilla Open Source', description: 'Funding for open source projects that contribute to a healthy internet ecosystem.' },
  { title: 'NSF GRFP', organization: 'National Science Foundation', provider: 'NSF', opportunityType: 'fellowship', region: 'US', field: 'STEM', deadline: 'October (annually)', amount: '$37,000/yr stipend + $12,000 education', url: 'https://www.nsfgrfp.org/', source: 'Scholars4Dev', description: 'Graduate Research Fellowship Program for STEM graduate students.' },
  { title: 'Opportunity Desk Internship Program', organization: 'Opportunity Desk', provider: 'OD', opportunityType: 'internship', region: 'International', field: 'International Development', deadline: 'Rolling', amount: 'Unpaid', url: 'https://opportunitydesk.org/', source: 'Opportunity Desk (Internships)', description: 'Remote internship opportunities in international development and social impact.' },
  { title: 'World Bank Internship', organization: 'World Bank', provider: 'World Bank Group', opportunityType: 'internship', region: 'Worldwide', field: 'International Development', deadline: 'January/June (biannual)', amount: 'Paid', url: 'https://www.worldbank.org/', source: 'ReliefWeb', description: 'Paid internship at the World Bank Group headquarters in Washington D.C. or country offices.' },
  { title: 'UNICEF Internship', organization: 'UNICEF', provider: 'UN', opportunityType: 'internship', region: 'Worldwide', field: 'International Development', deadline: 'Rolling', amount: 'Stipend provided', url: 'https://www.unicef.org/', source: 'Opportunities For Youth', description: 'Internships at UNICEF offices worldwide in program areas and operations.' },
  { title: 'Scholars4Dev Scholarship', organization: 'Various Universities', provider: 'Scholars4Dev', opportunityType: 'scholarship', region: 'Worldwide', field: 'International Development', deadline: 'Varies', amount: 'Various', url: 'https://www.scholars4dev.com/', source: 'Scholars4Dev', description: 'Comprehensive list of scholarships for international students at universities worldwide.' },
  { title: 'Opportunities for Africans Fellowship', organization: 'Various', provider: 'OFA', opportunityType: 'fellowship', region: 'Africa', field: 'All Fields', deadline: 'Varies', amount: 'Varies', url: 'https://www.opportunitiesforafricans.com/', source: 'Opportunities for Africans', description: 'Fellowships specifically for African students and professionals to study and work internationally.' },
  { title: 'DAAD Study Scholarship', organization: 'DAAD', provider: 'German Government', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'March/August', amount: '€934/month + health insurance', url: 'https://www.daad.de/', source: 'Scholars4Dev', description: 'DAAD scholarships for international students to study in Germany.' },
  { title: 'AfterSchool Africa Fellowship', organization: 'AfterSchool Africa', provider: 'ASA', opportunityType: 'fellowship', region: 'Africa', field: 'All Fields', deadline: 'Varies', amount: 'Varies', url: 'https://afterschoolafrica.com/', source: 'AfterSchool Africa', description: 'Fellowship opportunities curated for African students and graduates.' },
]

const AMOUNT_SORT = { 'Full tuition + stipend': 1, 'Full tuition + living costs': 2, 'Full tuition + living stipend': 2, '$37,000/yr stipend + $12,000 education': 3, '€934/month + benefits': 4, '€934/month + health insurance': 4, '$400,000-500,000 over 5 years': 5, 'Up to $10,000': 6, 'Paid': 7, 'Stipend provided': 7, '$5,000-10,000': 7, 'Various': 99, 'Varies': 99, 'Unpaid': 100 }

function formatDeadline(d) {
  if (!d || d === 'Varies' || d === 'Rolling') return d || 'Rolling'
  return d
}

export default function Opportunities({ searchQuery }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [fieldFilter, setFieldFilter] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [showDedup, setShowDedup] = useState(true)

  const { unique, duplicates, totalBefore, totalAfter, dupCount } = useMemo(
    () => deduplicateOpportunities(SAMPLE_OPPS), []
  )

  const filtered = useMemo(() => {
    let items = showDedup ? unique : SAMPLE_OPPS

    if (typeFilter !== 'all') {
      items = items.filter(o => o.opportunityType === typeFilter)
    }
    if (regionFilter !== 'all') {
      items = items.filter(o => o.region === regionFilter)
    }
    if (fieldFilter !== 'all') {
      items = items.filter(o => o.field === fieldFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.organization?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'deadline') {
      items = [...items].sort((a, b) => {
        if (a.deadline === 'Rolling') return -1
        if (b.deadline === 'Rolling') return 1
        return (a.deadline || '').localeCompare(b.deadline || '')
      })
    } else if (sortBy === 'amount') {
      items = [...items].sort((a, b) => (AMOUNT_SORT[a.amount] || 99) - (AMOUNT_SORT[b.amount] || 99))
    } else if (sortBy === 'title') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [typeFilter, regionFilter, fieldFilter, sortBy, searchQuery, showDedup, unique])

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
          {OPP_REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}>
          <option value="all">All Fields</option>
          {OPP_FIELDS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="deadline">Sort: Deadline</option>
          <option value="amount">Sort: Amount</option>
          <option value="title">Sort: Title</option>
        </select>

        <label style={{fontSize:'0.75rem', color:'var(--fg-dim)', display:'flex', alignItems:'center', gap:'0.3rem', cursor:'pointer'}}>
          <input type="checkbox" checked={showDedup} onChange={e => setShowDedup(e.target.checked)}
            style={{accentColor:'var(--fg)'}} />
          Dedup
        </label>

        <div className="jobs-count">{filtered.length} of {showDedup ? totalAfter : totalBefore}</div>
      </div>

      {showDedup && dupCount > 0 && (
        <div className="jobs-dedup-info">
          <strong>DEDUP ENGINE:</strong> {dupCount} duplicate{dupCount > 1 ? 's' : ''} removed from {totalBefore} raw &rarr; {totalAfter} unique
          <span style={{marginLeft:'0.5rem', fontSize:'0.65rem', opacity:0.5}}>
            (org+title fingerprint + description similarity)
          </span>
        </div>
      )}

      {filtered.map((opp, i) => (
        <a href={opp.url} key={i} target="_blank" rel="noopener noreferrer" style={{display:'block', textDecoration:'none', color:'inherit'}}>
          <div className="card">
            <div className="card-title">{opp.title}</div>
            <div className="card-meta">
              <span>{opp.organization}</span>
              {opp.amount && <span>{opp.amount}</span>}
            </div>
            <div className="card-meta" style={{marginTop:'0.3rem'}}>
              <span className={`card-tag ${opp.opportunityType === 'scholarship' ? 'green' : opp.opportunityType === 'fellowship' ? 'amber' : opp.opportunityType === 'grant' ? 'blue' : 'red'}`}>
                {opp.opportunityType}
              </span>
              <span className="card-tag">{opp.region}</span>
              <span className="card-tag">{opp.field}</span>
              <span className="card-tag">{opp.source}</span>
              <span style={{marginLeft:'auto', fontSize:'0.7rem', color:'var(--fg-bright)'}}>
                {opp.deadline === 'Rolling' ? 'Rolling' : opp.deadline ? `Deadline: ${opp.deadline}` : ''}
              </span>
            </div>
          </div>
        </a>
      ))}

      {filtered.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No opportunities match your filters.
        </div>
      )}
    </div>
  )
}
