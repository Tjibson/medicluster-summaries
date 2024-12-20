import { type Paper } from '../types'

export function calculateRelevanceScore(paper: Paper, searchTerm: string): number {
  let score = 0
  const searchTermLower = searchTerm.toLowerCase()
  
  // Title matches are worth more
  if (paper.title.toLowerCase().includes(searchTermLower)) {
    score += 50
  }
  
  // Abstract matches
  if (paper.abstract.toLowerCase().includes(searchTermLower)) {
    score += 30
  }
  
  // Clinical trial mentions boost score
  if (paper.title.toLowerCase().includes('trial') || 
      paper.abstract.toLowerCase().includes('trial')) {
    score += 20
  }
  
  // Citations boost score significantly
  score += Math.min(paper.citations * 2, 100)
  
  return score
}