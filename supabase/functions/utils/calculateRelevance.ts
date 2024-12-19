interface SearchTerms {
  disease?: string
  medicine?: string
  working_mechanism?: string
  population?: string
  trial_type?: string
  query?: string
  patient_count?: number
}

export function calculateRelevanceScore(text: string, searchTerms: SearchTerms): number {
  if (!text || !Object.values(searchTerms).some(term => term)) return 0

  let score = 0
  let totalCriteria = 0
  const textLower = text.toLowerCase()

  // Helper function to count occurrences
  const countOccurrences = (searchTerm: string): number => {
    if (!searchTerm) return 0
    const terms = searchTerm.toLowerCase().split(/\s+/)
    let matches = 0
    terms.forEach(term => {
      const regex = new RegExp(term, 'g')
      matches += (textLower.match(regex) || []).length
    })
    return matches
  }

  // Score each search term
  Object.entries(searchTerms).forEach(([key, term]) => {
    if (term && typeof term === 'string' && key !== 'patient_count') {
      totalCriteria++
      const occurrences = countOccurrences(term)
      if (occurrences > 0) {
        // Base match score
        score += 1
        // Bonus for multiple occurrences, capped at 0.5
        score += Math.min(occurrences / 5, 0.5)
      }
    }
  })

  // Handle direct query searches differently
  if (searchTerms.query) {
    const queryScore = countOccurrences(searchTerms.query)
    return queryScore > 0 ? 100 * (1 + Math.min(queryScore / 10, 0.5)) : 0
  }

  // Normalize score to percentage
  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0
}