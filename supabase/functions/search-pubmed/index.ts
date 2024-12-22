import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 5
const TIMEOUT = 5000

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request:', searchParams)

    if (!searchParams) {
      throw new Error('No search parameters provided')
    }

    const query = buildSearchQuery(searchParams)
    const offset = searchParams.offset || 0
    const limit = searchParams.limit || 25
    const sort = searchParams.sort || 'relevance'
    console.log('PubMed query:', query, 'offset:', offset, 'limit:', limit, 'sort:', sort)

    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    
    // Properly encode the search URL components
    const searchUrlParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      usehistory: 'y',
      retmax: '0',
      sort: sort
    })
    const searchUrl = `${baseUrl}/esearch.fcgi?${searchUrlParams.toString()}`
    console.log('Initial search URL:', searchUrl)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const searchResponse = await fetch(searchUrl, {
        headers: { 
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0' // Add user agent to prevent some API blocks
        },
        signal: controller.signal
      })
      clearTimeout(timeout)
      
      if (!searchResponse.ok) {
        throw new Error(`PubMed search failed: ${searchResponse.status} ${searchResponse.statusText}`)
      }

      const searchText = await searchResponse.text()
      console.log('Search response received, length:', searchText.length)

      const count = searchText.match(/<Count>(\d+)<\/Count>/)?.[1]
      const webEnv = searchText.match(/<WebEnv>(\S+)<\/WebEnv>/)?.[1]
      const queryKey = searchText.match(/<QueryKey>(\d+)<\/QueryKey>/)?.[1]

      if (!webEnv || !queryKey) {
        throw new Error('Failed to get WebEnv or QueryKey from PubMed')
      }

      console.log(`Total results: ${count}, fetching from offset ${offset} with limit ${limit}`)

      // Properly encode the fetch URL components
      const fetchUrlParams = new URLSearchParams({
        db: 'pubmed',
        WebEnv: webEnv,
        query_key: queryKey,
        retstart: offset.toString(),
        retmax: limit.toString(),
        retmode: 'xml',
        sort: sort
      })
      const fetchUrl = `${baseUrl}/efetch.fcgi?${fetchUrlParams.toString()}`
      console.log('Fetch URL:', fetchUrl)

      const fetchController = new AbortController()
      const fetchTimeout = setTimeout(() => fetchController.abort(), TIMEOUT)

      const fetchResponse = await fetch(fetchUrl, {
        headers: { 
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0'
        },
        signal: fetchController.signal
      })
      clearTimeout(fetchTimeout)

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch results: ${fetchResponse.status} ${fetchResponse.statusText}`)
      }

      const articlesXml = await fetchResponse.text()
      console.log('Received articles XML, length:', articlesXml.length)

      const articleMatches = articlesXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
      console.log(`Found ${articleMatches.length} articles to process`)

      const papers = []
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

          papers.push({
            id,
            title: decodeXMLEntities(title),
            abstract: decodeXMLEntities(abstract),
            authors,
            journal: decodeXMLEntities(journal),
            year,
            citations: 0
          })
          console.log('Successfully processed article:', id)
        } catch (error) {
          console.error('Error processing article:', error)
          continue
        }
      }

      console.log(`Successfully processed ${papers.length} papers`)
      return new Response(
        JSON.stringify({ 
          papers,
          total: parseInt(count || '0'),
          offset,
          limit
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
    } catch (error) {
      clearTimeout(timeout)
      throw error
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

function buildSearchQuery(params: any): string {
  const parts = []

  if (params.medicine) {
    parts.push(`(${params.medicine}[Title/Abstract])`)
  }

  if (params.condition) {
    parts.push(`(${params.condition}[Title/Abstract])`)
  }

  if (params.dateRange) {
    parts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    )
  }

  if (params.articleTypes && params.articleTypes.length > 0) {
    const typeQuery = params.articleTypes
      .map((type: string) => `"${type}"[Publication Type]`)
      .join(" OR ")
    parts.push(`(${typeQuery})`)
  }

  return parts.join(" AND ") || "*"
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}