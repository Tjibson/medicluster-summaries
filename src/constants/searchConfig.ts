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
  'Randomized Controlled Trial',
  'Systematic Review',
] as const;

export interface SearchParameters {
  dateRange: {
    start: string;
    end: string;
  };
  journalNames: string[];
  keywords: {
    medicine: string[];
    condition: string[];
  };
  articleTypes: typeof ARTICLE_TYPES[number][];
}

export const DEFAULT_SEARCH_PARAMS: SearchParameters = {
  dateRange: {
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 20)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  journalNames: Object.keys(JOURNAL_WEIGHTS),
  keywords: {
    medicine: [],
    condition: [],
  },
  articleTypes: [...ARTICLE_TYPES],
};

export function calculateRelevanceScore(
  title: string,
  abstract: string,
  journal: string,
  keywords: string[]
): number {
  let score = 0;

  // Journal weight
  score += JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 0;

  // Keyword weights
  const text = `${title} ${abstract}`.toLowerCase();
  keywords.forEach(keyword => {
    const weight = KEYWORD_WEIGHTS[keyword as keyof typeof KEYWORD_WEIGHTS] || 1;
    if (text.includes(keyword.toLowerCase())) {
      score += weight;
    }
  });

  return score;
}