import { type SearchParameters } from "@/constants/searchConfig"
import { supabase } from "@/integrations/supabase/client"

export async function POST(req: Request) {
  try {
    const searchParams = await req.json()
    console.log("Search params received:", searchParams)

    // Call the Supabase Edge Function for PubMed search
    const { data, error } = await supabase.functions.invoke('search-pubmed', {
      body: JSON.stringify(searchParams)
    })

    if (error) throw error

    return new Response(JSON.stringify({ papers: data }), {
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