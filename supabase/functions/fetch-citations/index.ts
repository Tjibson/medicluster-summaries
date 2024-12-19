import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  // ... Add more user agents for rotation
]

async function fetchCitations(title: string, authors: string[]) {
  const searchQuery = encodeURIComponent(`${title} ${authors[0]}`)
  const url = `https://scholar.google.com/scholar?q=${searchQuery}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) {
      throw new Error('Failed to parse HTML')
    }
    
    // Find citation count in Google Scholar results
    const citedByElement = doc.querySelector('.gs_fl a')
    if (citedByElement) {
      const citedByText = citedByElement.textContent
      const citations = citedByText.match(/\d+/)
      return citations ? parseInt(citations[0]) : 0
    }
    
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

    return new Response(
      JSON.stringify({ citations }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})