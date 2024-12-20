import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import axiod from 'https://deno.land/x/axiod@0.26.2/mod.ts'
import { parseStringPromise } from 'https://esm.sh/xml2js@0.4.23'

const NCBI_EMAIL = 'tjibbe-beckers@live.nl'
const NCBI_API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'
const RESULTS_PER_PAGE = 100 // Increased from 25 to ensure we capture important trials

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

    // Enhanced search query to better capture clinical trials
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

    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&email=${NCBI_EMAIL}&api_key=${NCBI_API_KEY}`
    console.log('EFetch URL:', efetchUrl)

    const efetchResponse = await axiod.get(efetchUrl)
    const xmlData = efetchResponse.data

    const parserOptions = { explicitArray: false, mergeAttrs: true }
    const parsedXml = await parseStringPromise(xmlData, parserOptions)
    const pubmedArticles = parsedXml.PubmedArticleSet?.PubmedArticle || []

    const articles = pubmedArticles.map(article => {
      const medlineCitation = article.MedlineCitation
      const articleData = medlineCitation.Article
      
      // Enhanced title handling
      let articleTitle = ''
      if (typeof articleData.ArticleTitle === 'string') {
        articleTitle = articleData.ArticleTitle
      } else if (articleData.ArticleTitle && typeof articleData.ArticleTitle === 'object') {
        articleTitle = articleData.ArticleTitle._ || articleData.ArticleTitle.toString() || ''
      }

      // Enhanced abstract handling
      let abstractText = ''
      if (articleData.Abstract && articleData.Abstract.AbstractText) {
        const abstractData = articleData.Abstract.AbstractText
        if (typeof abstractData === 'string') {
          abstractText = abstractData
        } else if (Array.isArray(abstractData)) {
          abstractText = abstractData.map(section => {
            return typeof section === 'string' ? section : section._ || ''
          }).join('\n')
        } else if (typeof abstractData === 'object') {
          abstractText = abstractData._ || abstractData.toString() || ''
        }
      }

      let authors: string[] = []
      if (articleData.AuthorList && articleData.AuthorList.Author) {
        let authorList = articleData.AuthorList.Author
        if (!Array.isArray(authorList)) {
          authorList = [authorList]
        }
        authors = authorList.map((auth: any) => {
          const firstName = auth.ForeName || ''
          const lastName = auth.LastName || ''
          return [firstName, lastName].filter(Boolean).join(' ')
        }).filter(name => name.length > 0)
      }

      const currentYear = new Date().getFullYear()
      let publicationYear = currentYear
      let publishedDate = null

      try {
        if (articleData.Journal?.JournalIssue?.PubDate) {
          const pubDate = articleData.Journal.JournalIssue.PubDate
          const year = pubDate.Year || (pubDate.MedlineDate && pubDate.MedlineDate.match(/\d{4}/)?.[0])
          if (year) {
            publicationYear = parseInt(year)
            const month = pubDate.Month || '01'
            const day = pubDate.Day || '01'
            publishedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
      } catch (error) {
        console.error('Error extracting publication date:', error)
      }

      // Calculate relevance score based on title and abstract matches
      const searchTermLower = term.toLowerCase()
      const titleLower = articleTitle.toLowerCase()
      const abstractLower = abstractText.toLowerCase()
      
      let relevanceScore = 0
      // Title matches are worth more
      if (titleLower.includes(searchTermLower)) {
        relevanceScore += 50
      }
      if (abstractLower.includes(searchTermLower)) {
        relevanceScore += 30
      }
      // Clinical trial mentions boost score
      if (titleLower.includes('trial') || abstractLower.includes('trial')) {
        relevanceScore += 20
      }
      // Recent papers get a small boost
      const yearBoost = Math.max(0, 10 - (currentYear - publicationYear))
      relevanceScore += yearBoost

      return {
        id: medlineCitation.PMID,
        title: articleTitle,
        abstract: abstractText,
        authors,
        journal: articleData.Journal?.Title || articleData.Journal?.ISOAbbreviation || 'Unknown Journal',
        year: publicationYear,
        publishedDate,
        citations: 0,
        relevance_score: relevanceScore
      }
    })

    // Sort articles by relevance score
    const sortedArticles = articles.sort((a, b) => b.relevance_score - a.relevance_score)

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