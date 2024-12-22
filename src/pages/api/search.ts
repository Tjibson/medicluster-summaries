import { type SearchParameters } from "@/constants/searchConfig"
import { supabase } from "@/integrations/supabase/client"

export async function POST(req: Request) {
  try {
    const searchParams = await req.json()
    console.log("Search params received:", searchParams)

    // Convert the search parameters to the expected format
    const formattedParams: SearchParameters = {
      medicine: searchParams.medicine || "",
      condition: searchParams.condition || "",
      dateRange: searchParams.dateRange,
      articleTypes: searchParams.articleTypes || []
    }

    // Call the Supabase Edge Function for PubMed search
    const { data, error } = await supabase.functions.invoke('search-pubmed', {
      body: { searchParams: formattedParams }
    })

    if (error) {
      console.error("Supabase function error:", error)
      throw error
    }

    console.log("Search results:", data)
    return new Response(JSON.stringify({ papers: data.papers }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error("Search API error:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to perform search" 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}