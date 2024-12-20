export function extractTitle(articleData: any): string {
  if (!articleData) return 'No title available'
  
  try {
    // Direct string title
    if (typeof articleData.ArticleTitle === 'string') {
      console.log('Found direct string title:', articleData.ArticleTitle)
      return articleData.ArticleTitle
    }

    // Handle object title with _ property
    if (articleData.ArticleTitle && typeof articleData.ArticleTitle === 'object') {
      if ('_' in articleData.ArticleTitle) {
        console.log('Found title in _ property:', articleData.ArticleTitle._)
        return String(articleData.ArticleTitle._)
      }
      if ('sub' in articleData.ArticleTitle) {
        console.log('Found title in sub property:', articleData.ArticleTitle.sub)
        return String(articleData.ArticleTitle.sub)
      }
    }

    // Fallback to VernacularTitle
    if (articleData.VernacularTitle) {
      console.log('Using VernacularTitle:', articleData.VernacularTitle)
      return String(articleData.VernacularTitle)
    }

    console.log('No valid title found in article data:', articleData)
    return 'No title available'
  } catch (error) {
    console.error('Error extracting title:', error)
    return 'Error extracting title'
  }
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
