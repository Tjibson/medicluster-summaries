export function calculateRelevanceScore(title: string, query: string): number {
  // Ensure both title and query are strings and not empty
  if (!title || !query || typeof title !== 'string' || typeof query !== 'string') {
    console.warn('Invalid input for relevance calculation:', { title, query })
    return 0
  }

  try {
    const lowerTitle = title.toLowerCase()
    const lowerQuery = query.toLowerCase()
    
    // Split query into words
    const queryWords = lowerQuery.split(/\s+/)
    
    // Calculate score based on word matches
    let score = 0
    queryWords.forEach(word => {
      if (lowerTitle.includes(word)) {
        score += 1
      }
    })
    
    // Normalize score (0-100)
    return Math.min(100, (score / queryWords.length) * 100)
  } catch (error) {
    console.error('Error calculating relevance score:', error)
    return 0
  }
}