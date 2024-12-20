import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NCBI_API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'

async function getCitationCount(pmid: string): Promise<number> {
  const elinkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&linkname=pubmed_pubmed_citedin&id=${pmid}&retmode=json&api_key=${NCBI_API_KEY}`
  
  try {
    console.log(`Fetching citations for PMID: ${pmid}`)
    const response = await fetch(elinkUrl)
    const data = await response.json()

    const linksets = data.linksets || []
    if (linksets.length === 0) return 0

    const linksetdbs = linksets[0].linksetdbs || []
    const citedInDb = linksetdbs.find((db: any) => db.linkname === 'pubmed_pubmed_citedin')
    if (!citedInDb || !citedInDb.links) return 0

    console.log(`Found ${citedInDb.links.length} citations for PMID: ${pmid}`)
    return citedInDb.links.length
  } catch (error) {
    console.error(`Error fetching citations for PMID ${pmid}:`, error)
    return 0
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { pmids } = await req.json()
    
    if (!Array.isArray(pmids)) {
      throw new Error('PMIDs must be provided as an array')
    }

    console.log('Fetching citations for PMIDs:', pmids)
    
    const citationCounts = await Promise.all(
      pmids.map(async (pmid) => ({
        pmid,
        citations: await getCitationCount(pmid)
      }))
    )

    return new Response(
      JSON.stringify({ citations: citationCounts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-citations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})