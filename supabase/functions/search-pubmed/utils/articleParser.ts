import { type Paper } from '../types'
import { calculateRelevanceScore } from './scoring'

interface ArticleParsingResult {
  success: boolean
  paper?: Paper
  error?: string
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
      citations: 0, // Will be updated later if citation data is available
      relevance_score: relevanceScore
    }

    console.log('Successfully parsed paper:', { id: paper.id, title: paper.title })
    return { success: true, paper }
  } catch (error) {
    console.error('Error parsing article:', error)
    return { success: false, error: String(error) }
  }
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

function extractTitle(articleData: any): string | null {
  try {
    const article = articleData.MedlineCitation?.Article
    if (!article) return null

    // Handle different title formats
    if (typeof article.ArticleTitle === 'string') {
      return article.ArticleTitle
    }

    if (article.ArticleTitle?._text) {
      return article.ArticleTitle._text
    }

    if (article.ArticleTitle?.text) {
      return article.ArticleTitle.text
    }

    // Handle vernacular title as fallback
    if (article.VernacularTitle) {
      return article.VernacularTitle
    }

    return null
  } catch (error) {
    console.error('Error extracting title:', error)
    return null
  }
}

function extractAbstract(articleData: any): string {
  try {
    const abstract = articleData.MedlineCitation?.Article?.Abstract?.AbstractText
    if (!abstract) return 'No abstract available'

    if (typeof abstract === 'string') {
      return abstract
    }

    if (Array.isArray(abstract)) {
      return abstract.map(section => {
        if (typeof section === 'string') return section
        return section?._text || section?.text || ''
      }).join('\n')
    }

    if (abstract._text) {
      return abstract._text
    }

    return 'No abstract available'
  } catch (error) {
    console.error('Error extracting abstract:', error)
    return 'Error extracting abstract'
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

function extractJournalInfo(articleData: any): { journal: string; year: number } {
  try {
    const journal = articleData.MedlineCitation?.Article?.Journal
    const journalTitle = journal?.Title || journal?.ISOAbbreviation || 'Unknown Journal'
    
    let year = new Date().getFullYear()
    const pubDate = journal?.JournalIssue?.PubDate

    if (pubDate?.Year) {
      year = parseInt(pubDate.Year)
    } else if (pubDate?.MedlineDate) {
      // Handle MedlineDate format (e.g., "2023 Jan-Feb")
      const yearMatch = pubDate.MedlineDate.match(/\d{4}/)
      if (yearMatch) {
        year = parseInt(yearMatch[0])
      }
    }

    return { journal: journalTitle, year }
  } catch (error) {
    console.error('Error extracting journal info:', error)
    return { journal: 'Unknown Journal', year: new Date().getFullYear() }
  }
}

function extractPublicationTypes(articleData: any): string[] {
  try {
    const pubTypes = articleData.MedlineCitation?.Article?.PublicationTypeList?.PublicationType
    if (!pubTypes) return []

    const types = Array.isArray(pubTypes) ? pubTypes : [pubTypes]
    return types.map((type: any) => type._text || type).filter(Boolean)
  } catch (error) {
    console.error('Error extracting publication types:', error)
    return []
  }
}

function extractIdentifiers(articleData: any): { doi: string | null; pdfUrl: string | null } {
  try {
    const articleIdList = articleData.PubmedData?.ArticleIdList?.ArticleId || []
    const ids = Array.isArray(articleIdList) ? articleIdList : [articleIdList]

    let doi: string | null = null
    ids.forEach((id: any) => {
      if (id?._attributes?.IdType === 'doi') {
        doi = id._text || id
      }
    })

    // Construct PDF URL if DOI is available
    const pdfUrl = doi ? `https://doi.org/${doi}` : null

    return { doi, pdfUrl }
  } catch (error) {
    console.error('Error extracting identifiers:', error)
    return { doi: null, pdfUrl: null }
  }
}