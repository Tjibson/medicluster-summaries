import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    const searchQuery = encodeURIComponent(`${medicine}[Title/Abstract]`)
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    
    // Step 1: Search for IDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${searchQuery}&retmax=10`
    console.log("Searching PubMed with URL:", searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    const searchText = await searchResponse.text()
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          papers: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Fetch details for found IDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log("Fetching article details with URL:", fetchUrl)
    
    const fetchResponse = await fetch(fetchUrl)
    const articlesXml = await fetchResponse.text()

    // Step 3: Parse articles using Deno DOM
    const parser = new DOMParser()
    const doc = parser.parseFromString(articlesXml, "text/xml")
    const articles = doc?.querySelectorAll("PubmedArticle") || []
    
    const papers = Array.from(articles).map((article) => {
      const title = article.querySelector("ArticleTitle")?.textContent || "No title"
      const abstract = article.querySelector("Abstract AbstractText")?.textContent || "No abstract available"
      const pmid = article.querySelector("PMID")?.textContent || ""

      return {
        id: pmid,
        title: decodeXMLEntities(title),
        abstract: decodeXMLEntities(abstract),
        citations: 0,
        relevance_score: 1
      }
    }).slice(0, 10) // Ensure we only return max 10 results

    console.log(`Found ${papers.length} papers`)

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

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}