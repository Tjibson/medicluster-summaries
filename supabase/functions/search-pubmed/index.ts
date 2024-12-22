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

    const papers = await searchPubMed(query)
    console.log(`Found ${papers.length} papers`)

    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Search error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search' 
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

async function searchPubMed(query: string): Promise<any[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  const retMax = 100
  
  try {
    console.log('Executing PubMed search with query:', query)
    
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${retMax}&usehistory=y`
    console.log('Search URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    console.log('Search response:', searchText)
    
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)
    
    if (pmids.length === 0) {
      console.log('No results found')
      return []
    }

    const batchSize = 10
    const articles = []
    
    for (let i = 0; i < pmids.length; i += batchSize) {
      const batch = pmids.slice(i, i + batchSize)
      const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${batch.join(',')}&retmode=xml`
      
      const fetchResponse = await fetch(fetchUrl)
      if (!fetchResponse.ok) {
        console.error(`Failed to fetch batch: ${fetchResponse.statusText}`)
        continue
      }
      
      const articleXml = await fetchResponse.text()
      const articleMatches = articleXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
      
      for (const articleXml of articleMatches) {
        try {
          const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
          const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
          
          // Enhanced abstract section handling
          let abstract = extractStructuredAbstract(articleXml)
          
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

          articles.push({
            id,
            title: decodeXMLEntities(title),
            authors,
            journal: decodeXMLEntities(journal),
            year,
            abstract: decodeXMLEntities(abstract),
            citations: 0
          })
        } catch (error) {
          console.error('Error processing article:', error)
          continue
        }
      }
    }
    
    return articles
    
  } catch (error) {
    console.error('Error in searchPubMed:', error)
    throw error
  }
}

function extractStructuredAbstract(articleXml: string): string {
  // First, try to get the complete Abstract section
  const abstractSection = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/)?.[1] || ''
  
  if (!abstractSection) {
    return 'No abstract available'
  }

  // Try to find all AbstractText elements with their sections
  const abstractParts: string[] = []
  const abstractTextRegex = /<AbstractText(?:\s+Label="([^"]*)")?\s*(?:NlmCategory="([^"]*)")?\s*>([\s\S]*?)<\/AbstractText>/g
  
  let match
  let hasStructuredSections = false
  
  while ((match = abstractTextRegex.exec(abstractSection)) !== null) {
    const [_, label, category, content] = match
    if (label || category) {
      hasStructuredSections = true
      const sectionTitle = label || category || ''
      abstractParts.push(`${sectionTitle}: ${content.trim()}`)
    } else {
      abstractParts.push(content.trim())
    }
  }

  // If no structured sections were found, try simple extraction
  if (!hasStructuredSections) {
    const simpleAbstract = articleXml.match(/<AbstractText>([\s\S]*?)<\/AbstractText>/)?.[1]
    if (simpleAbstract) {
      return simpleAbstract.trim()
    }
  }

  // Join all parts with proper spacing and formatting
  return abstractParts.join('\n\n')
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#xD;/g, '\r')
    .replace(/&#xA;/g, '\n')
}