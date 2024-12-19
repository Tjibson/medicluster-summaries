import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { xml2js } from "https://deno.land/x/xml2js@1.0.0/mod.ts"

const API_KEY = '0e15924868078a8b07c4fc709d8a306e6108'

interface SearchParams {
  medicine?: string
  condition?: string
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { medicine, condition, dateRange, journalNames } = await req.json() as SearchParams
    console.log('Search params:', { medicine, condition, dateRange, journalNames })

    // Build search term
    let searchTerms = []
    if (medicine) searchTerms.push(`(${medicine})`)
    if (condition) searchTerms.push(`(${condition})`)
    if (journalNames?.length) {
      searchTerms.push(`(${journalNames.join(' OR ')}[Journal])`)
    }
    if (dateRange) {
      searchTerms.push(`("${dateRange.start}"[Date - Publication] : "${dateRange.end}"[Date - Publication])`)
    }

    const searchTerm = searchTerms.join(' AND ')
    console.log('Final search term:', searchTerm)

    // 1. Use ESearch to get PMIDs
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmode=json&retmax=100${API_KEY ? '&api_key=' + API_KEY : ''}`
    
    console.log('ESearch URL:', esearchUrl)
    const esearchResponse = await fetch(esearchUrl)
    const esearchData = await esearchResponse.json()
    const pmids = esearchData.esearchresult.idlist

    if (!pmids.length) {
      console.log('No PMIDs found')
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Use EFetch to get article details
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml${API_KEY ? '&api_key=' + API_KEY : ''}`
    
    console.log('EFetch URL:', efetchUrl)
    const efetchResponse = await fetch(efetchUrl)
    const xmlData = await efetchResponse.text()

    // 3. Parse XML
    const jsonResult = await xml2js(xmlData, { compact: true })
    console.log('XML parsed successfully')

    // Process articles
    const papers = []
    const pubmedArticles = Array.isArray(jsonResult.PubmedArticleSet.PubmedArticle) 
      ? jsonResult.PubmedArticleSet.PubmedArticle 
      : [jsonResult.PubmedArticleSet.PubmedArticle]

    for (const article of pubmedArticles) {
      try {
        const articleData = article.MedlineCitation.Article
        const pmid = article.MedlineCitation.PMID._text

        // Handle abstract text
        let abstract = ''
        if (articleData.Abstract?.AbstractText) {
          if (typeof articleData.Abstract.AbstractText === 'string') {
            abstract = articleData.Abstract.AbstractText
          } else if (Array.isArray(articleData.Abstract.AbstractText)) {
            abstract = articleData.Abstract.AbstractText.map(section => section._text).join('\n')
          } else {
            abstract = articleData.Abstract.AbstractText._text || ''
          }
        }

        // Handle authors
        const authors = []
        if (articleData.AuthorList?.Author) {
          const authorList = Array.isArray(articleData.AuthorList.Author)
            ? articleData.AuthorList.Author
            : [articleData.AuthorList.Author]

          for (const auth of authorList) {
            const nameParts = []
            if (auth.ForeName?._text) nameParts.push(auth.ForeName._text)
            if (auth.LastName?._text) nameParts.push(auth.LastName._text)
            if (nameParts.length) authors.push(nameParts.join(' '))
          }
        }

        // Get publication year
        const pubDate = articleData.Journal?.JournalIssue?.PubDate
        const year = pubDate?.Year?._text || pubDate?.MedlineDate?._text?.substring(0, 4) || ''

        papers.push({
          id: pmid,
          title: articleData.ArticleTitle._text,
          abstract,
          authors,
          journal: articleData.Journal?.Title?._text || articleData.Journal?.ISOAbbreviation?._text || '',
          year: parseInt(year) || new Date().getFullYear(),
          citations: 0, // We'll need to implement citation count in a separate step
          pdfUrl: null // We'll need to implement PDF URL retrieval in a separate step
        })
      } catch (err) {
        console.error('Error parsing article:', err)
      }
    }

    console.log(`Processed ${papers.length} papers successfully`)
    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve papers from PubMed' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})