import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as xml2js from 'https://esm.sh/xml2js@0.4.23'

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  citations: number
  relevance_score: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NCBI_EMAIL = 'tjibbe-beckers@live.nl'
const NCBI_API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'
const RESULTS_PER_PAGE = 100

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
    
    // Parse XML to JSON using xml2js
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      mergeAttrs: true,
      valueProcessors: [parseFloat]
    })
    const jsonResult = await parser.parseStringPromise(xmlData)
    const pubmedArticles = jsonResult.PubmedArticleSet?.PubmedArticle || []
    
    // Process articles and fetch citations concurrently
    const articles = await Promise.all(pubmedArticles.map(async (article: any) => {
      const medlineCitation = article.MedlineCitation
      const articleData = medlineCitation.Article
      
      // Extract title
      const title = articleData.ArticleTitle || 'No title available'
      
      // Extract abstract
      let abstract = 'No abstract available'
      if (articleData.Abstract?.AbstractText) {
        if (typeof articleData.Abstract.AbstractText === 'string') {
          abstract = articleData.Abstract.AbstractText
        } else if (Array.isArray(articleData.Abstract.AbstractText)) {
          abstract = articleData.Abstract.AbstractText.join('\n')
        } else if (articleData.Abstract.AbstractText._) {
          abstract = articleData.Abstract.AbstractText._
        }
      }
      
      // Extract authors
      let authors: string[] = []
      if (articleData.AuthorList?.Author) {
        const authorList = Array.isArray(articleData.AuthorList.Author) 
          ? articleData.AuthorList.Author 
          : [articleData.AuthorList.Author]
        
        authors = authorList.map((auth: any) => {
          const firstName = auth.ForeName || ''
          const lastName = auth.LastName || ''
          return [firstName, lastName].filter(Boolean).join(' ')
        })
      }
      
      // Extract journal and year
      const journal = articleData.Journal?.Title || 
                     articleData.Journal?.ISOAbbreviation || 
                     'Unknown Journal'
      
      const year = articleData.Journal?.JournalIssue?.PubDate?.Year || 
                   new Date().getFullYear()
      
      // Extract PMID
      const pmid = medlineCitation.PMID?._ || medlineCitation.PMID || ''

      // Fetch citations
      const elinkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&linkname=pubmed_pubmed_citedin&id=${pmid}&retmode=json&api_key=${NCBI_API_KEY}`
      const elinkResponse = await fetch(elinkUrl)
      const elinkData = await elinkResponse.json()
      const citations = elinkData.linksets?.[0]?.linksetdbs?.[0]?.links?.length || 0

      // Calculate relevance score
      const relevanceScore = calculateRelevanceScore(title, abstract, term)
      
      return {
        id: pmid,
        title,
        abstract,
        authors,
        journal,
        year: parseInt(year),
        citations,
        relevance_score: relevanceScore
      }
    }))

    // Sort by citations first, then by relevance score
    const sortedArticles = articles.sort((a, b) => {
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

function calculateRelevanceScore(title: string, abstract: string, searchTerm: string): number {
  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  
  // Title matches are worth more
  if (title.toLowerCase().includes(searchTermLower)) {
    score += 50
  }
  
  // Abstract matches
  if (abstract.toLowerCase().includes(searchTermLower)) {
    score += 30
  }
  
  // Clinical trial mentions boost score
  if (title.toLowerCase().includes('trial') || 
      abstract.toLowerCase().includes('trial')) {
    score += 20
  }
  
  return score
}