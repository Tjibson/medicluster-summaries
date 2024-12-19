import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
]

async function fetchCitations(title: string, authors: string[]) {
  const searchQuery = encodeURIComponent(`${title} ${authors[0]}`)
  const url = `https://scholar.google.com/scholar?q=${searchQuery}&hl=en`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch from Google Scholar:', response.status)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) {
      throw new Error('Failed to parse HTML')
    }
    
    // Find citation count in Google Scholar results
    const citedByElements = doc.querySelectorAll('.gs_fl a')
    for (const element of citedByElements) {
      const text = element.textContent
      if (text && text.includes('Cited by')) {
        const citations = text.match(/\d+/)
        if (citations) {
          console.log(`Found citations for "${title}": ${citations[0]}`)
          return parseInt(citations[0])
        }
      }
    }
    
    console.log(`No citations found for "${title}"`)
    return 0
  } catch (error) {
    console.error('Error fetching citations:', error)
    return 0
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, authors } = await req.json()
    
    if (!title || !authors) {
      throw new Error('Title and authors are required')
    }

    const citations = await fetchCitations(title, authors)
    console.log(`Returning ${citations} citations for "${title}"`)

    return new Response(
      JSON.stringify({ citations }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in fetch-citations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})