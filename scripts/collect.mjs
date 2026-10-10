#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchAllJobs } from '../src/api/jobFetchers.js'
import { fetchAllOpportunities } from '../src/api/oppFetchers.js'
import { deduplicateJobs, deduplicateOpportunities, jobKey, oppKey } from '../src/engine/dedup.js'
import { classifyJob } from '../src/engine/classify.js'
import { buildJobStats, buildOppStats } from '../src/engine/stats.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'public', 'data')

const DESC_LEN = 260
const JOB_MAX_AGE_DAYS = 45
const OPP_MAX_AGE_DAYS = 120
const JOB_CAP = 2000
const OPP_CAP = 500
const SNAPSHOT_URL = String(process.env.SNAPSHOT_URL || '').replace(/\/+$/, '')

const started = Date.now()
const now = Date.now()

function readPrevSync(name) {
  const path = join(DATA_DIR, name)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

async function readPrevRemote(name) {
  if (!SNAPSHOT_URL) return null
  try {
    const res = await fetch(`${SNAPSHOT_URL}/data/${name}`, {
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function readPrev(name) {
  const local = readPrevSync(name)
  if (local) return { data: local, from: 'local' }
  const remote = await readPrevRemote(name)
  if (remote) return { data: remote, from: 'remote' }
  return { data: null, from: 'none' }
}

function ageDays(item) {
  const d = item.datePosted || item.firstSeen
  if (!d) return Infinity
  const t = Date.parse(d)
  return isNaN(t) ? Infinity : (now - t) / 86400000
}

function mergeFresh(prevItems, freshItems, keyFn, maxAgeDays) {
  const prevMap = new Map()
  for (const item of prevItems || []) {
    const k = keyFn(item)
    if (!prevMap.has(k)) prevMap.set(k, item)
  }

  const result = []
  const seen = new Set()
  let inherited = 0

  for (const item of freshItems) {
    const k = keyFn(item)
    if (seen.has(k)) continue
    seen.add(k)
    const old = prevMap.get(k)
    if (old?.firstSeen) {
      item.firstSeen = old.firstSeen
      inherited++
    }
    result.push(item)
  }

  let keptOld = 0
  for (const [k, old] of prevMap) {
    if (!seen.has(k) && ageDays(old) <= maxAgeDays) {
      seen.add(k)
      result.push(old)
      keptOld++
    }
  }

  return { items: result, inherited, keptOld }
}

function prepareJob(job) {
  const j = classifyJob({ ...job })
  j.description = String(j.description || '').replace(/\s+/g, ' ').trim().slice(0, DESC_LEN)
  if (j.salaryCurrency === 'USD') delete j.salaryCurrency
  return j
}

function prepareOpp(opp) {
  const o = { ...opp }
  o.description = String(o.description || '').replace(/\s+/g, ' ').trim().slice(0, DESC_LEN)
  return o
}

function stampFirstSeen(items) {
  const today = new Date(now).toISOString().slice(0, 10)
  for (const item of items) if (!item.firstSeen) item.firstSeen = today
}

function sourceCounts(items) {
  const m = {}
  for (const item of items) m[item.source || 'Unknown'] = (m[item.source || 'Unknown'] || 0) + 1
  return m
}

function writeJson(name, obj) {
  const text = JSON.stringify(obj)
  writeFileSync(join(DATA_DIR, name), text)
  return Buffer.byteLength(text)
}

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`
}

async function collectJobs() {
  const t = Date.now()
  const prev = await readPrev('jobs.json')
  const { jobs: freshJobs, errors } = await fetchAllJobs()
  const fresh = freshJobs.map(prepareJob)

  const { items: merged, inherited, keptOld } = mergeFresh(prev.data?.items, fresh, jobKey, JOB_MAX_AGE_DAYS)
  stampFirstSeen(merged)
  const deduped = deduplicateJobs(merged)
  const items = deduped.unique
    .sort((a, b) => (b.datePosted || b.firstSeen || '').localeCompare(a.datePosted || a.firstSeen || ''))
    .slice(0, JOB_CAP)

  const generatedAt = new Date().toISOString()
  const meta = {
    generatedAt,
    mode: 'snapshot',
    rawCount: freshJobs.length,
    uniqueCount: items.length,
    dupesRemoved: deduped.dupCount,
    errors,
    sourceCounts: sourceCounts(items),
    previous: prev.from,
  }

  const sizeJobs = writeJson('jobs.json', { generatedAt, meta, items })
  const jobStats = buildJobStats(items, meta)
  const sizeStats = writeJson('job-stats.json', jobStats)

  console.log(
    `[jobs] fetched ${freshJobs.length} from ${Object.keys(meta.sourceCounts).length} sources in ${((Date.now() - t) / 1000).toFixed(1)}s` +
      ` | errors: ${errors.length} | prev: ${prev.from}` +
      `\n[jobs] merged ${merged.length} (${inherited} refreshed, ${keptOld} retained) → deduped ${deduped.totalAfter} (-${deduped.dupCount}) → ${items.length}`
  )
  if (errors.length) for (const e of errors) console.log(`[jobs]   ! ${e}`)
  console.log(`[jobs] wrote jobs.json ${kb(sizeJobs)} · job-stats.json ${kb(sizeStats)}`)
  return items
}

async function collectOpps() {
  const t = Date.now()
  const prev = await readPrev('opps.json')
  const { opportunities: freshOpps, errors } = await fetchAllOpportunities()
  const fresh = freshOpps.map(prepareOpp)

  const { items: merged, inherited, keptOld } = mergeFresh(prev.data?.items, fresh, oppKey, OPP_MAX_AGE_DAYS)
  stampFirstSeen(merged)

  const pruned = merged.filter(o => {
    if (o.deadlineISO) {
      const t2 = Date.parse(o.deadlineISO)
      if (!isNaN(t2) && t2 < now) return false
    }
    return ageDays(o) <= OPP_MAX_AGE_DAYS
  })

  const deduped = deduplicateOpportunities(pruned)
  const items = deduped.unique
    .sort((a, b) => {
      const da = a.deadlineISO || '9999-12-31'
      const db = b.deadlineISO || '9999-12-31'
      return da.localeCompare(db) || (b.datePosted || '').localeCompare(a.datePosted || '')
    })
    .slice(0, OPP_CAP)

  const generatedAt = new Date().toISOString()
  const meta = {
    generatedAt,
    mode: 'snapshot',
    rawCount: freshOpps.length,
    uniqueCount: items.length,
    dupesRemoved: deduped.dupCount,
    errors,
    sourceCounts: sourceCounts(items),
    previous: prev.from,
  }

  const sizeOpps = writeJson('opps.json', { generatedAt, meta, items })
  const oppStats = buildOppStats(items, meta)
  const sizeStats = writeJson('opp-stats.json', oppStats)

  console.log(
    `[opps] fetched ${freshOpps.length} from ${Object.keys(meta.sourceCounts).length} sources in ${((Date.now() - t) / 1000).toFixed(1)}s` +
      ` | errors: ${errors.length} | prev: ${prev.from}` +
      `\n[opps] merged ${merged.length} (${inherited} refreshed, ${keptOld} retained) → pruned ${pruned.length} → deduped ${deduped.totalAfter} (-${deduped.dupCount}) → ${items.length}`
  )
  if (errors.length) for (const e of errors) console.log(`[opps]   ! ${e}`)
  console.log(`[opps] wrote opps.json ${kb(sizeOpps)} · opp-stats.json ${kb(sizeStats)}`)
  return items
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true })

  const [jobsResult, oppsResult] = await Promise.allSettled([collectJobs(), collectOpps()])

  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : []
  const opps = oppsResult.status === 'fulfilled' ? oppsResult.value : []

  if (jobsResult.status === 'rejected') console.error('[jobs] FAILED:', jobsResult.reason?.message || jobsResult.reason)
  if (oppsResult.status === 'rejected') console.error('[opps] FAILED:', oppsResult.reason?.message || oppsResult.reason)

  if (!jobs.length && !opps.length) {
    console.error('FATAL: no data collected and no previous snapshot available. Refusing to wipe data.')
    process.exit(1)
  }

  console.log(`[done] ${jobs.length} jobs · ${opps.length} opportunities in ${((Date.now() - started) / 1000).toFixed(1)}s → public/data/`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
