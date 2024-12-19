import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { xml2js } from 'https://esm.sh/xml2js@0.4.23'
import axiod from 'https://deno.land/x/axiod@0.26.2/mod.ts'

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true })

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
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchQuery}&retmode=json&retmax=100`
    console.log('ESearch URL:', esearchUrl)

    const esearchResponse = await axiod.get(esearchUrl)
    const pmids = esearchResponse.data.esearchresult.idlist
    console.log('Found PMIDs:', pmids.length)

    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ articles: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Use EFetch to get article details
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('EFetch URL:', efetchUrl)

    const efetchResponse = await axiod.get(efetchUrl)
    const xmlData = efetchResponse.data

    // 3. Parse XML response
    const jsonResult = await parser.parseStringPromise(xmlData)
    const pubmedArticles = jsonResult.PubmedArticleSet.PubmedArticle || []
    console.log('Parsing articles:', pubmedArticles.length)

    const articles = pubmedArticles.map(article => {
      try {
        const articleData = article.MedlineCitation.Article
        const articleTitle = articleData.ArticleTitle

        // Parse abstract
        let abstractText = ''
        if (articleData.Abstract && articleData.Abstract.AbstractText) {
          if (typeof articleData.Abstract.AbstractText === 'string') {
            abstractText = articleData.Abstract.AbstractText
          } else if (Array.isArray(articleData.Abstract.AbstractText)) {
            abstractText = articleData.Abstract.AbstractText.join('\n')
          } else {
            abstractText = articleData.Abstract.AbstractText._ || ''
          }
        }

        // Parse authors
        let authors = []
        if (articleData.AuthorList && articleData.AuthorList.Author) {
          const authorList = Array.isArray(articleData.AuthorList.Author)
            ? articleData.AuthorList.Author
            : [articleData.AuthorList.Author]

          authors = authorList.map(auth => {
            let nameParts = []
            if (auth.ForeName) nameParts.push(auth.ForeName)
            if (auth.LastName) nameParts.push(auth.LastName)
            return nameParts.join(' ')
          })
        }

        // Parse journal info
        const journalInfo = articleData.Journal ? {
          title: articleData.Journal.Title || '',
          isoAbbreviation: articleData.Journal.ISOAbbreviation || '',
          issn: articleData.Journal.ISSN || '',
          volume: articleData.Journal.JournalIssue?.Volume || '',
          issue: articleData.Journal.JournalIssue?.Issue || '',
          pubDate: articleData.Journal.JournalIssue?.PubDate || {}
        } : {}

        return {
          pmid: article.MedlineCitation.PMID._,
          title: articleTitle,
          abstract: abstractText,
          authors,
          journal: journalInfo
        }
      } catch (err) {
        console.error("Error parsing article:", err)
        return null
      }
    }).filter(Boolean)

    console.log('Returning articles:', articles.length)

    return new Response(
      JSON.stringify({ articles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})