import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const NCBI_EMAIL = 'tjibbe-beckers@live.nl'
const NCBI_API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'
const RESULTS_PER_PAGE = 100

async function getCitationCount(pmid: string): Promise<number> {
  const elinkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&linkname=pubmed_pubmed_citedin&id=${pmid}&retmode=json&api_key=${NCBI_API_KEY}`
  
  try {
    console.log(`Fetching citations for PMID: ${pmid}`)
    const response = await fetch(elinkUrl)
    const data = await response.json()

    const linksets = data.linksets || []
    if (linksets.length === 0) return 0

    const linksetdbs = linksets[0].linksetdbs || []
    const citedInDb = linksetdbs.find((db: any) => db.linkname === 'pubmed_pubmed_citedin')
    if (!citedInDb || !citedInDb.links) return 0

    console.log(`Found ${citedInDb.links.length} citations for PMID: ${pmid}`)
    return citedInDb.links.length
  } catch (error) {
    console.error(`Error fetching citations for PMID ${pmid}:`, error)
    return 0
  }
}

// Simple XML parser function
function extractFromXml(xml: string, tag: string): string[] {
  const results: string[] = []
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gs')
  let match
  
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim())
  }
  
  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { term, dateRange, journalNames } = await req.json()
    console.log('Search request:', { term, dateRange, journalNames })

    if (!term) {
      throw new Error('Search term is required')
    }

    let searchQuery = `${encodeURIComponent(term)} AND (Clinical Trial[Publication Type] OR Trial[Title/Abstract] OR Study[Title/Abstract])`
    
    if (dateRange) {
      searchQuery += ` AND ("${dateRange.start}"[Date - Publication] : "${dateRange.end}"[Date - Publication])`
    }
    if (journalNames && journalNames.length > 0) {
      const journalFilter = journalNames.map(j => `"${j}"[Journal]`).join(' OR ')
      searchQuery += ` AND (${journalFilter})`
    }

    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchQuery}&retmode=json&retmax=${RESULTS_PER_PAGE}&email=${NCBI_EMAIL}&api_key=${NCBI_API_KEY}&sort=relevance`
    console.log('ESearch URL:', esearchUrl)

    const esearchResponse = await fetch(esearchUrl)
    const esearchData = await esearchResponse.json()
    const { count, idlist: pmids } = esearchData.esearchresult
    console.log('Found PMIDs:', pmids.length, 'Total results:', count)

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ 
          articles: [],
          pagination: {
            total: 0,
            page: 1,
            totalPages: 0,
            hasMore: false
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&email=${NCBI_EMAIL}&api_key=${NCBI_API_KEY}`
    console.log('EFetch URL:', efetchUrl)

    const efetchResponse = await fetch(efetchUrl)
    const xmlData = await efetchResponse.text()

    // Process articles and fetch citations concurrently
    const articles = await Promise.all(pmids.map(async (pmid) => {
      // Extract article data using regex
      const articleXml = xmlData.match(new RegExp(`<PubmedArticle>.*?<PMID.*?>${pmid}</PMID>.*?</PubmedArticle>`, 's'))?.[0] || ''
      
      if (!articleXml) {
        console.error(`No XML found for PMID: ${pmid}`)
        return null
      }

      const title = extractFromXml(articleXml, 'ArticleTitle')[0] || 'No title available'
      const abstract = extractFromXml(articleXml, 'Abstract')[0] || 'No abstract available'
      const authors = extractFromXml(articleXml, 'LastName').map((lastName, i) => {
        const foreName = extractFromXml(articleXml, 'ForeName')[i] || ''
        return `${foreName} ${lastName}`.trim()
      })
      const journal = extractFromXml(articleXml, 'Title')[0] || extractFromXml(articleXml, 'ISOAbbreviation')[0] || 'Unknown Journal'
      const yearMatch = articleXml.match(/<Year>(\d{4})<\/Year>/)
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

      // Fetch citation count
      const citations = await getCitationCount(pmid)

      return {
        id: pmid,
        title,
        abstract,
        authors,
        journal,
        year,
        citations,
        relevance_score: 0
      }
    }))

    // Filter out null articles and sort by citations
    const validArticles = articles.filter((article): article is NonNullable<typeof article> => article !== null)
    
    // Calculate relevance scores and sort
    const searchTermLower = term.toLowerCase()
    const articlesWithScores = validArticles.map(article => {
      let relevanceScore = 0
      
      if (article.title.toLowerCase().includes(searchTermLower)) {
        relevanceScore += 50
      }
      if (article.abstract.toLowerCase().includes(searchTermLower)) {
        relevanceScore += 30
      }
      if (article.title.toLowerCase().includes('trial') || 
          article.abstract.toLowerCase().includes('trial')) {
        relevanceScore += 20
      }
      relevanceScore += Math.min(article.citations * 2, 100)
      
      return {
        ...article,
        relevance_score: relevanceScore
      }
    })

    // Sort by citations first, then by relevance score
    const sortedArticles = articlesWithScores.sort((a, b) => {
      const citationDiff = b.citations - a.citations
      if (citationDiff !== 0) return citationDiff
      return b.relevance_score - a.relevance_score
    })

    console.log('Processed and sorted articles:', sortedArticles.map(a => ({
      id: a.id,
      title: a.title.substring(0, 50) + '...',
      citations: a.citations,
      relevance_score: a.relevance_score
    })))

    return new Response(
      JSON.stringify({
        articles: sortedArticles,
        pagination: {
          total: count,
          page: 1,
          totalPages: Math.ceil(count / RESULTS_PER_PAGE),
          hasMore: count > RESULTS_PER_PAGE
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        articles: [],
        pagination: {
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})