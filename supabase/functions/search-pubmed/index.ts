import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import axiod from 'https://deno.land/x/axiod@0.26.2/mod.ts'
import { parseStringPromise } from 'https://esm.sh/xml2js@0.4.23'

const NCBI_EMAIL = 'tjibbe-beckers@live.nl'
const NCBI_API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'
const RESULTS_PER_PAGE = 25

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { term, dateRange, journalNames } = await req.json()
    console.log('Search request:', { term, dateRange, journalNames })

    if (!term) {
      throw new Error('Search term is required')
    }

    // Build search query with date range and journal filters
    let searchQuery = encodeURIComponent(term)
    if (dateRange) {
      searchQuery += ` AND ("${dateRange.start}"[Date - Publication] : "${dateRange.end}"[Date - Publication])`
    }
    if (journalNames && journalNames.length > 0) {
      const journalFilter = journalNames.map(j => `"${j}"[Journal]`).join(' OR ')
      searchQuery += ` AND (${journalFilter})`
    }

    // 1. Use ESearch to get PMIDs
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchQuery}&retmode=json&retmax=${RESULTS_PER_PAGE}&email=${NCBI_EMAIL}&api_key=${NCBI_API_KEY}`
    console.log('ESearch URL:', esearchUrl)

    const esearchResponse = await axiod.get(esearchUrl)
    const { count, idlist: pmids } = esearchResponse.data.esearchresult
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

    // 2. Use EFetch to get article details
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&email=${NCBI_EMAIL}&api_key=${NCBI_API_KEY}`
    console.log('EFetch URL:', efetchUrl)

    const efetchResponse = await axiod.get(efetchUrl)
    const xmlData = efetchResponse.data

    // Parse XML using xml2js
    const parserOptions = { explicitArray: false, mergeAttrs: true }
    const parsedXml = await parseStringPromise(xmlData, parserOptions)
    const pubmedArticles = parsedXml.PubmedArticleSet?.PubmedArticle || []

    // Transform parsed XML to articles
    const articles = pubmedArticles.map(article => {
      const medlineCitation = article.MedlineCitation
      const articleData = medlineCitation.Article
      const articleTitle = articleData.ArticleTitle || ''

      // Handle abstract text with different possible formats
      let abstractText = ''
      if (articleData.Abstract && articleData.Abstract.AbstractText) {
        if (typeof articleData.Abstract.AbstractText === 'string') {
          abstractText = articleData.Abstract.AbstractText
        } else if (Array.isArray(articleData.Abstract.AbstractText)) {
          abstractText = articleData.Abstract.AbstractText.join('\n')
        } else if (articleData.Abstract.AbstractText._) {
          abstractText = articleData.Abstract.AbstractText._
        }
      }

      // Handle both single author and multiple authors cases
      let authors: string[] = []
      if (articleData.AuthorList && articleData.AuthorList.Author) {
        let authorList = articleData.AuthorList.Author
        
        // If authorList is not an array, wrap it in an array
        if (!Array.isArray(authorList)) {
          authorList = [authorList]
        }

        authors = authorList.map((auth: any) => {
          const firstName = auth.ForeName || ''
          const lastName = auth.LastName || ''
          return [firstName, lastName].filter(Boolean).join(' ')
        }).filter(name => name.length > 0)
      }

      // Get current year as default
      const currentYear = new Date().getFullYear()

      return {
        id: medlineCitation.PMID,
        title: articleTitle,
        abstract: abstractText,
        authors,
        journal: articleData.Journal?.Title || articleData.Journal?.ISOAbbreviation || 'Unknown Journal',
        year: currentYear,
        citations: 0
      }
    })

    const totalPages = Math.ceil(count / RESULTS_PER_PAGE)

    return new Response(
      JSON.stringify({
        articles,
        pagination: {
          total: count,
          page: 1,
          totalPages,
          hasMore: totalPages > 1
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