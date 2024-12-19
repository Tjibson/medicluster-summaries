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
    const searchCriteria = await req.json()
    console.log('Search criteria:', searchCriteria)

    let searchQuery = ''
    const searchTerms: string[] = []
    
    if (searchCriteria.disease) searchTerms.push(`"${searchCriteria.disease}"[Title/Abstract]`)
    if (searchCriteria.medicine) searchTerms.push(`"${searchCriteria.medicine}"[Title/Abstract]`)
    if (searchCriteria.working_mechanism) searchTerms.push(`"${searchCriteria.working_mechanism}"[Title/Abstract]`)
    if (searchCriteria.population) searchTerms.push(`"${searchCriteria.population}"[Title/Abstract]`)
    if (searchCriteria.trial_type) searchTerms.push(`"${searchCriteria.trial_type}"[Publication Type]`)
    if (searchCriteria.journal) searchTerms.push(`"${searchCriteria.journal}"[Journal]`)
    
    searchQuery = searchTerms.join(' AND ')
    
    // If no specific criteria provided, search for recent medical research papers
    if (!searchQuery.trim()) {
      const lastYear = new Date().getFullYear() - 1
      searchQuery = `"${lastYear}/01/01"[Date - Publication] : "${lastYear}/12/31"[Date - Publication] AND "clinical trial"[Publication Type]`
    }

    console.log('Final search query:', searchQuery)

    // Fetch from PubMed
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=5&usehistory=y`
    
    console.log('Fetching from PubMed:', searchUrl)
    const searchResponse = await fetch(searchUrl)
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
    const fetchResponse = await fetch(fetchUrl)
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
    }

    const articlesXml = await fetchResponse.text()
    
    // Parse articles
    const papers = []
    const articleMatches = articlesXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

    for (const articleXml of articleMatches) {
      try {
        // Extract PMID
        const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
        
        // Extract title
        const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
        
        // Extract authors with improved parsing
        const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
        const authors = Array.from(authorMatches).map(match => {
          const lastName = match[1] || ''
          const foreName = match[2] || ''
          return `${foreName} ${lastName}`.trim()
        })

        // Extract journal info
        const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                       articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                       'Unknown Journal'
        
        // Extract publication year
        const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
        const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

        // Extract and clean abstract
        const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''

        // Extract references count
        const referencesCount = (articleXml.match(/<Reference>/g) || []).length

        papers.push({
          id,
          title: decodeXMLEntities(title),
          authors,
          journal: decodeXMLEntities(journal),
          year,
          abstract: decodeXMLEntities(abstract),
          citations: referencesCount, // Using reference count as a basic citation metric
          relevance_score: 100 // Default relevance score
        })
      } catch (error) {
        console.error('Error processing article:', error)
        continue
      }
    }

    console.log(`Successfully parsed ${papers.length} papers`)

    return new Response(
      JSON.stringify({ success: true, papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

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