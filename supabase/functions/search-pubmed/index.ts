import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch search results: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []

    if (pmids.length === 0) {
      return []
    }

    // Then fetch details for all PMIDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    const fetchResponse = await fetch(fetchUrl)
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
    }
    
    const fetchText = await fetchResponse.text()
    const articles = []

    // Parse articles using regex since XML parsing is problematic
    const articleMatches = fetchText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
    
    for (const articleXml of articleMatches) {
      try {
        // Extract basic article info using regex
        const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
        const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
        const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''
        
        // Extract authors
        const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
        const authors = Array.from(authorMatches).map(match => {
          const lastName = match[1] || ''
          const foreName = match[2] || ''
          return `${lastName} ${foreName}`.trim()
        })

        // Extract journal info
        const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                       articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                       'Unknown Journal'
        
        // Extract year
        const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
        const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

        // Extract patient count from abstract
        const patientCount = extractPatientCount(abstract)

        // Calculate relevance score
        const relevanceScore = calculateRelevanceScore(
          `${title} ${abstract}`,
          criteria
        )

        const paperData = {
          id,
          title: decodeXMLEntities(title),
          authors,
          journal: decodeXMLEntities(journal),
          year,
          abstract: decodeXMLEntities(abstract),
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

// Helper function to decode XML entities
function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// Helper function to extract patient count
function extractPatientCount(text: string): number | null {
  if (!text) return null

  const patterns = [
    /(?:included|enrolled|recruited|studied)\s+(\d+)\s+(?:patients?|participants?|subjects?)/i,
    /(?:n\s*=\s*)(\d+)(?:\s*patients?)?/i,
    /(?:sample size|cohort)\s+of\s+(\d+)/i,
    /(\d+)\s+(?:patients?|participants?|subjects?)\s+(?:were|was)\s+(?:included|enrolled|recruited)/i,
    /total\s+(?:of\s+)?(\d+)\s+(?:patients?|participants?|subjects?)/i,
    /population\s+of\s+(\d+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1])
      if (!isNaN(count) && count > 0) {
        return count
      }
    }
  }

  return null
}

// Helper function to calculate relevance score
function calculateRelevanceScore(text: string, searchTerms: any): number {
  if (!text || !Object.values(searchTerms).some(term => term)) return 0

  let score = 0
  let totalCriteria = 0
  const textLower = text.toLowerCase()

  // Helper function to count occurrences
  const countOccurrences = (searchTerm: string): number => {
    if (!searchTerm) return 0
    const terms = searchTerm.toLowerCase().split(/\s+/)
    let matches = 0
    terms.forEach(term => {
      const regex = new RegExp(term, 'g')
      matches += (textLower.match(regex) || []).length
    })
    return matches
  }

  // Score each search term
  Object.entries(searchTerms).forEach(([key, term]) => {
    if (term && typeof term === 'string' && key !== 'patient_count') {
      totalCriteria++
      const occurrences = countOccurrences(term)
      if (occurrences > 0) {
        // Base match score
        score += 1
        // Bonus for multiple occurrences, capped at 0.5
        score += Math.min(occurrences / 5, 0.5)
      }
    }
  })

  // Handle direct query searches differently
  if (searchTerms.query) {
    const queryScore = countOccurrences(searchTerms.query)
    return queryScore > 0 ? 100 * (1 + Math.min(queryScore / 10, 0.5)) : 0
  }

  // Normalize score to percentage
  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0
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