import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  PUBMED_BASE_URL,
  TIMEOUT,
  corsHeaders,
  requestHeaders
} from './utils/constants.ts';
import { buildSearchQuery, buildSearchParams } from './utils/queryBuilder.ts';
import { parseArticles } from './utils/xmlParser.ts';
import { SearchParams } from './utils/types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = await req.json();
    console.log('Search request received:', searchParams);

    if (!searchParams) {
      throw new Error('No search parameters provided');
    }

    // Validate search parameters
    if (!searchParams.medicine && !searchParams.condition) {
      throw new Error('At least one search term (medicine or condition) is required');
    }

    // Build search query
    const query = buildSearchQuery(searchParams);
    const params = buildSearchParams(
      query,
      searchParams.offset || 0,
      searchParams.limit || 25
    );

    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?${params.toString()}`;
    console.log('PubMed search URL:', searchUrl);

    // Execute search with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const searchResponse = await fetch(searchUrl, {
        headers: requestHeaders,
        signal: controller.signal
      });

      if (!searchResponse.ok) {
        throw new Error(`PubMed search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchText = await searchResponse.text();
      console.log('Search response received');

      // Extract WebEnv and QueryKey for fetching results
      const webEnv = searchText.match(/<WebEnv>(\S+)<\/WebEnv>/)?.[1];
      const queryKey = searchText.match(/<QueryKey>(\d+)<\/QueryKey>/)?.[1];
      const count = searchText.match(/<Count>(\d+)<\/Count>/)?.[1];

      if (!webEnv || !queryKey) {
        throw new Error('Failed to get WebEnv or QueryKey from PubMed');
      }

      // Fetch actual results
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        WebEnv: webEnv,
        query_key: queryKey,
        retstart: (searchParams.offset || 0).toString(),
        retmax: (searchParams.limit || 25).toString(),
        retmode: 'xml'
      });

      const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams.toString()}`;
      console.log('Fetching articles from:', fetchUrl);

      const fetchResponse = await fetch(fetchUrl, {
        headers: requestHeaders
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch results: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      const articlesXml = await fetchResponse.text();
      console.log('Articles XML received, length:', articlesXml.length);

      const papers = parseArticles(articlesXml);
      console.log(`Successfully processed ${papers.length} papers`);

      return new Response(
        JSON.stringify({ 
          papers,
          total: parseInt(count || '0'),
          offset: searchParams.offset || 0,
          limit: searchParams.limit || 25
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } finally {
      clearTimeout(timeout);
    }
    
  } catch (error) {
    console.error('Error in search-pubmed function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search',
        papers: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});