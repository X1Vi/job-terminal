import { fetchOnce } from './dataCache'
import { fetchAllJobs } from './jobFetchers'
import { fetchAllOpportunities } from './oppFetchers'
import { deduplicateJobs, deduplicateOpportunities } from '../engine/dedup'
import { classifyJob } from '../engine/classify'
import { buildJobStats, buildOppStats } from '../engine/stats'

const TTL = 5 * 60 * 1000
const LIVE_TTL = 60 * 1000
export const SNAPSHOT_STALE_MS = 12 * 60 * 60 * 1000
const LIVE_CACHE_MS = 6 * 60 * 60 * 1000
const CACHE_VERSION = 'v1'
const DESC_LEN = 260

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

export function snapshotAgeMs(snap) {
  const t = Date.parse(snap?.generatedAt || '')
  return Number.isNaN(t) ? Infinity : Date.now() - t
}

export function isStale(snap) {
  if (!snap || !snap.generatedAt) return false
  return snapshotAgeMs(snap) > SNAPSHOT_STALE_MS
}

function readLiveCache(name) {
  try {
    const raw = localStorage.getItem(`jt:${CACHE_VERSION}:${name}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (!entry?.ts || Date.now() - entry.ts > LIVE_CACHE_MS) return null
    if (entry.data?.snapshot && !entry.data.snapshot.items?.length) return null
    return entry.data
  } catch {
    return null
  }
}

function writeLiveCache(name, data) {
  try {
    localStorage.setItem(`jt:${CACHE_VERSION}:${name}`, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // quota/privacy mode — non-fatal
  }
}

function trimDescription(item) {
  return { ...item, description: String(item.description || '').replace(/\s+/g, ' ').trim().slice(0, DESC_LEN) }
}

async function fetchJsonData(name) {
  const res = await fetch(dataUrl(name))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data || !data.items) throw new Error('empty snapshot')
  return data
}

async function fetchJsonStats(name, preloadKey) {
  const pre = preloaded(preloadKey)
  if (pre) {
    const data = await pre
    if (data && data.uniqueCount != null) return data
  }
  const res = await fetch(dataUrl(name))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function liveJobs() {
  const { jobs, errors } = await fetchAllJobs()
  if (!jobs.length) throw new Error('live job fetch returned nothing')
  const classified = jobs.map(j => trimDescription(classifyJob(j)))
  const d = deduplicateJobs(classified)
  const generatedAt = new Date().toISOString()
  const snapshot = {
    generatedAt,
    meta: {
      generatedAt,
      mode: 'live',
      rawCount: jobs.length,
      uniqueCount: d.totalAfter,
      dupesRemoved: d.dupCount,
      errors,
      sourceCounts: sourceCounts(d.unique),
    },
    items: d.unique,
  }
  writeLiveCache('jobs', { snapshot })
  return snapshot
}

async function liveOpps() {
  const { opportunities, errors } = await fetchAllOpportunities()
  if (!opportunities.length) throw new Error('live opportunity fetch returned nothing')
  const trimmed = opportunities.map(trimDescription)
  const d = deduplicateOpportunities(trimmed)
  const generatedAt = new Date().toISOString()
  const snapshot = {
    generatedAt,
    meta: {
      generatedAt,
      mode: 'live',
      rawCount: opportunities.length,
      uniqueCount: d.totalAfter,
      dupesRemoved: d.dupCount,
      errors,
      sourceCounts: sourceCounts(d.unique),
    },
    items: d.unique,
  }
  writeLiveCache('opps', { snapshot })
  return snapshot
}

export function refreshJobsSnapshot() {
  return fetchOnce('jobs-live', liveJobs, LIVE_TTL)
}

export function refreshOppsSnapshot() {
  return fetchOnce('opps-live', liveOpps, LIVE_TTL)
}

export function loadJobsSnapshot() {
  return fetchOnce('jobs-snapshot', async () => {
    let json = null
    try {
      json = await fetchJsonData('jobs.json')
    } catch {
      json = null
    }
    if (json && !isStale(json)) return json
    const cached = readLiveCache('jobs')
    if (cached?.snapshot) return cached.snapshot
    if (json) return json
    return liveJobs()
  }, TTL)
}

export function loadOpportunitiesSnapshot() {
  return fetchOnce('opps-snapshot', async () => {
    let json = null
    try {
      json = await fetchJsonData('opps.json')
    } catch {
      json = null
    }
    if (json && !isStale(json)) return json
    const cached = readLiveCache('opps')
    if (cached?.snapshot) return cached.snapshot
    if (json) return json
    return liveOpps()
  }, TTL)
}

export function loadJobStats() {
  return fetchOnce('job-stats-snapshot', async () => {
    let json = null
    try {
      json = await fetchJsonStats('job-stats.json', 'jobStats')
    } catch {
      json = null
    }
    if (json && !isStale(json)) return json
    const cached = readLiveCache('jobs')
    if (cached?.stats) return cached.stats
    if (json) return json
    const snap = await liveJobs()
    const stats = buildJobStats(snap.items, snap.meta)
    writeLiveCache('jobs', { snapshot: snap, stats })
    return stats
  }, TTL)
}

export function loadOppStats() {
  return fetchOnce('opp-stats-snapshot', async () => {
    let json = null
    try {
      json = await fetchJsonStats('opp-stats.json', 'oppStats')
    } catch {
      json = null
    }
    if (json && !isStale(json)) return json
    const cached = readLiveCache('opps')
    if (cached?.stats) return cached.stats
    if (json) return json
    const snap = await liveOpps()
    const stats = buildOppStats(snap.items, snap.meta)
    writeLiveCache('opps', { snapshot: snap, stats })
    return stats
  }, TTL)
}

export function refreshJobStats() {
  return fetchOnce('job-stats-live', async () => {
    const snap = await refreshJobsSnapshot()
    const stats = buildJobStats(snap.items, snap.meta)
    writeLiveCache('jobs', { snapshot: snap, stats })
    return stats
  }, LIVE_TTL)
}

export function refreshOppStats() {
  return fetchOnce('opp-stats-live', async () => {
    const snap = await refreshOppsSnapshot()
    const stats = buildOppStats(snap.items, snap.meta)
    writeLiveCache('opps', { snapshot: snap, stats })
    return stats
  }, LIVE_TTL)
}
