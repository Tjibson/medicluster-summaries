import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { searchPubMed } from "../utils/pubmedSearch.ts"
import { parseArticles } from "../utils/articleParser.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const searchCriteria = await req.json()
    console.log('Search criteria:', searchCriteria)

    let searchQuery = ''
    const searchTerms: string[] = []
    
    if (searchCriteria.disease) searchTerms.push(`${searchCriteria.disease}[Title/Abstract]`)
    if (searchCriteria.medicine) searchTerms.push(`${searchCriteria.medicine}[Title/Abstract]`)
    if (searchCriteria.working_mechanism) searchTerms.push(`${searchCriteria.working_mechanism}[Title/Abstract]`)
    if (searchCriteria.population) searchTerms.push(`${searchCriteria.population}[Title/Abstract]`)
    if (searchCriteria.trial_type) searchTerms.push(`${searchCriteria.trial_type}[Publication Type]`)
    if (searchCriteria.journal) searchTerms.push(`"${searchCriteria.journal}"[Journal]`)
    
    searchQuery = searchTerms.join(' AND ')
    
    // If no specific criteria provided, search for all medical research papers from last year
    if (!searchQuery.trim()) {
      const lastYear = new Date().getFullYear() - 1
      searchQuery = `"${lastYear}/01/01"[Date - Publication] : "${lastYear}/12/31"[Date - Publication]`
    }

    console.log('Final search query:', searchQuery)

    // Reduced limit to 5 papers to stay within compute limits
    const xmlText = await searchPubMed(searchQuery, searchCriteria.date_range, 5)
    const papers = parseArticles(xmlText, searchCriteria)

    console.log(`Found ${papers.length} papers from PubMed`)

    return new Response(
      JSON.stringify({ success: true, papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})