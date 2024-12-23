import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { calculateRelevanceScore } from './utils/scoring.ts'

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL_NAME = 'MediScrape'
const TOOL_EMAIL = 'mediscrape@example.com'
const TIMEOUT = 30000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request received:', searchParams)

    if (!searchParams) {
      throw new Error('No search parameters provided')
    }

    // Build search query
    const queryParts = []
    if (searchParams.medicine) {
      queryParts.push(`(${encodeURIComponent(searchParams.medicine)}[Title/Abstract])`)
    }
    if (searchParams.condition) {
      queryParts.push(`(${encodeURIComponent(searchParams.condition)}[Title/Abstract])`)
    }

    const query = queryParts.join(" AND ")
    console.log('Built PubMed query:', query)

    // Execute search
    const params = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: '100',
      usehistory: 'y',
      retmode: 'xml',
      tool: TOOL_NAME,
      email: TOOL_EMAIL
    })

    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?${params.toString()}`
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.status}`)
    }

    const searchText = await searchResponse.text()
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch article details
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      tool: TOOL_NAME,
      email: TOOL_EMAIL
    })

    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams.toString()}`
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch results: ${fetchResponse.status}`)
    }

    const articlesXml = await fetchResponse.text()
    const articles = parseArticles(articlesXml)

    // Calculate relevance scores
    const articlesWithScores = articles.map(article => ({
      ...article,
      relevance_score: calculateRelevanceScore(
        article.title,
        article.abstract || '',
        { medicine: searchParams.medicine, condition: searchParams.condition }
      )
    }))

    // Sort by relevance score
    const sortedArticles = articlesWithScores.sort((a, b) => 
      (b.relevance_score || 0) - (a.relevance_score || 0)
    )

    return new Response(
      JSON.stringify({ papers: sortedArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

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