import { SearchParams } from './types.ts'

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TIMEOUT = 5000

const requestHeaders = {
  'Accept': 'application/xml',
  'User-Agent': 'Mozilla/5.0'
}

export async function searchPubMed(params: SearchParams) {
  // Build search query
  const queryParts = []
  
  if (params.medicine) {
    queryParts.push(`"${params.medicine}"[Title/Abstract]`)
  }
  
  if (params.condition) {
    queryParts.push(`"${params.condition}"[Title/Abstract]`)
  }

  if (params.articleTypes?.length) {
    const typeQuery = params.articleTypes
      .map(type => `"${type}"[Publication Type]`)
      .join(" OR ")
    queryParts.push(`(${typeQuery})`)
  }

  if (params.dateRange) {
    queryParts.push(
      `("${params.dateRange.start}"[Date - Publication] : "${params.dateRange.end}"[Date - Publication])`
    )
  }

  const query = queryParts.join(" AND ")
  console.log('Built query:', query)

  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    usehistory: 'y',
    retmax: '0',
    sort: params.sort || 'relevance'
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const response = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams.toString()}`, {
      headers: requestHeaders,
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`PubMed search failed: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    console.log('Search response received, length:', text.length)
    return text
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

export async function fetchPubMedResults(
  webEnv: string,
  queryKey: string,
  offset: number,
  limit: number,
  sort: string
) {
  const fetchParams = new URLSearchParams({
    db: 'pubmed',
    WebEnv: webEnv,
    query_key: queryKey,
    retstart: offset.toString(),
    retmax: limit.toString(),
    retmode: 'xml',
    sort
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const response = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams.toString()}`, {
      headers: requestHeaders,
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    console.log('Received articles XML, length:', text.length)
    return text
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}