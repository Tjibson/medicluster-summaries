import { PubMedArticle } from './types'

export function parseArticles(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = []
  const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
  
  for (const articleXml of articleMatches) {
    try {
      const article = {
        id: extractText(articleXml, 'PMID'),
        title: extractText(articleXml, 'ArticleTitle'),
        abstract: extractText(articleXml, 'Abstract/AbstractText') || 'No abstract available',
        authors: extractAuthors(articleXml),
        journal: extractText(articleXml, 'Journal/Title') || extractText(articleXml, 'ISOAbbreviation') || 'Unknown Journal',
        year: parseInt(extractText(articleXml, 'PubDate/Year') || new Date().getFullYear().toString()),
        citations: 0
      }
      
      articles.push(article)
    } catch (error) {
      console.error('Error processing article:', error)
      continue
    }
  }
  
  return articles
}

function extractText(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>(.*?)</${tag.split('/').pop()}>`, 's').exec(xml)
  return match ? decodeXMLEntities(match[1].trim()) : ''
}

function extractAuthors(xml: string): string[] {
  const authors = []
  const authorMatches = xml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
  
  for (const match of authorMatches) {
    const lastName = match[1] || ''
    const foreName = match[2] || ''
    authors.push(`${lastName} ${foreName}`.trim())
  }
  
  return authors
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}