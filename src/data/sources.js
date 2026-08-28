const OPP_SOURCES = [
  { id: 'scholars4dev', name: 'Scholars4Dev', type: 'RSS', url: 'https://www.scholars4dev.com/feed/', kind: 'scholarship', free: true, live: true },
  { id: 'opportunitydesk_fellowships', name: 'Opportunity Desk (Fellowships)', type: 'RSS', url: 'https://opportunitydesk.org/category/fellowships/feed/', kind: 'fellowship', free: true, live: true },
  { id: 'opportunitydesk_mixed', name: 'Opportunity Desk (All)', type: 'RSS', url: 'https://opportunitydesk.org/feed/', kind: 'mixed', free: true, live: true },
  { id: 'opportunitydesk_grants', name: 'Opportunity Desk (Grants)', type: 'RSS', url: 'https://opportunitydesk.org/category/grants/feed/', kind: 'grant', free: true },
  { id: 'opportunitydesk_internships', name: 'Opportunity Desk (Internships)', type: 'RSS', url: 'https://www.opportunitydesk.org/category/internships/feed/', kind: 'internship', free: true },
  { id: 'afterschoolafrica', name: 'AfterSchool Africa', type: 'RSS', url: 'https://afterschoolafrica.com/feed/', kind: 'mixed', free: true, live: true },
  { id: 'oppsforafricans', name: 'Opportunities for Africans', type: 'RSS', url: 'https://www.opportunitiesforafricans.com/feed/', kind: 'mixed', free: true },
  { id: 'oppsforyouth', name: 'Opportunities For Youth', type: 'RSS', url: 'https://opportunitiesforyouth.org/feed/', kind: 'mixed', free: true, live: true },
  { id: 'nsf_funding', name: 'NSF Funding', type: 'RSS', url: 'https://www.nsf.gov/rss/rss_www_funding_upcoming.xml', kind: 'grant', free: true, live: true },
  { id: 'reliefweb', name: 'ReliefWeb Jobs', type: 'RSS', url: 'https://reliefweb.int/jobs/rss.xml', kind: 'job', free: true },
  { id: 'nsf_grfp', name: 'NSF GRFP', type: 'Curated', url: 'https://www.nsfgrfp.org/', kind: 'fellowship', free: true },
  { id: 'grants_gov', name: 'Grants.gov', type: 'API', url: 'https://apply07.grants.gov/grantsws/rest/opportunities/search', kind: 'grant', free: true },
  { id: 'fulbright', name: 'Fulbright Program', type: 'Curated', url: 'https://fulbrightprogram.org/', kind: 'scholarship', free: true },
  { id: 'rhodes', name: 'Rhodes Scholarship', type: 'Curated', url: 'https://www.rhodeshouse.ox.ac.uk/', kind: 'scholarship', free: true },
  { id: 'gates_cambridge', name: 'Gates Cambridge', type: 'Curated', url: 'https://www.gatescambridge.org/', kind: 'scholarship', free: true },
  { id: 'marshall', name: 'Marshall Scholarship', type: 'Curated', url: 'https://www.marshallscholarship.org/', kind: 'scholarship', free: true },
  { id: 'chevening', name: 'Chevening Scholarships', type: 'Curated', url: 'https://www.chevening.org/', kind: 'scholarship', free: true },
  { id: 'daad', name: 'DAAD Scholarships', type: 'Curated', url: 'https://www.daad.de/', kind: 'scholarship', free: true },
  { id: 'erik_blei', name: 'Erik Blei Memorial Grant', type: 'Curated', url: 'https://signal.org/', kind: 'grant', free: true },
  { id: 'moz_open', name: 'Mozilla Open Source', type: 'Curated', url: 'https://www.mozilla.org/', kind: 'grant', free: true },
]

export const OPP_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'scholarship', name: 'Scholarships' },
  { id: 'fellowship', name: 'Fellowships' },
  { id: 'grant', name: 'Grants' },
  { id: 'internship', name: 'Internships' },
  { id: 'mixed', name: 'Mixed / Other' },
]

export const OPP_FIELDS = [
  'STEM', 'Medicine & Health', 'Arts & Design', 'Humanities',
  'Social Sciences', 'Business', 'Law', 'Engineering', 'Education',
  'Environment', 'Agriculture', 'Journalism & Media', 'International Development',
  'Computer Science & AI', 'Data & Math',
]

export const OPP_REGIONS = [
  'US', 'UK', 'Europe', 'Africa', 'Asia', 'International', 'Worldwide',
]

export const SOURCES = [
  { id: 'remoteok', name: 'RemoteOK', type: 'Free', url: 'https://remoteok.com/api', category: 'Remote Jobs', free: true, live: true },
  { id: 'arbeitnow', name: 'Arbeitnow', type: 'Free', url: 'https://www.arbeitnow.com/api/job-board-api', category: 'Remote Jobs', free: true, live: true },
  { id: 'themuse', name: 'The Muse', type: 'Free', url: 'The Muse API', category: 'Company Profiles', free: true },
  { id: 'jobicy', name: 'Jobicy', type: 'Free', url: 'https://jobicy.com/api/v2/remote-jobs', category: 'Remote Jobs', free: true, live: true },
  { id: 'remotive', name: 'Remotive', type: 'Free', url: 'https://remotive.com/api/remote-jobs', category: 'Remote Jobs', free: true, live: true },
  { id: 'weworkremotely', name: 'WeWorkRemotely', type: 'RSS', url: 'RSS feeds (7 categories)', category: 'Remote Jobs', free: true },
  { id: 'workingnomads', name: 'WorkingNomads', type: 'RSS/API', url: 'WorkingNomads API', category: 'Remote Jobs', free: true },
  { id: 'lobsters', name: 'Lobsters', type: 'Free', url: 'Lobsters job board', category: 'Tech Jobs', free: true },
  { id: 'greenhouse', name: 'Greenhouse', type: 'ATS', url: 'https://boards-api.greenhouse.io/v1/boards/{token}/jobs', category: 'ATS Boards', free: true, companies: 200 },
  { id: 'lever', name: 'Lever', type: 'ATS', url: 'https://api.lever.co/v0/postings/{company}?mode=json', category: 'ATS Boards', free: true, companies: 50 },
  { id: 'ashby', name: 'Ashby', type: 'ATS', url: 'Ashby ATS API', category: 'ATS Boards', free: true },
  { id: 'workable', name: 'Workable', type: 'ATS', url: 'Workable ATS API', category: 'ATS Boards', free: true },
  { id: 'jobscollider', name: 'JobsCollider', type: 'Free', url: 'jobsCollider API', category: 'Tech Jobs', free: true },
  { id: 'devitjobs', name: 'DevITjobs', type: 'Free', url: 'DevITjobs API', category: 'Developer Jobs', free: true },
  { id: 'hn_hiring', name: 'HN Who is Hiring', type: 'Free', url: 'https://hn.algolia.com/api/v1/search_by_date', category: 'Tech Jobs', free: true, live: true },
  { id: 'totaljobs', name: 'Totaljobs', type: 'Scraper', url: 'Totaljobs.com', category: 'UK Jobs', free: true },
  { id: 'remote_co', name: 'Remote.co', type: 'RSS/API', url: 'Remote.co', category: 'Remote Jobs', free: true },
  { id: 'govuk', name: 'GOV.UK Find a Job', type: 'Free', url: 'GOV.UK API', category: 'UK Jobs', free: true },
  { id: 'linkedin', name: 'LinkedIn', type: 'Scraper', url: 'LinkedIn Jobs', category: 'General', free: true },
  { id: 'indeed', name: 'Indeed', type: 'Scraper', url: 'Indeed (via JobSpy)', category: 'General', free: true },
  { id: 'glassdoor', name: 'Glassdoor', type: 'Scraper', url: 'Glassdoor (via JobSpy)', category: 'General', free: true },
  { id: 'ziprecruiter', name: 'ZipRecruiter', type: 'Scraper', url: 'ZipRecruiter (via JobSpy)', category: 'General', free: true },
  { id: 'google_jobs', name: 'Google Jobs', type: 'Scraper', url: 'Google (via JobSpy)', category: 'General', free: true },
  { id: 'adzuna', name: 'Adzuna', type: 'API Key', url: 'https://api.adzuna.com/v1/api/jobs/{country}/search/{page}', category: 'General', free: false, key: 'ADZUNA_APP_ID + ADZUNA_APP_KEY' },
  { id: 'reed', name: 'Reed.co.uk', type: 'API Key', url: 'https://www.reed.co.uk/api/1.0/search', category: 'UK Jobs', free: false, key: 'REED_API_KEY' },
  { id: 'usajobs', name: 'USAJobs', type: 'API Key', url: 'https://data.usajobs.gov/api/Search', category: 'US Jobs', free: false, key: 'USAJOBS_API_KEY + USAJOBS_EMAIL' },
  { id: 'jooble', name: 'Jooble', type: 'API Key', url: 'https://jooble.org/api/{api_key}', category: 'General', free: false, key: 'JOOBLE_API_KEY' },
  { id: 'serpapi', name: 'SerpAPI (Google Jobs)', type: 'API Key', url: 'https://serpapi.com/search.json?engine=google_jobs', category: 'General', free: false, key: 'SERPAPI_KEY' },
  { id: 'findwork', name: 'Findwork', type: 'API Key', url: 'Findwork API', category: 'General', free: false, key: 'FINDWORK_API_KEY' },
  { id: 'careerjet', name: 'CareerJet', type: 'API Key', url: 'CareerJet API', category: 'General', free: false, key: 'CAREERJET_AFFID' },
  { id: 'jobdata', name: 'JobData', type: 'Free/Key', url: 'https://jobdataapi.com/api/jobs/', category: 'General', free: true, key: 'JOBDATA_API_KEY (optional)' },
]

export const SOURCE_CATEGORIES = [
  { id: 'all', name: 'All Sources' },
  { id: 'Remote Jobs', sources: SOURCES.filter(s => s.category === 'Remote Jobs') },
  { id: 'ATS Boards', sources: SOURCES.filter(s => s.category === 'ATS Boards') },
  { id: 'Tech Jobs', sources: SOURCES.filter(s => s.category === 'Tech Jobs') },
  { id: 'General', sources: SOURCES.filter(s => s.category === 'General') },
  { id: 'UK Jobs', sources: SOURCES.filter(s => s.category === 'UK Jobs') },
  { id: 'US Jobs', sources: SOURCES.filter(s => s.category === 'US Jobs') },
  { id: 'Developer Jobs', sources: SOURCES.filter(s => s.category === 'Developer Jobs') },
  { id: 'Company Profiles', sources: SOURCES.filter(s => s.category === 'Company Profiles') },
]

export { OPP_SOURCES }

export const THEMES = [
  { id: 'matrix', name: 'Matrix', desc: 'Easy green on dark' },
  { id: 'amber', name: 'Amber', desc: 'Warm orange on dark' },
  { id: 'cyber', name: 'Cyber', desc: 'Cyan on deep navy' },
  { id: 'mono', name: 'Mono', desc: 'Soft gray high contrast' },
  { id: 'retro', name: 'Retro', desc: 'Muted green CRT feel' },
  { id: 'soft', name: 'Soft', desc: 'Warm beige light mode' },
]
