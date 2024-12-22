import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './utils/constants.ts'
import { validateSearchParams } from './utils/validation.ts'
import { searchPubMed, fetchPubMedResults } from './utils/pubmedApi.ts'
import { buildSearchQuery } from './utils/queryBuilder.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Search request:', searchParams)

    // Validate search parameters
    const validatedParams = validateSearchParams(searchParams)
    const query = buildSearchQuery(validatedParams)
    console.log('Built query:', query)

    // Perform initial search
    const searchText = await searchPubMed(query, validatedParams.sort)

    // Extract search metadata
    const count = searchText.match(/<Count>(\d+)<\/Count>/)?.[1]
    const webEnv = searchText.match(/<WebEnv>(\S+)<\/WebEnv>/)?.[1]
    const queryKey = searchText.match(/<QueryKey>(\d+)<\/QueryKey>/)?.[1]

    if (!webEnv || !queryKey) {
      throw new Error('Failed to get WebEnv or QueryKey from PubMed')
    }

    console.log(`Total results: ${count}, fetching from offset ${validatedParams.offset} with limit ${validatedParams.limit}`)

    // Fetch actual results
    const articlesXml = await fetchPubMedResults(
      webEnv,
      queryKey,
      validatedParams.offset,
      validatedParams.limit,
      validatedParams.sort
    )

    // Process results
    const articleMatches = articlesXml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
    console.log(`Found ${articleMatches.length} articles to process`)

    const papers = []
    for (const articleXml of articleMatches) {
      try {
        const id = articleXml.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1] || ''
        const title = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/)?.[1] || 'No title'
        const abstract = articleXml.match(/<Abstract>[\s\S]*?<AbstractText>(.*?)<\/AbstractText>/)?.[1] || ''
        
        const authorMatches = articleXml.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g)
        const authors = Array.from(authorMatches).map(match => {
          const lastName = match[1] || ''
          const foreName = match[2] || ''
          return `${lastName} ${foreName}`.trim()
        })

        const journal = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/)?.[1] ||
                     articleXml.match(/<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)?.[1] ||
                     'Unknown Journal'
        
        const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/)?.[1]
        const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear()

        papers.push({
          id,
          title: decodeXMLEntities(title),
          abstract: decodeXMLEntities(abstract),
          authors,
          journal: decodeXMLEntities(journal),
          year,
          citations: 0
        })
        console.log('Successfully processed article:', id)
      } catch (error) {
        console.error('Error processing article:', error)
        continue
      }
    }

    console.log(`Successfully processed ${papers.length} papers`)
    return new Response(
      JSON.stringify({ 
        papers,
        total: parseInt(count || '0'),
        offset: validatedParams.offset,
        limit: validatedParams.limit
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to perform search',
        papers: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}