const store = new Map()
let inflight = {}

export function getCached(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > entry.ttl) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key, data, ttl = 300000) {
  store.set(key, { data, ts: Date.now(), ttl })
  if (store.size > 20) {
    const oldest = store.keys().next().value
    store.delete(oldest)
  }
}

export async function fetchOnce(key, fetcher, ttl = 300000) {
  const cached = getCached(key)
  if (cached) return cached

  if (inflight[key]) return inflight[key]

  const promise = fetcher().then(data => {
    setCached(key, data, ttl)
    delete inflight[key]
    return data
  }).catch(err => {
    delete inflight[key]
    throw err
  })

  inflight[key] = promise
  return promise
}
