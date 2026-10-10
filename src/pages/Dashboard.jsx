import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { loadJobStats, loadOppStats } from '../api/snapshot'
import { formatAge } from '../engine/filter'

const CHART_COLORS = ['#78b878', '#c8944a', '#5aa8b8', '#b85050', '#8a7ab8', '#b8a060', '#5ab8a0', '#c87878']

function fmtMoney(n) {
  if (n == null) return '\u2014'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

function ChartOverlay({ title, children, onClose }) {
  return (
    <div className="chart-overlay" onClick={onClose}>
      <div className="chart-overlay-content" onClick={e => e.stopPropagation()}>
        <div className="chart-overlay-header">
          <div className="chart-overlay-title">{'>'} {title}</div>
          <button className="chart-overlay-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="chart-overlay-body">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function BarChartCard({ title, data, dataKey = 'value', color, onExpand, horizontal = false }) {
  const height = horizontal ? Math.min(430, Math.max(200, data.length * 24)) : 210
  return (
    <div className="chart-container chart-clickable" onClick={() => onExpand({ title, type: 'bar', data, dataKey, color, horizontal })}>
      <div className="chart-title">{'>'} {title}</div>
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{top:5, right:15, left:0, bottom:5}}>
            <XAxis type="number" tick={{fontSize:10}} axisLine stroke="var(--border)" tickLine={false} />
            <YAxis type="category" dataKey="name" width={125} tick={{fontSize:10}} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} radius={[0,2,2,0]} />
          </BarChart>
        ) : (
          <BarChart data={data} margin={{top:5, right:10, left:0, bottom:5}}>
            <XAxis dataKey="name" tick={{fontSize:10}} axisLine stroke="var(--border)" tickLine={false} />
            <YAxis tick={{fontSize:10}} axisLine stroke="var(--border)" tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} radius={[2,2,0,0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function PieChartCard({ title, data, onExpand }) {
  return (
    <div className="chart-container chart-clickable" onClick={() => onExpand({ title, type: 'pie', data })}>
      <div className="chart-title">{'>'} {title}</div>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={75}
            dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{stroke:'var(--border)'}}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function StatCard({ value, label, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <div className="section-header">
      {'///'} {label}
    </div>
  )
}

export default function Dashboard() {
  const [jStats, setJStats] = useState(null)
  const [oStats, setOStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedChart, setExpandedChart] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([loadJobStats(), loadOppStats()]).then(([jr, or]) => {
      if (!cancelled) {
        if (jr.status === 'fulfilled') setJStats(jr.value)
        if (or.status === 'fulfilled') setOStats(or.value)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const salaryBuckets = useMemo(() => jStats?.salary?.buckets || [], [jStats])
  const salaryByCategory = useMemo(
    () => (jStats?.salary?.byCategory || []).map(c => ({ name: c.name, value: c.value, count: c.count })),
    [jStats]
  )

  if (loading) {
    return (
      <div style={{textAlign:'center', padding:'4rem 0', color:'var(--fg-dim)', fontSize:'0.9rem'}}>
        <div style={{marginBottom:'0.5rem'}}>Loading statistics snapshot...</div>
        <div style={{fontSize:'0.7rem', opacity:0.5}}>Served as static JSON — fast by design</div>
      </div>
    )
  }

  if (!jStats && !oStats) {
    return (
      <div style={{textAlign:'center', padding:'4rem 0', color:'var(--fg-dim)', fontSize:'0.9rem'}}>
        No statistics available. Run <code>npm run collect</code> to generate a data snapshot.
      </div>
    )
  }

  const j = jStats || {}
  const o = oStats || {}

  return (
    <div>
      <div className="snapshot-line">
        <span className="snapshot-tag">SNAPSHOT {formatAge(j.generatedAt)}</span>
        <span>{j.generatedAt ? new Date(j.generatedAt).toUTCString() : '\u2014'}</span>
        <span>{j.uniqueCount ?? 0} jobs · {o.uniqueCount ?? 0} opportunities</span>
        {j.errors?.length > 0 && (
          <span style={{color:'#b85050'}} title={(j.errors || []).concat(o.errors || []).join('\n')}>
            {j.errors.length + (o.errors?.length || 0)} source error(s)
          </span>
        )}
      </div>

      <div className="stats-grid">
        <StatCard value={j.uniqueCount ?? 0} label="Unique Jobs" sub={`${j.rawCount ?? 0} fetched · ${j.dupesRemoved ?? 0} dupes`} />
        <StatCard value={j.freshness?.last24h ?? 0} label="New / 24h" sub={`${j.freshness?.last7d ?? 0} in 7d`} />
        <StatCard value={j.freshness?.last30d ?? 0} label="New / 30d" sub={`median age ${j.freshness?.medianAgeDays ?? '\u2014'}d`} />
        <StatCard value={j.companyCount ?? 0} label="Companies" sub="hiring now" />
        <StatCard value={j.salary?.median != null ? fmtMoney(j.salary.median) : '\u2014'} label="Median Salary" sub={`${j.salary?.coveragePct ?? 0}% list salary`} />
        <StatCard value={`${j.dedupRate ?? 0}%`} label="Dedup Rate" sub="cross-source dupes" />
        <StatCard value={o.uniqueCount ?? 0} label="Opportunities" sub={`${o.rawCount ?? 0} fetched · ${o.dupesRemoved ?? 0} dupes`} />
        <StatCard value={o.deadlines?.next30 ?? 0} label="Closing / 30d" sub={`${o.deadlines?.rolling ?? 0} rolling`} />
      </div>

      <SectionHeader label="Job Market" />

      <div className="charts-grid">
        <BarChartCard title="POSTINGS LAST 30 DAYS" data={j.byDay || []} color={CHART_COLORS[0]} onExpand={setExpandedChart} />
        <PieChartCard title="WORK MODE" data={j.byRemote || []} onExpand={setExpandedChart} />
        <BarChartCard title="SOURCES BY JOB COUNT" data={(j.bySource || []).slice(0, 10)} color={CHART_COLORS[2]} onExpand={setExpandedChart} />
        <PieChartCard title="EXPERIENCE LEVEL" data={j.byExperience || []} onExpand={setExpandedChart} />
        <BarChartCard title="JOBS BY CATEGORY" data={(j.byCategory || []).slice(0, 12)} color={CHART_COLORS[1]} onExpand={setExpandedChart} horizontal />
        <BarChartCard title="TOP SKILLS MENTIONED" data={j.topSkills || []} color={CHART_COLORS[6]} onExpand={setExpandedChart} horizontal />
        <BarChartCard title="TOP HIRING COMPANIES" data={j.topCompanies || []} color={CHART_COLORS[4]} onExpand={setExpandedChart} horizontal />
        <BarChartCard title="TOP LOCATIONS" data={(j.byLocation || []).slice(0, 10)} color={CHART_COLORS[7]} onExpand={setExpandedChart} />
        <BarChartCard title="SALARY RANGE" data={salaryBuckets} color={CHART_COLORS[3]} onExpand={setExpandedChart} />
        <BarChartCard title="MEDIAN SALARY BY CATEGORY" data={salaryByCategory} color={CHART_COLORS[5]} onExpand={setExpandedChart} horizontal />
        <BarChartCard title="JOB TYPE" data={j.byJobType || []} color={CHART_COLORS[2]} onExpand={setExpandedChart} />
        <BarChartCard title="OPPORTUNITIES BY DEADLINE MONTH" data={o.byMonth || []} color={CHART_COLORS[1]} onExpand={setExpandedChart} />
      </div>

      <SectionHeader label="Scholarships, Fellowships & Grants" />

      <div className="deadline-summary">
        <span className="card-tag green">{o.deadlines?.open ?? 0} open</span>
        <span className="card-tag blue">{o.deadlines?.rolling ?? 0} rolling</span>
        <span className="card-tag amber">{o.deadlines?.next30 ?? 0} closing {'\u2264'}30d</span>
        <span className="card-tag">{o.deadlines?.next60 ?? 0} within 60d</span>
        <span className="card-tag red">{o.deadlines?.expired ?? 0} expired</span>
      </div>

      <div className="charts-grid">
        <PieChartCard title="OPPORTUNITY TYPES" data={o.byType || []} onExpand={setExpandedChart} />
        <BarChartCard title="BY REGION" data={o.byRegion || []} color={CHART_COLORS[4]} onExpand={setExpandedChart} />
        <BarChartCard title="BY FIELD" data={(o.byField || []).slice(0, 12)} color={CHART_COLORS[5]} onExpand={setExpandedChart} horizontal />
        <PieChartCard title="TOP OPPORTUNITY SOURCES" data={(o.bySource || []).slice(0, 6)} onExpand={setExpandedChart} />
        <div className="chart-container closing-card">
          <div className="chart-title">{'>'} CLOSING SOON ({'\u2264'}14 DAYS)</div>
          {(o.deadlines?.closingSoon || []).length === 0 ? (
            <div className="muted-line">No deadlines in the next 14 days.</div>
          ) : (
            (o.deadlines?.closingSoon || []).map((c, i) => (
              <a key={i} className="closing-row" href={c.url} target="_blank" rel="noopener noreferrer">
                <span className={`closing-days ${c.daysLeft <= 3 ? 'urgent' : ''}`}>
                  {c.daysLeft <= 0 ? 'today' : `${c.daysLeft}d`}
                </span>
                <span className="closing-title">{c.title}</span>
                <span className="closing-org">{c.organization}</span>
              </a>
            ))
          )}
        </div>
      </div>

      {expandedChart && (
        <ChartOverlay title={expandedChart.title} onClose={() => setExpandedChart(null)}>
          {expandedChart.type === 'bar' ? (
            expandedChart.horizontal ? (
              <BarChart data={expandedChart.data} layout="vertical" margin={{top:20, right:40, left:20, bottom:20}}>
                <XAxis type="number" tick={{fontSize:12}} axisLine stroke="var(--border)" tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{fontSize:12}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey={expandedChart.dataKey} fill={expandedChart.color} radius={[0,3,3,0]} />
              </BarChart>
            ) : (
              <BarChart data={expandedChart.data} margin={{top:20, right:40, left:20, bottom:20}}>
                <XAxis dataKey="name" tick={{fontSize:12}} axisLine stroke="var(--border)" tickLine={false} />
                <YAxis tick={{fontSize:12}} axisLine stroke="var(--border)" tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey={expandedChart.dataKey} fill={expandedChart.color} radius={[3,3,0,0]} />
              </BarChart>
            )
          ) : (
            <PieChart>
              <Pie data={expandedChart.data} cx="50%" cy="50%" innerRadius={60} outerRadius={140}
                dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{stroke:'var(--border)'}}>
                {expandedChart.data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ChartOverlay>
      )}
    </div>
  )
}
