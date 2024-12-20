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
    // Use PubMed's citation API with proper parameters
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_citedin&retmode=json&api_key=0e15924868078a8b07c4fc709d8a306e6108`
    console.log('PubMed citation URL:', pubmedUrl)
    
    const response = await fetch(pubmedUrl)
    
    if (!response.ok) {
      console.error('PubMed API error:', response.statusText)
      return 0
    }

    const data = await response.json()
    console.log('PubMed citation response:', JSON.stringify(data))

    // Extract citations from the linksets
    if (!data.linksets?.[0]) return 0

    // Get citations count from the linkset
    const citations = data.linksets[0].linksets?.[0]?.links?.length || 0
    console.log(`Found ${citations} citations for PMID ${pmid} in PubMed`)
    return citations
  } catch (error) {
    console.error('Error fetching PubMed citations:', error)
    return 0
  }
}

async function getCitationCountFromCrossRef(paper: Paper): Promise<number> {
  try {
    // Build a precise query for CrossRef using multiple fields
    const query = encodeURIComponent(`${paper.title} ${paper.authors[0]} ${paper.year}`)
    const crossrefUrl = `https://api.crossref.org/works?query=${query}&select=title,DOI,is-referenced-by-count&rows=1`
    
    console.log('CrossRef URL:', crossrefUrl)
    
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
    console.log('CrossRef response:', JSON.stringify(data))

    if (!data.message?.items?.[0]) return 0

    const citations = data.message.items[0]['is-referenced-by-count'] || 0
    console.log(`Found ${citations} citations in CrossRef for paper:`, paper.title)
    return citations
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