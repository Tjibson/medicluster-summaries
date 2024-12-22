import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL_NAME = 'MediScrape'
const TOOL_EMAIL = 'mediscrape@example.com'
const TIMEOUT = 30000 // 30 seconds timeout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request received:', searchParams)

    if (!searchParams) {
      throw new Error('No search parameters provided')
    }

    // Validate search parameters
    if (!searchParams.medicine && !searchParams.condition) {
      throw new Error('At least one search term (medicine or condition) is required')
    }

    // Build search query with proper URL encoding
    const queryParts = []
    
    if (searchParams.medicine) {
      queryParts.push(`(${encodeURIComponent(searchParams.medicine)}[Title/Abstract])`)
    }
    
    if (searchParams.condition) {
      queryParts.push(`(${encodeURIComponent(searchParams.condition)}[Title/Abstract])`)
    }

    if (searchParams.articleTypes?.length) {
      const typeQuery = searchParams.articleTypes
        .map(type => `"${encodeURIComponent(type)}"[Publication Type]`)
        .join(" OR ")
      queryParts.push(`(${typeQuery})`)
    }

    if (searchParams.dateRange) {
      const dateQuery = `("${encodeURIComponent(searchParams.dateRange.start)}"[Date - Publication] : "${encodeURIComponent(searchParams.dateRange.end)}"[Date - Publication])`
      queryParts.push(dateQuery)
    }

    const query = queryParts.join(" AND ")
    console.log('Built PubMed query:', query)

    // Construct search URL with encoded parameters
    const params = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retstart: (searchParams.offset || 0).toString(),
      retmax: (searchParams.limit || 25).toString(),
      usehistory: 'y',
      retmode: 'xml',
      tool: TOOL_NAME,
      email: TOOL_EMAIL
    })

    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?${params.toString()}`
    console.log('PubMed search URL:', searchUrl)

    // Execute search with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0'
        },
        signal: controller.signal
      })

      if (!searchResponse.ok) {
        throw new Error(`PubMed search failed: ${searchResponse.status} ${searchResponse.statusText}`)
      }

      const searchText = await searchResponse.text()
      console.log('Search response received')

      // Extract WebEnv and QueryKey
      const webEnv = searchText.match(/<WebEnv>(\S+)<\/WebEnv>/)?.[1]
      const queryKey = searchText.match(/<QueryKey>(\d+)<\/QueryKey>/)?.[1]
      const count = searchText.match(/<Count>(\d+)<\/Count>/)?.[1]

      if (!webEnv || !queryKey) {
        throw new Error('Failed to get WebEnv or QueryKey from PubMed')
      }

      // Fetch actual results
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        WebEnv: webEnv,
        query_key: queryKey,
        retstart: (searchParams.offset || 0).toString(),
        retmax: (searchParams.limit || 25).toString(),
        retmode: 'xml',
        tool: TOOL_NAME,
        email: TOOL_EMAIL
      })

      const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams.toString()}`
      console.log('Fetching articles from:', fetchUrl)

      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0'
        }
      })

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch results: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const articlesXml = await fetchResponse.text()
      console.log('Articles XML received, length:', articlesXml.length)

      // Parse articles from XML
      const articles = parseArticles(articlesXml)
      console.log(`Successfully processed ${articles.length} papers`)

      return new Response(
        JSON.stringify({ 
          papers: articles,
          total: parseInt(count || '0'),
          offset: searchParams.offset || 0,
          limit: searchParams.limit || 25
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } finally {
      clearTimeout(timeout)
    }
    
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search',
        papers: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function parseArticles(xmlText: string) {
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
        abstract: decodeXMLEntities(abstract)
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