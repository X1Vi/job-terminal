import { fetchText } from './corsProxy.js'
import { extractDeadline, detectOppRegion, detectOppField } from '../engine/classify.js'

function stripTags(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRSS(xml) {
  const items = []
  const itemRegex = /<item>[\s\S]*?<\/item>/gi
  let m
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[0]
    const get = (tag) => {
      const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return r ? r[1] : ''
    }
    const title = stripTags(get('title'))
    if (!title) continue

    const desc = stripTags(get('description') || get('content:encoded')).slice(0, 500)
    const link = stripTags(get('link'))
    const pubDate = get('pubDate')
    const parsedPub = pubDate ? new Date(pubDate) : null
    const datePosted = parsedPub && !isNaN(parsedPub.getTime()) ? parsedPub.toISOString().slice(0, 10) : ''

    const text = `${title} ${desc}`.toLowerCase()
    let type = 'other'
    if (/scholarship/.test(text)) type = 'scholarship'
    else if (/fellowship/.test(text)) type = 'fellowship'
    else if (/grant|funding opportunity/.test(text)) type = 'grant'
    else if (/internship|intern\b|-intern/.test(text)) type = 'internship'

    const dl = extractDeadline(`${title}. ${desc}`)

    items.push({
      title,
      description: desc,
      opportunityType: type,
      deadline: dl.label,
      deadlineISO: dl.iso,
      datePosted,
      url: link,
    })
  }
  return items
}

const RSS_FEEDS = [
  { url: 'https://www.scholars4dev.com/feed/', source: 'Scholars4Dev', region: 'Worldwide', field: 'International Development' },
  { url: 'https://opportunitydesk.org/category/fellowships/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://opportunitydesk.org/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://opportunitydesk.org/category/grants/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://opportunitydesk.org/category/internships/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://afterschoolafrica.com/feed/', source: 'AfterSchool Africa', region: 'Africa', field: 'General' },
  { url: 'https://opportunitiesforyouth.org/feed/', source: 'Opportunities For Youth', region: 'Worldwide', field: 'General' },
  { url: 'https://www.nsf.gov/rss/rss_www_funding_upcoming.xml', source: 'NSF Funding', region: 'US', field: 'STEM' },
]

export async function fetchAllOpportunities() {
  const all = []
  const errors = []

  const results = await Promise.all(
    RSS_FEEDS.map(async feed => {
      try {
        const xml = await fetchText(feed.url, true)
        const items = parseRSS(xml)
        if (!items.length) return { feed, error: 'feed returned 0 items' }
        return { feed, items }
      } catch (e) {
        return { feed, error: e.message || 'unknown error' }
      }
    })
  )

  for (const r of results) {
    if (r.error) {
      errors.push(`${r.feed.source}: ${r.error}`)
      continue
    }
    for (const item of r.items) {
      const text = `${item.title} ${item.description}`
      all.push({
        ...item,
        region: detectOppRegion(text, r.feed.region),
        field: detectOppField(text, r.feed.field),
        source: r.feed.source,
        organization: r.feed.source,
      })
    }
  }

  return { opportunities: all, errors }
}

export { parseRSS, RSS_FEEDS }
