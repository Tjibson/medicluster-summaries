import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getCitationCountFromPubMed(pmid: string): Promise<number> {
  try {
    const pubmedUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_citedin&retmode=json&api_key=0e15924868078a8b07c4fc709d8a306e6108`
    console.log('PubMed citation URL:', pubmedUrl)
    
    const response = await fetch(pubmedUrl)
    if (!response.ok) {
      throw new Error(`PubMed API error: ${response.statusText}`)
    }
    
    const text = await response.text()
    console.log('Raw PubMed response:', text)

    // PubMed's elink endpoint returns XML, not JSON despite the retmode parameter
    const citationCount = (text.match(/<Link>.*?<\/Link>/g) || []).length
    console.log(`Found ${citationCount} citations in PubMed response`)
    return citationCount

  } catch (error) {
    console.error('Error fetching PubMed citations:', error)
    return 0
  }
}

async function getCitationCountFromCrossRef(paper: any): Promise<number> {
  try {
    // Build a precise query for CrossRef using multiple fields
    const query = encodeURIComponent(`${paper.title} ${paper.authors[0]} ${paper.year}`)
    const url = `https://api.crossref.org/works?query=${query}&rows=1`
    
    console.log('CrossRef URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YourApp (mailto:your-email@example.com)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('CrossRef response:', data)
    
    if (data.message.items && data.message.items.length > 0) {
      const citations = data.message.items[0]['is-referenced-by-count'] || 0
      console.log(`Found ${citations} citations in CrossRef`)
      return citations
    }
    
    return 0
  } catch (error) {
    console.error('Error fetching CrossRef citations:', error)
    return 0
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { paper } = await req.json()
    console.log('Fetching citations for paper:', paper)

    if (!paper || !paper.id) {
      throw new Error('Invalid paper data')
    }

    // Get citations from both sources
    const [pubmedCitations, crossrefCitations] = await Promise.all([
      getCitationCountFromPubMed(paper.id),
      getCitationCountFromCrossRef(paper)
    ])

    // Use the higher citation count
    const citations = Math.max(pubmedCitations, crossrefCitations)
    console.log(`Final citation count for paper ${paper.id}: ${citations}`)

    return new Response(
      JSON.stringify({ citations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in citation fetch:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch citations' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})