export const ARTICLE_TYPES = [
  "Clinical Trial",
  "Randomized Controlled Trial",
  "Observational Study",
  "Meta-Analysis",
  "Review",
  "Case Report"
] as const;

export const JOURNAL_WEIGHTS = {
  "The New England Journal of Medicine": 5,
  "The Lancet": 5,
  "Nature": 5,
  "Science": 5,
  "JAMA": 5,
  "Nature Medicine": 4,
  "Journal of the American College of Cardiology": 4,
  "Circulation": 4,
  "JAMA cardiology": 4,
  "European Heart Journal": 4,
  "European journal of heart failure": 3,
  "ESC heart failure": 3,
  "JACC. Heart failure": 3,
  "Frontiers in cardiovascular medicine": 2,
  "Journal of the American Heart Association": 2,
} as const;

export interface SearchParameters {
  medicine: string;
  condition: string;
  studyType: string;
  startDate: string;
  endDate: string;
  keywords: {
    medicine: string[];
    condition: string[];
  };
  dateRange?: {
    start: string;
    end: string;
  };
  articleTypes?: string[];
  journalNames?: string[];
}

export function calculateRelevanceScore(
  title: string,
  abstract: string,
  journal: string,
  citations: number,
  searchParams: SearchParameters
): number {
  let score = 0;
  
  // Title and abstract matching
  if (searchParams.medicine) {
    if (title.toLowerCase().includes(searchParams.medicine.toLowerCase())) {
      score += 50;
    }
    if (abstract.toLowerCase().includes(searchParams.medicine.toLowerCase())) {
      score += 30;
    }
  }

  if (searchParams.condition) {
    if (title.toLowerCase().includes(searchParams.condition.toLowerCase())) {
      score += 50;
    }
    if (abstract.toLowerCase().includes(searchParams.condition.toLowerCase())) {
      score += 30;
    }
  }

  // Journal weight
  const journalWeight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1;
  score += journalWeight * 5;

  // Citation score (max 20 points)
  const citationScore = Math.min(citations / 50, 20);
  score += citationScore;

  return Math.min(score, 100);
}