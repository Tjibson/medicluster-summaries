import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { searchPubMed } from "../utils/pubmedSearch.ts"
import { parseArticles } from "../utils/articleParser.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  dateRange: {
    start: string
    end: string
  }
  journalNames: string[]
  keywords: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dateRange, journalNames, keywords } = await req.json() as SearchParams

    // Format the journal query
    const journalQuery = journalNames.map(journal => `"${journal}"[Journal]`).join(' OR ')
    
    // Construct the final query with date range
    const dateQuery = `(${dateRange.start}[PDAT] : ${dateRange.end}[PDAT])`
    let finalQuery = `${dateQuery} AND (${journalQuery})`
    
    // Only add keywords if they exist
    if (keywords.trim()) {
      finalQuery += ` AND ${keywords}`
    }

    console.log('Executing PubMed search with query:', finalQuery)

    // Perform the PubMed search
    const xmlResponse = await searchPubMed(finalQuery)
    
    if (!xmlResponse) {
      console.log('No results found')
      return new Response(
        JSON.stringify({
          papers: [],
          message: 'No results found'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Parse the articles
    const papers = parseArticles(xmlResponse, { keywords })
    console.log(`Successfully processed ${papers.length} papers`)

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
      }
    )
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        papers: []
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
})