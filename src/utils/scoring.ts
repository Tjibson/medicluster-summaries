import { Paper } from "@/types/papers"

const KEYWORD_WEIGHTS = {
  TITLE: 2,
  ABSTRACT: 1,
  JOURNAL: 0.5
}

export function calculateRelevanceScore(paper: Paper, searchTerms: string[]): number {
  let score = 0

  // Score based on title matches
  searchTerms.forEach(term => {
    if (paper.title.toLowerCase().includes(term.toLowerCase())) {
      score += KEYWORD_WEIGHTS.TITLE
    }
  })

  // Score based on journal matches
  searchTerms.forEach(term => {
    if (paper.journal.toLowerCase().includes(term.toLowerCase())) {
      score += KEYWORD_WEIGHTS.JOURNAL
    }
  })

  return score
}