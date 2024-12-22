import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { extractStructuredAbstract } from './utils/parsers/abstractParser.ts'
import { extractArticleData, parseXML } from './utils/xmlParser.ts'

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
          const parsedData = await parseXML(articleXml)
          const articleData = extractArticleData(parsedData)
          
          // Use the new structured abstract extraction
          articleData.abstract = extractStructuredAbstract(articleXml)
          
          articles.push(articleData)
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