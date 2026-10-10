import { fetchOnce } from './dataCache'
import { fetchAllJobs } from './jobFetchers'
import { fetchAllOpportunities } from './oppFetchers'
import { deduplicateJobs, deduplicateOpportunities } from '../engine/dedup'
import { classifyJob } from '../engine/classify'
import { buildJobStats, buildOppStats } from '../engine/stats'

const TTL = 5 * 60 * 1000

function dataUrl(name) {
  const base = typeof document !== 'undefined' ? document.baseURI : 'http://localhost/'
  return new URL(`data/${name}`, base).href
}

function preloaded(key) {
  if (typeof window === 'undefined' || !window.__jd) return null
  const p = window.__jd[key]
  return p ? Promise.resolve(p).catch(() => null) : null
}

function sourceCounts(items) {
  const m = {}
  for (const item of items) m[item.source || 'Unknown'] = (m[item.source || 'Unknown'] || 0) + 1
  return m
}

async function fetchData(name, preloadKey) {
  const pre = preloaded(preloadKey)
  if (pre) {
    const data = await pre
    if (data && data.items) return data
  }
  const res = await fetch(dataUrl(name))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data || !data.items) throw new Error('empty snapshot')
  return data
}

async function fetchStats(name, preloadKey) {
  const pre = preloaded(preloadKey)
  if (pre) {
    const data = await pre
    if (data && data.uniqueCount != null) return data
  }
  const res = await fetch(dataUrl(name))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function loadJobsSnapshot() {
  return fetchOnce('jobs-snapshot', async () => {
    try {
      return await fetchData('jobs.json')
    } catch {
      const { jobs, errors } = await fetchAllJobs()
      if (!jobs.length) throw new Error('no jobs available (snapshot missing and live fetch failed)')
      const classified = jobs.map(classifyJob)
      const d = deduplicateJobs(classified)
      const generatedAt = new Date().toISOString()
      const meta = {
        generatedAt,
        mode: 'live',
        rawCount: jobs.length,
        uniqueCount: d.totalAfter,
        dupesRemoved: d.dupCount,
        errors,
        sourceCounts: sourceCounts(d.unique),
      }
      return { generatedAt, meta, items: d.unique }
    }
  }, TTL)
}

export function loadOpportunitiesSnapshot() {
  return fetchOnce('opps-snapshot', async () => {
    try {
      return await fetchData('opps.json')
    } catch {
      const { opportunities, errors } = await fetchAllOpportunities()
      if (!opportunities.length) throw new Error('no opportunities available')
      const d = deduplicateOpportunities(opportunities)
      const generatedAt = new Date().toISOString()
      const meta = {
        generatedAt,
        mode: 'live',
        rawCount: opportunities.length,
        uniqueCount: d.totalAfter,
        dupesRemoved: d.dupCount,
        errors,
        sourceCounts: sourceCounts(d.unique),
      }
      return { generatedAt, meta, items: d.unique }
    }
  }, TTL)
}

export function loadJobStats() {
  return fetchOnce('job-stats-snapshot', async () => {
    try {
      return await fetchStats('job-stats.json', 'jobStats')
    } catch {
      const snap = await loadJobsSnapshot()
      return buildJobStats(snap.items, snap.meta)
    }
  }, TTL)
}

export function loadOppStats() {
  return fetchOnce('opp-stats-snapshot', async () => {
    try {
      return await fetchStats('opp-stats.json', 'oppStats')
    } catch {
      const snap = await loadOpportunitiesSnapshot()
      return buildOppStats(snap.items, snap.meta)
    }
  }, TTL)
}
