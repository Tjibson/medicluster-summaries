import { type Paper } from '../types'
import { calculateRelevanceScore } from './scoring'
import { extractTitle } from './parsers/titleParser'
import { extractAbstract } from './parsers/abstractParser'
import { extractJournalInfo } from './parsers/journalParser'
import { extractIdentifiers } from './parsers/identifiersParser'
import { extractPublicationTypes } from './parsers/publicationTypesParser'

interface ArticleParsingResult {
  success: boolean
  paper?: Paper
  error?: string
}

function extractPMID(articleData: any): string | null {
  try {
    const medlineCitation = articleData.MedlineCitation
    return medlineCitation?.PMID?._text || medlineCitation?.PMID || null
  } catch (error) {
    console.error('Error extracting PMID:', error)
    return null
  }
}

function extractAuthors(articleData: any): string[] {
  try {
    const authorList = articleData.MedlineCitation?.Article?.AuthorList?.Author
    if (!authorList) return []

    const authors = Array.isArray(authorList) ? authorList : [authorList]
    return authors.map((author: any) => {
      const lastName = author.LastName || ''
      const foreName = author.ForeName || ''
      const initials = author.Initials || ''
      
      return [lastName, foreName || initials].filter(Boolean).join(' ')
    }).filter(Boolean)
  } catch (error) {
    console.error('Error extracting authors:', error)
    return []
  }
}

export function parseArticle(articleData: any, searchParams: any): ArticleParsingResult {
  try {
    console.log('Parsing article:', articleData?.MedlineCitation?.PMID)
    
    // Extract PMID
    const pmid = extractPMID(articleData)
    if (!pmid) {
      return { success: false, error: 'No PMID found' }
    }

    // Extract and validate title
    const title = extractTitle(articleData)
    if (!title) {
      return { success: false, error: 'No title found' }
    }

    // Extract abstract
    const abstract = extractAbstract(articleData)

    // Extract authors
    const authors = extractAuthors(articleData)

    // Extract journal info
    const { journal, year } = extractJournalInfo(articleData)

    // Extract publication types
    const publicationTypes = extractPublicationTypes(articleData)

    // Extract DOI and URLs
    const { doi, pdfUrl } = extractIdentifiers(articleData)

    // Calculate relevance score
    const relevanceScore = calculateRelevanceScore(title, abstract, searchParams)

    const paper: Paper = {
      id: pmid,
      title,
      abstract,
      authors,
      journal,
      year,
      publicationTypes,
      doi,
      pdfUrl,
      citations: 0,
      relevance_score: relevanceScore
    }

    console.log('Successfully parsed paper:', { id: paper.id, title: paper.title })
    return { success: true, paper }
  } catch (error) {
    console.error('Error parsing article:', error)
    return { success: false, error: String(error) }
  }
}