import { JOURNAL_WEIGHTS, KEYWORD_WEIGHTS } from "@/constants/searchConfig"
import { type Paper } from "@/types/papers"

interface ScoringFactors {
  journalScore: number
  keywordScore: number
  citationScore: number
  yearScore: number
  trialScore: number
  studySizeScore: number
}

// Helper to detect clinical trial phase
function detectTrialPhase(title: string, abstract: string): number {
  const text = `${title} ${abstract}`.toLowerCase()
  if (text.includes('phase 3') || text.includes('phase iii')) return 3
  if (text.includes('phase 2') || text.includes('phase ii')) return 2
  if (text.includes('phase 1') || text.includes('phase i')) return 1
  return 0
}

// Helper to detect if it's a registration/pivotal study
function isRegistrationStudy(title: string, abstract: string): boolean {
  const keywords = ['registration', 'pivotal', 'primary analysis', 'primary results']
  const text = `${title} ${abstract}`.toLowerCase()
  return keywords.some(keyword => text.includes(keyword))
}

// Helper to detect study naming patterns (e.g., ORION-1)
function hasStudyName(title: string): boolean {
  return /[A-Z]{2,}-\d+/.test(title)
}

// Helper to extract patient count
function extractPatientCount(abstract: string): number {
  const patientMatches = abstract.match(/(\d+)\s+(?:patients?|participants?|subjects?)/i)
  if (patientMatches) {
    return parseInt(patientMatches[1])
  }
  const nMatches = abstract.match(/[nN]\s*=\s*(\d+)/)
  if (nMatches) {
    return parseInt(nMatches[1])
  }
  return 0
}

// Helper to detect statistical significance
function hasSignificantResults(abstract: string): boolean {
  const text = abstract.toLowerCase()
  return text.includes('p < 0.05') || 
         text.includes('p < 0.01') || 
         text.includes('significant difference') ||
         text.includes('significantly improved')
}

export function calculateRelevanceScore(paper: Paper, searchKeywords: string[]): number {
  console.log("Calculating relevance score for paper:", paper.title)
  
  // Calculate individual scoring factors
  const factors = {
    trialScore: calculateTrialScore(paper.title, paper.abstract || ''),
    journalScore: calculateJournalScore(paper.journal),
    keywordScore: calculateKeywordScore(paper.title, paper.abstract || '', searchKeywords),
    studySizeScore: calculateStudySizeScore(paper.abstract || ''),
    citationScore: calculateCitationScore(paper.citations || 0),
    yearScore: calculateYearScore(paper.year)
  }
  
  console.log("Scoring factors:", factors)
  
  // Weighted combination of all factors
  const totalScore = (
    factors.trialScore * 0.20 +     // 20% weight for trial type/phase
    factors.journalScore * 0.15 +   // 15% weight for journal prestige
    factors.keywordScore * 0.30 +   // 30% weight for keyword relevance (increased from 20%)
    factors.studySizeScore * 0.15 + // 15% weight for study size
    factors.citationScore * 0.10 +  // 10% weight for citations
    factors.yearScore * 0.10        // 10% weight for recency
  )

  return Math.round(Math.min(totalScore * 100, 100))
}

function calculateTrialScore(title: string, abstract: string): number {
  let score = 0
  
  // Phase scoring
  const phase = detectTrialPhase(title, abstract)
  score += phase * 0.2 // Up to 0.6 for Phase 3

  // Registration/pivotal study bonus
  if (isRegistrationStudy(title, abstract)) {
    score += 0.3
  }

  // Named study bonus (e.g., ORION-1)
  if (hasStudyName(title)) {
    score += 0.1
  }

  // Significant results bonus
  if (hasSignificantResults(abstract)) {
    score += 0.1
  }

  return Math.min(score, 1)
}

function calculateJournalScore(journal: string): number {
  // Get base weight from existing weights
  const weight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1
  const maxWeight = Math.max(...Object.values(JOURNAL_WEIGHTS))
  
  // Normalize to 0-1 range
  return weight / maxWeight
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
    const titleMatches = (title.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length
    matchedWeight += titleMatches * weight * 2

    // Abstract matches
    const abstractMatches = (abstract.toLowerCase().match(new RegExp(keywordLower, 'g')) || []).length
    matchedWeight += abstractMatches * weight
  })

  return totalWeight > 0 ? Math.min(matchedWeight / (totalWeight * 3), 1) : 0.5
}

function calculateStudySizeScore(abstract: string): number {
  const patientCount = extractPatientCount(abstract)
  
  // Logarithmic scale for patient count
  // 0 patients = 0, 100 patients = 0.5, 1000+ patients = 1.0
  if (patientCount === 0) return 0
  return Math.min(Math.log10(patientCount) / Math.log10(1000), 1)
}

function calculateCitationScore(citations: number): number {
  // Use citation velocity (assume paper age of 1 year if very recent)
  const citationsPerYear = citations
  
  // Logarithmic scale to handle papers with very high citation counts
  // 0 citations = 0, 10 citations = 0.5, 100+ citations = 1.0
  return citations > 0 ? Math.min(Math.log10(citationsPerYear + 1) / Math.log10(100), 1) : 0
}

function calculateYearScore(year: number): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  // Papers from last 2 years get higher scores
  // 0-2 years old = 1.0, 5 years old = 0.5, 10+ years old = 0.0
  return Math.max(0, 1 - (age / 10))
}
