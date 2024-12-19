import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { searchPubMed } from "../utils/pubmedSearch.ts"
import { parseArticles } from "../utils/articleParser.ts"
import { fetchGoogleScholarData } from "../utils/googleScholar.ts"

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
    
    if (!searchQuery.trim()) {
      throw new Error('No search criteria provided')
    }

    console.log('Final search query:', searchQuery)

    // Search PubMed
    const xmlText = await searchPubMed(searchQuery, searchCriteria.date_range)
    let papers = parseArticles(xmlText, searchCriteria)

    // Enhance papers with Google Scholar data
    const enhancedPapers = await Promise.all(
      papers.map(async (paper) => {
        try {
          const scholarData = await fetchGoogleScholarData(paper.title, paper.authors)
          return {
            ...paper,
            pdfUrl: scholarData?.pdfUrl || null,
          }
        } catch (error) {
          console.error(`Error fetching Google Scholar data for paper ${paper.id}:`, error)
          return paper
        }
      })
    )

    console.log(`Found ${papers.length} papers`)

    return new Response(
      JSON.stringify({ success: true, papers: enhancedPapers }),
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