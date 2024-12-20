import * as xml2js from 'https://esm.sh/xml2js@0.4.23'

export async function parseXML(xml: string) {
  const parser = new xml2js.Parser({ 
    explicitArray: false, 
    mergeAttrs: true,
    valueProcessors: [parseFloat]
  })
  return parser.parseStringPromise(xml)
}

export function extractArticleData(article: any) {
  const medlineCitation = article.MedlineCitation
  const articleData = medlineCitation.Article
  
  // Extract title
  const title = articleData.ArticleTitle || 'No title available'
  
  // Extract abstract
  let abstract = 'No abstract available'
  if (articleData.Abstract?.AbstractText) {
    if (typeof articleData.Abstract.AbstractText === 'string') {
      abstract = articleData.Abstract.AbstractText
    } else if (Array.isArray(articleData.Abstract.AbstractText)) {
      abstract = articleData.Abstract.AbstractText.join('\n')
    } else if (articleData.Abstract.AbstractText._) {
      abstract = articleData.Abstract.AbstractText._
    }
  }
  
  // Extract authors
  let authors: string[] = []
  if (articleData.AuthorList?.Author) {
    const authorList = Array.isArray(articleData.AuthorList.Author) 
      ? articleData.AuthorList.Author 
      : [articleData.AuthorList.Author]
    
    authors = authorList.map((auth: any) => {
      const firstName = auth.ForeName || ''
      const lastName = auth.LastName || ''
      return [firstName, lastName].filter(Boolean).join(' ')
    })
  }
  
  // Extract journal and year
  const journal = articleData.Journal?.Title || 
                 articleData.Journal?.ISOAbbreviation || 
                 'Unknown Journal'
  
  const year = articleData.Journal?.JournalIssue?.PubDate?.Year || 
               new Date().getFullYear()
  
  // Extract PMID
  const pmid = medlineCitation.PMID?._ || medlineCitation.PMID || ''
  
  return {
    id: pmid,
    title,
    abstract,
    authors,
    journal,
    year: parseInt(year),
    citations: 0,
    relevance_score: 0
  }
}