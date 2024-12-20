import { JOURNAL_WEIGHTS, KEYWORD_WEIGHTS } from "@/constants/searchConfig"
import { type Paper } from "@/types/papers"

interface ScoringFactors {
  journalScore: number
  keywordScore: number
  citationScore: number
  yearScore: number
}

export function calculateRelevanceScore(paper: Paper, searchKeywords: string[]): number {
  console.log("Calculating relevance score for paper:", paper.title)
  
  const factors = {
    journalScore: calculateJournalScore(paper.journal),
    keywordScore: calculateKeywordScore(paper.title, paper.abstract || '', searchKeywords),
    citationScore: calculateCitationScore(paper.citations || 0),
    yearScore: calculateYearScore(paper.year)
  }
  
  console.log("Scoring factors:", factors)
  
  // Weighted combination of all factors
  const totalScore = (
    factors.journalScore * 0.3 +  // 30% weight for journal prestige
    factors.keywordScore * 0.4 +  // 40% weight for keyword relevance
    factors.citationScore * 0.2 + // 20% weight for citation count
    factors.yearScore * 0.1       // 10% weight for recency
  )

  // Normalize to 0-100 range
  return Math.min(Math.round(totalScore * 100), 100)
}

function calculateJournalScore(journal: string): number {
  const weight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1
  return weight / Math.max(...Object.values(JOURNAL_WEIGHTS))
}

function calculateKeywordScore(title: string, abstract: string, searchKeywords: string[]): number {
  if (!searchKeywords.length) return 0.5 // Neutral score if no keywords

  const text = `${title.toLowerCase()} ${abstract.toLowerCase()}`
  let totalWeight = 0
  let matchedWeight = 0

  searchKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    const weight = KEYWORD_WEIGHTS[keywordLower as keyof typeof KEYWORD_WEIGHTS] || 1
    totalWeight += weight

    // Title matches worth more (2x)
    if (title.toLowerCase().includes(keywordLower)) {
      matchedWeight += weight * 2
    }
    
    // Abstract matches
    const matches = (text.match(new RegExp(keywordLower, 'g')) || []).length
    matchedWeight += matches * weight
  })

  return totalWeight > 0 ? matchedWeight / (totalWeight * 3) : 0.5
}

function calculateCitationScore(citations: number): number {
  // Logarithmic scale to handle papers with very high citation counts
  const maxCitations = 1000 // Arbitrary cap for normalization
  return citations > 0 ? Math.min(Math.log10(citations + 1) / Math.log10(maxCitations + 1), 1) : 0
}

function calculateYearScore(year: number): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  // Papers from last 5 years get higher scores
  return Math.max(0, 1 - (age / 10))
}