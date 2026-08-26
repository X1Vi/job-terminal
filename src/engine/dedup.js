function normalize(str) {
  return str?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim() || ''
}

function titleFingerprint(title) {
  const n = normalize(title)
  const words = n.split(/\s+/).filter(w => w.length > 2)
  return [...new Set(words)].sort().join(' ')
}

function orgFingerprint(org) {
  return normalize(org)
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a.split(/\s+/))
  const setB = new Set(b.split(/\s+/))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

export function deduplicateJobs(jobs) {
  const seen = new Map()
  const duplicates = []
  const unique = []

  for (const job of jobs) {
    const titleFP = titleFingerprint(job.title)
    const companyFP = orgFingerprint(job.company || '')
    const key = `${companyFP}::${titleFP}`

    if (seen.has(key)) {
      const existing = seen.get(key)
      const descSim = jaccardSimilarity(
        normalize(job.description || ''),
        normalize(existing.description || '')
      )
      if (descSim >= 0.5) {
        duplicates.push({ kept: existing, removed: job, reason: 'same role' })
        continue
      }
    }

    seen.set(key, job)
    unique.push(job)
  }

  return { unique, duplicates, totalBefore: jobs.length, totalAfter: unique.length, dupCount: duplicates.length }
}

export function deduplicateOpportunities(opps) {
  const seen = new Map()
  const duplicates = []
  const unique = []

  for (const opp of opps) {
    const titleFP = titleFingerprint(opp.title)
    const orgFP = orgFingerprint(opp.organization || opp.provider || '')
    const key = `${orgFP}::${titleFP}`

    if (seen.has(key)) {
      const existing = seen.get(key)
      const descSim = jaccardSimilarity(
        normalize(opp.description || ''),
        normalize(existing.description || '')
      )
      if (descSim >= 0.5) {
        duplicates.push({ kept: existing, removed: opp, reason: 'same opportunity' })
        continue
      }
    }

    seen.set(key, opp)
    unique.push(opp)
  }

  return { unique, duplicates, totalBefore: opps.length, totalAfter: unique.length, dupCount: duplicates.length }
}

export function calculateStats(jobs) {
  const { unique, duplicates } = deduplicateJobs(jobs)

  const bySource = {}
  const byCategory = {}
  const byRemote = { remote: 0, onsite: 0, hybrid: 0, unknown: 0 }
  const byJobType = {}
  const byExperience = {}
  const byDate = {}
  const salaryData = []
  const matchScores = []

  for (const job of unique) {
    const src = job.source || 'unknown'
    bySource[src] = (bySource[src] || 0) + 1

    const cat = job.category || 'Uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + 1

    const remote = (job.remote || 'unknown').toLowerCase()
    if (byRemote[remote] !== undefined) byRemote[remote]++
    else byRemote.unknown++

    const jt = job.jobType || 'Not specified'
    byJobType[jt] = (byJobType[jt] || 0) + 1

    const el = job.experienceLevel || 'Not specified'
    byExperience[el] = (byExperience[el] || 0) + 1

    if (job.datePosted) {
      const d = job.datePosted.slice(0, 10)
      byDate[d] = (byDate[d] || 0) + 1
    }

    if (job.salaryMin || job.salaryMax) {
      salaryData.push({
        title: job.title,
        company: job.company,
        min: job.salaryMin || 0,
        max: job.salaryMax || 0,
        currency: job.salaryCurrency || 'USD',
      })
    }

    if (job.matchScore) {
      matchScores.push(job.matchScore)
    }
  }

  return {
    totalRaw: jobs.length,
    totalUnique: unique.length,
    duplicatesRemoved: duplicates.length,
    dedupRate: jobs.length > 0 ? ((duplicates.length / jobs.length) * 100).toFixed(1) : '0',
    bySource,
    byCategory,
    byRemote,
    byJobType,
    byExperience,
    byDate,
    salaryData,
    matchScores,
    avgMatchScore: matchScores.length > 0
      ? (matchScores.reduce((a, b) => a + b, 0) / matchScores.length).toFixed(1)
      : null,
  }
}

export function calculateOppStats(opps) {
  const { unique, duplicates } = deduplicateOpportunities(opps)

  const byType = {}
  const byRegion = {}
  const byField = {}
  const bySource = {}
  const byDeadline = {}

  for (const opp of unique) {
    const type = opp.opportunityType || opp.type || 'other'
    byType[type] = (byType[type] || 0) + 1

    const region = opp.region || opp.location || 'International'
    byRegion[region] = (byRegion[region] || 0) + 1

    const field = opp.field || 'General'
    byField[field] = (byField[field] || 0) + 1

    const src = opp.source || opp.sourceName || 'unknown'
    bySource[src] = (bySource[src] || 0) + 1

    if (opp.deadline) {
      byDeadline[opp.deadline] = (byDeadline[opp.deadline] || 0) + 1
    }
  }

  return {
    totalRaw: opps.length,
    totalUnique: unique.length,
    duplicatesRemoved: duplicates.length,
    dedupRate: opps.length > 0 ? ((duplicates.length / opps.length) * 100).toFixed(1) : '0',
    byType,
    byRegion,
    byField,
    bySource,
    byDeadline,
  }
}
