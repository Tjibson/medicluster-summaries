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

export function calculateRelevanceScore(title: string, abstract: string, journal: string, searchParams: SearchParameters): number {
  let score = 0;

  // Journal weight
  const journalWeight = JOURNAL_WEIGHTS[journal as keyof typeof JOURNAL_WEIGHTS] || 1;
  score += journalWeight * 10;

  // Keywords in title (higher weight)
  const titleLower = title.toLowerCase();
  [...searchParams.keywords.medicine, ...searchParams.keywords.condition].forEach(keyword => {
    if (titleLower.includes(keyword.toLowerCase())) {
      score += 15;
    }
  });

  // Keywords in abstract
  const abstractLower = abstract.toLowerCase();
  [...searchParams.keywords.medicine, ...searchParams.keywords.condition].forEach(keyword => {
    const matches = (abstractLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    score += matches * 5;
  });

  return Math.min(100, score); // Cap at 100
}