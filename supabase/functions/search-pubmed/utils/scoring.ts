export function calculateRelevanceScore(title: any, abstract: string, searchTerm: string): number {
  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  
  // Title matches are worth more - with type guard
  if (typeof title === 'string' && title) {
    const titleLower = title.toLowerCase()
    if (titleLower.includes(searchTermLower)) {
      score += 50
    }
  }
  
  // Abstract matches - with type guard
  if (typeof abstract === 'string' && abstract) {
    const abstractLower = abstract.toLowerCase()
    if (abstractLower.includes(searchTermLower)) {
      score += 30
    }
    
    // Clinical trial mentions boost score
    if (abstractLower.includes('trial')) {
      score += 20
    }
  }
  
  return score
}