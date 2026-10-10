const cache = new Map()

const IS_BROWSER = typeof window !== 'undefined'
const UA = 'Mozilla/5.0 (compatible; job-terminal/1.0; +https://github.com/X1Vi/job-terminal)'
const TIMEOUT_MS = 20000

function requestInit() {
  const init = {}
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(TIMEOUT_MS)
  }
  if (!IS_BROWSER) {
    init.headers = { 'user-agent': UA, accept: 'application/json, application/xml, text/xml, text/html, */*' }
  }
  return init
}

export function getCached(key, ttlMs = 300000) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() })
  if (cache.size > 50) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
}

export async function fetchJson(url, ttlMs = 300000) {
  const cached = getCached(url, ttlMs)
  if (cached) return cached
  const res = await fetch(url, requestInit())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  setCache(url, data)
  return data
}

export async function fetchText(url, useProxy = false, ttlMs = 300000) {
  const proxied = useProxy && IS_BROWSER
  const cacheKey = proxied ? `proxy:${url}` : url
  const cached = getCached(cacheKey, ttlMs)
  if (cached) return cached
  const target = proxied ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` : url
  const res = await fetch(target, requestInit())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  setCache(cacheKey, text)
  return text
}
