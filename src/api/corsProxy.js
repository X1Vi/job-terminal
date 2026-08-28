const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
]

export async function fetchWithCors(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } catch (e) {
    clearTimeout(timeout)
    for (const proxy of PROXIES) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 15000)
        const res = await fetch(proxy + encodeURIComponent(url), { ...options, signal: ctrl.signal })
        clearTimeout(t)
        if (res.ok) return res
      } catch {}
    }
    throw e
  }
}

export async function fetchJson(url) {
  const res = await fetchWithCors(url)
  return res.json()
}

export async function fetchText(url) {
  const res = await fetchWithCors(url)
  return res.text()
}
