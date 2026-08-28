import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { deduplicateJobs, calculateStats, deduplicateOpportunities, calculateOppStats } from '../engine/dedup'
import { fetchAllJobs } from '../api/jobFetchers'
import { fetchAllOpportunities } from '../api/oppFetchers'

const CHART_COLORS = ['#78b878', '#c8944a', '#5aa8b8', '#b85050', '#8a7ab8', '#b8a060', '#5ab8a0', '#c87878']

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

function BarChartCard({ title, data, dataKey, color, onExpand }) {
  return (
    <div className="chart-container chart-clickable" onClick={() => onExpand({ title, type: 'bar', data, dataKey, color })}>
      <div className="chart-title">{'>'} {title}</div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{top:5, right:10, left:0, bottom:5}}>
          <XAxis dataKey="name" tick={{fontSize:10}} axisLine stroke="var(--border)" tickLine={false} />
          <YAxis tick={{fontSize:10}} axisLine stroke="var(--border)" tickLine={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[2,2,0,0]} />
        </BarChart>
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

function SectionHeader({ label }) {
  return (
    <div style={{
      fontSize:'0.75rem', color:'var(--fg-dim)', textTransform:'uppercase',
      letterSpacing:'0.1em', marginBottom:'0.8rem', marginTop:'1.5rem',
      borderBottom:'1px solid var(--border)', paddingBottom:'0.3rem'
    }}>
      {'///'} {label}
    </div>
  )
}

export default function Dashboard({ searchQuery }) {
  const [allJobs, setAllJobs] = useState([])
  const [allOpps, setAllOpps] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedChart, setExpandedChart] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      fetchAllJobs(),
      fetchAllOpportunities(),
    ]).then(([jr, or]) => {
      if (!cancelled) {
        if (jr.status === 'fulfilled') setAllJobs(jr.value.jobs || [])
        if (or.status === 'fulfilled') setAllOpps(or.value.opportunities || [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const { unique: jobs, totalBefore: jRaw, totalAfter: jUnique, dupCount: jDup } = useMemo(() => {
    try { return allJobs.length ? deduplicateJobs(allJobs) : { unique: [], duplicates: [], totalBefore: 0, totalAfter: 0, dupCount: 0 } }
    catch { return { unique: allJobs, duplicates: [], totalBefore: allJobs.length, totalAfter: allJobs.length, dupCount: 0 } }
  }, [allJobs])

  const { unique: opps, totalBefore: oRaw, totalAfter: oUnique, dupCount: oDup } = useMemo(() => {
    try { return allOpps.length ? deduplicateOpportunities(allOpps) : { unique: [], duplicates: [], totalBefore: 0, totalAfter: 0, dupCount: 0 } }
    catch { return { unique: allOpps, duplicates: [], totalBefore: allOpps.length, totalAfter: allOpps.length, dupCount: 0 } }
  }, [allOpps])

  const jStats = useMemo(() => {
    try { return jobs.length ? calculateStats(jobs) : { bySource: {}, byCategory: {}, byRemote: { remote: 0, onsite: 0, hybrid: 0, unknown: 0 }, byJobType: {}, byExperience: {}, byDate: {}, salaryData: [], matchScores: [] } }
    catch { return { bySource: {}, byCategory: {}, byRemote: { remote: 0, onsite: 0, hybrid: 0, unknown: 0 }, byJobType: {}, byExperience: {}, byDate: {}, salaryData: [], matchScores: [] } }
  }, [jobs])

  const oStats = useMemo(() => {
    try { return opps.length ? calculateOppStats(opps) : { byType: {}, byRegion: {}, byField: {}, bySource: {}, byDeadline: {} } }
    catch { return { byType: {}, byRegion: {}, byField: {}, bySource: {}, byDeadline: {} } }
  }, [opps])

  const jobSourceData = useMemo(() =>
    Object.entries(jStats.bySource).map(([n, v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [jStats.bySource])

  const jobCategoryData = useMemo(() =>
    Object.entries(jStats.byCategory).map(([n, v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [jStats.byCategory])

  const jobRemoteData = useMemo(() =>
    Object.entries(jStats.byRemote).filter(([_,v]) => v > 0)
      .map(([n,v]) => ({name: n.charAt(0).toUpperCase() + n.slice(1), value:v})), [jStats.byRemote])

  const jobExpData = useMemo(() =>
    Object.entries(jStats.byExperience).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [jStats.byExperience])

  const jobTypeData = useMemo(() =>
    Object.entries(jStats.byJobType).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [jStats.byJobType])

  const salaryRangeData = useMemo(() => {
    const r = {'<$50k':0, '$50-100k':0, '$100-150k':0, '$150-200k':0, '$200-300k':0, '$300k+':0}
    for (const s of jStats.salaryData) {
      const m = (s.min + s.max) / 2
      if (m < 50000) r['<$50k']++
      else if (m < 100000) r['$50-100k']++
      else if (m < 150000) r['$100-150k']++
      else if (m < 200000) r['$150-200k']++
      else if (m < 300000) r['$200-300k']++
      else r['$300k+']++
    }
    return Object.entries(r).map(([n,v]) => ({name:n, value:v}))
  }, [jStats.salaryData])

  const oppTypeData = useMemo(() =>
    Object.entries(oStats.byType).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [oStats.byType])

  const oppRegionData = useMemo(() =>
    Object.entries(oStats.byRegion).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [oStats.byRegion])

  const oppFieldData = useMemo(() =>
    Object.entries(oStats.byField).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value), [oStats.byField])

  const oppSourceData = useMemo(() =>
    Object.entries(oStats.bySource).map(([n,v]) => ({name:n, value:v})).sort((a,b) => b.value - a.value).slice(0, 6), [oStats.bySource])

  if (loading) {
    return (
      <div style={{textAlign:'center', padding:'4rem 0', color:'var(--fg-dim)', fontSize:'0.9rem'}}>
        <div style={{marginBottom:'0.5rem'}}>Fetching live data from APIs & RSS feeds...</div>
        <div style={{fontSize:'0.7rem', opacity:0.5}}>This may take a moment through CORS proxy</div>
      </div>
    )
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{jRaw}</div>
          <div className="stat-label">Raw Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{jUnique}</div>
          <div className="stat-label">Unique Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{jDup}</div>
          <div className="stat-label">Job Dupes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oRaw}</div>
          <div className="stat-label">Raw Opps</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oUnique}</div>
          <div className="stat-label">Unique Opps</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oDup}</div>
          <div className="stat-label">Opp Dupes</div>
        </div>
      </div>

      <SectionHeader label="Job Market" />

      <div className="charts-grid">
        <BarChartCard title="SOURCES BY JOB COUNT" data={jobSourceData.slice(0, 10)} dataKey="value" color={CHART_COLORS[0]} onExpand={setExpandedChart} />
        <BarChartCard title="JOBS BY CATEGORY" data={jobCategoryData} dataKey="value" color={CHART_COLORS[1]} onExpand={setExpandedChart} />
        <PieChartCard title="WORK MODE" data={jobRemoteData} onExpand={setExpandedChart} />
        <PieChartCard title="EXPERIENCE LEVEL" data={jobExpData} onExpand={setExpandedChart} />
        <BarChartCard title="JOB TYPE" data={jobTypeData} dataKey="value" color={CHART_COLORS[2]} onExpand={setExpandedChart} />
        <BarChartCard title="SALARY RANGE" data={salaryRangeData} dataKey="value" color={CHART_COLORS[3]} onExpand={setExpandedChart} />
      </div>

      <SectionHeader label="Scholarships, Fellowships & Grants" />

      <div className="charts-grid">
        <PieChartCard title="OPPORTUNITY TYPES" data={oppTypeData} onExpand={setExpandedChart} />
        <BarChartCard title="BY REGION" data={oppRegionData} dataKey="value" color={CHART_COLORS[4]} onExpand={setExpandedChart} />
        <BarChartCard title="BY FIELD" data={oppFieldData} dataKey="value" color={CHART_COLORS[5]} onExpand={setExpandedChart} />
        <PieChartCard title="TOP OPPORTUNITY SOURCES" data={oppSourceData} onExpand={setExpandedChart} />
      </div>

      {expandedChart && (
        <ChartOverlay title={expandedChart.title} onClose={() => setExpandedChart(null)}>
          {expandedChart.type === 'bar' ? (
            <BarChart data={expandedChart.data} margin={{top:20, right:40, left:20, bottom:20}}>
              <XAxis dataKey="name" tick={{fontSize:12}} axisLine stroke="var(--border)" tickLine={false} />
              <YAxis tick={{fontSize:12}} axisLine stroke="var(--border)" tickLine={false} />
              <Tooltip />
              <Bar dataKey={expandedChart.dataKey} fill={expandedChart.color} radius={[3,3,0,0]} />
            </BarChart>
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
