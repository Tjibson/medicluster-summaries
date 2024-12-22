import { PUBMED_BASE_URL, requestHeaders, TIMEOUT } from './constants';

export async function searchPubMed(query: string, sort: string) {
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    usehistory: 'y',
    retmax: '0',
    sort
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams.toString()}`, {
      headers: requestHeaders,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`PubMed search failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log('Search response received, length:', text.length);
    return text;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export async function fetchPubMedResults(webEnv: string, queryKey: string, offset: number, limit: number, sort: string) {
  const fetchParams = new URLSearchParams({
    db: 'pubmed',
    WebEnv: webEnv,
    query_key: queryKey,
    retstart: offset.toString(),
    retmax: limit.toString(),
    retmode: 'xml',
    sort
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams.toString()}`, {
      headers: requestHeaders,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log('Received articles XML, length:', text.length);
    return text;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}