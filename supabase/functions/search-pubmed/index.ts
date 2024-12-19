import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SearchParams } from './utils/types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

async function searchPubMed(query: string, dateRange?: { start: string; end: string }) {
  try {
    console.log('Executing PubMed search with query:', query)
    
    // Step 1: Search for PMIDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    console.log('Search URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    console.log('Search response:', searchText)
    
    // Extract PMIDs
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)
    
    if (pmids.length === 0) {
      return []
    }

    // Step 2: Fetch article details
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('Fetch URL:', fetchUrl)
    
    const fetchResponse = await fetch(fetchUrl)
    if (!fetchResponse.ok) {
      throw new Error(`Fetch request failed: ${fetchResponse.statusText}`)
    }
    
    const articlesXml = await fetchResponse.text()
    console.log('Received articles XML length:', articlesXml.length)
    
    // Parse articles
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
        id: extractText(articleXml, 'PMID'),
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const params = await req.json() as SearchParams
    console.log('Received search params:', params)

    if (!params.keywords) {
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

    const papers = await searchPubMed(params.keywords, params.dateRange)

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