interface SearchTerms {
  disease?: string
  medicine?: string
  working_mechanism?: string
  population?: string
  trial_type?: string
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
    const regex = new RegExp(searchTerm.toLowerCase(), 'g')
    return (textLower.match(regex) || []).length
  }

  // Score each search term
  Object.entries(searchTerms).forEach(([key, term]) => {
    if (term && typeof term === 'string') {
      totalCriteria++
      const occurrences = countOccurrences(term)
      if (occurrences > 0) {
        // Base match score
        score += 1
        // Bonus for multiple occurrences
        score += Math.min(occurrences / 5, 0.5) // Cap bonus at 0.5
      }
    }
  })

  // Normalize score to percentage
  return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0
}