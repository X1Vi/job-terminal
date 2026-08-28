export async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchText(url, useProxy = false) {
  const target = useProxy ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` : url
  const res = await fetch(target)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}
