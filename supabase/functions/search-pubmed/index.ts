import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { searchPubMed } from "../utils/pubmedSearch.ts"
import { parseArticles } from "../utils/articleParser.ts"

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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const params = await req.json() as SearchParams
    console.log('Received search params:', params)

    if (!params.keywords?.trim()) {
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

    // Add timeout to the PubMed search
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout')), 25000)
    })

    // Format the journal query if journals are provided
    const journalQuery = params.journalNames?.length 
      ? params.journalNames.map(journal => `"${journal}"[Journal]`).join(' OR ')
      : ''

    // Build date query
    const startDate = params.dateRange?.start || "2024/01/01"
    const endDate = params.dateRange?.end || "2024/12/31"
    const dateQuery = `(${startDate}[PDAT] : ${endDate}[PDAT])`

    // Construct the final query
    let finalQuery = dateQuery
    if (journalQuery) {
      finalQuery += ` AND (${journalQuery})`
    }
    if (params.keywords) {
      finalQuery += ` AND ${params.keywords}`
    }

    console.log('Executing PubMed search with query:', finalQuery)

    // Race between the search and the timeout
    const xmlResponse = await Promise.race([
      searchPubMed(finalQuery),
      timeoutPromise
    ])
    
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
          status: 200
        }
      )
    }

    // Parse the articles
    const papers = parseArticles(xmlResponse, { keywords: params.keywords })
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
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    
    // Return a more informative error response
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
        status: 200 // Always return 200 to prevent the FunctionsHttpError
      }
    )
  }
})