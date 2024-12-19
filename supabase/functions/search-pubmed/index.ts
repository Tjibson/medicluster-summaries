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

    // Step 1: Search for papers using PubMed API
    const searchTerm = encodeURIComponent(`${medicine}[Title/Abstract]`)
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${searchTerm}&retmax=10&retmode=json`
    
    console.log("Searching PubMed with URL:", searchUrl)
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()
    const pmids = searchData.esearchresult?.idlist || []
    
    console.log(`Found ${pmids.length} PMIDs:`, pmids)

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Fetch detailed information including abstracts for each paper
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log("Fetching full details with URL:", fetchUrl)
    const fetchResponse = await fetch(fetchUrl)
    const xmlText = await fetchResponse.text()

    // Step 3: Also fetch summary data for basic paper info
    const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`
    console.log("Fetching summaries with URL:", summaryUrl)
    const summaryResponse = await fetch(summaryUrl)
    const summaryData = await summaryResponse.json()

    // Step 4: Extract abstracts from XML
    const abstractMap = new Map()
    const abstractMatches = xmlText.matchAll(/<Abstract>[\s\S]*?<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>[\s\S]*?<\/Abstract>/g)
    
    for (const match of abstractMatches) {
      const pmid = match[0].match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1]
      if (pmid) {
        let abstract = match[1] || ''
        // Clean up the abstract text
        abstract = abstract
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim()
        abstractMap.set(pmid, abstract)
      }
    }

    // Step 5: Process and format the papers
    const papers = pmids
      .map(pmid => {
        const paper = summaryData.result[pmid]
        if (!paper) return null

        // Extract and clean the date
        const pubDate = paper.pubdate || ''
        const yearMatch = pubDate.match(/\d{4}/)
        const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()

        // Extract authors
        const authors = paper.authors?.map((author: any) => {
          const name = author.name || ''
          return name.replace(/^([^,]+),\s*(.+)$/, '$2 $1').trim()
        }) || []

        // Clean the title
        const title = (paper.title || '')
          .replace(/\[.*?\]/g, '')
          .replace(/\.$/, '')
          .trim()

        // Get abstract from our XML parsing
        const abstract = abstractMap.get(pmid) || 'Abstract not available'

        return {
          id: pmid,
          title: title || 'No title available',
          authors,
          journal: paper.fulljournalname || paper.source || 'Unknown Journal',
          year,
          abstract,
          citations: 0,
          relevance_score: 100
        }
      })
      .filter(Boolean)

    console.log(`Successfully processed ${papers.length} papers with abstracts`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        papers 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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