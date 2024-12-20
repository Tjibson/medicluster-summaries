import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface Paper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  citations?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { papers } = await req.json()
    console.log('Received papers:', papers)

    // Fetch citations in parallel for all papers
    const papersWithCitations = await Promise.all(
      papers.map(async (paper: Paper) => {
        const citationUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&linkname=pubmed_pubmed_citedin&id=${paper.id}&retmode=json`
        
        try {
          const response = await fetch(citationUrl)
          const data = await response.json()
          
          const citations = data.linksets?.[0]?.linksetdbs?.[0]?.links?.length || 0
          console.log(`Citations for paper ${paper.id}: ${citations}`)
          
          return {
            ...paper,
            citations
          }
        } catch (error) {
          console.error(`Error fetching citations for paper ${paper.id}:`, error)
          return {
            ...paper,
            citations: 0
          }
        }
      })
    )

    // Sort papers by citations in descending order
    const sortedPapers = papersWithCitations.sort((a, b) => (b.citations || 0) - (a.citations || 0))
    console.log('Sorted papers:', sortedPapers)

    return new Response(
      JSON.stringify({ papers: sortedPapers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-sorted-papers:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})