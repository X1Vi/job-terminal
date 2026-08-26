import { useMemo, useState } from 'react'
import { SOURCES } from '../data/sources'
import { deduplicateJobs } from '../engine/dedup'

const SAMPLE_JOBS = [
  { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 150000, salaryMax: 220000, salaryCurrency: 'USD', datePosted: '2026-08-20', description: 'Build and maintain Stripe\'s frontend infrastructure. React, TypeScript, and WebGL experience required.', url: '#' },
  { title: 'Senior Frontend Engineer', company: 'Stripe', location: 'Remote', source: 'LinkedIn', category: 'General', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 145000, salaryMax: 225000, salaryCurrency: 'USD', datePosted: '2026-08-19', description: 'Build Stripe\'s frontend infrastructure. React, TypeScript experience required.', url: '#' },
  { title: 'Staff Software Engineer', company: 'Netflix', location: 'Los Gatos, CA', source: 'Lever', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 250000, salaryMax: 500000, salaryCurrency: 'USD', datePosted: '2026-08-18', description: 'Lead engineering teams building streaming infrastructure.', url: '#' },
  { title: 'Backend Developer', company: 'GitLab', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 100000, salaryMax: 170000, salaryCurrency: 'USD', datePosted: '2026-08-17', description: 'Ruby on Rails backend development for GitLab platform.', url: '#' },
  { title: 'Backend Developer', company: 'GitLab', location: 'Remote', source: 'RemoteOK', category: 'Remote Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 100000, salaryMax: 170000, salaryCurrency: 'USD', datePosted: '2026-08-16', description: 'Ruby on Rails backend development for GitLab platform.', url: '#' },
  { title: 'Machine Learning Engineer', company: 'Anthropic', location: 'San Francisco, CA', source: 'Ashby', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 200000, salaryMax: 350000, salaryCurrency: 'USD', datePosted: '2026-08-15', description: 'Build and train large language models. PyTorch, distributed systems.', url: '#' },
  { title: 'Product Designer', company: 'Linear', location: 'Remote', source: 'Ashby', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 120000, salaryMax: 180000, salaryCurrency: 'USD', datePosted: '2026-08-14', description: 'Design intuitive interfaces for project management tools.', url: '#' },
  { title: 'DevOps Engineer', company: 'Databricks', location: 'San Francisco, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 140000, salaryMax: 200000, salaryCurrency: 'USD', datePosted: '2026-08-13', description: 'Cloud infrastructure and Kubernetes orchestration.', url: '#' },
  { title: 'Frontend Developer', company: 'Vercel', location: 'Remote', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 130000, salaryMax: 190000, salaryCurrency: 'USD', datePosted: '2026-08-12', description: 'Build Vercel\'s frontend platform. Next.js, React.', url: '#' },
  { title: 'Data Scientist', company: 'OpenAI', location: 'San Francisco, CA', source: 'Lever', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 200000, salaryMax: 350000, salaryCurrency: 'USD', datePosted: '2026-08-11', description: 'Research and develop new AI capabilities.', url: '#' },
  { title: 'Data Scientist', company: 'OpenAI', location: 'San Francisco, CA', source: 'LinkedIn', category: 'General', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 210000, salaryMax: 360000, salaryCurrency: 'USD', datePosted: '2026-08-10', description: 'AI research and development. Deep learning, NLP.', url: '#' },
  { title: 'Junior Developer', company: 'Spotify', location: 'Stockholm, Sweden', source: 'Arbeitnow', category: 'Remote Jobs', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Entry', salaryMin: 50000, salaryMax: 80000, salaryCurrency: 'EUR', datePosted: '2026-08-09', description: 'Join Spotify\'s music recommendation team.', url: '#' },
  { title: 'React Developer', company: 'Upwork', location: 'Remote', source: 'Remotive', category: 'Remote Jobs', remote: 'Remote', jobType: 'Contract', experienceLevel: 'Mid', salaryMin: 80000, salaryMax: 120000, salaryCurrency: 'USD', datePosted: '2026-08-08', description: 'Freelance React development for various clients.', url: '#' },
  { title: 'Engineering Manager', company: 'Atlassian', location: 'Sydney, Australia', source: 'Lever', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Lead', salaryMin: 180000, salaryMax: 260000, salaryCurrency: 'USD', datePosted: '2026-08-07', description: 'Lead distributed engineering teams building cloud products.', url: '#' },
  { title: 'Engineering Manager', company: 'Atlassian', location: 'Remote', source: 'JobsCollider', category: 'Tech Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Lead', salaryMin: 170000, salaryMax: 250000, salaryCurrency: 'USD', datePosted: '2026-08-06', description: 'Lead engineering teams building cloud products.', url: '#' },
  { title: 'iOS Developer', company: 'Airbnb', location: 'San Francisco, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 130000, salaryMax: 190000, salaryCurrency: 'USD', datePosted: '2026-08-05', description: 'Swift and SwiftUI development for Airbnb iOS app.', url: '#' },
  { title: 'Security Engineer', company: 'Cloudflare', location: 'Austin, TX', source: 'Greenhouse', category: 'ATS Boards', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 160000, salaryMax: 240000, salaryCurrency: 'USD', datePosted: '2026-08-04', description: 'Cloud security and DDoS mitigation infrastructure.', url: '#' },
  { title: 'UX Researcher', company: 'Notion', location: 'New York, NY', source: 'Lever', category: 'ATS Boards', remote: 'Hybrid', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 110000, salaryMax: 160000, salaryCurrency: 'USD', datePosted: '2026-08-03', description: 'User research for productivity software.', url: '#' },
  { title: 'Technical Writer', company: 'Postman', location: 'Remote', source: 'RemoteOK', category: 'Remote Jobs', remote: 'Remote', jobType: 'Full-time', experienceLevel: 'Mid', salaryMin: 90000, salaryMax: 130000, salaryCurrency: 'USD', datePosted: '2026-08-02', description: 'API documentation and developer guides.', url: '#' },
  { title: 'Site Reliability Engineer', company: 'SpaceX', location: 'Hawthorne, CA', source: 'Greenhouse', category: 'ATS Boards', remote: 'On-site', jobType: 'Full-time', experienceLevel: 'Senior', salaryMin: 140000, salaryMax: 200000, salaryCurrency: 'USD', datePosted: '2026-08-01', description: 'Launch vehicle software reliability and infrastructure.', url: '#' },
]

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
  const [category, setCategory] = useState('all')
  const [remote, setRemote] = useState('all')
  const [jobType, setJobType] = useState('all')
  const [expLevel, setExpLevel] = useState('all')
  const [showDedupInfo, setShowDedupInfo] = useState(true)

  const { unique, duplicates, totalBefore, totalAfter, dupCount } = useMemo(
    () => deduplicateJobs(SAMPLE_JOBS), []
  )

  const filtered = useMemo(() => {
    let jobs = showDedupInfo ? unique : SAMPLE_JOBS

    if (category !== 'all') {
      jobs = jobs.filter(j => j.category === category)
    }
    if (remote !== 'all') {
      jobs = jobs.filter(j => j.remote.toLowerCase() === remote)
    }
    if (jobType !== 'all') {
      jobs = jobs.filter(j => j.jobType === jobType)
    }
    if (expLevel !== 'all') {
      jobs = jobs.filter(j => j.experienceLevel === expLevel)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      )
    }
    return jobs
  }, [category, remote, jobType, expLevel, searchQuery, showDedupInfo, unique])

  return (
    <div>
      <div className="jobs-toolbar">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="ATS Boards">ATS Boards</option>
          <option value="Remote Jobs">Remote Jobs</option>
          <option value="Tech Jobs">Tech Jobs</option>
          <option value="General">General</option>
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
          <input type="checkbox" checked={showDedupInfo} onChange={e => setShowDedupInfo(e.target.checked)}
            style={{accentColor:'var(--fg)'}} />
          Dedup
        </label>

        <div className="jobs-count">{filtered.length} of {showDedupInfo ? totalAfter : totalBefore} jobs</div>
      </div>

      {showDedupInfo && dupCount > 0 && (
        <div className="jobs-dedup-info">
          <strong>DEDUP ENGINE:</strong> {dupCount} duplicate{dupCount > 1 ? 's' : ''} removed from {totalBefore} raw jobs &rarr; {totalAfter} unique
          {dupCount > 0 && (
            <span style={{marginLeft:'0.5rem', fontSize:'0.65rem', opacity:0.5}}>
              (using title+company fingerprint + Jaccard description similarity)
            </span>
          )}
        </div>
      )}

      {filtered.map((job, i) => (
        <a href={job.url} key={i} target="_blank" rel="noopener noreferrer" style={{display:'block', textDecoration:'none', color:'inherit'}}>
          <div className="card">
            <div className="card-title">{job.title}</div>
            <div className="card-meta">
              <span>{job.company}</span>
              <span>{job.location}</span>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
            </div>
            <div className="card-meta" style={{marginTop:'0.3rem'}}>
              <span className={`card-tag ${job.remote === 'Remote' ? 'green' : job.remote === 'Hybrid' ? 'amber' : 'blue'}`}>
                {job.remote}
              </span>
              <span className="card-tag">{job.jobType}</span>
              <span className="card-tag">{job.experienceLevel}</span>
              <span className="card-tag">{job.source}</span>
              <span style={{marginLeft:'auto', fontSize:'0.7rem'}}>{job.datePosted}</span>
            </div>
          </div>
        </a>
      ))}

      {filtered.length === 0 && (
        <div style={{textAlign:'center', padding:'3rem 0', color:'var(--fg-dim)', fontSize:'0.85rem'}}>
          No jobs match your filters.
        </div>
      )}
    </div>
  )
}
