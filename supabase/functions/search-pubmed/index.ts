import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { BeautifulSoup } from "https://deno.land/x/beautiful_soup@v0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1",
  "Mozilla/5.0 (X11; CrOS i686 2268.111.0) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6",
  "Mozilla/5.0 (Windows NT 6.0) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.36 Safari/536.5",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1062.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1062.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/19.77.34.5 Safari/537.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.0 Safari/536.3",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.24 (KHTML, like Gecko) Chrome/19.0.1055.1 Safari/535.24",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/535.24 (KHTML, like Gecko) Chrome/19.0.1055.1 Safari/535.24"
]

function makeHeader() {
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  }
}

async function getPMIDs(page: number, keyword: string, baseUrl: string) {
  const pageUrl = `${baseUrl}+${keyword}+&page=${page}`
  console.log('Fetching PMIDs from:', pageUrl)
  
  const response = await fetch(pageUrl, { 
    headers: makeHeader(),
    redirect: 'follow'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PMIDs: ${response.status}`)
  }

  const html = await response.text()
  const soup = new BeautifulSoup(html)
  
  const pmidsElem = soup.find('meta', { name: 'log_displayeduids' })
  const pmids = pmidsElem?.getAttribute('content')?.split(',') || []
  
  return pmids
}

async function extractArticleData(pmid: string, baseUrl: string) {
  const articleUrl = `${baseUrl}/${pmid}`
  console.log('Fetching article:', articleUrl)
  
  const response = await fetch(articleUrl, {
    headers: makeHeader(),
    redirect: 'follow'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch article ${pmid}: ${response.status}`)
  }

  const html = await response.text()
  const soup = new BeautifulSoup(html)
  
  try {
    const abstractRaw = soup.find('div', { class: 'abstract-content selected' })?.findAll('p')
    const abstract = abstractRaw ? abstractRaw.map(p => p.text().trim()).join(' ') : ''
    
    const title = soup.find('meta', { name: 'citation_title' })?.getAttribute('content')?.trim() || ''
    
    const authors = soup.find('div', { class: 'authors-list' })
      ?.findAll('a', { class: 'full-name' })
      ?.map(author => author.text().trim()) || []
    
    const journal = soup.find('meta', { name: 'citation_journal_title' })?.getAttribute('content') || ''
    const year = soup.find('time', { class: 'citation-year' })?.text()?.trim() || ''

    return {
      id: pmid,
      title,
      abstract,
      authors,
      journal,
      year: parseInt(year) || new Date().getFullYear(),
      citations: 0
    }
  } catch (error) {
    console.error(`Error extracting data from article ${pmid}:`, error)
    return null
  }
}

async function searchPubMed(criteria: any) {
  console.log('Searching PubMed with criteria:', criteria)
  
  let searchQuery = ''
  if (criteria.disease) searchQuery += `${criteria.disease}[Title/Abstract] `
  if (criteria.medicine) searchQuery += `AND ${criteria.medicine}[Title/Abstract] `
  if (criteria.working_mechanism) searchQuery += `AND ${criteria.working_mechanism}[Title/Abstract] `
  if (criteria.population) searchQuery += `AND ${criteria.population}[Title/Abstract] `
  if (criteria.trial_type) searchQuery += `AND ${criteria.trial_type}[Publication Type] `
  
  searchQuery = searchQuery.trim().replace(/^AND\s+/, '')
  
  if (!searchQuery) {
    throw new Error('No search criteria provided')
  }

  const baseUrl = 'https://pubmed.ncbi.nlm.nih.gov'
  const searchUrl = `${baseUrl}/?term=${encodeURIComponent(searchQuery)}`
  
  console.log('Base search URL:', searchUrl)
  
  try {
    // Get PMIDs from first page
    const pmids = await getPMIDs(1, searchQuery, baseUrl)
    console.log(`Found ${pmids.length} PMIDs`)
    
    // Get article data for each PMID
    const articles = []
    for (const pmid of pmids) {
      try {
        const article = await extractArticleData(pmid, baseUrl)
        if (article) {
          articles.push(article)
        }
      } catch (error) {
        console.error(`Error processing article ${pmid}:`, error)
        continue
      }
    }
    
    return articles
  } catch (error) {
    console.error('Error searching PubMed:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const searchCriteria = await req.json()
    console.log('Received search criteria:', searchCriteria)

    const papers = await searchPubMed(searchCriteria)

    return new Response(
      JSON.stringify({ 
        success: true,
        papers
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})