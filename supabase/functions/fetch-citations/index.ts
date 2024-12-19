import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Paper {
  id: string
  title: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { papers } = await req.json() as { papers: Paper[] }
    console.log('Fetching citations for papers:', papers)

    const citationsData = await Promise.all(
      papers.map(async (paper) => {
        try {
          // Search for the paper in Semantic Scholar
          const searchResponse = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(paper.title)}&fields=citationCount,title`
          )

          if (!searchResponse.ok) {
            throw new Error(`Semantic Scholar API error: ${searchResponse.statusText}`)
          }

          const searchData = await searchResponse.json()
          const matchingPaper = searchData.data?.[0]

          return {
            id: paper.id,
            citations: matchingPaper?.citationCount || 0
          }
        } catch (error) {
          console.error(`Error fetching citations for paper ${paper.id}:`, error)
          return {
            id: paper.id,
            citations: 0
          }
        }
      })
    )

    return new Response(
      JSON.stringify({ citations: citationsData }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in fetch-citations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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