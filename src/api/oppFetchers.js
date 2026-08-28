import { fetchText } from './corsProxy'

function parseRSS(xml) {
  const items = []
  const itemRegex = /<item>[\s\S]*?<\/item>/gi
  let m
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[0]
    const get = (tag) => {
      const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return r ? r[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : ''
    }
    const title = get('title')
    if (!title) continue

    const desc = get('description').replace(/<[^>]+>/g, '').slice(0, 500)
    const link = get('link')
    const t = (title + ' ' + desc).toLowerCase()
    let type = 'other'
    if (/scholarship/i.test(t)) type = 'scholarship'
    else if (/fellowship/i.test(t)) type = 'fellowship'
    else if (/grant/i.test(t)) type = 'grant'
    else if (/internship/i.test(t)) type = 'internship'

    const y = title.match(/\b(20\d{2})\b/)
    items.push({
      title, description: desc, opportunityType: type,
      deadline: y ? y[0] : 'Rolling',
      url: link, source: '', organization: '',
    })
  }
  return items
}

const RSS_FEEDS = [
  { url: 'https://www.scholars4dev.com/feed/', source: 'Scholars4Dev', region: 'Worldwide', field: 'International Development' },
  { url: 'https://opportunitydesk.org/category/fellowships/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://opportunitydesk.org/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://afterschoolafrica.com/feed/', source: 'AfterSchool Africa', region: 'Africa', field: 'General' },
  { url: 'https://opportunitiesforyouth.org/feed/', source: 'Opportunities For Youth', region: 'Worldwide', field: 'General' },
  { url: 'https://www.nsf.gov/rss/rss_www_funding_upcoming.xml', source: 'NSF Funding', region: 'US', field: 'STEM' },
]

export async function fetchAllOpportunities() {
  const all = []
  const errors = []

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchText(feed.url, true)
      const items = parseRSS(xml)
      for (const item of items) {
        all.push({
          ...item,
          region: feed.region,
          field: feed.field,
          source: feed.source,
          organization: feed.source,
        })
      }
    } catch (e) {
      errors.push(`${feed.source}: ${e.message}`)
    }
  }

  return { opportunities: all, errors }
}
