import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { searchPubMed } from "../utils/pubmedSearch.ts"
import { parseArticles } from "../utils/articleParser.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  dateRange?: {
    start: string
    end: string
  }
  journalNames?: string[]
  keywords?: string
  medicine?: string
  condition?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const params = await req.json() as SearchParams
    console.log('Received search params:', params)

    // Format the journal query if journals are provided
    const journalQuery = params.journalNames?.length 
      ? params.journalNames.map(journal => `"${journal}"[Journal]`).join(' OR ')
      : ''

    // Build date query
    const startDate = params.dateRange?.start || "2024/01/01"
    const endDate = params.dateRange?.end || "2024/12/31"
    const dateQuery = `(${startDate}[PDAT] : ${endDate}[PDAT])`

    // Build keywords query
    let keywordsQuery = ''
    if (params.medicine || params.condition) {
      const medicineTerms = params.medicine?.trim().split(/[ ,]+/).filter(Boolean) || []
      const conditionTerms = params.condition?.trim().split(/[ ,]+/).filter(Boolean) || []
      
      if (medicineTerms.length && conditionTerms.length) {
        keywordsQuery = `(${medicineTerms.join(" OR ")}) AND (${conditionTerms.join(" OR ")})`
      } else if (medicineTerms.length) {
        keywordsQuery = `(${medicineTerms.join(" OR ")})`
      } else if (conditionTerms.length) {
        keywordsQuery = `(${conditionTerms.join(" OR ")})`
      }
    }

    // Construct the final query
    let finalQuery = dateQuery
    if (journalQuery) {
      finalQuery += ` AND (${journalQuery})`
    }
    if (keywordsQuery) {
      finalQuery += ` AND ${keywordsQuery}`
    }

    console.log('Executing PubMed search with query:', finalQuery)

    // Perform the PubMed search
    const xmlResponse = await searchPubMed(finalQuery)
    
    if (!xmlResponse) {
      console.log('No results found')
      return new Response(
        JSON.stringify({
          papers: [],
          message: 'No results found'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Parse the articles
    const papers = parseArticles(xmlResponse, { keywords: keywordsQuery })
    console.log(`Successfully processed ${papers.length} papers`)

    return new Response(
      JSON.stringify({
        papers,
        message: 'Search completed successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in search-pubmed function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        papers: []
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
})