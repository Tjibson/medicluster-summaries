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
      const relevanceScore = calculateRelevanceScore(title, abstract, searchTerms)

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

function calculateRelevanceScore(title: string, abstract: string, searchTerms: string): number {
  if (!title || !abstract || !searchTerms) return 0

  const text = `${title.toLowerCase()} ${abstract.toLowerCase()}`
  const terms = searchTerms.toLowerCase()
    .replace(/[()]/g, '') // Remove parentheses
    .split(/\s+(?:AND|OR)\s+/) // Split on AND/OR operators
    .map(term => term.trim())
    .filter(Boolean)

  let score = 0

  // Title matches are worth more
  terms.forEach(term => {
    const titleMatches = (title.toLowerCase().match(new RegExp(term, 'g')) || []).length
    const abstractMatches = (abstract.toLowerCase().match(new RegExp(term, 'g')) || []).length
    
    score += titleMatches * 3 // Title matches worth 3x
    score += abstractMatches
  })

  // Normalize score to 0-100 range
  const normalizedScore = Math.min(100, score * 10)

  // Recent papers get a small boost (up to 20% boost for current year)
  const currentYear = new Date().getFullYear()
  const yearBoost = Math.max(0, Math.min(0.2, (currentYear - 1950) / (currentYear - 1950)))
  
  return Math.round(normalizedScore * (1 + yearBoost))
}