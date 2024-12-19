export async function searchPubMed(searchQuery: string, limit: number = 25) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  
  try {
    console.log('Fetching PubMed search results...')
    // Remove any malformed URL characters and properly encode the query
    const sanitizedQuery = searchQuery.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(sanitizedQuery)}&retmax=${limit}&usehistory=y`
    
    console.log('Search URL:', searchUrl)
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'Mozilla/5.0' // Add user agent to prevent some API blocks
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

    // Batch the PMIDs into smaller chunks to reduce memory usage
    const batchSize = 10
    const pmidBatches = []
    for (let i = 0; i < pmids.length; i += batchSize) {
      pmidBatches.push(pmids.slice(i, i + batchSize))
    }

    // Process each batch and combine results
    let combinedResults = ''
    for (const batch of pmidBatches) {
      console.log(`Processing batch of ${batch.length} PMIDs...`)
      const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${batch.join(',')}&retmode=xml&rettype=abstract`
      
      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'Mozilla/5.0'
        }
      })
      
      if (!fetchResponse.ok) {
        console.error(`Failed to fetch batch details: ${fetchResponse.statusText}`)
        continue // Skip failed batches instead of failing completely
      }

      const batchText = await fetchResponse.text()
      combinedResults += batchText.replace('<?xml version="1.0" encoding="UTF-8"?>', '')
    }

    return `<?xml version="1.0" encoding="UTF-8"?>${combinedResults}`
  } catch (error) {
    console.error('Error in searchPubMed:', error)
    throw error
  }
}