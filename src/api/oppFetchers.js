import { fetchText } from './corsProxy'

function opp(title, organization, opportunityType, region, field, deadline, amount, url, source, description) {
  return { title, organization, provider: organization, opportunityType, region, field, deadline, amount, url, source, description }
}

function parseRSS(xmlText) {
  const items = []
  const itemRegex = /<item>[\s\S]*?<\/item>/gi
  let match
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const item = match[0]
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? m[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : ''
    }
    const title = get('title')
    if (!title) continue
    const link = get('link')
    const desc = get('description').replace(/<[^>]+>/g, '').slice(0, 500)
    const pubDate = get('pubDate')
    const category = get('category')

    let type = 'other'
    const t = title.toLowerCase() + ' ' + desc.toLowerCase() + ' ' + category.toLowerCase()
    if (/scholarship/i.test(t)) type = 'scholarship'
    else if (/fellowship/i.test(t)) type = 'fellowship'
    else if (/grant/i.test(t)) type = 'grant'
    else if (/internship/i.test(t)) type = 'internship'

    const deadlineMatch = title.match(/(\d{4})/) || desc.match(/deadline[:\s]+([^\.]+)/i)
    const deadline = deadlineMatch ? deadlineMatch[1] || deadlineMatch[0] : pubDate?.slice(0, 10) || 'Rolling'

    items.push({
      title,
      organization: '',
      opportunityType: type,
      region: 'Worldwide',
      field: 'General',
      deadline,
      amount: '',
      url: link,
      source: '',
      description: desc,
    })
  }
  return items
}

const RSS_FEEDS = [
  { url: 'https://www.scholars4dev.com/feed/', source: 'Scholars4Dev', region: 'Worldwide', field: 'International Development' },
  { url: 'https://opportunitydesk.org/category/fellowships/feed/', source: 'Opportunity Desk', region: 'Worldwide', field: 'General' },
  { url: 'https://opportunitydesk.org/feed/', source: 'Opportunity Desk (Mixed)', region: 'Worldwide', field: 'General' },
  { url: 'https://afterschoolafrica.com/feed/', source: 'AfterSchool Africa', region: 'Africa', field: 'General' },
  { url: 'https://opportunitiesforyouth.org/feed/', source: 'Opportunities For Youth', region: 'Worldwide', field: 'General' },
  { url: 'https://www.nsf.gov/rss/rss_www_funding_upcoming.xml', source: 'NSF Funding', region: 'US', field: 'STEM' },
]

export async function fetchAllOpportunities() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async feed => {
      const xml = await fetchText(feed.url)
      const items = parseRSS(xml)
      return items.map(item => opp(
        item.title,
        feed.source,
        item.opportunityType,
        feed.region,
        feed.field,
        item.deadline,
        '',
        item.url,
        feed.source,
        item.description
      ))
    })
  )

  const all = []
  const errors = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
    else errors.push(r.reason?.message || 'unknown')
  }

  return { opportunities: all, errors }
}
