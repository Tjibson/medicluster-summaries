import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Paper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
}

async function getCitationCountFromCrossRef(paper: Paper): Promise<number> {
  try {
    const query = `query=${encodeURIComponent(paper.title)}+author:${encodeURIComponent(paper.authors[0])}+journal:${encodeURIComponent(paper.journal)}+year:${paper.year}`
    const crossrefUrl = `https://api.crossref.org/works?${query}&rows=1`
    
    const response = await fetch(crossrefUrl)
    if (!response.ok) return 0

    const data = await response.json()
    const items = data.message?.items || []
    
    if (items.length > 0) {
      return items[0]['is-referenced-by-count'] || 0
    }
    return 0
  } catch (error) {
    console.error('Error fetching CrossRef citations:', error)
    return 0
  }
}

async function getCitationCountFromPubMed(pmid: string): Promise<number> {
  try {
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`
    const response = await fetch(pubmedUrl)
    
    if (!response.ok) return 0

    const data = await response.json()
    const result = data.result?.[pmid]
    return result?.citedby || 0
  } catch (error) {
    console.error('Error fetching PubMed citations:', error)
    return 0
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { paper } = await req.json()
    
    // Try PubMed first since we have the PMID
    let citations = await getCitationCountFromPubMed(paper.id)
    
    // If no citations found in PubMed, try CrossRef
    if (!citations) {
      citations = await getCitationCountFromCrossRef(paper)
    }

    return new Response(
      JSON.stringify({ citations }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in fetch-citations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})