import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SearchParams } from './utils/types'
import { buildPubMedQuery } from './utils/queryBuilder'
import { searchPubMed } from './utils/pubmedApi'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const query = buildPubMedQuery(params)
    console.log('Final PubMed query:', query)
    
    const papers = await searchPubMed(query, params.dateRange)

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