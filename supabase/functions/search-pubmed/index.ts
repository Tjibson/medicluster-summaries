import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { buildSearchQuery } from './utils/queryBuilder.ts'
import { parseArticles } from './utils/articleParser.ts'
import { calculateRelevanceScore } from './utils/scoring.ts'
import { type SearchParameters } from './types.ts'

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
    console.log('Search request:', { searchParams })

    // Step 1: Construct search query with Boolean logic
    const query = buildSearchQuery(searchParams)
    console.log("Constructed PubMed query:", query)

    // Step 2: Fetch article IDs from PubMed
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    console.log('Search URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    console.log('Search response:', searchText)
    
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)
    
    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Fetch full article details
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('Fetch URL:', fetchUrl)
    
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
    }
    
    const articlesXml = await fetchResponse.text()
    console.log('Received articles XML length:', articlesXml.length)
    
    // Step 4: Parse and score articles
    const articles = parseArticles(articlesXml, searchParams)
    console.log(`Successfully processed ${articles.length} papers`)
    
    // Step 5: Sort by relevance score and return
    const sortedPapers = articles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))

    return new Response(
      JSON.stringify({ papers: sortedPapers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        papers: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})