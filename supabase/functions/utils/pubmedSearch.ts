export async function searchPubMed(searchQuery: string, dateRange?: { start: string; end: string }, limit: number = 10) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  let query = searchQuery

  // Add date range if provided
  if (dateRange) {
    const startYear = new Date(dateRange.start).getFullYear()
    const endYear = new Date(dateRange.end).getFullYear()
    query += ` AND ("${startYear}/01/01"[Date - Publication] : "${endYear}/12/31"[Date - Publication])`
  }

  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&usehistory=y`
  
  const searchResponse = await fetch(searchUrl)
  if (!searchResponse.ok) {
    throw new Error(`Failed to fetch search results: ${searchResponse.statusText}`)
  }
  
  const searchText = await searchResponse.text()
  const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
  
  if (pmids.length === 0) {
    return ''
  }

  const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`
  const fetchResponse = await fetch(fetchUrl)
  if (!fetchResponse.ok) {
    throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
  }

  return await fetchResponse.text()
}