export function calculateRelevanceScore(title: any, abstract: string, searchTerm: string): number {
  // Ensure title is a string
  if (typeof title !== 'string') {
    console.warn('Title is not a string:', title);
    return 0;
  }

  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  const titleLower = title.toLowerCase()
  const abstractLower = typeof abstract === 'string' ? abstract.toLowerCase() : ''

  // Title matches are worth more
  if (titleLower.includes(searchTermLower)) {
    score += 50
  }

  // Clinical trial mentions in title boost score
  if (titleLower.includes('trial')) {
    score += 20
  }

  // Abstract matches if abstract is available
  if (abstractLower && abstractLower.includes(searchTermLower)) {
    score += 30
  }

  // Clinical trial mentions in abstract boost score
  if (abstractLower && abstractLower.includes('trial')) {
    score += 20
  }

  return score
}