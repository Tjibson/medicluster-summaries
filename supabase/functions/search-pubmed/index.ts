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
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
  }
}

async function searchPubMed(criteria: any) {
  const baseUrl = 'https://pubmed.ncbi.nlm.nih.gov'
  let searchQuery = ''
  
  if (criteria.disease) searchQuery += `${criteria.disease}[Title/Abstract] `
  if (criteria.medicine) searchQuery += `AND ${criteria.medicine}[Title/Abstract] `
  if (criteria.working_mechanism) searchQuery += `AND ${criteria.working_mechanism}[Title/Abstract] `
  if (criteria.population) searchQuery += `AND ${criteria.population}[Title/Abstract] `
  if (criteria.trial_type) searchQuery += `AND ${criteria.trial_type}[Publication Type] `
  
  const searchUrl = `${baseUrl}/?term=${encodeURIComponent(searchQuery.trim())}&size=10`
  
  try {
    const response = await fetch(searchUrl, { headers: makeHeader() })
    const html = await response.text()
    const soup = new BeautifulSoup(html)
    
    const results = []
    const articles = soup.findAll('article', { class: 'full-docsum' })
    
    for (const article of articles) {
      const titleElem = article.find('a', { class: 'docsum-title' })
      const title = titleElem?.text()?.trim() || ''
      const pmid = article.getAttribute('data-article-id') || ''
      
      // Get full article details
      const articleUrl = `${baseUrl}/${pmid}`
      const articleResponse = await fetch(articleUrl, { headers: makeHeader() })
      const articleHtml = await articleResponse.text()
      const articleSoup = new BeautifulSoup(articleHtml)
      
      const abstract = articleSoup.find('div', { class: 'abstract-content' })?.text()?.trim() || ''
      const authors = articleSoup.findAll('a', { class: 'full-name' })
        ?.map(author => author.text()?.trim())
        ?.filter(Boolean) || []
      const journal = articleSoup.find('button', { id: 'journal-citation-trigger' })?.text()?.trim() || ''
      const year = articleSoup.find('span', { class: 'citation-year' })?.text()?.trim() || ''
      
      results.push({
        id: pmid,
        title,
        abstract,
        authors,
        journal,
        year: parseInt(year) || new Date().getFullYear(),
        citations: 0, // Would need additional API call to get citations
      })
    }
    
    return results
  } catch (error) {
    console.error('Error searching PubMed:', error)
    throw error
  }
}

serve(async (req) => {
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
