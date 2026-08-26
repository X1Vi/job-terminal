import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { deduplicateJobs, calculateStats, deduplicateOpportunities, calculateOppStats } from '../engine/dedup'

const CHART_COLORS = ['#78b878', '#c8944a', '#5aa8b8', '#b85050', '#8a7ab8', '#b8a060', '#5ab8a0', '#c87878']

const SAMPLE_JOBS = [
  { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 150000, salaryMax: 220000, salaryCurrency: 'USD', datePosted: '2026-08-20', description: 'Build and maintain Stripe\'s frontend infrastructure. React, TypeScript, and WebGL experience required.' },
  { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', source: 'LinkedIn', category: 'General', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 145000, salaryMax: 225000, salaryCurrency: 'USD', datePosted: '2026-08-19', description: 'Build Stripe\'s frontend infrastructure. React, TypeScript experience required.' },
  { title: 'Staff Software Engineer', company: 'Netflix', location: 'Los Gatos, CA', source: 'Lever', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 250000, salaryMax: 500000, salaryCurrency: 'USD', datePosted: '2026-08-18', description: 'Lead engineering teams building streaming infrastructure.' },
  { title: 'Backend Developer', company: 'GitLab', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 100000, salaryMax: 170000, salaryCurrency: 'USD', datePosted: '2026-08-17', description: 'Ruby on Rails backend development for GitLab platform.' },
  { title: 'Backend Developer', company: 'GitLab', location: 'Remote', source: 'RemoteOK', category: 'Remote Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 100000, salaryMax: 170000, salaryCurrency: 'USD', datePosted: '2026-08-16', description: 'Ruby on Rails backend development for GitLab platform.' },
  { title: 'Machine Learning Engineer', company: 'Anthropic', location: 'San Francisco, CA', source: 'Ashby', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 200000, salaryMax: 350000, salaryCurrency: 'USD', datePosted: '2026-08-15', description: 'Build and train large language models. PyTorch, distributed systems.' },
  { title: 'Product Designer', company: 'Linear', location: 'Remote', source: 'Ashby', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 120000, salaryMax: 180000, salaryCurrency: 'USD', datePosted: '2026-08-14', description: 'Design intuitive interfaces for project management tools.' },
  { title: 'DevOps Engineer', company: 'Databricks', location: 'San Francisco, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 140000, salaryMax: 200000, salaryCurrency: 'USD', datePosted: '2026-08-13', description: 'Cloud infrastructure and Kubernetes orchestration.' },
  { title: 'Frontend Developer', company: 'Vercel', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 130000, salaryMax: 190000, salaryCurrency: 'USD', datePosted: '2026-08-12', description: 'Build Vercel\'s frontend platform. Next.js, React.' },
  { title: 'Data Scientist', company: 'OpenAI', location: 'San Francisco, CA', source: 'Lever', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 200000, salaryMax: 350000, salaryCurrency: 'USD', datePosted: '2026-08-11', description: 'Research and develop new AI capabilities.' },
  { title: 'Data Scientist', company: 'OpenAI', location: 'San Francisco, CA', source: 'LinkedIn', category: 'General', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 210000, salaryMax: 360000, salaryCurrency: 'USD', datePosted: '2026-08-10', description: 'AI research and development. Deep learning, NLP.' },
  { title: 'Junior Developer', company: 'Spotify', location: 'Stockholm, Sweden', source: 'Arbeitnow', category: 'Remote Jobs', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Entry', salaryMin: 50000, salaryMax: 80000, salaryCurrency: 'EUR', datePosted: '2026-08-09', description: 'Join Spotify\'s music recommendation team.' },
  { title: 'React Developer', company: 'Upwork', location: 'Remote', source: 'Remotive', category: 'Remote Jobs', remote: 'Remote', jobType: 'Contract', experienceLevel: 'Mid', salaryMin: 80000, salaryMax: 120000, salaryCurrency: 'USD', datePosted: '2026-08-08', description: 'Freelance React development for various clients.' },
  { title: 'Engineering Manager', company: 'Atlassian', location: 'Sydney, Australia', source: 'Lever', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Lead', salaryMin: 180000, salaryMax: 260000, salaryCurrency: 'USD', datePosted: '2026-08-07', description: 'Lead distributed engineering teams building cloud products.' },
  { title: 'Engineering Manager', company: 'Atlassian', location: 'Remote', source: 'JobsCollider', category: 'Tech Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Lead', salaryMin: 170000, salaryMax: 250000, salaryCurrency: 'USD', datePosted: '2026-08-06', description: 'Lead engineering teams building cloud products.' },
  { title: 'iOS Developer', company: 'Airbnb', location: 'San Francisco, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 130000, salaryMax: 190000, salaryCurrency: 'USD', datePosted: '2026-08-05', description: 'Swift and SwiftUI development for Airbnb iOS app.' },
  { title: 'Security Engineer', company: 'Cloudflare', location: 'Austin, TX', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 160000, salaryMax: 240000, salaryCurrency: 'USD', datePosted: '2026-08-04', description: 'Cloud security and DDoS mitigation infrastructure.' },
  { title: 'UX Researcher', company: 'Notion', location: 'New York, NY', source: 'Lever', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 110000, salaryMax: 160000, salaryCurrency: 'USD', datePosted: '2026-08-03', description: 'User research for productivity software.' },
  { title: 'Technical Writer', company: 'Postman', location: 'Remote', source: 'RemoteOK', category: 'Remote Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 90000, salaryMax: 130000, salaryCurrency: 'USD', datePosted: '2026-08-02', description: 'API documentation and developer guides.' },
  { title: 'Site Reliability Engineer', company: 'SpaceX', location: 'Hawthorne, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 140000, salaryMax: 200000, salaryCurrency: 'USD', datePosted: '2026-08-01', description: 'Launch vehicle software reliability and infrastructure.' },
]

const SAMPLE_OPPS = [
  { title: 'NSF Graduate Research Fellowship Program', organization: 'National Science Foundation', opportunityType: 'fellowship', region: 'US', field: 'STEM', deadline: 'October (annually)', amount: '$37,000/yr stipend', source: 'NSF GRFP', description: 'Fellowship for graduate students in STEM pursuing research-based degrees.' },
  { title: 'Fulbright Foreign Student Program', organization: 'U.S. Department of State', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'Varies by country', amount: 'Full tuition + stipend', source: 'Fulbright', description: 'Graduate study and research in the United States.' },
  { title: 'Rhodes Scholarship', organization: 'Rhodes Trust', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'October annually', amount: 'Full tuition + stipend', source: 'Rhodes', description: 'Postgraduate study at the University of Oxford.' },
  { title: 'Gates Cambridge Scholarship', organization: 'Gates Cambridge Trust', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'October annually', amount: 'Full tuition + stipend', source: 'Gates Cambridge', description: 'Postgraduate study at the University of Cambridge.' },
  { title: 'Marshall Scholarship', organization: 'Marshall Commission', opportunityType: 'scholarship', region: 'US', field: 'All Fields', deadline: 'September annually', amount: 'Full tuition + living costs', source: 'Marshall', description: 'American students studying at UK universities.' },
  { title: 'Chevening Scholarships', organization: 'UK Foreign Office', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'November annually', amount: 'Full tuition + living costs', source: 'Chevening', description: 'UK Government global scholarship for future leaders.' },
  { title: 'DAAD Scholarship', organization: 'DAAD', opportunityType: 'scholarship', region: 'Worldwide', field: 'All Fields', deadline: 'Varies by program', amount: '€934/month', source: 'DAAD', description: 'Study in Germany at all academic levels.' },
  { title: 'NSF CAREER Award', organization: 'National Science Foundation', opportunityType: 'grant', region: 'US', field: 'STEM', deadline: 'July annually', amount: '$400k-500k', source: 'NSF', description: 'Early-career faculty development award.' },
  { title: 'Grants.gov Opportunities', organization: 'US Federal Government', opportunityType: 'grant', region: 'US', field: 'All Fields', deadline: 'Varies', amount: 'Varies', source: 'Grants.gov', description: 'Federal grants across all agencies.' },
  { title: 'NSF GRFP', organization: 'National Science Foundation', opportunityType: 'fellowship', region: 'US', field: 'STEM', deadline: 'October annually', amount: '$37,000/yr stipend', source: 'Scholars4Dev', description: 'Graduate Research Fellowship Program for STEM graduate students.' },
  { title: 'Erik Blei Memorial Grant', organization: 'Signal Foundation', opportunityType: 'grant', region: 'Worldwide', field: 'Open Source & Privacy', deadline: 'Rolling', amount: '$5k-10k', source: 'Signal', description: 'Grant for open source privacy and security tools.' },
  { title: 'Mozilla Open Source Grant', organization: 'Mozilla Foundation', opportunityType: 'grant', region: 'Worldwide', field: 'Open Source', deadline: 'Rolling', amount: 'Up to $10k', source: 'Mozilla', description: 'Funding for a healthy internet ecosystem.' },
  { title: 'World Bank Internship', organization: 'World Bank', opportunityType: 'internship', region: 'Worldwide', field: 'International Development', deadline: 'Jan/June biannual', amount: 'Paid', source: 'ReliefWeb', description: 'Paid internship at World Bank headquarters.' },
  { title: 'UNICEF Internship', organization: 'UNICEF', opportunityType: 'internship', region: 'Worldwide', field: 'International Development', deadline: 'Rolling', amount: 'Stipend', source: 'OFY', description: 'Internships at UNICEF offices worldwide.' },
  { title: 'Opportunities for Africans Fellowship', organization: 'Various', opportunityType: 'fellowship', region: 'Africa', field: 'All Fields', deadline: 'Varies', amount: 'Varies', source: 'OFA', description: 'Fellowships for African students and professionals.' },
]

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
  const [expandedChart, setExpandedChart] = useState(null)

  const { unique: jobs, totalBefore: jRaw, totalAfter: jUnique, dupCount: jDup } = useMemo(
    () => deduplicateJobs(SAMPLE_JOBS), []
  )
  const { unique: opps, totalBefore: oRaw, totalAfter: oUnique, dupCount: oDup } = useMemo(
    () => deduplicateOpportunities(SAMPLE_OPPS), []
  )

  const jStats = useMemo(() => calculateStats(jobs), [jobs])
  const oStats = useMemo(() => calculateOppStats(opps), [opps])

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
          <div className="stat-label">Job Dupes Removed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oRaw}</div>
          <div className="stat-label">Raw Opportunities</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oUnique}</div>
          <div className="stat-label">Unique Opportunities</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{oDup}</div>
          <div className="stat-label">Opp Dupes Removed</div>
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
