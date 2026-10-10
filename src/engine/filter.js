import { normalizeText } from './text.js'

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'our', 'are', 'will', 'have', 'this', 'that',
  'your', 'from', 'they', 'their', 'can', 'all', 'not', 'but', 'who', 'what', 'when',
  'where', 'how', 'its', 'was', 'were', 'has', 'had', 'his', 'her', 'she', 'they',
])

export function parseQuery(raw) {
  const tokens = []
  const phrases = []
  const exclude = []
  const re = /"([^"]+)"|(\S+)/g
  let m
  while ((m = re.exec(String(raw || ''))) !== null) {
    const piece = (m[1] || m[2]).toLowerCase().trim()
    if (!piece) continue
    if (!m[1] && piece.startsWith('-') && piece.length > 1) {
      exclude.push(...normalizeText(piece.slice(1)).split(' ').filter(Boolean))
      continue
    }
    const norm = normalizeText(piece)
    if (!norm) continue
    if (m[1]) phrases.push(norm)
    else for (const t of norm.split(' ')) {
      if (t.length > 1 && !STOPWORDS.has(t)) tokens.push(t)
    }
  }
  return {
    tokens: [...new Set(tokens)],
    phrases: [...new Set(phrases)],
    exclude: [...new Set(exclude)],
    empty: tokens.length === 0 && phrases.length === 0 && exclude.length === 0,
  }
}

const FIELDS_CACHE = new WeakMap()

function fieldsFor(item, kind) {
  let entry = FIELDS_CACHE.get(item)
  if (entry && entry.kind === kind) return entry
  if (kind === 'job') {
    entry = {
      kind,
      title: normalizeText(item.title),
      company: normalizeText(item.company),
      location: normalizeText(item.location),
      category: normalizeText(item.category),
      meta: normalizeText(`${item.jobType || ''} ${item.experienceLevel || ''} ${item.remote || ''} ${item.source || ''}`),
      desc: normalizeText(item.description),
    }
  } else {
    entry = {
      kind,
      title: normalizeText(item.title),
      company: normalizeText(`${item.organization || ''} ${item.source || ''}`),
      location: normalizeText(`${item.region || ''} ${item.field || ''}`),
      category: normalizeText(item.opportunityType),
      meta: normalizeText(item.source),
      desc: normalizeText(item.description),
    }
  }
  entry.all = `${entry.title} ${entry.company} ${entry.location} ${entry.category} ${entry.meta} ${entry.desc}`
  FIELDS_CACHE.set(item, entry)
  return entry
}

const W_TITLE = 5
const W_COMPANY = 3
const W_LOCATION = 2
const W_CATEGORY = 2
const W_META = 1
const W_DESC = 1

function scoreFields(f, q) {
  let score = 0
  for (const t of q.tokens) {
    let hit = 0
    if (f.title.includes(t)) hit += W_TITLE
    if (f.company.includes(t)) hit += W_COMPANY
    if (f.location.includes(t)) hit += W_LOCATION
    if (f.category.includes(t)) hit += W_CATEGORY
    if (f.meta.includes(t)) hit += W_META
    if (f.desc.includes(t)) hit += W_DESC
    if (!hit) return -1
    score += hit
  }
  for (const p of q.phrases) {
    if (!f.all.includes(p)) return -1
    score += 6
    if (f.title.includes(p)) score += 6
  }
  for (const x of q.exclude) {
    if (f.title.includes(x) || f.company.includes(x) || f.desc.includes(x)) return -1
  }
  return score
}

export function matchJob(job, q) {
  if (q.empty) return 0
  return scoreFields(fieldsFor(job, 'job'), q)
}

export function matchOpp(opp, q) {
  if (q.empty) return 0
  return scoreFields(fieldsFor(opp, 'opp'), q)
}

export function daysAgo(dateStr, now = Date.now()) {
  if (!dateStr) return Infinity
  const t = Date.parse(dateStr)
  if (isNaN(t)) return Infinity
  return Math.floor((now - t) / 86400000)
}

export function formatAge(dateStr) {
  const d = daysAgo(dateStr)
  if (d === Infinity) return ''
  if (d <= 0) return 'today'
  if (d === 1) return '1d ago'
  if (d < 14) return `${d}d ago`
  if (d < 60) return `${Math.floor(d / 7)}w ago`
  if (d < 730) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

export function deadlineState(opp, now = Date.now()) {
  if (opp.deadlineISO) {
    const t = Date.parse(opp.deadlineISO)
    if (!isNaN(t)) {
      const daysLeft = Math.ceil((t - now) / 86400000)
      return { has: true, rolling: false, expired: daysLeft < 0, daysLeft }
    }
  }
  const label = String(opp.deadline || '')
  if (/rolling|ongoing|open until|varies|year[- ]round/i.test(label)) {
    return { has: true, rolling: true, expired: false, daysLeft: null }
  }
  return { has: false, rolling: false, expired: false, daysLeft: null }
}

export function formatDaysLeft(daysLeft) {
  if (daysLeft == null) return ''
  if (daysLeft < 0) return `closed ${Math.abs(daysLeft)}d ago`
  if (daysLeft === 0) return 'closes today'
  if (daysLeft === 1) return 'closes tomorrow'
  return `closes in ${daysLeft}d`
}

export function jobMatchesFilters(job, f) {
  if (f.source !== 'all' && job.source !== f.source) return false
  if (f.category !== 'all' && job.category !== f.category) return false
  if (f.remote !== 'all' && job.remote !== f.remote) return false
  if (f.type !== 'all' && job.jobType !== f.type) return false
  if (f.exp !== 'all' && job.experienceLevel !== f.exp) return false
  if (f.salary !== 'any') {
    const v = Math.max(job.salaryMax || 0, job.salaryMin || 0)
    if (v < Number(f.salary)) return false
  }
  if (f.age !== 'any' && daysAgo(job.datePosted) > Number(f.age)) return false
  return true
}

export function oppMatchesFilters(opp, f, now = Date.now()) {
  if (f.type !== 'all' && opp.opportunityType !== f.type) return false
  if (f.region !== 'all' && opp.region !== f.region) return false
  if (f.field !== 'all' && opp.field !== f.field) return false
  if (f.deadline !== 'all') {
    const st = deadlineState(opp, now)
    switch (f.deadline) {
      case 'open':
        if (st.expired) return false
        break
      case 'soon14':
        if (st.daysLeft == null || st.daysLeft < 0 || st.daysLeft > 14) return false
        break
      case 'soon30':
        if (st.daysLeft == null || st.daysLeft < 0 || st.daysLeft > 30) return false
        break
      case 'rolling':
        if (!st.rolling) return false
        break
      case 'expired':
        if (!st.expired) return false
        break
      case 'none':
        if (st.has) return false
        break
      default:
        break
    }
  }
  return true
}

export function compareJobs(a, b, sortBy, scoreA = 0, scoreB = 0) {
  switch (sortBy) {
    case 'relevance':
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.datePosted || '').localeCompare(a.datePosted || '')
    case 'date':
      return (b.datePosted || '').localeCompare(a.datePosted || '')
    case 'oldest':
      return (a.datePosted || '9999').localeCompare(b.datePosted || '9999')
    case 'salary': {
      const va = Math.max(a.salaryMax || 0, a.salaryMin || 0)
      const vb = Math.max(b.salaryMax || 0, b.salaryMin || 0)
      return vb - va
    }
    case 'company':
      return (a.company || '').localeCompare(b.company || '')
    case 'title':
      return (a.title || '').localeCompare(b.title || '')
    case 'source':
      return (a.source || '').localeCompare(b.source || '') || (b.datePosted || '').localeCompare(a.datePosted || '')
    default:
      return 0
  }
}

export function compareOpps(a, b, sortBy, scoreA = 0, scoreB = 0, now = Date.now()) {
  switch (sortBy) {
    case 'relevance':
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.datePosted || '').localeCompare(a.datePosted || '')
    case 'deadline': {
      const sa = deadlineState(a, now)
      const sb = deadlineState(b, now)
      if (sa.expired !== sb.expired) return sa.expired ? 1 : -1
      if (sa.daysLeft == null && sb.daysLeft == null) return (a.title || '').localeCompare(b.title || '')
      if (sa.daysLeft == null) return 1
      if (sb.daysLeft == null) return -1
      return sa.daysLeft - sb.daysLeft
    }
    case 'newest':
      return (b.datePosted || '').localeCompare(a.datePosted || '')
    case 'title':
      return (a.title || '').localeCompare(b.title || '')
    case 'source':
      return (a.source || '').localeCompare(b.source || '') || (b.datePosted || '').localeCompare(a.datePosted || '')
    default:
      return 0
  }
}
