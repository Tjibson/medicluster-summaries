import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { xml2js } from "https://deno.land/x/xml2js@v1.0.0/mod.ts"

interface SearchParams {
  medicine?: string
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { medicine, dateRange, journalNames } = await req.json() as SearchParams
    console.log("Search params received:", { medicine, dateRange, journalNames })

    if (!medicine && !dateRange && !journalNames?.length) {
      throw new Error("At least one search parameter is required")
    }

    // Build search query
    let searchQuery = medicine || ""
    if (journalNames?.length) {
      searchQuery += ` AND (${journalNames.join(" OR ")}[Journal])`
    }
    if (dateRange) {
      searchQuery += ` AND ("${dateRange.start}"[Date - Publication] : "${dateRange.end}"[Date - Publication])`
    }

    console.log("PubMed search query:", searchQuery)

    // Step 1: Use ESearch to get PMIDs
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmode=json&retmax=100`
    const esearchResponse = await fetch(esearchUrl)
    const esearchData = await esearchResponse.json()
    
    console.log("ESearch response:", esearchData)
    
    const pmids = esearchData.esearchresult.idlist
    if (!pmids?.length) {
      return new Response(
        JSON.stringify({ papers: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Step 2: Use EFetch to get article details
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const efetchResponse = await fetch(efetchUrl)
    const xmlData = await efetchResponse.text()
    
    console.log("EFetch XML received, parsing...")

    // Parse XML
    const jsonResult = await xml2js(xmlData, { compact: true })
    const pubmedArticles = Array.isArray(jsonResult.PubmedArticleSet.PubmedArticle) 
      ? jsonResult.PubmedArticleSet.PubmedArticle 
      : [jsonResult.PubmedArticleSet.PubmedArticle]

    // Transform articles into our format
    const papers = pubmedArticles.map(article => {
      const articleData = article.MedlineCitation.Article
      const pmid = article.MedlineCitation.PMID._text

      // Extract authors
      let authors = []
      if (articleData.AuthorList?.Author) {
        const authorList = Array.isArray(articleData.AuthorList.Author)
          ? articleData.AuthorList.Author
          : [articleData.AuthorList.Author]

        authors = authorList.map(auth => {
          const foreName = auth.ForeName?._text || ''
          const lastName = auth.LastName?._text || ''
          return `${foreName} ${lastName}`.trim()
        })
      }

      // Extract abstract
      let abstract = ''
      if (articleData.Abstract?.AbstractText) {
        if (typeof articleData.Abstract.AbstractText === 'string') {
          abstract = articleData.Abstract.AbstractText
        } else if (Array.isArray(articleData.Abstract.AbstractText)) {
          abstract = articleData.Abstract.AbstractText.map(section => 
            section._text || section
          ).join('\n')
        } else {
          abstract = articleData.Abstract.AbstractText._text || ''
        }
      }

      // Extract publication year
      const pubDate = articleData.Journal?.JournalIssue?.PubDate
      const year = pubDate?.Year?._text || 
                  (pubDate?.MedlineDate?._text || '').substring(0, 4) || 
                  new Date().getFullYear()

      return {
        id: pmid,
        title: articleData.ArticleTitle._text || '',
        abstract,
        authors,
        journal: articleData.Journal?.Title?._text || '',
        year: parseInt(year),
        citations: 0, // We'll need to implement citation count in a separate step
        pdfUrl: null // We'll need to implement PDF URL retrieval in a separate step
      }
    })

    console.log(`Processed ${papers.length} papers`)

    return new Response(
      JSON.stringify({ papers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error in search-pubmed function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})