// Helper function to safely render title
export function extractTitle(articleData: any): string {
  if (!articleData) return 'No title available'
  
  const title = articleData.ArticleTitle
  
  if (typeof title === 'string') return title
  if (!title) return 'No title available'
  
  // Handle case where title is an object with '_' property
  if (typeof title === 'object') {
    if ('_' in title) return title._ as string
    if ('sub' in title) return String(title.sub)
  }
  
  // If we have an array of title parts, join them
  if (Array.isArray(title)) {
    return title.map(part => {
      if (typeof part === 'string') return part
      if (typeof part === 'object' && '_' in part) return part._
      return ''
    }).filter(Boolean).join(' ')
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