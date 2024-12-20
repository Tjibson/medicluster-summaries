interface SearchParams {
  keywords: {
    medicine: string[]
    condition: string[]
  }
  journalNames: string[]
}

const JOURNAL_WEIGHTS = {
  "The New England Journal of Medicine": 5,
  "The Lancet": 5,
  "Nature": 4,
  "Journal of the American College of Cardiology": 4,
  "Circulation": 4,
  "JAMA cardiology": 4,
  "European journal of heart failure": 3,
  "ESC heart failure": 3,
  "JACC. Heart failure": 3,
  "Frontiers in cardiovascular medicine": 2,
  "Journal of the American Heart Association": 2,
}

export function calculateRelevanceScore(title: string, abstract: string, journal: string, searchParams: SearchParams): number {
  let score = 0
  const text = `${title} ${abstract}`.toLowerCase()

  // Journal weight (30% of total score)
  const journalWeight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1
  score += (journalWeight / Math.max(...Object.values(JOURNAL_WEIGHTS))) * 30

  // Keyword matches (70% of total score)
  const allKeywords = [...searchParams.keywords.medicine, ...searchParams.keywords.condition]
  allKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    // Title matches worth more (2x)
    if (title.toLowerCase().includes(keywordLower)) {
      score += 15
    }
    // Abstract matches
    const matches = (text.match(new RegExp(keywordLower, 'g')) || []).length
    score += matches * 5
  })

  // Normalize to 0-100
  return Math.min(Math.round(score), 100)
}