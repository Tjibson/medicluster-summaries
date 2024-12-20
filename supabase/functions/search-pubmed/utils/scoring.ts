export function calculateRelevanceScore(title: any, abstract: string, searchTerm: string): number {
  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  
  // Convert title to string if possible and check for matches
  if (title) {
    const titleStr = String(title)
    const titleLower = titleStr.toLowerCase()
    if (titleLower.includes(searchTermLower)) {
      score += 50
    }
    
    // Clinical trial mentions in title boost score
    if (titleLower.includes('trial')) {
      score += 20
    }
  }
  
  // Abstract matches - with type guard
  if (typeof abstract === 'string' && abstract) {
    const abstractLower = abstract.toLowerCase()
    if (abstractLower.includes(searchTermLower)) {
      score += 30
    }
    
    // Clinical trial mentions in abstract boost score
    if (abstractLower.includes('trial')) {
      score += 20
    }
  }
  
  return score
}