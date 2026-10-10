import { normalizeText, titleFingerprint, orgFingerprint, tokenSet, jaccardSets, cleanUrl } from './text.js'

function hasSubstance(desc) {
  return normalizeText(desc).length >= 40
}

function scoreItem(item) {
  let score = 0
  if (item.salaryMin || item.salaryMax) score += 3
  score += Math.min(normalizeText(item.description).length / 200, 2)
  if (item.datePosted) score += 1
  return score
}

function pickBest(a, b) {
  return scoreItem(b) > scoreItem(a) ? b : a
}

function makeKey(org, title) {
  return `${org}::${title}`
}

function dedupe(items, { orgFn, minTitleSim = 0.85, minDescSim = 0.3 }) {
  const exact = new Map()
  const byOrg = new Map()
  const unique = []
  const duplicates = []

  const addEntry = (item, titleFP, orgFP) => {
    const entry = { item, titleFP, orgFP, idx: unique.length }
    unique.push(item)
    exact.set(makeKey(orgFP, titleFP), entry)
    if (orgFP) {
      const group = byOrg.get(orgFP)
      if (group) group.push(entry)
      else byOrg.set(orgFP, [entry])
    }
  }

  for (const item of items) {
    if (!item || !item.title) continue
    const titleFP = titleFingerprint(item.title)
    const orgFP = orgFn(item)
    if (!titleFP) {
      addEntry(item, titleFP, orgFP)
      continue
    }

    let match = exact.get(makeKey(orgFP, titleFP)) || null
    const titleTokens = new Set(titleFP.split(' '))

    if (!match && orgFP) {
      const group = byOrg.get(orgFP)
      if (group) {
        for (const entry of group) {
          if (jaccardSets(tokenSet(entry.titleFP), titleTokens) >= minTitleSim) {
            match = entry
            break
          }
        }
      }
    }

    if (match) {
      const descA = normalizeText(match.item.description)
      const descB = normalizeText(item.description)
      const sim = jaccardSets(tokenSet(descA), tokenSet(descB))
      if (!hasSubstance(descA) || !hasSubstance(descB) || sim >= minDescSim) {
        const winner = pickBest(match.item, item)
        const loser = winner === match.item ? item : match.item
        if (winner !== match.item) {
          match.item = winner
          unique[match.idx] = winner
        }
        duplicates.push({ kept: winner, removed: loser, reason: 'same role' })
        continue
      }
    }

    addEntry(item, titleFP, orgFP)
  }

  return { unique, duplicates, totalBefore: items.length, totalAfter: unique.length, dupCount: duplicates.length }
}

export function deduplicateJobs(jobs) {
  return dedupe(jobs, {
    orgFn: job => orgFingerprint(job.company || ''),
  })
}

export function deduplicateOpportunities(opps) {
  return dedupe(opps, {
    orgFn: opp => orgFingerprint(opp.organization || opp.provider || opp.source || ''),
  })
}

export function jobKey(job) {
  const u = cleanUrl(job.url)
  if (u && u !== '#') return `u:${u}`
  return `k:${orgFingerprint(job.company || '')}::${titleFingerprint(job.title || '')}`
}

export function oppKey(opp) {
  const u = cleanUrl(opp.url)
  if (u && u !== '#') return `u:${u}`
  return `k:${orgFingerprint(opp.organization || opp.source || '')}::${titleFingerprint(opp.title || '')}`
}
