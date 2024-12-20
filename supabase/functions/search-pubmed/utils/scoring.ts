export function calculateRelevanceScore(title: string, abstract: string, searchTerm: string): number {
  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  
  // Title matches are worth more
  if (title.toLowerCase().includes(searchTermLower)) {
    score += 50
  }
  
  // Abstract matches
  if (abstract.toLowerCase().includes(searchTermLower)) {
    score += 30
  }
  
  // Clinical trial mentions boost score
  if (title.toLowerCase().includes('trial') || 
      abstract.toLowerCase().includes('trial')) {
    score += 20
  }
  
  return score
}