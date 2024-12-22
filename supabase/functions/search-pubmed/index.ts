import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParameters {
  medicine?: string
  condition?: string
  dateRange?: {
    start: string
    end: string
  }
  articleTypes?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request:', searchParams)

    // Construct PubMed search query
    const query = buildSearchQuery(searchParams)
    console.log('PubMed query:', query)

    // Call PubMed API
    const papers = await searchPubMed(query)
    console.log(`Found ${papers.length} papers`)

    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function buildSearchQuery(params: SearchParameters): string {
  const parts = []

  if (params.medicine) {
    parts.push(`"${params.medicine}"[Title/Abstract]`)
  }

  if (params.condition) {
    parts.push(`"${params.condition}"[Title/Abstract]`)
  }

  if (params.dateRange) {
    parts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    )
  }

  if (params.articleTypes && params.articleTypes.length > 0) {
    const typeQuery = params.articleTypes
      .map(type => `"${type}"[Publication Type]`)
      .join(" OR ")
    parts.push(`(${typeQuery})`)
  }

  return parts.join(" AND ")
}

async function searchPubMed(query: string): Promise<any[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  
  try {
    console.log('Executing PubMed search with query:', query)
    
    // Initial search to get PMIDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    console.log('Search URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    console.log('Search response:', searchText)
    
    // Extract PMIDs from search results
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)
    
    if (pmids.length === 0) {
      console.log('No results found')
      return []
    }

    // Fetch full article details
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('Fetch URL:', fetchUrl)
    
    const fetchResponse = await fetch(fetchUrl)
    if (!fetchResponse.ok) {
      throw new Error(`Fetch request failed: ${fetchResponse.statusText}`)
    }
    
    const articlesXml = await fetchResponse.text()
    console.log('Received articles XML length:', articlesXml.length)
    
    // Parse articles from XML
    const articles = parseArticles(articlesXml)
    console.log(`Successfully processed ${articles.length} papers`)
    
    return articles
    
  } catch (error) {
    console.error('Error in searchPubMed:', error)
    throw error
  }
}

function parseArticles(xmlText: string): any[] {
  const articles = []
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

  for (const articleXml of articleMatches) {
    try {
      const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
      const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
      const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''
      
      const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
      const authors = Array.from(authorMatches).map(match => {
        const lastName = match[1] || ''
        const foreName = match[2] || ''
        return `${lastName} ${foreName}`.trim()
      })

      const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                     articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                     'Unknown Journal'
      
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
      const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

      articles.push({
        id,
        title: decodeXMLEntities(title),
        authors,
        journal: decodeXMLEntities(journal),
        year,
        abstract: decodeXMLEntities(abstract),
        citations: 0 // We'll update this later via the citations API
      })
    } catch (error) {
      console.error('Error processing article:', error)
      continue
    }
  }

  return articles
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}