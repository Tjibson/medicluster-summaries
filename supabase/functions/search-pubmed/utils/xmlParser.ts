import * as xml2js from 'https://esm.sh/xml2js@0.4.23'
import { extractStructuredAbstract } from './parsers/abstractParser.ts'

export async function parseXML(xml: string) {
  console.log('Starting XML parsing')
  try {
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      mergeAttrs: true,
      valueProcessors: [parseFloat]
    })
    const result = await parser.parseStringPromise(xml)
    console.log('XML parsing successful')
    return result
  } catch (error) {
    console.error('XML parsing failed:', error)
    throw new Error('Failed to parse XML response')
  }
}

export function extractArticleData(article: any) {
  console.log('Extracting article data')
  try {
    const medlineCitation = article.MedlineCitation
    const articleData = medlineCitation.Article
    
    // Extract title with error handling
    let title = 'No title available'
    try {
      title = articleData.ArticleTitle || title
      console.log('Title extracted:', title)
    } catch (error) {
      console.error('Error extracting title:', error)
    }
    
    // Extract abstract with error handling
    let abstract = 'No abstract available'
    try {
      if (articleData.Abstract?.AbstractText) {
        if (typeof articleData.Abstract.AbstractText === 'string') {
          abstract = articleData.Abstract.AbstractText
        } else if (Array.isArray(articleData.Abstract.AbstractText)) {
          abstract = articleData.Abstract.AbstractText.join('\n')
        } else if (articleData.Abstract.AbstractText._) {
          abstract = articleData.Abstract.AbstractText._
        }
      }
      console.log('Abstract extracted successfully')
    } catch (error) {
      console.error('Error extracting abstract:', error)
    }
    
    // Extract authors with error handling
    let authors: string[] = []
    try {
      if (articleData.AuthorList?.Author) {
        const authorList = Array.isArray(articleData.AuthorList.Author) 
          ? articleData.AuthorList.Author 
          : [articleData.AuthorList.Author]
        
        authors = authorList.map((auth: any) => {
          const firstName = auth.ForeName || ''
          const lastName = auth.LastName || ''
          return [firstName, lastName].filter(Boolean).join(' ')
        })
        console.log(`Extracted ${authors.length} authors`)
      }
    } catch (error) {
      console.error('Error extracting authors:', error)
    }
    
    // Extract journal and year with error handling
    let journal = 'Unknown Journal'
    let year = new Date().getFullYear()
    try {
      journal = articleData.Journal?.Title || 
                articleData.Journal?.ISOAbbreviation || 
                journal
      
      year = parseInt(articleData.Journal?.JournalIssue?.PubDate?.Year) || year
      console.log('Journal and year extracted:', { journal, year })
    } catch (error) {
      console.error('Error extracting journal/year:', error)
    }
    
    // Extract PMID with error handling
    let pmid = ''
    try {
      pmid = medlineCitation.PMID?._ || medlineCitation.PMID || ''
      console.log('PMID extracted:', pmid)
    } catch (error) {
      console.error('Error extracting PMID:', error)
    }
    
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
  } catch (error) {
    console.error('Error in extractArticleData:', error)
    throw new Error('Failed to extract article data')
  }
}