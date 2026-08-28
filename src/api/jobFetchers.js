import { fetchJson } from './corsProxy'

function job(title, company, location, source, category, remote, jobType, experienceLevel, salaryMin, salaryMax, salaryCurrency, datePosted, description, url) {
  return { title, company, location, source, category, remote: remote || 'Remote', jobType: jobType || 'Full-time', experienceLevel: experienceLevel || 'Mid', salaryMin, salaryMax, salaryCurrency: salaryCurrency || 'USD', datePosted: datePosted || '', description: (description || '').replace(/<[^>]+>/g, '').slice(0, 1000), url }
}

export async function fetchRemoteOK() {
  const data = await fetchJson('https://remoteok.com/api')
  return (Array.isArray(data) ? data.slice(1) : []).map(j => job(
    j.position || j.title, j.company, j.location || 'Remote',
    'RemoteOK', 'Remote Jobs', 'Remote', null, null,
    j.salary_min, j.salary_max, 'USD',
    j.date?.slice(0, 10), j.description,
    j.url || `https://remoteok.com/remote-jobs/${j.slug}`
  ))
}

export async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.title, j.company_name, j.candidate_required_location || 'Remote',
    'Remotive', 'Remote Jobs', 'Remote',
    j.job_type?.replace('_', '-'), null,
    j.salary_min, j.salary_max, 'USD',
    j.publication_date?.slice(0, 10), j.description,
    j.url || ''
  ))
}

export async function fetchArbeitnow() {
  const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api')
  return (data.data || []).map(j => job(
    j.title, j.company_name, j.location || 'Remote',
    'Arbeitnow', 'Remote Jobs',
    j.remote ? 'Remote' : null,
    j.job_types?.[0], j.experience_level,
    null, null, 'EUR',
    j.created_at?.slice(0, 10), j.description,
    j.url || ''
  ))
}

export async function fetchJobicy() {
  const data = await fetchJson('https://jobicy.com/api/v2/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.title, j.companyName, j.location || 'Remote',
    'Jobicy', 'Remote Jobs', 'Remote',
    j.jobType, null,
    j.annualSalaryMin, j.annualSalaryMax, 'USD',
    j.pubDate?.slice(0, 10), j.description,
    j.url || j.link || ''
  ))
}

export async function fetchHNHiring() {
  const data = await fetchJson('https://hn.algolia.com/api/v1/search_by_date?tags=story,whoishiring&hitsPerPage=50')
  return (data.hits || []).filter(h => h.title).map(h => job(
    h.title, 'Hacker News', 'Remote',
    'HN Hiring', 'Tech Jobs', 'Remote', null, null,
    null, null, 'USD',
    h.created_at?.slice(0, 10),
    h.story_text || '',
    h.url || `https://news.ycombinator.com/item?id=${h.objectID}`
  ))
}

const FETCHERS = [
  { name: 'RemoteOK', fn: fetchRemoteOK },
  { name: 'Remotive', fn: fetchRemotive },
  { name: 'Arbeitnow', fn: fetchArbeitnow },
  { name: 'Jobicy', fn: fetchJobicy },
  { name: 'HN Hiring', fn: fetchHNHiring },
]

export async function fetchAllJobs() {
  const all = []
  const errors = []

  for (const { name, fn } of FETCHERS) {
    try {
      const jobs = await fn()
      all.push(...jobs)
    } catch (e) {
      errors.push(`${name}: ${e.message}`)
    }
  }

  return { jobs: all, errors }
}
