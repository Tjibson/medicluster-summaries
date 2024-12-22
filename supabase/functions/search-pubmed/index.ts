import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { type SearchParameters } from './types.ts'

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

    // Construct PubMed search query
    const query = buildSearchQuery(searchParams)
    console.log('PubMed query:', query)

    // Call PubMed API
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
        status: 500
      }
    )
  }
})

function buildSearchQuery(params: SearchParameters): string {
  const parts = []

  if (params.medicine) {
    parts.push(`"${params.medicine}"[Title/Abstract]`)
  }

  if (params.condition) {
    parts.push(`"${params.condition}"[Title/Abstract]`)
  }

  if (params.dateRange) {
    parts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    )
  }

  if (params.articleTypes && params.articleTypes.length > 0) {
    const typeQuery = params.articleTypes
      .map(type => `"${type}"[Publication Type]`)
      .join(" OR ")
    parts.push(`(${typeQuery})`)
  }

  return parts.join(" AND ")
}

async function searchPubMed(query: string): Promise<any[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  
  try {
    // Search for IDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&format=json`
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) throw new Error('PubMed search failed')
    
    const searchData = await searchResponse.json()
    const ids = searchData.esearchresult.idlist

    if (ids.length === 0) return []

    // Fetch details
    const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
    const summaryResponse = await fetch(summaryUrl)
    if (!summaryResponse.ok) throw new Error('Failed to fetch paper details')
    
    const summaryData = await summaryResponse.json()
    
    return Object.values(summaryData.result).filter(paper => paper.uid).map((paper: any) => ({
      id: paper.uid,
      title: paper.title,
      authors: paper.authors?.map((author: any) => author.name) || [],
      journal: paper.fulljournalname || paper.source,
      year: parseInt(paper.pubdate),
      abstract: paper.abstract || ''
    }))
  } catch (error) {
    console.error('PubMed API error:', error)
    throw error
  }
}