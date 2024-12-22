import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request:', searchParams)

    if (!searchParams) {
      throw new Error('No search parameters provided')
    }

    const query = buildSearchQuery(searchParams)
    console.log('PubMed query:', query)

    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    console.log('Search URL:', searchUrl)

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/xml'
      }
    })
    
    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.statusText}`)
    }

    const searchText = await searchResponse.text()
    console.log('Search response text:', searchText)

    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)

    if (pmids.length === 0) {
      console.log('No results found')
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch details for each paper in batches
    const batchSize = 10
    const papers = []
    
    for (let i = 0; i < pmids.length; i += batchSize) {
      const batch = pmids.slice(i, i + batchSize)
      const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${batch.join(',')}&retmode=xml`
      console.log(`Fetching batch ${i/batchSize + 1}:`, fetchUrl)
      
      try {
        const fetchResponse = await fetch(fetchUrl, {
          headers: {
            'Accept': 'application/xml'
          }
        })
        
        if (!fetchResponse.ok) {
          console.error(`Failed to fetch batch: ${fetchResponse.statusText}`)
          continue
        }
        
        const articleXml = await fetchResponse.text()
        console.log(`Received XML for batch ${i/batchSize + 1}, length:`, articleXml.length)
        
        const articleMatches = articleXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
        console.log(`Found ${articleMatches.length} articles in batch`)
        
        for (const articleXml of articleMatches) {
          try {
            const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
            const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
            const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''
            
            const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
            const authors = Array.from(authorMatches).map(match => {
              const lastName = match[1] || ''
              const foreName = match[2] || ''
              return `${lastName} ${foreName}`.trim()
            })

            const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                           articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                           'Unknown Journal'
            
            const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
            const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

            papers.push({
              id,
              title: decodeXMLEntities(title),
              abstract: decodeXMLEntities(abstract),
              authors,
              journal: decodeXMLEntities(journal),
              year,
              citations: 0
            })
            console.log('Successfully processed article:', id)
          } catch (error) {
            console.error('Error processing article:', error)
            continue
          }
        }
      } catch (error) {
        console.error(`Error processing batch ${i/batchSize + 1}:`, error)
        continue
      }
    }

    console.log(`Successfully processed ${papers.length} papers`)
    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search',
        papers: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function buildSearchQuery(params: any): string {
  const parts = []

  if (params.medicine) {
    parts.push(`(${params.medicine}[Title/Abstract])`)
  }

  if (params.condition) {
    parts.push(`(${params.condition}[Title/Abstract])`)
  }

  if (params.dateRange) {
    parts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    )
  }

  if (params.articleTypes && params.articleTypes.length > 0) {
    const typeQuery = params.articleTypes
      .map((type: string) => `"${type}"[Publication Type]`)
      .join(" OR ")
    parts.push(`(${typeQuery})`)
  }

  return parts.join(" AND ") || "*"
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}