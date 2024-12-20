import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as xml2js from 'https://esm.sh/xml2js@0.4.23'
import { extractTitle, extractAbstract, extractAuthors, extractJournalInfo } from './utils/articleParser.ts'
import { calculateRelevanceScore } from './utils/scoring.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchQuery}&retmode=json&retmax=100&sort=relevance`
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

    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('EFetch URL:', efetchUrl)

    const efetchResponse = await fetch(efetchUrl)
    const xmlData = await efetchResponse.text()
    
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      mergeAttrs: true,
      valueProcessors: [parseFloat]
    })
    const jsonResult = await parser.parseStringPromise(xmlData)
    const pubmedArticles = jsonResult.PubmedArticleSet?.PubmedArticle || []
    
    const articles = await Promise.all(pubmedArticles.map(async (article: any) => {
      const medlineCitation = article.MedlineCitation
      const articleData = medlineCitation.Article
      
      // Extract article data using our utility functions
      const title = extractTitle(articleData)
      console.log('Extracted title:', title)
      
      const abstract = extractAbstract(articleData)
      const authors = extractAuthors(articleData)
      const { journal, year } = extractJournalInfo(articleData)
      
      // Extract PMID
      const pmid = medlineCitation.PMID?._ || medlineCitation.PMID || ''

      // Calculate relevance score
      const relevance_score = calculateRelevanceScore(title, term)
      
      return {
        id: pmid,
        title,
        abstract,
        authors,
        journal,
        year,
        citations: 0,
        relevance_score
      }
    }))

    console.log('Processed articles with titles:', articles.map(a => ({ id: a.id, title: a.title })))

    return new Response(
      JSON.stringify({
        articles,
        pagination: {
          total: count,
          page: 1,
          totalPages: Math.ceil(count / 100),
          hasMore: count > 100
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