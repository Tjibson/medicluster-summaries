import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParameters {
  medicine?: string
  condition?: string
  dateRange?: {
    start: string
    end: string
  }
  articleTypes?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Received search parameters:', searchParams)

    // Mock response for testing
    const papers = [
      {
        id: "1",
        title: "Test Paper",
        authors: ["Author 1", "Author 2"],
        journal: "Test Journal",
        year: 2024,
        abstract: "This is a test abstract",
        citations: 0
      }
    ]

    return new Response(
      JSON.stringify({ papers }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})