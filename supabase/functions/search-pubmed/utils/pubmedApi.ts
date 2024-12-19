import { PubMedArticle } from './types'

const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export async function searchPubMed(query: string, dateRange?: { start: string; end: string }): Promise<PubMedArticle[]> {
  try {
    console.log('Executing PubMed search with query:', query)
    
    // Initial search to get PMIDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=100&usehistory=y`
    console.log('Search URL:', searchUrl)
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    console.log('Search response:', searchText)
    
    // Extract PMIDs from search results
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    console.log('Found PMIDs:', pmids)
    
    if (pmids.length === 0) {
      console.log('No results found')
      return []
    }

    // Fetch full article details
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
    console.log('Fetch URL:', fetchUrl)
    
    const fetchResponse = await fetch(fetchUrl)
    if (!fetchResponse.ok) {
      throw new Error(`Fetch request failed: ${fetchResponse.statusText}`)
    }
    
    const articlesXml = await fetchResponse.text()
    console.log('Received articles XML length:', articlesXml.length)
    
    // Parse articles from XML
    const articles = parseArticles(articlesXml)
    console.log(`Successfully processed ${articles.length} papers`)
    
    return articles
    
  } catch (error) {
    console.error('Error in searchPubMed:', error)
    throw error
  }
}