export const JOURNAL_WEIGHTS = {
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
} as const;

export const KEYWORD_WEIGHTS = {
  "Entresto": 5,
  "Sacubitril": 4,
  "ARNi": 4,
  "LCZ696": 3,
  "HFrEF": 3,
  "heart failure": 2,
} as const;

export const ARTICLE_TYPES = [
  'Abstract',
  'Clinical Study',
  'Clinical Trial',
  'Comparative Study',
  'Meta-Analysis',
  'Multicenter Study',
  'Practice Guideline',
  'Randomized Controlled Trial',
  'Systematic Review',
] as const;

export interface SearchParameters {
  medicine?: string;
  condition?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  articleTypes?: string[];
  keywords?: {
    medicine: string[];
    condition: string[];
  };
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

  // Add citation score (max 20 points)
  const citationScore = Math.min(citations / 50, 20);
  score += citationScore;

  return Math.min(score, 100);
}