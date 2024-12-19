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
    console.log('Search query:', searchQuery)

    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000) // 25 second timeout

    try {
      const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=10&usehistory=y`
      console.log('Fetching from PubMed:', searchUrl)
      
      const searchResponse = await fetch(searchUrl, { signal: controller.signal })
      if (!searchResponse.ok) {
        throw new Error(`PubMed search failed: ${searchResponse.statusText}`)
      }
      
      const searchText = await searchResponse.text()
      const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
      
      if (pmids.length === 0) {
        console.log('No results found')
        return new Response(
          JSON.stringify({ success: true, papers: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Found ${pmids.length} PMIDs, fetching details...`)
      const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
      const fetchResponse = await fetch(fetchUrl, { signal: controller.signal })
      
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
      }

      const articlesXml = await fetchResponse.text()
      const papers = []
      const articleMatches = articlesXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

      for (const articleXml of articleMatches) {
        try {
          const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
          const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
          const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''

          papers.push({
            id,
            title: decodeXMLEntities(title),
            abstract: decodeXMLEntities(abstract),
            citations: 0
          })
        } catch (error) {
          console.error('Error processing article:', error)
          continue
        }
      }

      clearTimeout(timeout)
      console.log(`Successfully parsed ${papers.length} papers`)

      return new Response(
        JSON.stringify({ success: true, papers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      clearTimeout(timeout)
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, message: "Request timed out" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 408 }
        )
      }
      throw error
    }

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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