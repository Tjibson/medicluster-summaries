import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

export async function fetchGoogleScholarData(title: string, authors: string[]) {
  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const query = encodeURIComponent(`${title} ${authors[0]}`)
  const url = `https://scholar.google.com/scholar?q=${query}`
  
  try {
    const response = await fetch(url, { 
      headers: { 'User-Agent': getRandomUserAgent() }
    })
    
    if (!response.ok) {
      console.error('Google Scholar request failed:', response.status)
      return { citations: 0 }
    }
    
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    if (!doc) return { citations: 0 }

    // Find citation count
    const citedByText = Array.from(doc.querySelectorAll('.gs_fl a'))
      .find(a => a.textContent?.includes('Cited by'))
      ?.textContent
    
    const citations = citedByText ? 
      parseInt(citedByText.match(/\d+/)?.[0] || '0') : 0

    return { citations }
  } catch (error) {
    console.error('Error fetching Google Scholar data:', error)
    return { citations: 0 }
  }
}

function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0"
  ]
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}