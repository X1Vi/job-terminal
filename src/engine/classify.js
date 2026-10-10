import { normalizeText } from './text.js'

const CATEGORY_RULES = [
  ['QA & Testing', /\b(qa|quality assurance|test automation|sdet|test engineer|tester)\b/],
  ['Security', /\b(security|cybersecurity|infosec|appsec|penetration|soc analyst)\b/],
  ['Data & AI', /\b(machine learning|deep learning|data scien|data engineer|data analyst|analytics engineer|business intelligence|computer vision|nlp|llm|ai engineer|ai researcher|artificial intelligence|ai)\b/],
  ['DevOps & Cloud', /\b(devops|sre|site reliability|platform engineer|infrastructure|cloud engineer|network engineer|systems administrator|sysadmin)\b/],
  ['Design', /\b(design|ux|ui|creative|illustrator|motion graphics)\b/],
  ['Product', /\b(product manager|product owner|product lead|product designer|product analyst|product)\b/],
  ['Marketing', /\b(marketing|growth|seo|sem|content|social media|communications|copywriter|brand)\b/],
  ['Sales', /\b(sales|account executive|business development|bdr|sdr|partnership|revenue|account manager)\b/],
  ['Support', /\b(support|customer success|customer service|help desk|service desk|call cent|technical account)\b/],
  ['Finance', /\b(finance|financial|accountant|accounting|bookkeep|controller|treasury|fp&a|payroll|audit)\b/],
  ['HR & Recruiting', /\b(recruit|talent|human resources|hr|people ops|people partner)\b/],
  ['Legal', /\b(legal|counsel|attorney|paralegal|compliance)\b/],
  ['Writing & Media', /\b(writer|editor|journalis|reporter|producer|video editor)\b/],
  ['Research', /\b(research|postdoc|phd|fellow)\b/],
  ['Healthcare', /\b(nurse|physician|medical|clinical|pharmac|therapist)\b/],
  ['Education', /\b(teacher|tutor|instructor|professor|educator)\b/],
  ['Operations', /\b(operations|logistics|supply chain|procurement|office manager|administrative|project manager|program manager|coordinator)\b/],
  ['Engineering', /\b(engineer|developer|programmer|software|frontend|front end|backend|back end|fullstack|full stack|web|mobile|ios|android|embedded|architect|coder|data)\b/],
]

export function detectCategory(title) {
  const t = normalizeText(title)
  if (!t) return 'Other'
  for (const [name, re] of CATEGORY_RULES) if (re.test(t)) return name
  return 'Other'
}

export function classifyJobType(value) {
  const v = normalizeText(value)
  if (!v) return 'Other'
  if (/intern/.test(v)) return 'Internship'
  if (/part/.test(v)) return 'Part-time'
  if (/contract|freelance|b2b|1099/.test(v)) return 'Contract'
  if (/temp|seasonal/.test(v)) return 'Temporary'
  if (/full|permanent|regular/.test(v)) return 'Full-time'
  return 'Other'
}

export function classifyExperience(title, value) {
  const t = normalizeText(title)
  if (/\b(internship|intern|trainee)\b/.test(t)) return 'Intern'
  if (/\b(junior|jr|entry|graduate|associate)\b/.test(t)) return 'Junior'
  if (/\b(senior|sr|experienced|expert)\b/.test(t)) return 'Senior'
  if (/\b(lead|principal|staff|director|head|vp|chief|manager)\b/.test(t)) return 'Lead'

  const v = normalizeText(value)
  if (!v) return 'Unknown'
  if (/intern|trainee/.test(v)) return 'Intern'
  if (/junior|jr|entry|graduate|associate/.test(v)) return 'Junior'
  if (/mid|intermediate|regular/.test(v)) return 'Mid'
  if (/senior|sr|experienced|expert/.test(v)) return 'Senior'
  if (/lead|principal|staff|director|head|manager|executive/.test(v)) return 'Lead'
  return 'Unknown'
}

export function classifyRemote(value, location = '') {
  const s = normalizeText(`${value || ''} ${location || ''}`)
  if (!s) return 'Unknown'
  if (/\bhybrid\b/.test(s)) return 'Hybrid'
  if (/\bonsite|on site|in office|in person|office based\b/.test(s)) return 'On-site'
  if (/\bremote|anywhere|worldwide|distributed|wfh|work from home|telecommut/.test(s)) return 'Remote'
  return 'Unknown'
}

export function classifyJob(job) {
  if (!job) return job
  const title = job.title || ''
  return {
    ...job,
    category: detectCategory(title),
    remote: classifyRemote(job.remote, job.location),
    jobType: classifyJobType(job.jobType),
    experienceLevel: classifyExperience(title, job.experienceLevel),
  }
}

const LOCATION_RULES = [
  [/worldwide|anywhere|global|international|remote/, 'Worldwide'],
  [/\busa?\b|united states|u\.s\.|america|new york|san francisco|california|texas|boston|seattle|chicago|austin/, 'USA'],
  [/\buk\b|united kingdom|england|scotland|wales|london|manchester|edinburgh/, 'UK'],
  [/germany|berlin|munich|hamburg|deutsch/, 'Germany'],
  [/canada|toronto|vancouver|montreal|ontario/, 'Canada'],
  [/india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai/, 'India'],
  [/australia|sydney|melbourne|brisbane/, 'Australia'],
  [/france|paris|lyon/, 'France'],
  [/netherlands|amsterdam|rotterdam/, 'Netherlands'],
  [/spain|madrid|barcelona/, 'Spain'],
  [/poland|warsaw|krakow|wroclaw/, 'Poland'],
  [/brazil|são paulo|sao paulo|rio de janeiro/, 'Brazil'],
  [/europe|emea/, 'Europe'],
  [/africa|nigeria|kenya|ghana|south africa|egypt/, 'Africa'],
  [/asia|singapore|japan|china|indonesia|philippines|malaysia|vietnam/, 'Asia'],
]

export function locationBucket(location) {
  const loc = normalizeText(location)
  if (!loc) return 'Unknown'
  for (const [re, name] of LOCATION_RULES) if (re.test(loc)) return name
  const parts = String(location).split(',').map(s => s.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1].slice(0, 24) : 'Unknown'
}

export const SKILL_RULES = [
  ['JavaScript', /\bjavascript\b|\bjs\b/],
  ['TypeScript', /\btypescript\b/],
  ['React', /\breact(\.js)?\b/],
  ['Vue', /\bvue(\.js)?\b/],
  ['Angular', /\bangular\b/],
  ['Node.js', /\bnode(\.js)?\b/],
  ['Next.js', /\bnext\.js\b/],
  ['Python', /\bpython\b/],
  ['Java', /\bjava\b/],
  ['C++', /c\+\+/],
  ['C#', /c#|\bcsharp\b/],
  ['Go', /\bgolang\b/],
  ['Rust', /\brust\b/],
  ['PHP', /\bphp\b/],
  ['Ruby', /\bruby\b/],
  ['Swift', /\bswift\b/],
  ['Kotlin', /\bkotlin\b/],
  ['SQL', /\bsql\b/],
  ['PostgreSQL', /\bpostgres(ql)?\b/],
  ['AWS', /\baws\b|amazon web services/],
  ['GCP', /\bgcp\b|google cloud/],
  ['Azure', /\bazure\b/],
  ['Docker', /\bdocker\b/],
  ['Kubernetes', /\bkubernetes\b|\bk8s\b/],
  ['Terraform', /\bterraform\b/],
  ['GraphQL', /\bgraphql\b/],
  ['Machine Learning', /\bmachine learning\b|\bml\b/],
  ['AI / LLM', /\bllm\b|\bgenai\b|generative ai/],
  ['Data Pipelines', /\bdata (engineer|science|analyst|pipeline|warehouse)/],
  ['DevOps', /\bdevops\b/],
  ['Security', /\bsecurity\b|\bcyber\b/],
  ['Salesforce', /\bsalesforce\b/],
  ['Figma', /\bfigma\b/],
  ['Excel', /\bexcel\b/],
  ['Marketing', /\bmarketing\b/],
  ['Sales', /\bsales\b/],
  ['Design', /\bdesign\b/],
  ['Writing', /\b(writer|writing|copywriting|content)\b/],
]

export function detectSkills(text) {
  const t = normalizeText(text)
  if (!t) return []
  const out = []
  for (const [name, re] of SKILL_RULES) if (re.test(t)) out.push(name)
  return out
}

const MONTH_RE = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec'
const DEADLINE_CTX = new RegExp(
  `(?:deadline|due|closes?|closing|apply (?:by|before)|applications? close|submit by|no later than)[^.\\n]{0,40}?(` +
    `[A-Z][a-z]{2,8}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}` +
    `|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_RE})[a-z]*\\.?,?\\s+\\d{4}` +
    `|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}` +
    `)`,
  'i'
)

export function extractDeadline(text) {
  const s = String(text || '')
  const m = s.match(DEADLINE_CTX)
  if (!m) return { label: '', iso: '' }
  const raw = m[1].replace(/\s+/g, ' ').trim()
  const parseable = raw.replace(/(\d{1,2})(st|nd|rd|th)/i, '$1')
  const t = Date.parse(parseable)
  if (isNaN(t)) return { label: raw, iso: '' }
  const d = new Date(t)
  const y = d.getFullYear()
  if (y < 2024 || y > 2035) return { label: raw, iso: '' }
  return { label: raw, iso: d.toISOString().slice(0, 10) }
}

const OPP_REGION_RULES = [
  ['Africa', /\b(africa|african|nigeria|kenya|ghana|uganda|tanzania|rwanda|ethiopia|south africa|zambia|zimbabwe|malawi|egypt|morocco|tunisia|senegal|cameroon|botswana|namibia)\b/],
  ['US', /\b(usa|united states|u\.s\.|american|california|new york|texas)\b/],
  ['UK', /\b(uk|united kingdom|england|scotland|wales|britain|london|oxford|cambridge|chevening)\b/],
  ['Europe', /\b(europe|european|germany|france|netherlands|spain|italy|sweden|norway|denmark|finland|switzerland|austria|belgium|ireland|poland|portugal|daad)\b/],
  ['Asia', /\b(asia|india|china|japan|korea|singapore|indonesia|malaysia|thailand|vietnam|philippines|pakistan|bangladesh)\b/],
  ['Middle East', /\b(middle east|uae|emirates|dubai|saudi|qatar|jordan|lebanon|turkey|israel)\b/],
  ['Latin America', /\b(latin america|south america|brazil|mexico|argentina|chile|colombia|peru)\b/],
  ['Canada', /\b(canada|canadian|ontario|toronto|vancouver|quebec)\b/],
  ['Australia', /\b(australia|new zealand|sydney|melbourne|auckland)\b/],
]

export function detectOppRegion(text, fallback = 'Worldwide') {
  const t = normalizeText(text)
  for (const [name, re] of OPP_REGION_RULES) if (re.test(t)) return name
  return fallback
}

const OPP_FIELD_RULES = [
  ['Computer Science & AI', /\b(computer science|software|programming|artificial intelligence|machine learning|data science|information technology|ict)\b/],
  ['Medicine & Health', /\b(medicine|medical|health|nursing|public health|pharma|clinical)\b/],
  ['Engineering', /\b(engineering|engineer)\b/],
  ['STEM', /\b(stem|science|physics|chemistry|biology|mathematics|math)\b/],
  ['Business', /\b(business|mba|management|finance|economics|entrepreneur|accounting)\b/],
  ['Law', /\b(law|legal|llm|juris)\b/],
  ['Arts & Design', /\b(arts|design|music|film|creative|architecture|theatre)\b/],
  ['Social Sciences', /\b(social science|sociology|political|psychology|anthropology|international relations)\b/],
  ['Education', /\b(education|teaching|teacher)\b/],
  ['Environment', /\b(environment|climate|sustainability|energy|conservation)\b/],
  ['Agriculture', /\b(agriculture|agricultural|food security|farming)\b/],
  ['Journalism & Media', /\b(journalism|media|communication|press|broadcast)\b/],
  ['International Development', /\b(development|developing countries|humanitarian|poverty|ngo)\b/],
]

export function detectOppField(text, fallback = 'General') {
  const t = normalizeText(text)
  for (const [name, re] of OPP_FIELD_RULES) if (re.test(t)) return name
  return fallback
}
