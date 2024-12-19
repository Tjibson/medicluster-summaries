export async function searchPubMed(searchQuery: string, limit: number = 50) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  
  try {
    console.log('Fetching PubMed search results...')
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=${limit}&usehistory=y`
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/xml'
      }
    })
    
    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch search results: ${searchResponse.statusText}`)
    }
    
    const searchText = await searchResponse.text()
    const pmids = searchText.match(/<Id>(\d+)<\/Id>/g)?.map(id => id.replace(/<\/?Id>/g, '')) || []
    
    if (pmids.length === 0) {
      console.log('No results found')
      return ''
    }

    console.log(`Found ${pmids.length} PMIDs, fetching details...`)
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract,citation`
    
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        'Accept': 'application/xml'
      }
    })
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch article details: ${fetchResponse.statusText}`)
    }

    return await fetchResponse.text()
  } catch (error) {
    console.error('Error in searchPubMed:', error)
    throw error
  }
}