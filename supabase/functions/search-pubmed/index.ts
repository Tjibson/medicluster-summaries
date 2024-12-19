import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"
import { extractPatientCount } from "../utils/extractPatientCount.ts"
import { calculateRelevanceScore } from "../utils/calculateRelevance.ts"
import { fetchGoogleScholarData } from "../utils/googleScholar.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchFullText(pmid: string): Promise<string> {
  try {
    const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' }
    })
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) return ''
    
    const abstractElement = doc.querySelector('.abstract-content')
    const fullTextElement = doc.querySelector('.full-text-links-list a')
    
    let text = abstractElement?.textContent || ''
    
    if (fullTextElement) {
      const fullTextUrl = fullTextElement.getAttribute('href')
      if (fullTextUrl) {
        try {
          const fullTextResponse = await fetch(fullTextUrl)
          const fullTextHtml = await fullTextResponse.text()
          const fullTextDoc = parser.parseFromString(fullTextHtml, 'text/html')
          if (fullTextDoc) {
            text += ' ' + fullTextDoc.body.textContent
          }
        } catch (error) {
          console.error('Error fetching full text:', error)
        }
      }
    }
    
    return text
  } catch (error) {
    console.error('Error fetching article text:', error)
    return ''
  }
}

async function searchPubMed(criteria: any) {
  let searchQuery = ''
  const searchTerms: string[] = []
  
  if (criteria.disease) searchTerms.push(`${criteria.disease}[Title/Abstract]`)
  if (criteria.medicine) searchTerms.push(`${criteria.medicine}[Title/Abstract]`)
  if (criteria.working_mechanism) searchTerms.push(`${criteria.working_mechanism}[Title/Abstract]`)
  if (criteria.population) searchTerms.push(`${criteria.population}[Title/Abstract]`)
  if (criteria.trial_type) searchTerms.push(`${criteria.trial_type}[Publication Type]`)
  
  searchQuery = searchTerms.join(' AND ')
  
  if (criteria.query) {
    searchQuery = `${criteria.query}[Title/Abstract]`
  }
  
  if (!searchQuery.trim()) {
    throw new Error('No search criteria provided')
  }

  const baseUrl = 'https://pubmed.ncbi.nlm.nih.gov'
  const searchUrl = `${baseUrl}/?term=${encodeURIComponent(searchQuery)}&size=100`
  
  try {
    const response = await fetch(searchUrl)
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) throw new Error('Failed to parse HTML')

    const articles = []
    const articleElements = doc.querySelectorAll('.docsum-content')
    
    for (const element of articleElements) {
      try {
        const titleElement = element.querySelector('.docsum-title')
        const title = titleElement?.textContent?.trim() || 'No title'
        
        const authorElement = element.querySelector('.docsum-authors')
        const authors = authorElement?.textContent?.split(',').map(a => a.trim()) || []
        
        const journalElement = element.querySelector('.docsum-journal-citation')
        const journalText = journalElement?.textContent || ''
        const journal = journalText.split('.')[0] || 'No journal'
        
        const yearMatch = journalText.match(/\d{4}/)
        const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()
        
        const abstractElement = element.querySelector('.full-view-snippet')
        const abstract = abstractElement?.textContent?.trim() || ''

        const idElement = element.querySelector('a')
        const id = idElement?.getAttribute('href')?.replace('/', '') || ''

        // Fetch full text and Google Scholar data in parallel
        const [fullText, scholarData] = await Promise.all([
          fetchFullText(id),
          fetchGoogleScholarData(title, authors)
        ])

        const patientCount = extractPatientCount(fullText)
        
        // Calculate relevance score using full text
        const relevanceScore = calculateRelevanceScore(
          `${title} ${abstract} ${fullText}`, 
          criteria
        )

        const paperData = {
          id,
          title,
          authors,
          journal,
          year,
          abstract,
          pdfUrl: scholarData?.pdfUrl || `https://pubmed.ncbi.nlm.nih.gov/${id}/pdf`,
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