import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts"
import { extractPatientCount } from "../utils/extractPatientCount.ts"
import { calculateRelevanceScore } from "../utils/calculateRelevance.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchPubMed(criteria: any) {
  let searchQuery = ''
  const searchTerms: string[] = []
  
  // Build search query with Title/Abstract for each term
  if (criteria.disease) searchTerms.push(`${criteria.disease}[Title/Abstract]`)
  if (criteria.medicine) searchTerms.push(`${criteria.medicine}[Title/Abstract]`)
  if (criteria.working_mechanism) searchTerms.push(`${criteria.working_mechanism}[Title/Abstract]`)
  if (criteria.population) searchTerms.push(`${criteria.population}[Title/Abstract]`)
  if (criteria.trial_type) searchTerms.push(`${criteria.trial_type}[Publication Type]`)
  
  searchQuery = searchTerms.join(' AND ')
  
  // Handle direct query searches (like from the top nav)
  if (criteria.query) {
    searchQuery = `${criteria.query}[Title/Abstract]`
  }
  
  if (!searchQuery.trim()) {
    throw new Error('No search criteria provided')
  }

  console.log('Search query:', searchQuery)

  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=100&usehistory=y`
  
  try {
    // First get the PMIDs
    const searchResponse = await fetch(searchUrl)
    const searchText = await searchResponse.text()
    const searchDoc = parse(searchText)
    
    if (!searchDoc) throw new Error('Failed to parse search XML')

    const idList = searchDoc.IdList?.Id || []
    const pmids = Array.isArray(idList) ? idList.map(id => id?._text) : []

    if (pmids.length === 0) {
      return []
    }

    // Then fetch details for all PMIDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const fetchResponse = await fetch(fetchUrl)
    const fetchText = await fetchResponse.text()
    const fetchDoc = parse(fetchText)

    if (!fetchDoc) throw new Error('Failed to parse fetch XML')

    const articles = []
    const articleSet = fetchDoc.PubmedArticleSet?.PubmedArticle || []
    const articleElements = Array.isArray(articleSet) ? articleSet : [articleSet]
    
    for (const element of articleElements) {
      try {
        const medlineCitation = element.MedlineCitation
        const article = medlineCitation?.Article
        
        if (!article) continue

        const id = medlineCitation?.PMID?._text || ''
        const title = article?.ArticleTitle?._text || 'No title'
        const abstract = article?.Abstract?.AbstractText?._text || ''
        
        // Get authors
        const authorList = article?.AuthorList?.Author || []
        const authors = Array.isArray(authorList) 
          ? authorList.map(author => {
              const lastName = author?.LastName?._text || ''
              const foreName = author?.ForeName?._text || ''
              return `${lastName} ${foreName}`.trim()
            })
          : []

        // Get journal info
        const journal = article?.Journal?.Title?._text || 
                       article?.Journal?.ISOAbbreviation?._text || 
                       'Unknown Journal'
        
        // Get year
        const pubDate = article?.Journal?.JournalIssue?.PubDate
        const year = pubDate?.Year?._text 
          ? parseInt(pubDate.Year._text) 
          : new Date().getFullYear()

        // Calculate relevance score using full text
        const relevanceScore = calculateRelevanceScore(
          `${title} ${abstract}`, 
          criteria
        )

        // Extract patient count from abstract
        const patientCount = extractPatientCount(abstract)

        const paperData = {
          id,
          title,
          authors,
          journal,
          year,
          abstract,
          citations: 0,
          patient_count: patientCount,
          relevance_score: relevanceScore
        }

        articles.push(paperData)
      } catch (error) {
        console.error('Error processing article:', error)
        continue
      }
    }
    
    // Sort by relevance score
    articles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    
    return articles
    
  } catch (error) {
    console.error('Error searching PubMed:', error)
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const searchCriteria = await req.json()
    const papers = await searchPubMed(searchCriteria)

    return new Response(
      JSON.stringify({ success: true, papers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})