import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as xml2js from 'https://esm.sh/xml2js@0.4.23'
import { buildSearchQuery } from './utils/queryBuilder.ts'
import { parseArticles } from './utils/articleParser.ts'
import { calculateRelevanceScore } from './utils/scoring.ts'
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
    console.log('Search request:', { searchParams })

    // Step 1: Construct search query with Boolean logic
    const query = buildSearchQuery(searchParams)
    console.log("Constructed PubMed query:", query)

    // Step 2: Fetch article IDs from PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.text()
    
    const pmids = searchData.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    
    if (pmids.length === 0) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Fetch full article details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const fetchResponse = await fetch(fetchUrl)
    const xmlData = await fetchResponse.text()
    
    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true })
    const result = await parser.parseStringPromise(xmlData)
    
    // Step 4: Parse and score articles
    const articles = Array.isArray(result.PubmedArticleSet.PubmedArticle) 
      ? result.PubmedArticleSet.PubmedArticle 
      : [result.PubmedArticleSet.PubmedArticle]

    const papers = articles.map(article => {
      const medlineCitation = article.MedlineCitation
      const articleData = medlineCitation.Article
      
      const title = typeof articleData.ArticleTitle === 'string' 
        ? articleData.ArticleTitle 
        : articleData.ArticleTitle?._ || 'No title available'
      
      const abstract = articleData.Abstract?.AbstractText || 'No abstract available'
      const journal = articleData.Journal?.Title || 'Unknown Journal'
      const year = parseInt(articleData.Journal?.JournalIssue?.PubDate?.Year) || new Date().getFullYear()
      const pmid = medlineCitation.PMID?._ || medlineCitation.PMID
      
      // Extract authors
      const authorList = articleData.AuthorList?.Author || []
      const authors = (Array.isArray(authorList) ? authorList : [authorList])
        .map((author: any) => {
          const lastName = author.LastName || ''
          const foreName = author.ForeName || ''
          return `${lastName} ${foreName}`.trim()
        })
        .filter(Boolean)

      // Calculate relevance score
      const relevance_score = calculateRelevanceScore(title, String(abstract), journal, searchParams)

      return {
        id: pmid,
        title,
        abstract: String(abstract), // Ensure abstract is always a string
        authors,
        journal,
        year,
        citations: 0,
        relevance_score
      }
    })

    // Step 5: Sort by relevance score and return
    const sortedPapers = papers.sort((a, b) => b.relevance_score - a.relevance_score)

    return new Response(
      JSON.stringify({ papers: sortedPapers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})