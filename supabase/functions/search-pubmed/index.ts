import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    console.log("Received request data:", requestData)
    const { medicine } = requestData

    if (!medicine?.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No search criteria provided" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Step 1: Search for PMIDs using E-utilities
    const term = encodeURIComponent(`${medicine}[Title/Abstract]`)
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=10&sort=relevance`
    console.log("Searching PubMed with URL:", searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    const searchText = await searchResponse.text()
    
    // Extract PMIDs using regex
    const pmids = Array.from(searchText.matchAll(/<Id>(\d+)<\/Id>/g)).map(match => match[1])
    console.log(`Found ${pmids.length} PMIDs:`, pmids)

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Fetch detailed information for each PMID
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`
    console.log("Fetching summaries with URL:", summaryUrl)
    
    const summaryResponse = await fetch(summaryUrl)
    const summaryData = await summaryResponse.json()
    
    // Process the papers
    const papers = pmids.map(pmid => {
      const paper = summaryData.result[pmid]
      if (!paper) return null

      return {
        id: pmid,
        title: paper.title || 'No title available',
        authors: paper.authors?.map((author: any) => author.name) || [],
        journal: paper.fulljournalname || paper.source || 'Unknown Journal',
        year: parseInt(paper.pubdate) || new Date().getFullYear(),
        abstract: paper.abstract || 'Abstract not available',
        citations: 0,
        relevance_score: 100 // Default score for now
      }
    }).filter(Boolean)

    console.log(`Successfully processed ${papers.length} papers`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        papers 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})