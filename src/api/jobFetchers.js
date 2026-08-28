import { fetchJson } from './corsProxy'

function job(title, company, location, source, category, remote, jobType, experienceLevel, salaryMin, salaryMax, salaryCurrency, datePosted, description, url) {
  return { title, company, location, source, category, remote, jobType, experienceLevel, salaryMin, salaryMax, salaryCurrency, datePosted, description, url }
}

export async function fetchRemoteOK() {
  const data = await fetchJson('https://remoteok.com/api')
  return (data || []).slice(1).map(j => job(
    j.position || j.title, j.company, j.location || 'Remote',
    'RemoteOK', 'Remote Jobs', j.remote ? 'Remote' : 'Remote',
    'Full-time', 'Mid',
    null, null, 'USD',
    j.date ? j.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    j.description?.replace(/<[^>]+>/g, '') || '',
    j.url || `https://remoteok.com/remote-jobs/${j.slug}`
  ))
}

export async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.title, j.company_name, j.candidate_required_location || 'Remote',
    'Remotive', 'Remote Jobs', 'Remote',
    j.job_type || 'Full-time', 'Mid',
    j.salary_min || null, j.salary_max || null, 'USD',
    j.publication_date?.slice(0, 10) || '',
    j.description?.replace(/<[^>]+>/g, '') || '',
    j.url || ''
  ))
}

export async function fetchArbeitnow() {
  const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api')
  return (data.data || []).map(j => job(
    j.title, j.company_name, j.location || 'Remote',
    'Arbeitnow', 'Remote Jobs',
    j.remote ? 'Remote' : 'On-site',
    j.job_types?.[0] || 'Full-time',
    j.experience_level || 'Mid',
    null, null, 'EUR',
    j.created_at?.slice(0, 10) || '',
    j.description?.replace(/<[^>]+>/g, '') || '',
    j.url || ''
  ))
}

export async function fetchJobicy() {
  const data = await fetchJson('https://jobicy.com/api/v2/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.title, j.companyName, j.location || 'Remote',
    'Jobicy', 'Remote Jobs', 'Remote',
    j.jobType || 'Full-time', 'Mid',
    j.annualSalaryMin || null, j.annualSalaryMax || null, 'USD',
    j.pubDate?.slice(0, 10) || '',
    j.description?.replace(/<[^>]+>/g, '') || '',
    j.url || j.link || ''
  ))
}

export async function fetchHNHiring() {
  const data = await fetchJson(
    'https://hn.algolia.com/api/v1/search_by_date?tags=story,whoishiring&hitsPerPage=50'
  )
  return (data.hits || []).filter(h => h.title).map(h => job(
    h.title, 'Hacker News', 'Remote',
    'HN Who is Hiring', 'Tech Jobs', 'Remote',
    'Full-time', 'Mid',
    null, null, 'USD',
    h.created_at?.slice(0, 10) || '',
    h.story_text?.replace(/<[^>]+>/g, '').slice(0, 500) || '',
    h.url || `https://news.ycombinator.com/item?id=${h.objectID}`
  ))
}

const JOB_FETCHERS = {
  'RemoteOK': fetchRemoteOK,
  'Remotive': fetchRemotive,
  'Arbeitnow': fetchArbeitnow,
  'Jobicy': fetchJobicy,
  'HN Who is Hiring': fetchHNHiring,
}

export async function fetchAllJobs(sources = Object.keys(JOB_FETCHERS)) {
  const results = await Promise.allSettled(
    sources.filter(s => JOB_FETCHERS[s]).map(async source => {
      const jobs = await JOB_FETCHERS[source]()
      return { source, jobs, ok: true }
    })
  )

  const allJobs = []
  const errors = []

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) {
      allJobs.push(...r.value.jobs)
    } else if (r.status === 'rejected') {
      errors.push(r.reason?.message || 'unknown error')
    }
  }

  return { jobs: allJobs, errors, sourceCount: sources.length }
}

export { JOB_FETCHERS }
