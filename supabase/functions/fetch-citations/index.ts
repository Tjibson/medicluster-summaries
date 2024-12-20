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

async function getCitationCountFromPubMed(pmid: string): Promise<number> {
  try {
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&linkname=pubmed_pubmed_citedin&id=${pmid}&retmode=json`
    const response = await fetch(pubmedUrl)
    
    if (!response.ok) {
      console.error('PubMed API error:', response.statusText)
      return 0
    }

    const data = await response.json()
    const linksets = data.linksets || []
    if (linksets.length === 0) return 0

    const linksetdb = linksets[0].linksetdbs?.find((db: any) => db.linkname === 'pubmed_pubmed_citedin')
    return linksetdb?.links?.length || 0
  } catch (error) {
    console.error('Error fetching PubMed citations:', error)
    return 0
  }
}

async function getCitationCountFromCrossRef(paper: Paper): Promise<number> {
  try {
    // Construct a precise query using multiple fields
    const query = `query=${encodeURIComponent(paper.title)}+author:${encodeURIComponent(paper.authors[0])}+container-title:${encodeURIComponent(paper.journal)}+published:${paper.year}`
    const crossrefUrl = `https://api.crossref.org/works?${query}&rows=1&select=is-referenced-by-count`
    
    const response = await fetch(crossrefUrl, {
      headers: {
        'User-Agent': 'ResearchApp/1.0 (mailto:tjibbe-beckers@live.nl)'
      }
    })

    if (!response.ok) {
      console.error('CrossRef API error:', response.statusText)
      return 0
    }

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { paper } = await req.json()
    console.log('Fetching citations for paper:', paper.title)

    // Try both sources and take the higher count
    const [pubmedCitations, crossrefCitations] = await Promise.all([
      getCitationCountFromPubMed(paper.id),
      getCitationCountFromCrossRef(paper)
    ])

    console.log('Citation counts:', {
      pubmed: pubmedCitations,
      crossref: crossrefCitations,
      paper: paper.title
    })

    // Use the higher citation count between the two sources
    const citations = Math.max(pubmedCitations, crossrefCitations)

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