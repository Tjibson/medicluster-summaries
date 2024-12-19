import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"
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
    const parser = new DOMParser()
    const searchDoc = parser.parseFromString(searchText, 'text/xml')
    
    if (!searchDoc) throw new Error('Failed to parse search XML')

    const idList = searchDoc.querySelectorAll('IdList Id')
    const pmids = Array.from(idList).map(id => id.textContent)

    if (pmids.length === 0) {
      return []
    }

    // Then fetch details for all PMIDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const fetchResponse = await fetch(fetchUrl)
    const fetchText = await fetchResponse.text()
    const fetchDoc = parser.parseFromString(fetchText, 'text/xml')

    if (!fetchDoc) throw new Error('Failed to parse fetch XML')

    const articles = []
    const articleElements = fetchDoc.querySelectorAll('PubmedArticle')
    
    for (const element of articleElements) {
      try {
        const id = element.querySelector('PMID')?.textContent || ''
        const title = element.querySelector('ArticleTitle')?.textContent || 'No title'
        const abstract = element.querySelector('Abstract')?.textContent || ''
        
        // Get authors
        const authorElements = element.querySelectorAll('Author')
        const authors = Array.from(authorElements).map(author => {
          const lastName = author.querySelector('LastName')?.textContent || ''
          const foreName = author.querySelector('ForeName')?.textContent || ''
          return `${lastName} ${foreName}`.trim()
        })

        // Get journal info
        const journal = element.querySelector('Journal Title')?.textContent || 
                       element.querySelector('ISOAbbreviation')?.textContent || 
                       'Unknown Journal'
        
        // Get year
        const yearElement = element.querySelector('PubDate Year')
        const year = yearElement ? parseInt(yearElement.textContent || '') : new Date().getFullYear()

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