interface Article {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  year: number
  citations: number
  relevance_score?: number
}

export function parseArticles(xmlText: string, searchParams: any): Article[] {
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

      // Calculate relevance score based on title and abstract matches
      const searchTerms = [
        ...searchParams.keywords.medicine,
        ...searchParams.keywords.condition
      ]
      const relevance_score = calculateRelevanceScore(title, abstract, searchTerms)

      articles.push({
        id,
        title: decodeXMLEntities(title),
        authors,
        journal: decodeXMLEntities(journal),
        year,
        abstract: decodeXMLEntities(abstract),
        citations: 0, // We'll update this later if needed
        relevance_score
      })
    } catch (error) {
      console.error('Error processing article:', error)
      continue
    }
  }

  return articles
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function calculateRelevanceScore(title: string, abstract: string, searchTerms: string[]): number {
  if (!searchTerms.length) return 50 // Default score if no search terms

  let score = 0
  const text = `${title.toLowerCase()} ${abstract.toLowerCase()}`

  searchTerms.forEach(term => {
    const termLower = term.toLowerCase()
    // Title matches worth more (3x)
    const titleMatches = (title.toLowerCase().match(new RegExp(termLower, 'g')) || []).length
    score += titleMatches * 30

    // Abstract matches
    const abstractMatches = (abstract.toLowerCase().match(new RegExp(termLower, 'g')) || []).length
    score += abstractMatches * 10
  })

  // Normalize to 0-100 range
  return Math.min(Math.round(score), 100)
}