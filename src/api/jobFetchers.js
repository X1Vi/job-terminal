import { fetchJson } from './corsProxy'

function stripHtml(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
}

function dateStr(d) {
  if (typeof d === 'number') {
    const t = new Date(d < 1e12 ? d * 1000 : d)
    return isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10)
  }
  return String(d || '').slice(0, 10)
}

function job(title, company, location, source, category, remote, jobType, experienceLevel, salaryMin, salaryMax, salaryCurrency, datePosted, description, url) {
  return { title: title?.trim() || 'Untitled', company: company?.trim() || 'Unknown', location: location?.trim() || 'Remote', source, category, remote: remote || 'Remote', jobType: jobType || 'Full-time', experienceLevel: experienceLevel || 'Mid', salaryMin, salaryMax, salaryCurrency: salaryCurrency || 'USD', datePosted: datePosted || '', description: description?.slice(0, 600) || '', url: url || '#' }
}

export async function fetchRemoteOK() {
  const data = await fetchJson('https://remoteok.com/api')
  return (Array.isArray(data) ? data : []).slice(1).map(j => job(
    j.position || j.title, j.company,
    (j.location || '').replace(/🌏/g, '').trim() || 'Remote',
    'RemoteOK', 'Remote Jobs', 'Remote', 'Full-time', 'Mid',
    j.salary_min > 0 ? j.salary_min : null,
    j.salary_max > 0 ? j.salary_max : null, j.currency || 'USD',
    dateStr(j.date), stripHtml(j.description),
    j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.slug}`
  ))
}

export async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.title, j.company_name,
    j.candidate_required_location || 'Remote',
    'Remotive', 'Remote Jobs', 'Remote',
    j.job_type || 'Full-time', 'Mid',
    null, null, 'USD',
    dateStr(j.publication_date), stripHtml(j.description),
    j.url || ''
  ))
}

export async function fetchArbeitnow() {
  const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api')
  return (data.data || []).map(j => job(
    j.title, j.company_name,
    j.remote ? 'Remote' : (j.location || 'Remote'),
    'Arbeitnow', 'Remote Jobs', j.remote ? 'Remote' : 'On-site',
    j.job_types?.[0] || 'Full-time', 'Mid',
    null, null, 'EUR',
    dateStr(j.created_at), stripHtml(j.description),
    j.url || ''
  ))
}

export async function fetchJobicy() {
  const data = await fetchJson('https://jobicy.com/api/v2/remote-jobs')
  return (data.jobs || []).map(j => job(
    j.jobTitle, j.companyName, j.jobGeo || 'Remote',
    'Jobicy', 'Remote Jobs', 'Remote',
    Array.isArray(j.jobType) ? (j.jobType[0] || 'Full-time') : (j.jobType || 'Full-time'),
    j.jobLevel || 'Mid',
    j.salaryMin || null, j.salaryMax || null, j.salaryCurrency || 'USD',
    dateStr(j.pubDate), stripHtml(j.jobDescription || j.jobExcerpt),
    j.url || j.link || ''
  ))
}

export async function fetchHNHiring() {
  const search = await fetchJson(
    'https://hn.algolia.com/api/v1/search_by_date?tags=story,ask_hn&query=who%20is%20hiring&hitsPerPage=50'
  )
  const story = (search.hits || [])
    .filter(h => /^Ask HN: Who is hiring/i.test(h.title || '') && /\d{4}/.test(h.title || ''))
    .sort((a, b) => (b.created_at_i || 0) - (a.created_at_i || 0))[0]
  if (!story) throw new Error('HN hiring thread not found')

  const item = await fetchJson(`https://hn.algolia.com/api/v1/items/${story.objectID}`)
  const jobs = []

  for (const c of item.children || []) {
    if (!c?.text) continue
    const text = c.text
      .replace(/<p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#x2F;/g, '/').split('\n').filter(Boolean)

    const firstLine = text[0] || ''
    const fullText = text.join(' ').slice(0, 600)

    // Try "Company | Title | Location" or "Company | Title"
    let company = '', title = '', loc = 'Remote'

    const pipeMatch = firstLine.match(/^\s*(.+?)\s*\|\s*(.+?)(?:\s*\|\s*(.+))?$/)
    if (pipeMatch) {
      company = pipeMatch[1].replace(/\s*\([^)]*\)\s*$/, '').trim()
      title = pipeMatch[2].trim()
      loc = pipeMatch[3] ? pipeMatch[3].trim() : 'Remote'
    } else {
      // Try "Company – Title" or "Company - Title"
      const dashMatch = firstLine.match(/^\s*(.+?)\s*[–-]\s*(.+)$/)
      if (dashMatch) {
        company = dashMatch[1].replace(/\s*\([^)]*\)\s*$/, '').trim()
        title = dashMatch[2].trim()
      } else {
        // Try extracting company name: often ends with "is hiring" or the line starts with a known company pattern
        const hiringMatch = firstLine.match(/^\s*(.+?)\s+(?:is|are|seeks?)\s+(?:hiring|looking|seeking)\s+/i)
        if (hiringMatch) {
          company = hiringMatch[1].trim()
          title = firstLine.slice(hiringMatch[0].length).trim()
        }
      }
    }

    if (!company || !title) continue
    if (company.length > 60 || title.length < 2 || company.length < 2) continue

    let remote = 'Remote'
    if (/onsite|on-site|in[- ]office/i.test(fullText) && !/remote|anywhere|distributed/i.test(fullText)) {
      remote = 'On-site'
    } else if (/hybrid/i.test(fullText)) {
      remote = 'Hybrid'
    }

    jobs.push(job(
      title, company, loc,
      'HN Who is Hiring', 'Tech Jobs', remote,
      'Full-time', 'Mid',
      null, null, 'USD',
      dateStr(c.created_at), stripHtml(c.text).slice(0, 400),
      `https://news.ycombinator.com/item?id=${c.id}`
    ))
    if (jobs.length >= 300) break
  }

  if (!jobs.length) throw new Error('No HN hiring comments parsed')
  return jobs
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
      errors.push(r.reason?.message || `unknown error`)
    }
  }
  return { jobs: allJobs, errors, sourceCount: sources.length }
}

export { JOB_FETCHERS }
