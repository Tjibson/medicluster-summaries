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
    const { medicine } = await req.json()
    console.log('Search criteria:', { medicine })

    if (!medicine?.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "No search criteria provided" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const searchQuery = `${medicine}[Title/Abstract]`
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    
    // Step 1: Search for IDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=10`
    const searchResponse = await fetch(searchUrl)
    const searchText = await searchResponse.text()
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Fetch details for found IDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const fetchResponse = await fetch(fetchUrl)
    const articlesXml = await fetchResponse.text()
    
    // Step 3: Parse articles
    const papers = []
    const articleMatches = articlesXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

    for (const articleXml of articleMatches) {
      const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)
      const abstractMatch = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)
      const idMatch = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)

      if (titleMatch) {
        papers.push({
          id: idMatch?.[1] || '',
          title: decodeXMLEntities(titleMatch[1]),
          abstract: abstractMatch ? decodeXMLEntities(abstractMatch[1]) : '',
          citations: 0
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}