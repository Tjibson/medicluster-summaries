import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { parseXML, extractArticleData } from './utils/xmlParser.ts'
import { getCitationCount } from './utils/citations.ts'
import { calculateRelevanceScore } from './utils/scoring.ts'
import { type Paper } from './types'

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
    const jsonResult = await parseXML(xmlData)
    const pubmedArticles = jsonResult.PubmedArticleSet?.PubmedArticle || []
    
    // Process articles and fetch citations concurrently
    const articles = await Promise.all(pubmedArticles.map(async (article: any) => {
      const paperData = extractArticleData(article)
      paperData.citations = await getCitationCount(paperData.id)
      paperData.relevance_score = calculateRelevanceScore(paperData, term)
      return paperData
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