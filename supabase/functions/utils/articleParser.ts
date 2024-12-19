interface Article {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  citations: number
  patient_count?: number | null
  relevance_score?: number
}

export function parseArticles(xmlText: string, searchTerms: any): Article[] {
  const articles: Article[] = []
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

  for (const articleXml of articleMatches) {
    try {
      const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
      const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
      const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''
      
      const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
      const authors = Array.from(authorMatches).map(match => {
        const lastName = match[1] || ''
        const foreName = match[2] || ''
        return `${lastName} ${foreName}`.trim()
      })

      const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                     articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                     'Unknown Journal'
      
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
      const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

      // Extract citation count from the XML
      const citationCountMatch = articleXml.match(/<CitationCount>(\d+)<\/CitationCount>/)
      const citations = citationCountMatch ? parseInt(citationCountMatch[1]) : 0

      const patientCount = extractPatientCount(abstract)
      const relevanceScore = calculateRelevanceScore(`${title} ${abstract}`, searchTerms)

      articles.push({
        id,
        title: decodeXMLEntities(title),
        authors,
        journal: decodeXMLEntities(journal),
        year,
        abstract: decodeXMLEntities(abstract),
        citations,
        patient_count: patientCount,
        relevance_score: relevanceScore
      })
    } catch (error) {
      console.error('Error processing article:', error)
      continue
    }
  }

  return articles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

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

function calculateRelevanceScore(text: string, searchTerms: any): number {
  if (!text || !Object.values(searchTerms).some(term => term)) return 0

  let score = 0
  let totalCriteria = 0
  const textLower = text.toLowerCase()

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

  Object.entries(searchTerms).forEach(([key, term]) => {
    if (term && typeof term === 'string' && key !== 'patient_count') {
      totalCriteria++
      const occurrences = countOccurrences(term)
      if (occurrences > 0) {
        score += 1
        score += Math.min(occurrences / 5, 0.5)
      }
    }
  })

  if (searchTerms.query) {
    const queryScore = countOccurrences(searchTerms.query)
    return queryScore > 0 ? 100 * (1 + Math.min(queryScore / 10, 0.5)) : 0
  }

  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0
}