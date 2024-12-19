import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
  keywords?: string
  medicine?: string
  condition?: string
}

async function searchPubMed(query: string, dateRange?: { start: string; end: string }) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  
  try {
    console.log('Executing PubMed search with query:', query)
    
    // Build the search URL with date range if provided
    let searchQuery = query
    if (dateRange) {
      searchQuery += ` AND ("${dateRange.start}"[Date - Publication] : "${dateRange.end}"[Date - Publication])`
    }
    
    // Initial search to get PMIDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=100&usehistory=y`
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

function parseArticles(xml: string) {
  const articles = []
  const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
  
  for (const articleXml of articleMatches) {
    try {
      const article = {
        id: articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || '',
        title: extractText(articleXml, 'ArticleTitle'),
        abstract: extractText(articleXml, 'Abstract/AbstractText') || 'No abstract available',
        authors: extractAuthors(articleXml),
        journal: extractText(articleXml, 'Journal/Title') || extractText(articleXml, 'ISOAbbreviation') || 'Unknown Journal',
        year: parseInt(extractText(articleXml, 'PubDate/Year') || new Date().getFullYear().toString()),
        citations: 0
      }
      
      articles.push(article)
    } catch (error) {
      console.error('Error processing article:', error)
      continue
    }
  }
  
  return articles
}

function extractText(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>(.*?)</${tag.split('/').pop()}>`, 's').exec(xml)
  return match ? decodeXMLEntities(match[1].trim()) : ''
}

function extractAuthors(xml: string): string[] {
  const authors = []
  const authorMatches = xml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
  
  for (const match of authorMatches) {
    const lastName = match[1] || ''
    const foreName = match[2] || ''
    authors.push(`${lastName} ${foreName}`.trim())
  }
  
  return authors
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const params = await req.json() as SearchParams
    console.log('Received search params:', params)

    if (!params.medicine && !params.condition) {
      return new Response(
        JSON.stringify({
          papers: [],
          message: 'No search keywords provided'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200
        }
      )
    }

    // Build search query
    const searchTerms = []
    if (params.medicine) searchTerms.push(`(${params.medicine})`)
    if (params.condition) searchTerms.push(`(${params.condition})`)
    
    // Format the journal query if journals are provided
    const journalQuery = params.journalNames?.length 
      ? ` AND (${params.journalNames.map(journal => `"${journal}"[Journal]`).join(' OR ')})`
      : ''

    // Construct the final query
    const finalQuery = `${searchTerms.join(' AND ')}${journalQuery}`
    console.log('Final PubMed query:', finalQuery)
    
    const papers = await searchPubMed(finalQuery, params.dateRange)

    return new Response(
      JSON.stringify({
        papers,
        message: 'Search completed successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during search',
        papers: []
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200
      }
    )
  }
})