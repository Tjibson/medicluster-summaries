export function extractTitle(articleData: any): string {
  if (!articleData) return 'No title available'
  
  // Direct access to ArticleTitle
  if (typeof articleData.ArticleTitle === 'string') {
    return articleData.ArticleTitle
  }

  // Handle case where ArticleTitle is an object
  if (articleData.ArticleTitle && typeof articleData.ArticleTitle === 'object') {
    if ('_' in articleData.ArticleTitle) return String(articleData.ArticleTitle._)
    if ('sub' in articleData.ArticleTitle) return String(articleData.ArticleTitle.sub)
    return JSON.stringify(articleData.ArticleTitle)
  }

  // Try VernacularTitle as fallback
  if (articleData.VernacularTitle) {
    return String(articleData.VernacularTitle)
  }

  return 'No title available'
}

export function extractAbstract(articleData: any): string {
  if (!articleData.Abstract?.AbstractText) return 'No abstract available'
  
  const abstractText = articleData.Abstract.AbstractText
  if (typeof abstractText === 'string') return abstractText
  if (Array.isArray(abstractText)) return abstractText.join('\n')
  if (typeof abstractText === 'object' && '_' in abstractText) return abstractText._
  
  return 'No abstract available'
}

export function extractAuthors(articleData: any): string[] {
  if (!articleData.AuthorList?.Author) return []
  
  const authorList = Array.isArray(articleData.AuthorList.Author) 
    ? articleData.AuthorList.Author 
    : [articleData.AuthorList.Author]
  
  return authorList.map((auth: any) => {
    const firstName = auth.ForeName || ''
    const lastName = auth.LastName || ''
    return [firstName, lastName].filter(Boolean).join(' ')
  })
}

export function extractJournalInfo(articleData: any): { journal: string; year: number } {
  const journal = articleData.Journal?.Title || 
                 articleData.Journal?.ISOAbbreviation || 
                 'Unknown Journal'
  
  const year = parseInt(articleData.Journal?.JournalIssue?.PubDate?.Year) || 
               new Date().getFullYear()
  
  return { journal, year }
}
