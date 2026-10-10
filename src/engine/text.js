const KEEP_CHARS = /[^a-z0-9\s+#.]/g

export function normalizeText(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(KEEP_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenSet(str) {
  const set = new Set()
  const n = normalizeText(str)
  if (!n) return set
  for (const w of n.split(' ')) if (w) set.add(w)
  return set
}

export function jaccardSets(a, b) {
  if (!a.size && !b.size) return 0
  let inter = 0
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const x of small) if (large.has(x)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

const TITLE_STOP = new Set(['the', 'and', 'for', 'with', 'of', 'a', 'an', 'to', 'in', 'on', 'at', 'by'])
const TITLE_NOISE = /\b(remote|hybrid|onsite|on site|full time|part time|contract|contractor|freelance|internship|intern|temporary|permanent|urgent|urgently|hiring|position|vacancy|opening|job|role|needed|wanted|m f d|m w d|f m d|w m d)\b/g

export function titleFingerprint(title) {
  const n = normalizeText(title).replace(TITLE_NOISE, ' ')
  const words = n.split(' ').filter(w => w.length > 1 && !/^\d+$/.test(w) && !/^[ivx]+$/.test(w) && !TITLE_STOP.has(w))
  const normalized = words.map(w => (w === 'sr' ? 'senior' : w === 'jr' ? 'junior' : w))
  return [...new Set(normalized)].sort().join(' ')
}

const ORG_NOISE = /\b(inc|llc|ltd|limited|gmbh|corp|corporation|co|company|sa|ag|bv|nv|oy|ab|plc|pte|pvt|group|holdings|labs|technologies|technology|solutions|systems|software|services|the)\b/g

export function orgFingerprint(org) {
  return normalizeText(org).replace(ORG_NOISE, ' ').replace(/\s+/g, ' ').trim()
}

const TRACKING_PARAM = /^(utm_|ref$|referrer|source$|src$|gh_src|fbclid|gclid|mc_cid|mc_eid|lever-source|campaign)/i

export function cleanUrl(url) {
  const raw = String(url || '').trim()
  if (!raw || raw === '#') return ''
  try {
    const u = new URL(raw)
    u.hash = ''
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) u.searchParams.delete(key)
    }
    const s = u.toString().replace(/\/+$/, '')
    return s.toLowerCase()
  } catch {
    return raw.split('#')[0].replace(/\/+$/, '').toLowerCase()
  }
}
