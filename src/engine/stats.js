import { orgFingerprint } from './text.js'
import { detectSkills, locationBucket } from './classify.js'
import { daysAgo, deadlineState } from './filter.js'

function countBy(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const k = keyFn(item) || 'Unknown'
    map.set(k, (map.get(k) || 0) + 1)
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function median(nums) {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

function round(n) {
  return n == null ? null : Math.round(n)
}

const SALARY_BUCKETS = [
  ['<$50k', 0, 50000],
  ['$50-100k', 50000, 100000],
  ['$100-150k', 100000, 150000],
  ['$150-200k', 150000, 200000],
  ['$200-300k', 200000, 300000],
  ['$300k+', 300000, Infinity],
]

function buildJobStats(items, meta = {}) {
  const now = Date.now()
  const salaryItems = []
  const salaryByCategory = new Map()
  const skills = new Map()
  const companies = new Map()
  const dayMap = new Map()
  const buckets = SALARY_BUCKETS.map(([name]) => ({ name, value: 0 }))

  let last24 = 0
  let last7 = 0
  let last30 = 0
  let newest = ''
  const ages = []

  for (const job of items) {
    const min = job.salaryMin || 0
    const max = job.salaryMax || 0
    if (min || max) {
      const value = min && max ? (min + max) / 2 : min || max
      salaryItems.push(value)
      const cat = job.category || 'Other'
      if (!salaryByCategory.has(cat)) salaryByCategory.set(cat, [])
      salaryByCategory.get(cat).push(value)
      const idx = SALARY_BUCKETS.findIndex(([, lo, hi]) => value >= lo && value < hi)
      if (idx >= 0) buckets[idx].value++
    }

    for (const s of detectSkills(`${job.title} ${job.description}`)) {
      skills.set(s, (skills.get(s) || 0) + 1)
    }

    const cKey = orgFingerprint(job.company || '') || 'unknown'
    const cEntry = companies.get(cKey) || { name: job.company || 'Unknown', value: 0 }
    cEntry.value++
    companies.set(cKey, cEntry)

    const age = daysAgo(job.datePosted, now)
    if (age !== Infinity) {
      ages.push(age)
      if (age <= 1) last24++
      if (age <= 7) last7++
      if (age <= 30) last30++
      if (job.datePosted > newest) newest = job.datePosted
      const d = new Date(Date.parse(job.datePosted))
      if (!isNaN(d.getTime())) {
        const key = d.toISOString().slice(5, 10)
        dayMap.set(key, (dayMap.get(key) || 0) + 1)
      }
    }
  }

  const byDay = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().slice(5, 10)
    byDay.push({ name: key, value: dayMap.get(key) || 0 })
  }

  const salaryMedian = median(salaryItems)
  const byCategorySalary = [...salaryByCategory.entries()]
    .filter(([, v]) => v.length >= 3)
    .map(([name, v]) => ({ name, value: median(v), count: v.length }))
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 8)

  return {
    generatedAt: meta.generatedAt || new Date().toISOString(),
    mode: meta.mode || 'snapshot',
    rawCount: meta.rawCount ?? items.length,
    uniqueCount: items.length,
    dupesRemoved: meta.dupesRemoved ?? 0,
    dedupRate: meta.rawCount ? Math.round(((meta.dupesRemoved || 0) / meta.rawCount) * 1000) / 10 : 0,
    errors: meta.errors || [],
    bySource: countBy(items, j => j.source),
    byCategory: countBy(items, j => j.category),
    byRemote: countBy(items, j => j.remote),
    byJobType: countBy(items, j => j.jobType),
    byExperience: countBy(items, j => j.experienceLevel),
    byLocation: countBy(items, j => locationBucket(j.location)).slice(0, 15),
    byDay,
    topCompanies: [...companies.values()].sort((a, b) => b.value - a.value).slice(0, 15),
    topSkills: [...skills.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 20),
    salary: {
      count: salaryItems.length,
      coveragePct: items.length ? Math.round((salaryItems.length / items.length) * 100) : 0,
      median: round(salaryMedian),
      avgMin: round(salaryItems.length ? salaryItems.reduce((a, b) => a + b, 0) / salaryItems.length : null),
      buckets,
      byCategory: byCategorySalary,
    },
    freshness: {
      last24h: last24,
      last7d: last7,
      last30d: last30,
      medianAgeDays: round(median(ages)),
    },
    newestDate: newest,
    companyCount: companies.size,
  }
}

function monthKey(iso) {
  return String(iso || '').slice(0, 7)
}

function buildOppStats(items, meta = {}) {
  const now = Date.now()
  const closingSoon = []
  const monthMap = new Map()
  let open = 0
  let rolling = 0
  let expired = 0
  let unknown = 0
  let next30 = 0
  let next60 = 0
  let nearest = ''

  for (const opp of items) {
    const st = deadlineState(opp, now)
    if (st.expired) expired++
    else if (st.rolling) {
      rolling++
      open++
    } else if (st.has) {
      open++
      if (st.daysLeft <= 30) next30++
      if (st.daysLeft <= 60) next60++
      if (st.daysLeft <= 14) {
        closingSoon.push({
          title: opp.title,
          organization: opp.organization || opp.source || '',
          deadline: opp.deadline || opp.deadlineISO || '',
          daysLeft: st.daysLeft,
          url: opp.url || '',
        })
      }
      if (!nearest || opp.deadlineISO < nearest) nearest = opp.deadlineISO
      const mk = monthKey(opp.deadlineISO)
      if (mk >= new Date(now).toISOString().slice(0, 7)) {
        monthMap.set(mk, (monthMap.get(mk) || 0) + 1)
      }
    } else {
      unknown++
      open++
    }
  }

  closingSoon.sort((a, b) => a.daysLeft - b.daysLeft)

  const byMonth = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 9)
    .map(([name, value]) => ({ name, value }))

  return {
    generatedAt: meta.generatedAt || new Date().toISOString(),
    mode: meta.mode || 'snapshot',
    rawCount: meta.rawCount ?? items.length,
    uniqueCount: items.length,
    dupesRemoved: meta.dupesRemoved ?? 0,
    errors: meta.errors || [],
    byType: countBy(items, o => o.opportunityType),
    byRegion: countBy(items, o => o.region),
    byField: countBy(items, o => o.field),
    bySource: countBy(items, o => o.source),
    deadlines: {
      open,
      rolling,
      expired,
      unknown,
      next30,
      next60,
      nearest: nearest || null,
      closingSoon: closingSoon.slice(0, 10),
    },
    byMonth,
  }
}

export { buildJobStats, buildOppStats }
